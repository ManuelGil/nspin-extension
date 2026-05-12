import { Spinner } from 'nspin-extension';

/**
 * Basic Example
 * -------------
 * Demonstrates starting, pausing, resuming, restarting, and stopping a spinner.
 */
const basicSpinner = new Spinner({
  frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  interval: 100,
});

console.log('Starting basic spinner...');
basicSpinner.start('Basic spinner: Processing...');

// Pause after 2 seconds with a descriptive log.
setTimeout(() => {
  basicSpinner.pause();
  console.log('[Basic] Spinner paused at 2 seconds.');
}, 2000);

// Resume after 4 seconds.
setTimeout(() => {
  basicSpinner.resume();
  console.log('[Basic] Spinner resumed at 4 seconds.');
}, 4000);

// Restart after 6 seconds.
setTimeout(() => {
  basicSpinner.restart();
  console.log('[Basic] Spinner restarted at 6 seconds.');
}, 6000);

// Stop after 8 seconds.
setTimeout(() => {
  basicSpinner.stop('Basic spinner: Finished processing.');
  console.log('[Basic] Spinner stopped at 8 seconds.');
}, 8000);
