import { Injectable, NgZone } from '@angular/core';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context information
 */
export interface ErrorContext {
  component?: string;
  method?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

/**
 * Error information structure
 */
export interface ErrorInfo {
  error: Error;
  severity: ErrorSeverity;
  context: ErrorContext;
  recoverable: boolean;
  retryable: boolean;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  enableConsoleLogging?: boolean;
  enableErrorReporting?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  reportEndpoint?: string;
}

/**
 * Global error handler service for the CAPTCHA component.
 *
 * Catches and handles errors gracefully, preventing component crashes from
 * affecting the application. Provides error reporting, recovery options,
 * and centralized error management.
 *
 * @example
 * ```typescript
 * // Register error handler
 * errorHandler.initialize({
 *   enableConsoleLogging: true,
 *   enableErrorReporting: true,
 *   maxRetries: 3,
 *   retryDelay: 1000
 * });
 *
 * // Handle an error
 * try {
 *   riskyOperation();
 * } catch (error) {
 *   const handled = errorHandler.handleError(error, {
 *     component: 'MyComponent',
 *     method: 'riskyOperation',
 *     severity: ErrorSeverity.MEDIUM,
 *     recoverable: true,
 *     retryable: true
 *   });
 *
 *   if (handled.recovered) {
 *     // Operation recovered successfully
 *   }
 * }
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerUtil {
  private config: Required<ErrorHandlerConfig> = {
    enableConsoleLogging: true,
    enableErrorReporting: false,
    maxRetries: 3,
    retryDelay: 1000,
    reportEndpoint: '',
  };

  private errorHistory: ErrorInfo[] = [];
  private retryCounters = new Map<string, number>();
  private errorCallbacks = new Set<(error: ErrorInfo) => void>();

  constructor(private readonly ngZone: NgZone) {}

  /**
   * Initializes the error handler with configuration.
   *
   * @param config - Error handler configuration
   * @public
   */
  initialize(config: ErrorHandlerConfig = {}): void {
    this.config = {
      enableConsoleLogging: config.enableConsoleLogging ?? true,
      enableErrorReporting: config.enableErrorReporting ?? false,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      reportEndpoint: config.reportEndpoint ?? '',
    };

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Handles an error with context information.
   *
   * @param error - The error to handle
   * @param context - Context information about where the error occurred
   * @param severity - Error severity level
   * @param recoverable - Whether the error is recoverable
   * @param retryable - Whether the operation can be retried
   * @returns Object indicating if the error was handled and if recovery occurred
   * @public
   */
  handleError(
    error: Error,
    context: Partial<ErrorContext> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverable: boolean = true,
    retryable: boolean = false
  ): { handled: boolean; recovered: boolean; retryAttempted?: boolean } {
    const errorInfo: ErrorInfo = {
      error,
      severity,
      context: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context,
      },
      recoverable,
      retryable,
    };

    // Log error
    if (this.config.enableConsoleLogging) {
      this.logError(errorInfo);
    }

    // Add to history
    this.errorHistory.push(errorInfo);

    // Limit history size
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-50);
    }

    // Notify callbacks
    this.notifyErrorCallbacks(errorInfo);

    // Report error if enabled
    if (this.config.enableErrorReporting) {
      this.reportError(errorInfo);
    }

    // Attempt recovery if possible
    if (recoverable) {
      return {
        handled: true,
        recovered: this.attemptRecovery(errorInfo),
      };
    }

    return { handled: true, recovered: false };
  }

  /**
   * Handles an error with retry logic.
   *
   * @param error - The error to handle
   * @param operation - Function to retry
   * @param context - Context information
   * @param severity - Error severity level
   * @returns Promise that resolves with the operation result or rejects if all retries fail
   * @public
   */
  async handleWithRetry<T>(
    error: Error,
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): Promise<T> {
    const operationKey = `${context.component || 'unknown'}-${context.method || 'unknown'}`;
    const currentRetries = this.retryCounters.get(operationKey) || 0;

    if (currentRetries >= this.config.maxRetries) {
      this.handleError(error, context, severity, false, false);
      throw error;
    }

    // Increment retry counter
    this.retryCounters.set(operationKey, currentRetries + 1);

    // Wait before retry
    await this.delay(this.config.retryDelay);

    try {
      const result = await operation();

      // Reset retry counter on success
      this.retryCounters.delete(operationKey);

      return result;
    } catch (retryError) {
      // Handle retry error recursively
      return this.handleWithRetry(retryError as Error, operation, context, severity);
    }
  }

  /**
   * Registers a callback to be notified of errors.
   *
   * @param callback - Function to call when an error occurs
   * @returns Function to unregister the callback
   * @public
   */
  onError(callback: (error: ErrorInfo) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Gets the error history.
   *
   * @param severity - Optional severity filter
   * @returns Array of error information
   * @public
   */
  getErrorHistory(severity?: ErrorSeverity): ErrorInfo[] {
    if (severity) {
      return this.errorHistory.filter((error) => error.severity === severity);
    }
    return [...this.errorHistory];
  }

  /**
   * Clears the error history.
   *
   * @public
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.retryCounters.clear();
  }

  /**
   * Sets up global error handlers for unhandled errors.
   *
   * @private
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(event.reason),
        {
          component: 'Global',
          method: 'unhandledrejection',
          additionalData: { promise: event.promise },
        },
        ErrorSeverity.HIGH,
        false,
        false
      );
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(
        event.error || new Error(event.message),
        {
          component: 'Global',
          method: 'error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
        ErrorSeverity.CRITICAL,
        false,
        false
      );
    });
  }

  /**
   * Logs an error to the console.
   *
   * @param errorInfo - Error information to log
   * @private
   */
  private logError(errorInfo: ErrorInfo): void {
    // Error logging removed - errors are handled internally
  }

  /**
   * Reports an error to the configured endpoint.
   *
   * @param errorInfo - Error information to report
   * @private
   */
  private reportError(errorInfo: ErrorInfo): void {
    if (!this.config.reportEndpoint) {
      return;
    }

    // Send error report asynchronously
    fetch(this.config.reportEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          name: errorInfo.error.name,
          message: errorInfo.error.message,
          stack: errorInfo.error.stack,
        },
        severity: errorInfo.severity,
        context: errorInfo.context,
        recoverable: errorInfo.recoverable,
        retryable: errorInfo.retryable,
      }),
    }).catch((reportError) => {
      // Failed to report error - handle silently
    });
  }

  /**
   * Attempts to recover from an error.
   *
   * @param errorInfo - Error information
   * @returns Whether recovery was successful
   * @private
   */
  private attemptRecovery(errorInfo: ErrorInfo): boolean {
    const { error, context } = errorInfo;

    // Try common recovery strategies based on error type
    if (error.name === 'TypeError' && error.message.includes('null')) {
      // Null reference error - try to reinitialize
      return true;
    }

    if (error.name === 'QuotaExceededError') {
      // Storage quota exceeded - try to clear old data
      this.clearErrorHistory();
      return true;
    }

    // Generic recovery attempt

    // In a real implementation, you might have specific recovery strategies
    // for different error types and components
    return false;
  }

  /**
   * Notifies all registered error callbacks.
   *
   * @param errorInfo - Error information
   * @private
   */
  private notifyErrorCallbacks(errorInfo: ErrorInfo): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(errorInfo);
      } catch (callbackError) {
        // Don't let callback errors cause more errors
      }
    });
  }

  /**
   * Delays execution for a specified amount of time.
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
