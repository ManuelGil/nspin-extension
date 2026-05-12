import { EventEmitter } from 'node:events';
import { performance } from 'node:perf_hooks';
import { Spinner } from 'nspin';
import {
  clearLine,
  getEnvironmentAwareInterval,
  isCI,
  shouldEnableAnimations,
} from '../helpers/index.js';
import { PluginManager } from '../plugins/index.js';
import { RenderManager } from '../render/index.js';
import type {
  Logger,
  RunOptions,
  SpinnerEventMap,
  SpinnerPlugin,
} from '../types/index.js';
import { SpinnerState } from '../types/spinner-state.js';
import { ErrorHandler, ErrorSeverity } from './error-handler.js';
import { StateMachine } from './state-machine.js';

/**
 * Custom renderer function type.
 * @callback CustomRenderer
 * @param {string} output - The spinner output.
 * @returns {string} The custom rendered output.
 */
type CustomRenderer = (output: string) => string;

/**
 * ExtendedSpinner enhances nspin's Spinner with plugin support, state management,
 * custom rendering, and dependency injection for utilities.
 */
export class ExtendedSpinner extends Spinner {
  /** Event emitter for spinner events. */
  private eventEmitter = new EventEmitter();
  /** State machine instance to manage spinner states. */
  private stateMachine = new StateMachine(SpinnerState.Idle);
  /** Render manager to delegate output rendering. */
  private renderManager = new RenderManager();
  /** Plugin manager for instance-level plugins. */
  private pluginManager = new PluginManager();
  /** Logger for output messages. */
  private logger: Logger;
  /** Error handler for improved error management and recovery. */
  private errorHandler: ErrorHandler;
  /** Optional custom renderer function. */
  private customRenderer?: CustomRenderer;
  /** Timestamp for the beginning of a pause, or null if not paused. */
  private pauseStartTime: number | null = null;
  /** Flag indicating if a run operation is in progress. */
  private runInProgress = false;
  /** Abort listener function reference for cleanup. */
  private abortListener: (() => void) | undefined;
  /** Unique identifier for each spinner instance. */
  private readonly id: number;
  /** Static counter to generate unique ids. */
  private static spinnerCounter = 0;
  /**
   * Static array to manage active ExtendedSpinner instances.
   * This helps prevent memory leaks by cleaning up destroyed spinners.
   */
  private static activeSpinners: ExtendedSpinner[] = [];
  /**
   * Static flag to ensure the global exit listener is registered only once.
   */
  private static globalExitListenerRegistered = false;
  /**
   * Static counter to track render operations for periodic cleanup
   * Used to avoid calling cleanActiveSpinners on every render
   */
  private static renderCounter = 0;
  /**
   * The interval at which to clean active spinners (every N render operations)
   */
  private static readonly CLEANUP_INTERVAL = 30;

  /**
   * Creates an instance of ExtendedSpinner.
   * @param options - Spinner options including logger, clearLine function, and visual configuration.
   */
  constructor(options?: {
    frames: string[];
    interval?: number;
    format?: string | string[];
    position?: 'left' | 'right';
    logger?: Logger;
  }) {
    // Extract logger and pass remaining options to the base Spinner.
    const { logger, interval, ...otherOptions } = options ?? {};

    // Adapt interval based on environment (slower in CI environments)
    const adaptedInterval = getEnvironmentAwareInterval(interval);

    super({ ...otherOptions, interval: adaptedInterval });

    // Set unique id for the spinner instance.
    this.id = ExtendedSpinner.spinnerCounter++;

    // Use provided logger or fallback to console methods.
    this.logger = logger ?? {
      log: (msg: string) => console.log(msg),
      warn: (msg: string) => console.warn(msg),
      error: (msg: string) => console.error(msg),
    };

    // Initialize error handler with logger
    this.errorHandler = new ErrorHandler(this.logger);

    // Set a higher max listeners to prevent warnings.
    this.eventEmitter.setMaxListeners(50);
    ExtendedSpinner.initGlobalExitListener();

    // Log environment information in CI environments to help debugging
    if (isCI()) {
      this.logger.log(
        `[Spinner ${this.id}] Running in CI environment with adapted interval: ${adaptedInterval}ms`,
      );

      if (!shouldEnableAnimations()) {
        this.logger.log(
          `[Spinner ${this.id}] Animations may be limited in this CI environment`,
        );
      }
    }

    // Note: Registration in activeSpinners is done in start() only.
  }

