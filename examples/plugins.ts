import { Spinner, type SpinnerPlugin } from 'nspin-extension';

/**
 * Plugins Example
 * ---------------
 * Shows how to register a plugin to receive notifications on spinner events.
 */
const loggingPlugin: SpinnerPlugin = {
  onStart: (_spinner, message) =>
    console.log(
      `Plugin Notification: Spinner started with message: "${message}"`,
    ),
  onPause: () => console.log('Plugin Notification: Spinner has been paused.'),
  onResume: () => console.log('Plugin Notification: Spinner has resumed.'),
  onRestart: () =>
    console.log('Plugin Notification: Spinner has been restarted.'),
  onRender: (_spinner, output) =>
    console.log(`Plugin Notification: Rendering output -> ${output}`),
  onStop: (_spinner, finalText) =>
    console.log(
      `Plugin Notification: Spinner stopped with message: "${finalText}"`,
    ),
};

const pluginSpinner = new Spinner({
  frames: ['.', 'o', 'O', '0'],
  interval: 150,
});

pluginSpinner.registerPlugin(loggingPlugin);

console.log('Starting spinner with plugin support...');
pluginSpinner.start('Plugin Spinner: Executing task...');

setTimeout(() => {
  pluginSpinner.pause();
  console.log('[Plugin] Spinner paused at 2 seconds.');
}, 2000);

setTimeout(() => {
  pluginSpinner.resume();
  console.log('[Plugin] Spinner resumed at 4 seconds.');
}, 4000);

setTimeout(() => {
  pluginSpinner.restart();
  console.log('[Plugin] Spinner restarted at 6 seconds.');
}, 6000);

setTimeout(() => {
  pluginSpinner.stop('Plugin Spinner: Task completed.');
  console.log('[Plugin] Spinner stopped at 8 seconds.');
}, 8000);
