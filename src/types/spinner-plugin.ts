import { ExtendedSpinner } from '../core/index.js';

/**
 * Plugin interface to extend spinner behavior.
 *
 * Plugins allow for modular extensions to the spinner functionality without modifying
 * the core implementation. They can be registered at the instance level using
 * `spinner.registerPlugin(myPlugin)` and can respond to various lifecycle events.
 *
 * ## Plugin Lifecycle
 * Plugins receive callbacks at various points in the spinner's lifecycle:
 *
 * 1. **Initialization**: No specific callback, plugins are active upon registration
 * 2. **Start/Stop**: `onStart`, `onStop` callbacks
 * 3. **Pause/Resume**: `onPause`, `onResume` callbacks
 * 4. **Operations**: `onRunSuccess`, `onRunError` for async operations
 * 5. **Rendering**: `onRender` called during the render process
 *
 * ## Error Handling
 * Plugin methods should handle their own errors. Any uncaught exceptions in plugin methods
 * will be caught by the spinner, logged, but will not interrupt spinner operation.
 *
 * ## Plugin Development Best Practices
 * - Keep plugins focused on a single responsibility
 * - Avoid heavy operations in frequently called methods like `onRender`
 * - Use the spinner instance methods rather than directly modifying state
 * - Be mindful of memory usage and clean up resources in `onStop` if needed
 */
export interface SpinnerPlugin {
  /**
   * Called when the spinner starts.
   *
   * @param spinner - The spinner instance that started
   * @param message - The initial message displayed by the spinner
   */
  onStart?(spinner: ExtendedSpinner, message?: string): void;

  /**
   * Called when the spinner stops.
   * Use this to perform any cleanup needed by your plugin.
   *
   * @param spinner - The spinner instance that stopped
   * @param finalText - The final text displayed by the spinner
   */
  onStop?(spinner: ExtendedSpinner, finalText?: string): void;

  /**
   * Called when the spinner is paused.
   *
   * @param spinner - The spinner instance that was paused
   */
  onPause?(spinner: ExtendedSpinner): void;

  /**
   * Called when the spinner is resumed after being paused.
   *
   * @param spinner - The spinner instance that was resumed
   */
  onResume?(spinner: ExtendedSpinner): void;

  /**
   * Called when the spinner is restarted.
   * This occurs after a stop and before a new start.
   *
   * @param spinner - The spinner instance that was restarted
   */
  onRestart?(spinner: ExtendedSpinner): void;

  /**
   * Called when an asynchronous operation completes successfully.
   * This is triggered after the spinner's `run()` method's promise resolves.
   *
   * @param spinner - The spinner instance
   * @param result - The result of the async operation
   */
  onRunSuccess?(spinner: ExtendedSpinner, result: unknown): void;

  /**
   * Called when an asynchronous operation fails.
   * This is triggered after the spinner's `run()` method's promise rejects.
   *
   * @param spinner - The spinner instance
   * @param error - The error from the failed async operation
   */
  onRunError?(spinner: ExtendedSpinner, error: unknown): void;

  /**
   * Called during each render cycle of the spinner.
   * Use this to modify or intercept the output before rendering.
   * Note: This method is called frequently - keep it lightweight.
   *
   * @param spinner - The spinner instance being rendered
   * @param output - The current output string to be rendered
   * @returns If a string is returned, it will replace the output
   */
  onRender?(spinner: ExtendedSpinner, output: string): string | void;
}