  /**
   * Subscribes to spinner events.
   * @param event - Event name.
   * @param listener - Callback function.
   * @returns {this} ExtendedSpinner instance.
   */
  public on<K extends keyof SpinnerEventMap>(
    event: K,
    listener: (...args: SpinnerEventMap[K]) => void,
  ): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  /**
   * Unsubscribes from spinner events.
   * @param event - Event name.
   * @param listener - Callback function.
   * @returns {this} ExtendedSpinner instance.
   */
  public off<K extends keyof SpinnerEventMap>(
    event: K,
    listener: (...args: SpinnerEventMap[K]) => void,
  ): this {
    this.eventEmitter.off(event, listener);
    return this;
  }

  /**
   * Registers an instance-level plugin.
   * @param plugin - The plugin to register.
   * @returns {this} ExtendedSpinner instance.
   */
  public registerPlugin(plugin: SpinnerPlugin): this {
    this.pluginManager.register(plugin);
    return this;
  }

  /**
   * Unregisters an instance-level plugin.
   * @param plugin - The plugin to unregister.
   * @returns {this} ExtendedSpinner instance.
   */
  public unregisterPlugin(plugin: SpinnerPlugin): this {
    this.pluginManager.unregister(plugin);
    return this;
  }

  /**
   * Sets a custom logger.
   * @param logger - The logger object.
   * @returns {this} ExtendedSpinner instance.
   */
  public setLogger(logger: Logger): this {
    this.logger = logger;
    return this;
  }

  /**
   * Returns the current lifecycle state of the spinner.
   * Useful for runtime inspection and test assertions through the public API.
   * @returns {SpinnerState} The current spinner state.
   */
  public getLifecycleState(): SpinnerState {
    return this.stateMachine.getState();
  }

  /**
   * Returns true if the spinner is currently running.
   * @returns {boolean} True if in Running state.
   */
  public isRunning(): boolean {
    return this.stateMachine.getState() === SpinnerState.Running;
  }

  /**
   * Returns true if the spinner is currently paused.
   * @returns {boolean} True if in Paused state.
   */
  public isPaused(): boolean {
    return this.stateMachine.getState() === SpinnerState.Paused;
  }

  /**
   * Returns true if the spinner has been stopped.
   * @returns {boolean} True if in Stopped state.
   */
  public isStopped(): boolean {
    return this.stateMachine.getState() === SpinnerState.Stopped;
  }

  /**
   * Returns true if the spinner has been destroyed.
   * @returns {boolean} True if in Destroyed state.
   */
  public isDestroyed(): boolean {
    return this.stateMachine.getState() === SpinnerState.Destroyed;
  }

  /**
   * Returns true if the spinner is in an idle state (not yet started).
   * @returns {boolean} True if in Idle state.
   */
  public isIdle(): boolean {
    return this.stateMachine.getState() === SpinnerState.Idle;
  }

  /**
   * Sets a custom renderer function to modify the spinner output.
   * Validates that the provided function returns a string.
   * @param renderer - The custom renderer.
   * @returns {this} ExtendedSpinner instance.
   */
  public setCustomRenderer(renderer: CustomRenderer): this {
    try {
      const testOutput = renderer('test');
      if (typeof testOutput !== 'string') {
        throw new Error('Custom renderer must return a string.');
      }
      this.customRenderer = renderer;
    } catch (error) {
      this.logger.error(
        `[Spinner ${this.id}] setCustomRenderer error: ${
          (error as Error).message
        }`,
      );
    }
    return this;
  }

  /**
   * Starts the spinner if not already running.
   * Transitions from Idle or Stopped state to Running.
   * @param message - The message to display.
   * @returns {this} ExtendedSpinner instance.
   * @throws {Error} If spinner is destroyed or already running.
   */
  public start(message?: string): this {
    if (this.stateMachine.getState() === SpinnerState.Destroyed) {
      throw new Error('Cannot start a destroyed spinner.');
    }
    if (this.stateMachine.getState() === SpinnerState.Running) {
      throw new Error('Spinner is already running.');
    }
    if (this.stateMachine.getState() === SpinnerState.Stopped) {
      this.stateMachine.transition(SpinnerState.Idle);
    }
    try {
      this.resetProperties();
    } catch (error) {
      this.logger.error(
        `[Spinner ${this.id}] resetProperties error: ${
          (error as Error).message
        }`,
      );
    }
    this.stateMachine.transition(SpinnerState.Running);
    if (ExtendedSpinner.activeSpinners.indexOf(this) === -1) {
      ExtendedSpinner.activeSpinners.push(this);
    }
    super.start(message);
    // Notify plugins (only errors are logged)
    this.pluginManager.notify((plugin) => {
      try {
        plugin.onStart?.(this, message);
      } catch (e) {
        this.logger.error(
          `[Spinner ${this.id}] Plugin onStart error: ${(e as Error).message}`,
        );
      }
    });
    return this;
  }

