/**
 * CursorManager abstracts the logic to update and restore the console cursor position.
 */
export class CursorManager {
  /**
   * Moves the cursor to the correct position for the current spinner.
   * @param activeSpinners - Array of active spinner instances.
   * @param spinnerIndex - The index of the spinner that is rendering.
   * @param clearLineFn - Function to clear the current line.
   */
  public static updateCursorPosition(
    activeSpinners: { id: string; status: string }[],
    spinnerIndex: number,
    clearLineFn: () => void,
  ): void {
    if (
      process.stdout.isTTY &&
      typeof process.stdout.moveCursor === 'function'
    ) {
      process.stdout.moveCursor.call(
        process.stdout,
        0,
        -(activeSpinners.length - spinnerIndex),
      );
      process.stdout.cursorTo(0);
    }
    try {
      clearLineFn();
    } catch {
      process.stdout.write('\r');
    }
  }

  /**
   * Restores the cursor position after rendering.
   * @param activeSpinners - Array of active spinner instances.
   * @param spinnerIndex - The index of the spinner that is rendering.
   */
  public static restoreCursorPosition(
    activeSpinners: { id: string; status: string }[],
    spinnerIndex: number,
  ): void {
    if (
      process.stdout.isTTY &&
      typeof process.stdout.moveCursor === 'function'
    ) {
      process.stdout.moveCursor.call(
        process.stdout,
        0,
        activeSpinners.length - spinnerIndex,
      );
    }
  }
}
