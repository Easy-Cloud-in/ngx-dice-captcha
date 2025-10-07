import { TestBed } from '@angular/core/testing';
import { ErrorHandlerUtil, ErrorSeverity } from './error-handler.util';

describe('ErrorHandlerUtil', () => {
  let service: ErrorHandlerUtil;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorHandlerUtil],
    });
    service = TestBed.inject(ErrorHandlerUtil);
  });

  afterEach(() => {
    service.clearErrorHistory();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize', () => {
    it('should initialize with default configuration', () => {
      service.initialize();

      const stats = service.getErrorHistory();
      expect(stats).toEqual([]);
    });

    it('should initialize with custom configuration', () => {
      const config = {
        enableConsoleLogging: false,
        enableErrorReporting: true,
        maxRetries: 5,
        retryDelay: 2000,
      };

      service.initialize(config);

      // Configuration is applied internally, we can't directly test it
      // but we can verify the service was initialized without errors
      expect(service).toBeTruthy();
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      service.initialize({
        enableConsoleLogging: false, // Disable console logging for tests
        enableErrorReporting: false,
      });
    });

    it('should handle an error and return recovery status', () => {
      const error = new Error('Test error');
      const result = service.handleError(error, {
        component: 'TestComponent',
        method: 'testMethod',
      });

      expect(result.handled).toBe(true);
      expect(result.recovered).toBe(false); // Default recovery attempt
    });

    it('should store error in history', () => {
      const error = new Error('Test error');
      service.handleError(error, {
        component: 'TestComponent',
        method: 'testMethod',
      });

      const history = service.getErrorHistory();
      expect(history.length).toBe(1);
      expect(history[0].error.message).toBe('Test error');
      expect(history[0].context.component).toBe('TestComponent');
    });

    it('should filter errors by severity', () => {
      const lowError = new Error('Low error');
      const highError = new Error('High error');

      service.handleError(lowError, {}, ErrorSeverity.LOW);
      service.handleError(highError, {}, ErrorSeverity.HIGH);

      const lowErrors = service.getErrorHistory();
      expect(lowErrors.length).toBe(2);

      const highErrors = service.getErrorHistory(ErrorSeverity.HIGH);
      expect(highErrors.length).toBe(1);
      expect(highErrors[0].error.message).toBe('High error');
    });

    it('should notify error callbacks', () => {
      const callbackSpy = jasmine.createSpy('errorCallback');
      service.onError(callbackSpy);

      const error = new Error('Test error');
      service.handleError(error);

      expect(callbackSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          error: error,
          severity: ErrorSeverity.MEDIUM,
        })
      );
    });

    it('should allow callback unregistration', () => {
      const callbackSpy = jasmine.createSpy('errorCallback');
      const unregister = service.onError(callbackSpy);

      unregister();

      const error = new Error('Test error');
      service.handleError(error);

      expect(callbackSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleWithRetry', () => {
    beforeEach(() => {
      service.initialize({
        enableConsoleLogging: false,
        enableErrorReporting: false,
        maxRetries: 2,
        retryDelay: 10, // Short delay for tests
      });
    });

    it('should retry operation on failure', async () => {
      let attempts = 0;
      const failingOperation = jasmine.createSpy('failingOperation').and.callFake(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('Operation failed'));
        }
        return Promise.resolve('success');
      });

      const result = await service.handleWithRetry(new Error('Initial error'), failingOperation, {
        component: 'TestComponent',
      });

      expect(result).toBe('success');
      expect(failingOperation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const failingOperation = jasmine
        .createSpy('failingOperation')
        .and.returnValue(Promise.reject(new Error('Always fails')));

      await expectAsync(
        service.handleWithRetry(new Error('Initial error'), failingOperation)
      ).toBeRejectedWithError('Always fails');

      expect(failingOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('error history management', () => {
    beforeEach(() => {
      service.initialize({
        enableConsoleLogging: false,
        enableErrorReporting: false,
      });
    });

    it('should clear error history', () => {
      service.handleError(new Error('Test error'));
      expect(service.getErrorHistory().length).toBe(1);

      service.clearErrorHistory();
      expect(service.getErrorHistory().length).toBe(0);
    });

    it('should limit history size', () => {
      // Add many errors to test size limiting
      for (let i = 0; i < 150; i++) {
        service.handleError(new Error(`Error ${i}`));
      }

      const history = service.getErrorHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('global error handlers', () => {
    beforeEach(() => {
      service.initialize({
        enableConsoleLogging: false,
        enableErrorReporting: false,
      });
    });

    it('should handle unhandled promise rejections', (done) => {
      const callbackSpy = jasmine.createSpy('errorCallback');
      service.onError(callbackSpy);

      // Simulate unhandled promise rejection
      const event = new Event('unhandledrejection') as any;
      event.reason = 'Test rejection';
      window.dispatchEvent(event);

      // Use setTimeout to allow async error handling
      setTimeout(() => {
        expect(callbackSpy).toHaveBeenCalledWith(
          jasmine.objectContaining({
            error: jasmine.any(Error),
          })
        );
        done();
      }, 0);
    });

    it('should handle uncaught errors', (done) => {
      const callbackSpy = jasmine.createSpy('errorCallback');
      service.onError(callbackSpy);

      // Simulate uncaught error
      const event = new ErrorEvent('error', {
        error: new Error('Test error'),
        filename: 'test.js',
        lineno: 1,
        colno: 1,
      });
      window.dispatchEvent(event);

      // Use setTimeout to allow async error handling
      setTimeout(() => {
        expect(callbackSpy).toHaveBeenCalledWith(
          jasmine.objectContaining({
            error: jasmine.any(Error),
          })
        );
        done();
      }, 0);
    });
  });
});
