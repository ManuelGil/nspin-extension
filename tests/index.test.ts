import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Spinner } from '../src/index.js'; // Here, Spinner is exported as an alias for ExtendedSpinner

// ----------------------------------------------------------------------
// TTY Environment Tests
// ----------------------------------------------------------------------
describe('Spinner - TTY Environment', () => {
  let originalIsTTY: boolean;
  let moveCursorSpy: ReturnType<typeof vi.spyOn> | undefined;
  let cursorToSpy: ReturnType<typeof vi.spyOn> | undefined;
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Simulate TTY environment
    originalIsTTY = process.stdout.isTTY;
    process.stdout.isTTY = true;

    // Spy on stdout methods if available
    if (typeof process.stdout.moveCursor === 'function') {
      moveCursorSpy = vi
        .spyOn(process.stdout, 'moveCursor')
        .mockImplementation(() => true);
    }
    if (typeof process.stdout.cursorTo === 'function') {
      cursorToSpy = vi
        .spyOn(process.stdout, 'cursorTo')
        .mockImplementation(() => true);
    }
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    // Restore original TTY settings and spy implementations
    process.stdout.isTTY = originalIsTTY;
    moveCursorSpy?.mockRestore();
    cursorToSpy?.mockRestore();
    writeSpy.mockRestore();
  });

  it('should allow method chaining and manage spinner instances correctly', () => {
    const spinner = new Spinner({
      frames: ['-', '\\', '|', '/'],
      interval: 10,
      format: 'cyan',
    });
    const chainedResult = spinner
      .start('TTY Test')
      .updateText('Updated')
      .stop('Final TTY');

    // Validate that method chaining returns an instance of Spinner
    expect(chainedResult).toBeInstanceOf(Spinner);

    // Verify that moveCursor and cursorTo have been called if available
    if (moveCursorSpy) {
      expect(moveCursorSpy).toHaveBeenCalled();
    }
    if (cursorToSpy) {
      expect(cursorToSpy).toHaveBeenCalled();
    }
  });
});

// ----------------------------------------------------------------------
// Non-TTY Environment Tests
// ----------------------------------------------------------------------
describe('Spinner - Non-TTY Environment', () => {
  let originalIsTTY: boolean;
  let originalMoveCursor: typeof process.stdout.moveCursor | undefined;
  let originalCursorTo: typeof process.stdout.cursorTo | undefined;
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Simulate non-TTY environment by overriding isTTY and cursor methods
    originalIsTTY = process.stdout.isTTY;
    process.stdout.isTTY = false;

    originalMoveCursor = process.stdout.moveCursor;
    originalCursorTo = process.stdout.cursorTo;
    (process.stdout as any).moveCursor = undefined;
    (process.stdout as any).cursorTo = undefined;

    // Spy on stdout.write to capture output
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    process.stdout.isTTY = originalIsTTY;
    if (originalMoveCursor) {
      process.stdout.moveCursor = originalMoveCursor;
    }
    if (originalCursorTo) {
      process.stdout.cursorTo = originalCursorTo;
    }
    writeSpy.mockRestore();
  });

  it('should print output with newlines in a non-TTY environment', async () => {
    const spinner = new Spinner({
      frames: ['-', '\\', '|', '/'],
      interval: 10,
      format: 'green',
    });

    spinner.start('Non-TTY Test');

    // Wait for at least one render cycle
    await new Promise((resolve) => setTimeout(resolve, 50));

    spinner.stop('Final Non-TTY');

    // Check that the final output contains a newline character
    const writeCalls = writeSpy.mock.calls;
    const lastCallOutput = writeCalls[writeCalls.length - 1][0] as string;
    expect(lastCallOutput).toContain('\n');
  });
});

// ----------------------------------------------------------------------
// ExtendedSpinner Additional Functionalities Tests
// ----------------------------------------------------------------------
describe('ExtendedSpinner Functionalities', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // For these tests, we use the default environment settings.
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  it('should pause the spinner and clear the timer', () => {
    const spinner = new Spinner({
      frames: ['-', '\\', '|', '/'],
      interval: 10,
      format: 'yellow',
    });
    spinner.start('Testing pause');

    // Call pause() and verify lifecycle state through public API.
    spinner.pause();
    expect(spinner.getLifecycleState()).toBe('paused');
  });

  it('should resume the spinner after being paused', () => {
    const spinner = new Spinner({
      frames: ['-', '\\', '|', '/'],
      interval: 10,
      format: 'yellow',
    });
    spinner.start('Testing resume');
    spinner.pause();
    spinner.resume();

    expect(spinner.getLifecycleState()).toBe('running');
  });

  it('should complete run() with a successful promise', async () => {
    const spinner = new Spinner({
      frames: ['-', '\\', '|', '/'],
      interval: 10,
      format: 'magenta',
    });
    // Create a promise that resolves successfully
    const promise = Promise.resolve('success');
    const result = await spinner.run(promise, 'Running success');

    // Validate the resolved result and that the spinner stops with "Success"
    expect(result).toBe('success');
    expect(spinner.getLifecycleState()).toBe('stopped');
  });

  it('should complete run() and throw an error for a rejected promise', async () => {
    const spinner = new Spinner({
      frames: ['-', '\\', '|', '/'],
      interval: 10,
      format: 'magenta',
    });
    // Create a promise that rejects with an error
    const promise = Promise.reject(new Error('failure'));

    await expect(spinner.run(promise, 'Running failure')).rejects.toThrow(
      'failure',
    );
    expect(spinner.getLifecycleState()).toBe('stopped');
  });

  it('should report correct state via inspection helpers', () => {
    const spinner = new Spinner({
      frames: ['-', '\\', '|', '/'],
      interval: 10,
      format: 'blue',
    });

    // Initial state: idle
    expect(spinner.isIdle()).toBe(true);
    expect(spinner.isRunning()).toBe(false);
    expect(spinner.isPaused()).toBe(false);
    expect(spinner.isStopped()).toBe(false);
    expect(spinner.isDestroyed()).toBe(false);

    // After start: running
    spinner.start('State test');
    expect(spinner.isRunning()).toBe(true);
    expect(spinner.isIdle()).toBe(false);

    // After pause: paused
    spinner.pause();
    expect(spinner.isPaused()).toBe(true);
    expect(spinner.isRunning()).toBe(false);

    // After resume: running again
    spinner.resume();
    expect(spinner.isRunning()).toBe(true);
    expect(spinner.isPaused()).toBe(false);

    // After stop: stopped
    spinner.stop();
    expect(spinner.isStopped()).toBe(true);
    expect(spinner.isRunning()).toBe(false);

    // After destroy: destroyed
    spinner.destroy();
    expect(spinner.isDestroyed()).toBe(true);
    expect(spinner.isStopped()).toBe(false);
  });

  it('should remain destroyed when a running workflow is destroyed during cleanup', async () => {
    const spinner = new Spinner({
      frames: ['-', '\\', '|', '/'],
      interval: 10,
      format: 'magenta',
    });

    const longPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('ok'), 20);
    });

    const runPromise = spinner.run(longPromise, 'Running and destroying');
    spinner.destroy();

    await expect(runPromise).resolves.toBe('ok');
    expect(spinner.getLifecycleState()).toBe('destroyed');
  });
});