  /**
   * Pauses the spinner if running.
   * Transitions state to Paused.
   * @returns {this} ExtendedSpinner instance.
   */
  public pause(): this {
    if (this.stateMachine.getState() === SpinnerState.Destroyed) {
      throw new Error('Cannot pause a destroyed spinner.');
    }
    if (this.stateMachine.getState() !== SpinnerState.Running) return this;
    this.pauseStartTime = performance.now();
    super.pause();
    this.stateMachine.transition(SpinnerState.Paused);
    this.pluginManager.notify((plugin) => {
      try {
        plugin.onPause?.(this);
      } catch (e) {
        this.logger.error(
          `[Spinner ${this.id}] Plugin onPause error: ${(e as Error).message}`,
        );
      }
    });
    return this;
  }

  /**
   * Resumes the spinner if paused.
   * Transitions state back to Running.
   * @returns {this} ExtendedSpinner instance.
   */
  public resume(): this {
    if (this.stateMachine.getState() === SpinnerState.Destroyed) {
      throw new Error('Cannot resume a destroyed spinner.');
    }
    if (this.stateMachine.getState() !== SpinnerState.Paused) return this;
    if (this.pauseStartTime !== null) {
      this.pauseStartTime = null;
    }
    super.resume();
    this.stateMachine.transition(SpinnerState.Running);
    this.pluginManager.notify((plugin) => {
      try {
        plugin.onResume?.(this);
      } catch (e) {
        this.logger.error(
          `[Spinner ${this.id}] Plugin onResume error: ${(e as Error).message}`,
        );
      }
    });
    return this;
  }

  /**
   * Restarts the spinner by stopping it and reinitializing state.
   * @returns {this} ExtendedSpinner instance.
   * @throws {Error} If spinner is destroyed.
   */
  public restart(): this {
    if (this.stateMachine.getState() === SpinnerState.Destroyed) {
      throw new Error('Cannot restart a destroyed spinner.');
    }
    this.stop(undefined, false);
    ExtendedSpinner.activeSpinners = ExtendedSpinner.activeSpinners.filter(
      (s) => s !== this,
    );
    this.stateMachine.transition(SpinnerState.Idle);
    try {
      this.resetProperties();
    } catch (error) {
      this.logger.error(
        `[Spinner ${this.id}] resetProperties error during restart: ${
          (error as Error).message
        }`,
      );
    }
    this.pluginManager.notify((plugin) => {
      try {
        plugin.onRestart?.(this);
      } catch (e) {
        this.logger.error(
          `[Spinner ${this.id}] Plugin onRestart error: ${(e as Error).message}`,
        );
      }
    });
    return this.start(this.getCurrentText());
  }

  /**
   * Stops the spinner.
   * @param finalText - Final text to display.
   * @param removeFromActiveSpinners - Whether to remove from active spinners.
   * @returns {this} ExtendedSpinner instance.
   */
  public stop(
    finalText?: string,
    removeFromActiveSpinners: boolean = true,
  ): this {
    if (
      [SpinnerState.Stopped, SpinnerState.Destroyed].includes(
        this.stateMachine.getState(),
      )
    )
      return this;
    this.stateMachine.transition(SpinnerState.Stopped);
    super.stop(finalText);
    this.pluginManager.notify((plugin) => {
      try {
        plugin.onStop?.(this, finalText);
      } catch (e) {
        this.logger.error(
          `[Spinner ${this.id}] Plugin onStop error: ${(e as Error).message}`,
        );
      }
    });
    if (removeFromActiveSpinners) {
      ExtendedSpinner.activeSpinners = ExtendedSpinner.activeSpinners.filter(
        (s) => s !== this,
      );
    }
    return this;
  }

