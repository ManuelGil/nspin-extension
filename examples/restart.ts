import { Spinner } from 'nspin-extension';

/**
 * Restart Example
 * ---------------
 * Shows how to use the restart() method to reinitialize a spinner while preserving configuration.
 */
const restartSpinner = new Spinner({
  frames: ['↻', '↺'],
  interval: 100,
});

console.log('Starting spinner for restart demonstration...');
restartSpinner.start('Restart Spinner: Starting process...');

// Restart the spinner after 3 seconds with a new message.
setTimeout(() => {
  restartSpinner.restart();
  console.log('Restart Spinner: Process restarted at 3 seconds.');
}, 3000);

// Stop the spinner after 6 seconds.
setTimeout(() => {
  restartSpinner.stop('Restart Spinner: Process completed.');
  console.log('Restart Spinner: Stopped at 6 seconds.');
}, 6000);
