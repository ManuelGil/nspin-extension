import { Spinner } from 'nspin-extension';

/**
 * Run Example
 * -----------
 * Demonstrates using the run() method to manage an asynchronous operation with spinner feedback.
 */
const asyncTask = new Promise<string>((resolve) => {
  setTimeout(() => {
    resolve('Async operation completed successfully!');
  }, 3000);
});

const asyncSpinner = new Spinner({
  frames: ['◐', '◓', '◑', '◒'],
  interval: 120,
});

console.log('Running async operation with spinner...');
asyncSpinner
  .run(asyncTask, 'Async Spinner: Processing async task...', {
    showError: true,
    onSuccess: (result) => console.log(`Async Task Success: ${result}`),
    onError: (error) => console.error(`Async Task Error: ${error}`),
    onStop: () => console.log('Async Spinner: Stopped after async operation.'),
  })
  .catch((error) => console.error('Async Spinner Caught Error:', error));
