import { performance } from 'node:perf_hooks';
import { CursorManager } from './cursor-manager.js';

/** Minimum render interval (ms) for throttling (~60 FPS) */
const MIN_RENDER_INTERVAL = 16;

/**
 * RenderManager handles output formatting, throttling and cursor management.
 * This class is responsible for rendering logic only.
 */
export class RenderManager {
  private lastRenderTime = 0;

  /**
   * Renders the spinner output using the provided render function.
   * @param renderFn - The function that returns the output string.
   * @param activeSpinners - Array of active spinner instances.
   * @param spinnerIndex - The index of the spinner that is rendering.
   * @param clearLineFn - Function to clear the current line.
   * @param writeFn - Function to write output to the console.
   */
  public render(
    renderFn: () => string,
    activeSpinners: { id: string; status: string }[],
    spinnerIndex: number,
    clearLineFn: () => void,
    writeFn: (output: string) => void,
  ): void {
    const now = performance.now();
    if (now - this.lastRenderTime < MIN_RENDER_INTERVAL) return;
    this.lastRenderTime = now;
    CursorManager.updateCursorPosition(
      activeSpinners,
      spinnerIndex,
      clearLineFn,
    );
    try {
      const output = renderFn();
      writeFn(output);
      CursorManager.restoreCursorPosition(activeSpinners, spinnerIndex);
    } catch (error) {
      console.error(`Error in render: ${(error as Error).message}`);
    }
  }
}
