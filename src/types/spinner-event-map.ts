import type { SpinnerPlugin } from './index.js';

/**
 * Interface for spinner events and their argument types.
 */
export interface SpinnerEventMap {
  start: [message?: string];
  stop: [finalText?: string];
  pause: [];
  resume: [];
  restart: [];
  runStart: [];
  runSuccess: [result: unknown];
  runError: [error: unknown];
  render: [output: string];
  pluginError: [error: Error];
  pluginDisabled: [plugin: SpinnerPlugin];
}
