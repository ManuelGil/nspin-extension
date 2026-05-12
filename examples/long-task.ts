import { Spinner } from 'nspin-extension';

/**
 * Long Task Example
 * -----------------
 * Demonstrates using a spinner for a long-running task.
 */
const longTaskSpinner = new Spinner({
  frames: ['🔄', '🔃'],
  interval: 200,
});

console.log('Starting long-running task spinner...');
longTaskSpinner.start('Long Task Spinner: Executing long task...');

// Simulate a long task by stopping the spinner after 10 seconds.
setTimeout(() => {
  longTaskSpinner.stop('Long Task Spinner: Task finished.');
  console.log('Long task spinner stopped after 10 seconds.');
}, 10000);
