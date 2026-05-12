import { Spinner } from 'nspin-extension';

/**
 * Global Example
 * --------------
 * Demonstrates how to manage multiple spinners concurrently and stop them all at once.
 */
const spinnerOne = new Spinner({
  frames: ['-', '=', '≡'],
  interval: 100,
});
const spinnerTwo = new Spinner({
  frames: ['◴', '◷', '◶', '◵'],
  interval: 120,
});
const spinnerThree = new Spinner({
  frames: ['|', '/', '-', '\\'],
  interval: 80,
});

console.log('Starting multiple global spinners...');
spinnerOne.start('Global Spinner 1: Downloading...');
spinnerTwo.start('Global Spinner 2: Processing...');
spinnerThree.start('Global Spinner 3: Updating...');

// Stop all spinners after 5 seconds.
setTimeout(() => {
  Spinner.stopAll('All spinners: Operation complete.');
  console.log('[Global] All spinners have been stopped at 5 seconds.');
}, 5000);
