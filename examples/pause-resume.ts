import { Spinner } from 'nspin-extension';

/**
 * Pause & Resume Example
 * -----------------------
 * Demonstrates pausing and resuming a spinner with clear, descriptive console logs.
 */
const pauseResumeSpinner = new Spinner({
  frames: ['💡', '✨', '⚡'],
  interval: 120,
});

console.log('Starting spinner for pause-resume demonstration...');
pauseResumeSpinner.start('Pause/Resume Spinner: Working on task...');

// Pause the spinner after 2 seconds.
setTimeout(() => {
  pauseResumeSpinner.pause();
  console.log('Pause/Resume Spinner: Paused at 2 seconds.');
}, 2000);

// Resume the spinner after 4 seconds.
setTimeout(() => {
  pauseResumeSpinner.resume();
  console.log('Pause/Resume Spinner: Resumed at 4 seconds.');
}, 4000);

// Finally, stop the spinner after 6 seconds.
setTimeout(() => {
  pauseResumeSpinner.stop('Pause/Resume Spinner: Task completed.');
  console.log('Pause/Resume Spinner: Stopped at 6 seconds.');
}, 6000);