  /**
   * Renders the spinner output to the console.
   * Uses a cached current time and periodically cleans active spinners to avoid overhead.
   * The cleanup is now performed periodically instead of on every render call.
   */
  public render(finalText?: string): void {
    try {
      // Periodically clean active spinners to improve performance
      if (
        ++ExtendedSpinner.renderCounter % ExtendedSpinner.CLEANUP_INTERVAL ===
        0
      ) {
        ExtendedSpinner.cleanActiveSpinners();
        ExtendedSpinner.renderCounter = 0;
      }

      if (ExtendedSpinner.activeSpinners.length === 0) return;
      const activeSpinners = ExtendedSpinner.activeSpinners;
      const spinnerIndex = activeSpinners.indexOf(this);
      this.renderManager.render(
        () => this.getRenderOutput(finalText),
        activeSpinners.map((spinner) => ({
          id: spinner.id.toString(),
          status: spinner.stateMachine.getState().toString(),
        })),
        spinnerIndex,
        clearLine,
        (output: string) => process.stdout.write(output),
      );
    } catch (error) {
      // Use the error handler for structured error handling and recovery
      const recovery = this.errorHandler.handleError(
        error as Error,
        'render',
        'rendering spinner output',
        ErrorSeverity.MEDIUM,
      );

      // If recovery was attempted but unsuccessful, use traditional error logging
      if (recovery.attempted && !recovery.successful) {
        this.logger.error(
          `[Spinner ${this.id}] render error: ${(error as Error).message}`,
        );
      }
    }
  }

  /**
   * Runs a promise while displaying the spinner.
   * Implements abort signal handling and proper listener cleanup.
   * @template T
   * @param promise - The promise to run.
   * @param message - Message to display.
   * @param options - Run options.
   * @returns {Promise<T>} Resolves or rejects based on the promise.
   * @throws {Error} If spinner is destroyed or concurrent run is attempted.
   */
  public async run<T>(
    promise: Promise<T>,
    message: string,
    options?: RunOptions<T>,
  ): Promise<T> {
    if (this.stateMachine.getState() === SpinnerState.Destroyed) {
      throw new Error('Cannot run on a destroyed spinner.');
    }
    if (this.runInProgress) {
      throw new Error('Concurrent run operations not allowed.');
    }
    this.runInProgress = true;
    this.start(message);
    const abortPromise = options?.abortSignal
      ? this.handleAbortSignal<T>(options.abortSignal)
      : null;
    try {
      const result = await Promise.race(
        abortPromise ? [promise, abortPromise] : [promise],
      );
      this.stop(options?.successMessage ?? 'Success');
      this.pluginManager.notify((plugin) => {
        try {
          plugin.onRunSuccess?.(this, result);
        } catch (e) {
          this.logger.error(
            `[Spinner ${this.id}] Plugin onRunSuccess error: ${
              (e as Error).message
            }`,
          );
        }
      });
      options?.onSuccess?.(result);
      return result;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (options?.showError) {
        this.stop(`Error: ${errorMsg}`);
      } else {
        this.stop();
      }
      this.pluginManager.notify((plugin) => {
        try {
          plugin.onRunError?.(this, error);
        } catch (e) {
          this.logger.error(
            `[Spinner ${this.id}] Plugin onRunError error: ${
              (e as Error).message
            }`,
          );
        }
      });
      options?.onError?.(error);
      throw error;
    } finally {
      if (options?.abortSignal && this.abortListener) {
        options.abortSignal.removeEventListener('abort', this.abortListener);
        this.abortListener = undefined;
      }
      options?.onStop?.();
      if (
        ![SpinnerState.Stopped, SpinnerState.Destroyed].includes(
          this.stateMachine.getState(),
        )
      ) {
        this.stateMachine.transition(SpinnerState.Stopped);
      }
      this.runInProgress = false;
    }
  }

  /**
   * Destroys the spinner instance by cleaning up all listeners and state.
   */
  public destroy(): void {
    if (this.stateMachine.getState() === SpinnerState.Running) {
      this.logger.warn('Destroying spinner with a pending operation.');
    }
    this.stop();
    this.eventEmitter.removeAllListeners();
    ExtendedSpinner.activeSpinners = ExtendedSpinner.activeSpinners.filter(
      (s) => s !== this,
    );
    this.stateMachine.transition(SpinnerState.Destroyed);
  }

