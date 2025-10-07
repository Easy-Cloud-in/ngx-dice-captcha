/**
 * Custom error class for component-specific errors with enhanced context.
 *
 * Provides structured error information including component name, operation,
 * and optional context data for better debugging and error tracking.
 *
 * @example
 * ```typescript
 * throw new ComponentError(
 *   'DiceCanvasComponent',
 *   'initializeScene',
 *   'Failed to create WebGL context',
 *   { webglSupport: false, canvas: canvasElement }
 * );
 * ```
 *
 * @public
 * @since 1.0.0
 */
export class ComponentError extends Error {
  /**
   * Creates a new ComponentError instance.
   *
   * @param component - Name of the component where the error occurred
   * @param operation - Name of the operation that failed
   * @param message - Detailed error message
   * @param context - Optional context data for debugging
   */
  constructor(
    public readonly component: string,
    public readonly operation: string,
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(`[${component}] ${operation}: ${message}`);
    this.name = 'ComponentError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (
      typeof (
        Error as unknown as { captureStackTrace?: (error: Error, constructor: Function) => void }
      ).captureStackTrace === 'function'
    ) {
      (
        Error as unknown as { captureStackTrace: (error: Error, constructor: Function) => void }
      ).captureStackTrace(this, ComponentError);
    }
  }

  /**
   * Converts the error to a JSON-serializable object.
   * Useful for logging to external services.
   *
   * @returns Object representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      component: this.component,
      operation: this.operation,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}
