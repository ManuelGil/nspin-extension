/**
 * Helper functions to detect various environment conditions
 * Particularly useful for adapting behavior in CI/CD environments
 */

/**
 * Checks if the current process is running in a CI/CD environment
 * Detects common CI/CD services like GitHub Actions, Jenkins, Travis CI, etc.
 *
 * @returns {boolean} True if running in a CI/CD environment
 */
export function isCI(): boolean {
  return !!(
    (
      process.env['CI'] || // Travis CI, CircleCI, GitLab CI, AppVeyor, GitHub Actions
      process.env['CONTINUOUS_INTEGRATION'] || // Travis CI
      process.env['BUILD_NUMBER'] || // Jenkins
      process.env['TEAMCITY_VERSION'] || // TeamCity
      process.env['GITHUB_ACTIONS']
    ) // GitHub Actions
  );
}

/**
 * Checks if the current process has an interactive terminal
 *
 * @returns {boolean} True if running in an interactive terminal
 */
export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/**
 * Gets an appropriate spinner interval based on the environment
 * Uses slower intervals in CI/CD environments to reduce CPU usage
 *
 * @param {number} defaultInterval - The default interval to use in interactive environments
 * @returns {number} Appropriate spinner interval in milliseconds
 */
export function getEnvironmentAwareInterval(
  defaultInterval: number = 80,
): number {
  const normalizedInterval =
    Number.isFinite(defaultInterval) && defaultInterval > 0
      ? Math.floor(defaultInterval)
      : 80;

  return isCI() ? Math.max(normalizedInterval, 150) : normalizedInterval;
}

/**
 * Determines if spinner animations should be enabled
 * Some CI environments might struggle with animations
 *
 * @returns {boolean} True if animations should be enabled
 */
export function shouldEnableAnimations(): boolean {
  // Disable animations in non-interactive environments
  if (!isInteractive()) return false;

  // In CI, disable animations when the terminal does not expose capabilities.
  const disableInCI =
    !process.env['TERM_PROGRAM'] || process.env['TERM'] === 'dumb';

  return !(isCI() && disableInCI);
}
