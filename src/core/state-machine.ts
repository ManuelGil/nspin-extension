import { SpinnerState } from '../types/spinner-state.js';

/** Allowed state transitions */
const ALLOWED_TRANSITIONS: Record<SpinnerState, SpinnerState[]> = {
  [SpinnerState.Idle]: [SpinnerState.Running, SpinnerState.Destroyed],
  [SpinnerState.Running]: [
    SpinnerState.Paused,
    SpinnerState.Stopped,
    SpinnerState.Destroyed,
  ],
  [SpinnerState.Paused]: [
    SpinnerState.Running,
    SpinnerState.Stopped,
    SpinnerState.Destroyed,
  ],
  // From Stopped, allow transition to Idle to restart.
  [SpinnerState.Stopped]: [SpinnerState.Idle, SpinnerState.Destroyed],
  [SpinnerState.Destroyed]: [],
};

/**
 * Simple state machine to manage spinner state transitions.
 * @class
 */
export class StateMachine {
  private state: SpinnerState;

  /**
   * Creates an instance of StateMachine.
   * @param {SpinnerState} initialState - The initial state of the state machine.
   */
  constructor(initialState: SpinnerState) {
    this.state = initialState;
  }

  /**
   * Returns the current state.
   * @returns {SpinnerState} The current state.
   */
  public getState(): SpinnerState {
    return this.state;
  }

  /**
   * Transitions the state machine to a new state if allowed.
   * @param {SpinnerState} newState - The desired new state.
   * @throws {Error} If the transition is not allowed.
   */
  public transition(newState: SpinnerState): void {
    if (this.state === newState) return;
    if (!ALLOWED_TRANSITIONS[this.state].includes(newState)) {
      throw new Error(`Invalid transition from ${this.state} to ${newState}.`);
    }
    this.state = newState;
  }
}
