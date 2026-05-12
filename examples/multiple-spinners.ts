import { Spinner } from 'nspin-extension';

/**
 * Multiple Spinners Example
 * -------------------------
 * Illustrates managing several spinners concurrently, each with its own unique style and message.
 */
const spinnerArray = [
  new Spinner({
    frames: ['🌑', '🌒', '🌓', '🌔', '🌕'],
    interval: 100,
  }),
  new Spinner({
    frames: ['🚶', '🏃'],
    interval: 150,
  }),
  new Spinner({
    frames: ['🔄', '🔃'],
    interval: 200,
  }),
];

console.log('Starting multiple concurrent spinners...');
spinnerArray.forEach((spinner, index) => {
  spinner.start(`Concurrent Spinner ${index + 1}: Running...`);
});

// Stop all spinners after 5 seconds with descriptive logging.
setTimeout(() => {
  spinnerArray.forEach((spinner, index) => {
    spinner.stop(`Concurrent Spinner ${index + 1}: Completed.`);
  });
  console.log('All concurrent spinners have been stopped at 5 seconds.');
}, 5000);