  /**
   * Generates the spinner output string and applies a custom renderer if set.
   * @param finalText - Optional final text.
   * @returns {string} The rendered output.
   */
  protected getRenderOutput(finalText?: string): string {
    let output = super.getRenderOutput(finalText);
    if (this.customRenderer) {
      try {
        const custom = this.customRenderer(output);
        if (typeof custom === 'string') {
          output = custom;
          this.pluginManager.resetErrorCounters();
        } else {
          // Use error handler for non-string return from custom renderer
          this.errorHandler.handleError(
            'Custom renderer did not return a string',
            'render',
            'custom renderer execution',
            ErrorSeverity.LOW,
          );
          // Still use default output in this case
        }
      } catch (error) {
        // Use error handler for custom renderer exceptions
        this.errorHandler.handleError(
          error as Error,
          'render',
          'custom renderer execution',
          ErrorSeverity.MEDIUM,
        );
      }
    }
    return output;
  }

  /**
   * Resets properties for a new run.
   * @private
   */
  private resetProperties(): void {
    this.currentFrame = 0;
    this.startTime = performance.now();
    this.pauseStartTime = null;
  }

  /**
   * Handles the abort signal by returning a promise that rejects when aborted.
   * Ensures atomic registration and removal of the abort listener with proper cleanup.
   * Enhanced to prevent potential memory leaks and ensure proper resource cleanup.
   *
   * @template T
   * @param abortSignal - The abort signal.
   * @returns {Promise<T>} Promise that rejects upon abort.
   * @private
   */
  private handleAbortSignal<T>(abortSignal: AbortSignal): Promise<T> {
    return new Promise<T>((_, reject) => {
      try {
        // Clean up any existing abort listener before creating a new one
        this.removeAbortListener(abortSignal);

        // Create and store new abort listener
        this.abortListener = () => {
          if (
            ![SpinnerState.Stopped, SpinnerState.Destroyed].includes(
              this.stateMachine.getState(),
            )
          ) {
            this.stateMachine.transition(SpinnerState.Stopped);
            this.stop('Aborted');

            // Use error handler for abort operations
            this.errorHandler.handleError(
              'Operation aborted',
              'abort',
              'signal handling',
              ErrorSeverity.LOW, // Abortion is an expected operation, not a true error
            );

            reject(new Error('Operation aborted'));
          }

          // Self-cleanup to prevent memory leaks
          this.removeAbortListener(abortSignal);
        };

        // Only add the listener if the signal hasn't been aborted already
        if (!abortSignal.aborted) {
          abortSignal.addEventListener('abort', this.abortListener);
        } else {
          // If already aborted, execute the handler immediately
          this.abortListener();
        }
      } catch (error) {
        // Handle errors in the abort signal handling
        this.errorHandler.handleError(
          error as Error,
          'abort',
          'signal setup',
          ErrorSeverity.MEDIUM,
        );
        reject(
          new Error(
            `Failed to set up abort handler: ${(error as Error).message}`,
          ),
        );
      }
    });
  }

  /**
   * Helper method to safely remove abort signal listeners.
   * Prevents potential memory leaks by ensuring listeners are properly cleaned up.
   *
   * @param abortSignal - The abort signal to remove listeners from.
   * @private
   */
  private removeAbortListener(abortSignal: AbortSignal): void {
    if (this.abortListener) {
      try {
        abortSignal.removeEventListener('abort', this.abortListener);
      } catch (error) {
        // Just log the error without breaking functionality
        this.logger.error(
          `[Spinner ${this.id}] Error removing abort listener: ${(error as Error).message}`,
        );
      }
      this.abortListener = undefined;
    }
  }

  /**
   * Cleans the activeSpinners array by removing destroyed instances.
   * Prevents memory leaks by removing references to destroyed spinners.
   * @private
   */
  private static cleanActiveSpinners(): void {
    ExtendedSpinner.activeSpinners = ExtendedSpinner.activeSpinners.filter(
      (spinner) => spinner.stateMachine.getState() !== SpinnerState.Destroyed,
    );
  }

  /**
   * Initializes a global exit listener to clean up active spinners on process exit.
   * @private
   */
  private static initGlobalExitListener(): void {
    if (this.globalExitListenerRegistered) return;
    this.globalExitListenerRegistered = true;
    process.on('exit', () => {
      ExtendedSpinner.activeSpinners.forEach((spinner) => spinner.destroy());
    });
  }

  /**
   * Stops all active ExtendedSpinner instances with a given final text.
   * @param finalText - Final text to display.
   */
  public static stopAll(finalText: string = 'Stopped'): void {
    const spinners = [...ExtendedSpinner.activeSpinners];
    for (const spinner of spinners) {
      try {
        spinner.stop(finalText);
      } catch (err) {
        console.error('Error during stopAll:', (err as Error).message);
      }
    }
    ExtendedSpinner.activeSpinners = [];
  }
}
