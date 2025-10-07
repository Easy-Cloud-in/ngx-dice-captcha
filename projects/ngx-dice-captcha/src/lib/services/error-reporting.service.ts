import { Injectable } from '@angular/core';
import { ErrorInfo, ErrorSeverity } from '../utils/error-handler.util';

/**
 * Error report data structure
 */
export interface ErrorReport {
  id: string;
  timestamp: number;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  severity: ErrorSeverity;
  context: {
    component?: string;
    method?: string;
    userAgent?: string;
    url?: string;
    additionalData?: Record<string, any>;
  };
  recoverable: boolean;
  retryable: boolean;
  resolved: boolean;
  resolvedAt?: number;
  resolutionMethod?: string;
}

/**
 * Error reporting configuration
 */
export interface ErrorReportingConfig {
  enabled?: boolean;
  endpoint?: string;
  apiKey?: string;
  batchSize?: number;
  reportInterval?: number;
  includeStackTrace?: boolean;
  includeUserAgent?: boolean;
  includeUrl?: boolean;
  maxReports?: number;
}

/**
 * Error reporting statistics
 */
export interface ErrorReportingStats {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByComponent: Record<string, number>;
  resolvedErrors: number;
  unresolvedErrors: number;
  averageResolutionTime?: number;
}

/**
 * Service for centralized error reporting and monitoring.
 *
 * Collects, categorizes, and reports errors to external monitoring services.
 * Provides statistics and analytics on error patterns and resolution rates.
 *
 * @example
 * ```typescript
 * // Configure error reporting
 * errorReporting.configure({
 *   enabled: true,
 *   endpoint: 'https://api.example.com/errors',
 *   apiKey: 'your-api-key',
 *   batchSize: 10,
 *   reportInterval: 30000 // 30 seconds
 * });
 *
 * // Report an error
 * errorReporting.reportError({
 *   error: new Error('Something went wrong'),
 *   severity: ErrorSeverity.MEDIUM,
 *   context: { component: 'MyComponent', method: 'doSomething' },
 *   recoverable: true,
 *   retryable: false
 * });
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorReportingService {
  private config: Required<ErrorReportingConfig> = {
    enabled: false,
    endpoint: '',
    apiKey: '',
    batchSize: 10,
    reportInterval: 30000, // 30 seconds
    includeStackTrace: true,
    includeUserAgent: true,
    includeUrl: true,
    maxReports: 1000,
  };

  private errorReports: ErrorReport[] = [];
  private pendingReports: ErrorReport[] = [];
  private reportTimer?: ReturnType<typeof setInterval>;
  private reportCallbacks = new Set<(report: ErrorReport) => void>();

  constructor() {
    // Set up periodic reporting
    this.setupPeriodicReporting();
  }

  /**
   * Configures the error reporting service.
   *
   * @param config - Configuration options
   * @public
   */
  configure(config: ErrorReportingConfig): void {
    this.config = {
      enabled: config.enabled ?? false,
      endpoint: config.endpoint ?? '',
      apiKey: config.apiKey ?? '',
      batchSize: config.batchSize ?? 10,
      reportInterval: config.reportInterval ?? 30000,
      includeStackTrace: config.includeStackTrace ?? true,
      includeUserAgent: config.includeUserAgent ?? true,
      includeUrl: config.includeUrl ?? true,
      maxReports: config.maxReports ?? 1000,
    };

    // Restart periodic reporting if interval changed
    if (config.reportInterval) {
      this.setupPeriodicReporting();
    }
  }

  /**
   * Reports an error to the monitoring system.
   *
   * @param errorInfo - Error information to report
   * @returns The generated error report ID
   * @public
   */
  reportError(errorInfo: ErrorInfo): string {
    if (!this.config.enabled) {
      return '';
    }

    const report: ErrorReport = {
      id: this.generateReportId(),
      timestamp: Date.now(),
      error: {
        name: errorInfo.error.name,
        message: errorInfo.error.message,
        stack: this.config.includeStackTrace ? errorInfo.error.stack : undefined,
      },
      severity: errorInfo.severity,
      context: {
        component: errorInfo.context.component,
        method: errorInfo.context.method,
        userAgent: this.config.includeUserAgent ? errorInfo.context.userAgent : undefined,
        url: this.config.includeUrl ? errorInfo.context.url : undefined,
        additionalData: errorInfo.context.additionalData,
      },
      recoverable: errorInfo.recoverable,
      retryable: errorInfo.retryable,
      resolved: false,
    };

    // Add to reports
    this.errorReports.push(report);
    this.pendingReports.push(report);

    // Limit report count
    if (this.errorReports.length > this.config.maxReports) {
      this.errorReports = this.errorReports.slice(-this.config.maxReports / 2);
    }

    // Notify callbacks
    this.notifyReportCallbacks(report);

    // Send immediately if batch size reached
    if (this.pendingReports.length >= this.config.batchSize) {
      this.sendPendingReports();
    }

    return report.id;
  }

  /**
   * Marks an error as resolved.
   *
   * @param reportId - ID of the error report to resolve
   * @param resolutionMethod - How the error was resolved
   * @public
   */
  resolveError(reportId: string, resolutionMethod?: string): void {
    const report = this.errorReports.find((r) => r.id === reportId);
    if (report && !report.resolved) {
      report.resolved = true;
      report.resolvedAt = Date.now();
      report.resolutionMethod = resolutionMethod;

      // Remove from pending reports
      const pendingIndex = this.pendingReports.findIndex((r) => r.id === reportId);
      if (pendingIndex !== -1) {
        this.pendingReports.splice(pendingIndex, 1);
      }

      // Report resolution
      this.reportResolution(report);
    }
  }

  /**
   * Gets error statistics.
   *
   * @returns Error reporting statistics
   * @public
   */
  getStats(): ErrorReportingStats {
    const stats: ErrorReportingStats = {
      totalErrors: this.errorReports.length,
      errorsBySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      errorsByComponent: {},
      resolvedErrors: 0,
      unresolvedErrors: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    this.errorReports.forEach((report) => {
      // Count by severity
      stats.errorsBySeverity[report.severity]++;

      // Count by component
      if (report.context.component) {
        stats.errorsByComponent[report.context.component] =
          (stats.errorsByComponent[report.context.component] || 0) + 1;
      }

      // Count resolved/unresolved
      if (report.resolved) {
        stats.resolvedErrors++;
        if (report.resolvedAt) {
          totalResolutionTime += report.resolvedAt - report.timestamp;
          resolvedCount++;
        }
      } else {
        stats.unresolvedErrors++;
      }
    });

    // Calculate average resolution time
    if (resolvedCount > 0) {
      stats.averageResolutionTime = totalResolutionTime / resolvedCount;
    }

    return stats;
  }

  /**
   * Gets error reports filtered by criteria.
   *
   * @param filters - Optional filters to apply
   * @returns Array of error reports
   * @public
   */
  getReports(filters?: {
    severity?: ErrorSeverity;
    component?: string;
    resolved?: boolean;
    since?: number;
  }): ErrorReport[] {
    let reports = [...this.errorReports];

    if (filters) {
      if (filters.severity) {
        reports = reports.filter((r) => r.severity === filters.severity);
      }
      if (filters.component) {
        reports = reports.filter((r) => r.context.component === filters.component);
      }
      if (filters.resolved !== undefined) {
        reports = reports.filter((r) => r.resolved === filters.resolved);
      }
      if (filters.since) {
        reports = reports.filter((r) => r.timestamp >= filters.since!);
      }
    }

    return reports.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Registers a callback to be notified of new error reports.
   *
   * @param callback - Function to call when an error is reported
   * @returns Function to unregister the callback
   * @public
   */
  onReport(callback: (report: ErrorReport) => void): () => void {
    this.reportCallbacks.add(callback);
    return () => this.reportCallbacks.delete(callback);
  }

  /**
   * Manually sends all pending error reports.
   *
   * @public
   */
  sendPendingReports(): void {
    if (!this.config.enabled || !this.config.endpoint || this.pendingReports.length === 0) {
      return;
    }

    const reportsToSend = [...this.pendingReports];
    this.pendingReports = [];

    this.sendReports(reportsToSend);
  }

  /**
   * Clears all error reports.
   *
   * @public
   */
  clearReports(): void {
    this.errorReports = [];
    this.pendingReports = [];
  }

  /**
   * Sets up periodic reporting of errors.
   *
   * @private
   */
  private setupPeriodicReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    if (this.config.enabled && this.config.reportInterval > 0) {
      this.reportTimer = setInterval(() => {
        this.sendPendingReports();
      }, this.config.reportInterval);
    }
  }

  /**
   * Sends error reports to the configured endpoint.
   *
   * @param reports - Reports to send
   * @private
   */
  private sendReports(reports: ErrorReport[]): void {
    if (!this.config.endpoint || !this.config.apiKey) {
      return;
    }

    const payload = {
      reports,
      metadata: {
        timestamp: Date.now(),
        source: 'ngx-dice-captcha',
        version: '1.0.0',
      },
    };

    fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'X-Source': 'ngx-dice-captcha',
      },
      body: JSON.stringify(payload),
    }).catch((error) => {
      // Failed to send reports, add them back to pending
      this.pendingReports.unshift(...reports);

      // Limit pending reports
      if (this.pendingReports.length > this.config.batchSize * 2) {
        this.pendingReports = this.pendingReports.slice(0, this.config.batchSize);
      }
    });
  }

  /**
   * Reports error resolution to the monitoring system.
   *
   * @param report - The resolved error report
   * @private
   */
  private reportResolution(report: ErrorReport): void {
    if (!this.config.endpoint || !this.config.apiKey) {
      return;
    }

    const payload = {
      resolution: {
        reportId: report.id,
        resolvedAt: report.resolvedAt,
        resolutionMethod: report.resolutionMethod,
      },
      metadata: {
        timestamp: Date.now(),
        source: 'ngx-dice-captcha',
        version: '1.0.0',
      },
    };

    fetch(`${this.config.endpoint}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'X-Source': 'ngx-dice-captcha',
      },
      body: JSON.stringify(payload),
    }).catch((error) => {
      // Failed to report resolution, but don't retry
    });
  }

  /**
   * Notifies all registered report callbacks.
   *
   * @param report - Error report to notify about
   * @private
   */
  private notifyReportCallbacks(report: ErrorReport): void {
    this.reportCallbacks.forEach((callback) => {
      try {
        callback(report);
      } catch (error) {
        // Don't let callback errors cause more errors
      }
    });
  }

  /**
   * Generates a unique report ID.
   *
   * @returns Unique report ID
   * @private
   */
  private generateReportId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup method called when service is destroyed.
   *
   * @public
   */
  ngOnDestroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = undefined;
    }

    // Send any pending reports before cleanup
    this.sendPendingReports();
  }
}
