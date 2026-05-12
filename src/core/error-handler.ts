import type { Logger } from '../types/index.js';

/**
 * Error severity levels for categorizing spinner errors
 */
export enum ErrorSeverity {
  /** Low severity errors that don't affect spinner operation */
  LOW = 'low',
  /** Medium severity errors that may affect some spinner functionality */
  MEDIUM = 'medium',
  /** High severity errors that prevent normal spinner operation */
  HIGH = 'high',
  /** Critical errors that require immediate attention */
  CRITICAL = 'critical',
}

/**
 * Structured error information object
 */
export interface ErrorInfo {
  /** Original error object or message */
  error: Error | string;
  /** Component where the error occurred */
  component: string;
  /** Operation that was being performed */
  operation: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Timestamp when the error occurred */
  timestamp: number;
  /** Whether recovery was attempted */
  recoveryAttempted: boolean;
  /** Whether recovery was successful */
  recoverySuccessful?: boolean;
}

/**
 * Error handler for spinner operations
 * Provides structured error handling, logging, and recovery strategies
 */
export class ErrorHandler {
  /** Logger for output messages */
  private logger: Logger;
  /** Recent errors that occurred */
  private recentErrors: ErrorInfo[] = [];
  /** Maximum number of errors to keep in history */
  private maxErrorHistory = 10;
  /** Number of recovery attempts made */
  private recoveryAttempts = 0;
  /** Maximum number of recovery attempts allowed */
  private maxRecoveryAttempts = 3;
  /** Timestamp of the last error */
  private lastErrorTime = 0;
  /** Cooldown period in ms before allowing another recovery attempt */
  private recoveryCooldown = 5000; // 5 seconds

  /**
   * Creates a new ErrorHandler instance
   * @param logger - Logger instance for error reporting
   */
  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Handles an error by logging it and attempting recovery if appropriate
   *
   * @param error - The error that occurred
   * @param component - Component where the error occurred
   * @param operation - Operation being performed when the error happened
   * @param severity - Severity level of the error
   * @returns Whether recovery was attempted and if it was successful
   */
  public handleError(
    error: Error | string,
    component: string,
    operation: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  ): { attempted: boolean; successful?: boolean } {
    const now = Date.now();
    const errorMessage = error instanceof Error ? error.message : error;

    // Log the error with appropriate severity level
    if (severity === ErrorSeverity.LOW) {
      this.logger.log(`[${component}] ${operation}: ${errorMessage}`);
    } else if (severity === ErrorSeverity.MEDIUM) {
      this.logger.warn(`[${component}] ${operation}: ${errorMessage}`);
    } else {
      this.logger.error(`[${component}] ${operation}: ${errorMessage}`);
    }

    // Create error info object
    const errorInfo: ErrorInfo = {
      error,
      component,
      operation,
      severity,
      timestamp: now,
      recoveryAttempted: false,
    };

    // Add to recent errors, maintaining max history size
    this.recentErrors.unshift(errorInfo);
    if (this.recentErrors.length > this.maxErrorHistory) {
      this.recentErrors = this.recentErrors.slice(0, this.maxErrorHistory);
    }

    // Determine if recovery should be attempted
    const shouldAttemptRecovery = this.shouldAttemptRecovery(severity, now);

    if (!shouldAttemptRecovery) {
      return { attempted: false };
    }

    // Attempt recovery based on severity and component
    const recoveryResult = this.attemptRecovery(errorInfo);
    errorInfo.recoveryAttempted = true;
    errorInfo.recoverySuccessful = recoveryResult;
    this.recoveryAttempts++;
    this.lastErrorTime = now;

    return {
      attempted: true,
      successful: recoveryResult,
    };
  }

  /**
   * Decides whether to attempt recovery based on error severity and recent history
   *
   * @param severity - Severity of the error
   * @param timestamp - When the error occurred
   * @returns Whether recovery should be attempted
   * @private
   */
  private shouldAttemptRecovery(
    severity: ErrorSeverity,
    timestamp: number,
  ): boolean {
    // Don't attempt recovery for low severity errors
    if (severity === ErrorSeverity.LOW) return false;

    // Critical errors always attempt recovery
    if (severity === ErrorSeverity.CRITICAL) return true;

    // Check cooldown period
    if (timestamp - this.lastErrorTime < this.recoveryCooldown) return false;

    // Check max recovery attempts
    return this.recoveryAttempts < this.maxRecoveryAttempts;
  }

  /**
   * Attempts to recover from an error based on component and severity
   * Implements various recovery strategies depending on the error context
   *
   * @param errorInfo - Information about the error
   * @returns Whether recovery was successful
   * @private
   */
  private attemptRecovery(errorInfo: ErrorInfo): boolean {
    const { component, severity } = errorInfo;

    // Component-specific recovery strategies
    switch (component) {
      case 'render':
        return this.recoverFromRenderError(severity);
      case 'plugin':
        return this.recoverFromPluginError(severity);
      case 'state':
        return this.recoverFromStateError(severity);
      default:
        // Generic recovery strategy for other components
        return severity !== ErrorSeverity.CRITICAL;
    }
  }

  /**
   * Attempts recovery from rendering errors
   *
   * @param severity - Severity of the error
   * @returns Whether recovery was successful
   * @private
   */
  private recoverFromRenderError(severity: ErrorSeverity): boolean {
    // For render errors, recovery is typically successful for non-critical errors
    return severity !== ErrorSeverity.CRITICAL;
  }

  /**
   * Attempts recovery from plugin errors
   *
   * @param severity - Severity of the error
   * @returns Whether recovery was successful
   * @private
   */
  private recoverFromPluginError(_severity: ErrorSeverity): boolean {
    // Plugin errors can typically be recovered from by continuing without the plugin
    return true;
  }

  /**
   * Attempts recovery from state machine errors
   *
   * @param severity - Severity of the error
   * @returns Whether recovery was successful
   * @private
   */
  private recoverFromStateError(severity: ErrorSeverity): boolean {
    // State errors can be more difficult to recover from
    return (
      severity !== ErrorSeverity.HIGH && severity !== ErrorSeverity.CRITICAL
    );
  }

  /**
   * Gets recent errors that have occurred
   *
   * @param count - Maximum number of errors to retrieve (default: all)
   * @returns Array of recent errors
   */
  public getRecentErrors(count?: number): ErrorInfo[] {
    const limit = count ?? this.recentErrors.length;
    return this.recentErrors.slice(0, limit);
  }

  /**
   * Resets error tracking state
   * Useful when intentionally clearing error history
   */
  public reset(): void {
    this.recentErrors = [];
    this.recoveryAttempts = 0;
    this.lastErrorTime = 0;
  }
}
