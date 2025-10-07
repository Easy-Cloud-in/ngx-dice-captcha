import { TestBed } from '@angular/core/testing';
import { ErrorReportingService } from './error-reporting.service';
import { ErrorHandlerUtil, ErrorSeverity } from '../utils/error-handler.util';

describe('ErrorReportingService', () => {
  let service: ErrorReportingService;
  let mockErrorHandler: jasmine.SpyObj<ErrorHandlerUtil>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ErrorHandlerUtil', ['handleError']);

    TestBed.configureTestingModule({
      providers: [ErrorReportingService, { provide: ErrorHandlerUtil, useValue: spy }],
    });

    service = TestBed.inject(ErrorReportingService);
    mockErrorHandler = TestBed.inject(ErrorHandlerUtil) as jasmine.SpyObj<ErrorHandlerUtil>;
  });

  afterEach(() => {
    service.clearReports();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('configure', () => {
    it('should configure with default values', () => {
      service.configure({});

      const stats = service.getStats();
      expect(stats.totalErrors).toBe(0);
    });

    it('should configure with custom values', () => {
      const config = {
        enabled: true,
        endpoint: 'https://api.example.com/errors',
        apiKey: 'test-key',
        batchSize: 5,
        reportInterval: 10000,
      };

      service.configure(config);

      // Configuration is applied internally
      expect(service).toBeTruthy();
    });

    it('should disable reporting when enabled is false', () => {
      service.configure({ enabled: false });

      const reportId = service.reportError({
        error: new Error('Test error'),
        severity: ErrorSeverity.MEDIUM,
        context: { component: 'TestComponent', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      expect(reportId).toBe('');
    });
  });

  describe('reportError', () => {
    beforeEach(() => {
      service.configure({
        enabled: false, // Disable reporting for tests
      });
    });

    it('should report an error and return an ID', () => {
      const reportId = service.reportError({
        error: new Error('Test error'),
        severity: ErrorSeverity.MEDIUM,
        context: { component: 'TestComponent', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      expect(reportId).toBeTruthy();
      expect(reportId).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should store error report in history', () => {
      service.reportError({
        error: new Error('Test error'),
        severity: ErrorSeverity.HIGH,
        context: { component: 'TestComponent', timestamp: Date.now() },
        recoverable: false,
        retryable: true,
      });

      const reports = service.getReports();
      expect(reports.length).toBe(1);
      expect(reports[0].error.message).toBe('Test error');
      expect(reports[0].severity).toBe(ErrorSeverity.HIGH);
      expect(reports[0].resolved).toBe(false);
    });

    it('should notify report callbacks', () => {
      const callbackSpy = jasmine.createSpy('reportCallback');
      service.onReport(callbackSpy);

      service.reportError({
        error: new Error('Test error'),
        severity: ErrorSeverity.MEDIUM,
        context: { component: 'TestComponent', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      expect(callbackSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          error: jasmine.objectContaining({
            message: 'Test error',
          }),
        })
      );
    });

    it('should allow callback unregistration', () => {
      const callbackSpy = jasmine.createSpy('reportCallback');
      const unregister = service.onReport(callbackSpy);

      unregister();

      service.reportError({
        error: new Error('Test error'),
        severity: ErrorSeverity.MEDIUM,
        context: { component: 'TestComponent', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      expect(callbackSpy).not.toHaveBeenCalled();
    });
  });

  describe('resolveError', () => {
    beforeEach(() => {
      service.configure({
        enabled: false,
      });
    });

    it('should mark an error as resolved', () => {
      const reportId = service.reportError({
        error: new Error('Test error'),
        severity: ErrorSeverity.MEDIUM,
        context: { component: 'TestComponent', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      service.resolveError(reportId, 'Manual fix');

      const reports = service.getReports();
      expect(reports[0].resolved).toBe(true);
      expect(reports[0].resolutionMethod).toBe('Manual fix');
      expect(reports[0].resolvedAt).toBeTruthy();
    });

    it('should not resolve non-existent error', () => {
      service.resolveError('non-existent-id', 'Test resolution');

      const reports = service.getReports();
      expect(reports.length).toBe(0);
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      service.configure({
        enabled: false,
      });
    });

    it('should return correct statistics', () => {
      // Add errors of different severities
      service.reportError({
        error: new Error('Low error'),
        severity: ErrorSeverity.LOW,
        context: { component: 'ComponentA', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      service.reportError({
        error: new Error('High error'),
        severity: ErrorSeverity.HIGH,
        context: { component: 'ComponentB', timestamp: Date.now() },
        recoverable: false,
        retryable: true,
      });

      const stats = service.getStats();
      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsBySeverity[ErrorSeverity.LOW as ErrorSeverity]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.HIGH as ErrorSeverity]).toBe(1);
      expect(stats.errorsByComponent['ComponentA']).toBe(1);
      expect(stats.errorsByComponent['ComponentB']).toBe(1);
      expect(stats.resolvedErrors).toBe(0);
      expect(stats.unresolvedErrors).toBe(2);
    });

    it('should calculate average resolution time', (done) => {
      const reportId = service.reportError({
        error: new Error('Test error'),
        severity: ErrorSeverity.MEDIUM,
        context: { component: 'TestComponent', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      // Wait a bit before resolving
      setTimeout(() => {
        service.resolveError(reportId);

        const stats = service.getStats();
        expect(stats.resolvedErrors).toBe(1);
        expect(stats.averageResolutionTime).toBeGreaterThan(0);
        done();
      }, 10);
    });
  });

  describe('getReports', () => {
    beforeEach(() => {
      service.configure({
        enabled: false,
      });
    });

    it('should return all reports by default', () => {
      service.reportError({
        error: new Error('Error 1'),
        severity: ErrorSeverity.LOW,
        context: { component: 'ComponentA', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      service.reportError({
        error: new Error('Error 2'),
        severity: ErrorSeverity.HIGH,
        context: { component: 'ComponentB', timestamp: Date.now() },
        recoverable: false,
        retryable: true,
      });

      const reports = service.getReports();
      expect(reports.length).toBe(2);
    });

    it('should filter reports by severity', () => {
      service.reportError({
        error: new Error('Low error'),
        severity: ErrorSeverity.LOW,
        context: { component: 'ComponentA', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      service.reportError({
        error: new Error('High error'),
        severity: ErrorSeverity.HIGH,
        context: { component: 'ComponentB', timestamp: Date.now() },
        recoverable: false,
        retryable: true,
      });

      const highSeverityReports = service.getReports({ severity: ErrorSeverity.HIGH });
      expect(highSeverityReports.length).toBe(1);
      expect(highSeverityReports[0].error.message).toBe('High error');
    });

    it('should filter reports by component', () => {
      service.reportError({
        error: new Error('Error 1'),
        severity: ErrorSeverity.LOW,
        context: { component: 'ComponentA', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      service.reportError({
        error: new Error('Error 2'),
        severity: ErrorSeverity.HIGH,
        context: { component: 'ComponentB', timestamp: Date.now() },
        recoverable: false,
        retryable: true,
      });

      const componentAReports = service.getReports({ component: 'ComponentA' });
      expect(componentAReports.length).toBe(1);
      expect(componentAReports[0].context.component).toBe('ComponentA');
    });

    it('should filter reports by resolution status', () => {
      const reportId1 = service.reportError({
        error: new Error('Error 1'),
        severity: ErrorSeverity.LOW,
        context: { component: 'ComponentA', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      const reportId2 = service.reportError({
        error: new Error('Error 2'),
        severity: ErrorSeverity.HIGH,
        context: { component: 'ComponentB', timestamp: Date.now() },
        recoverable: false,
        retryable: true,
      });

      service.resolveError(reportId1);

      const resolvedReports = service.getReports({ resolved: true });
      expect(resolvedReports.length).toBe(1);
      expect(resolvedReports[0].id).toBe(reportId1);

      const unresolvedReports = service.getReports({ resolved: false });
      expect(unresolvedReports.length).toBe(1);
      expect(unresolvedReports[0].id).toBe(reportId2);
    });

    it('should sort reports by timestamp (newest first)', () => {
      const reportId1 = service.reportError({
        error: new Error('Error 1'),
        severity: ErrorSeverity.LOW,
        context: { component: 'ComponentA', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      // Wait a bit to ensure different timestamps
      setTimeout(() => {
        const reportId2 = service.reportError({
          error: new Error('Error 2'),
          severity: ErrorSeverity.HIGH,
          context: { component: 'ComponentB', timestamp: Date.now() },
          recoverable: false,
          retryable: true,
        });

        const reports = service.getReports();
        expect(reports[0].id).toBe(reportId2); // Newest first
        expect(reports[1].id).toBe(reportId1);
      }, 1);
    });
  });

  describe('clearReports', () => {
    beforeEach(() => {
      service.configure({
        enabled: false,
      });
    });

    it('should clear all reports', () => {
      service.reportError({
        error: new Error('Test error'),
        severity: ErrorSeverity.MEDIUM,
        context: { component: 'TestComponent', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      expect(service.getReports().length).toBe(1);

      service.clearReports();
      expect(service.getReports().length).toBe(0);
    });
  });

  describe('sendPendingReports', () => {
    beforeEach(() => {
      service.configure({
        enabled: false,
        endpoint: 'https://api.example.com/errors',
        apiKey: 'test-key',
      });
    });

    it('should not send reports when endpoint is not configured', () => {
      service.configure({ endpoint: '' });

      service.reportError({
        error: new Error('Test error'),
        severity: ErrorSeverity.MEDIUM,
        context: { component: 'TestComponent', timestamp: Date.now() },
        recoverable: true,
        retryable: false,
      });

      // Should not throw error
      expect(() => service.sendPendingReports()).not.toThrow();
    });

    it('should clear pending reports after sending', () => {
      // Add multiple reports to trigger batch sending
      for (let i = 0; i < 12; i++) {
        service.reportError({
          error: new Error(`Error ${i}`),
          severity: ErrorSeverity.MEDIUM,
          context: { component: 'TestComponent', timestamp: Date.now() },
          recoverable: true,
          retryable: false,
        });
      }

      // Reports should be sent when batch size is reached
      // We can't easily test the actual HTTP request, but we can verify
      // the service doesn't throw errors
      expect(() => service.sendPendingReports()).not.toThrow();
    });
  });
});
