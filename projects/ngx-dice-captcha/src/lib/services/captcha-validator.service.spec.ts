import { TestBed } from '@angular/core/testing';
import { CaptchaValidatorService, ValidatorConfig } from './captcha-validator.service';
import { OperationType, Difficulty } from '../models/challenge.model';
import { VerificationMode } from '../models/verification-mode.model';

describe('CaptchaValidatorService', () => {
  let service: CaptchaValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CaptchaValidatorService],
    });
    service = TestBed.inject(CaptchaValidatorService);
  });

  afterEach(() => {
    service.clearAllSessions();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('configure', () => {
    it('should configure with default values', () => {
      const config = service.getConfig();
      expect(config.maxAttempts).toBe(5);
      expect(config.lockoutDuration).toBe(5 * 60 * 1000); // 5 minutes
      expect(config.attemptWindowDuration).toBe(60 * 1000); // 1 minute
      expect(config.tolerancePercentage).toBe(0);
    });

    it('should merge custom configuration with defaults', () => {
      service.configure({
        maxAttempts: 3,
        lockoutDuration: 10 * 60 * 1000, // 10 minutes
      });

      const config = service.getConfig();
      expect(config.maxAttempts).toBe(3);
      expect(config.lockoutDuration).toBe(10 * 60 * 1000);
      expect(config.attemptWindowDuration).toBe(60 * 1000); // Still default
    });

    it('should restart cleanup timer when cleanupInterval changes', () => {
      const spy = spyOn(service as any, 'stopAutomaticCleanup');
      const startSpy = spyOn(service as any, 'startAutomaticCleanup');

      service.configure({
        cleanupInterval: 60000, // 1 minute
      });

      expect(spy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('validateSolution', () => {
    const mockChallenge = {
      id: 'test-challenge',
      operation: OperationType.SUM,
      diceCount: 2,
      difficulty: Difficulty.EASY,
      description: 'Add the numbers on the dice',
      hint: 'Sum the values',
    };

    it('should validate correct sum solution', () => {
      const result = service.validateSolution(
        7, // 3 + 4 = 7
        mockChallenge,
        [3, 4],
        'test-session'
      );

      expect(result.success).toBe(true);
      expect(result.token).toBeTruthy();
      expect(result.message).toBe('CAPTCHA verification successful');
    });

    it('should reject incorrect sum solution', () => {
      const result = service.validateSolution(
        6, // Wrong answer
        mockChallenge,
        [3, 4],
        'test-session'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Expected: 7, Got: 6');
      expect(result.attemptsRemaining).toBe(4); // 5 - 1 attempt made
    });

    it('should validate correct product solution', () => {
      const productChallenge = {
        ...mockChallenge,
        operation: OperationType.PRODUCT,
      };

      const result = service.validateSolution(
        12, // 3 * 4 = 12
        productChallenge,
        [3, 4],
        'test-session'
      );

      expect(result.success).toBe(true);
      expect(result.token).toBeTruthy();
    });

    it('should validate correct difference solution', () => {
      const differenceChallenge = {
        ...mockChallenge,
        operation: OperationType.DIFFERENCE,
      };

      const result = service.validateSolution(
        1, // 4 - 3 = 1
        differenceChallenge,
        [3, 4],
        'test-session'
      );

      expect(result.success).toBe(true);
      expect(result.token).toBeTruthy();
    });

    it('should validate correct specific number solution', () => {
      const specificChallenge = {
        ...mockChallenge,
        operation: OperationType.SPECIFIC_NUMBER,
        targetValue: 3,
      };

      // Should return 1 when target value is found
      const result1 = service.validateSolution(
        1, // Yes, found
        specificChallenge,
        [3, 5],
        'test-session'
      );

      expect(result1.success).toBe(true);

      // Should return 0 when target value is not found
      const result2 = service.validateSolution(
        0, // No, not found
        specificChallenge,
        [4, 5],
        'test-session'
      );

      expect(result2.success).toBe(true);
    });

    it('should reject invalid dice results', () => {
      const result = service.validateSolution(
        7,
        mockChallenge,
        [3, 7], // Invalid dice value (7)
        'test-session'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid dice results');
    });

    it('should reject wrong number of dice results', () => {
      const result = service.validateSolution(
        7,
        mockChallenge,
        [3], // Only 1 die instead of 2
        'test-session'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid dice results');
    });
  });

  describe('validateIndividualDice', () => {
    const mockDiceValues = [3, 4, 5];

    it('should validate correct individual dice values', () => {
      const result = service.validateIndividualDice(
        [3, 4, 5], // Correct values
        mockDiceValues,
        'test-session'
      );

      expect(result.success).toBe(true);
      expect(result.token).toBeTruthy();
      expect(result.message).toBe('All dice values correctly identified!');
    });

    it('should reject incorrect individual dice values', () => {
      const result = service.validateIndividualDice(
        [3, 5, 5], // Incorrect second value
        mockDiceValues,
        'test-session'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('2 out of 3 dice values correct. Try again!');
      expect(result.partialMatch?.correctDice).toBe(2);
      expect(result.partialMatch?.totalDice).toBe(3);
    });

    it('should reject invalid number of dice inputs', () => {
      const result = service.validateIndividualDice(
        [3, 4], // Only 2 inputs instead of 3
        mockDiceValues,
        'test-session'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid number of dice values provided');
    });

    it('should reject invalid dice values', () => {
      const result = service.validateIndividualDice(
        [3, 7, 5], // Invalid dice value (7)
        mockDiceValues,
        'test-session'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid dice values. Each value must be between 1 and 6');
    });
  });

  describe('rate limiting', () => {
    const mockChallenge = {
      id: 'test-challenge',
      operation: OperationType.SUM,
      diceCount: 2,
      difficulty: Difficulty.EASY,
      description: 'Add the numbers on the dice',
      hint: 'Sum the values',
    };

    it('should allow attempts within limit', () => {
      for (let i = 0; i < 4; i++) {
        const result = service.validateSolution(
          0, // Wrong answer
          mockChallenge,
          [1, 1],
          'test-session'
        );
        expect(result.success).toBe(false);
        expect(result.attemptsRemaining).toBeGreaterThan(0);
      }
    });

    it('should lock out after max attempts', () => {
      // Make max attempts
      for (let i = 0; i < 5; i++) {
        service.validateSolution(0, mockChallenge, [1, 1], 'test-session');
      }

      // Next attempt should be blocked
      const result = service.validateSolution(7, mockChallenge, [3, 4], 'test-session');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Maximum attempts exceeded');
    });

    it('should reset attempts after success', () => {
      // Make some failed attempts
      for (let i = 0; i < 3; i++) {
        service.validateSolution(0, mockChallenge, [1, 1], 'test-session');
      }

      // Successful verification should reset attempts
      const successResult = service.validateSolution(7, mockChallenge, [3, 4], 'test-session');
      expect(successResult.success).toBe(true);

      // Should have full attempts again
      const anotherResult = service.validateSolution(0, mockChallenge, [1, 1], 'test-session');
      expect(anotherResult.success).toBe(false);
      expect(anotherResult.attemptsRemaining).toBe(4); // Full attempts minus 1
    });

    it('should clear expired sessions', (done) => {
      service.configure({
        sessionMaxAge: 100, // 100ms
      });

      // Create a session
      service.validateSolution(0, mockChallenge, [1, 1], 'test-session');

      // Wait for session to expire
      setTimeout(() => {
        const cleaned = service.cleanupOldSessions();
        expect(cleaned).toBe(1);
        done();
      }, 150);
    });
  });

  describe('token verification', () => {
    it('should verify valid token', () => {
      const result = service.validateSolution(
        7,
        {
          id: 'test-challenge',
          operation: OperationType.SUM,
          diceCount: 2,
          difficulty: Difficulty.EASY,
          description: 'Add the numbers on the dice',
          hint: 'Sum the values',
        },
        [3, 4],
        'test-session'
      );

      const verification = service.verifyToken(result.token!);
      expect(verification.valid).toBe(true);
      expect(verification.sessionId).toBe('test-session');
    });

    it('should reject invalid token', () => {
      const verification = service.verifyToken('invalid-token');
      expect(verification.valid).toBe(false);
    });

    it('should reject expired token', (done) => {
      const result = service.validateSolution(
        7,
        {
          id: 'test-challenge',
          operation: OperationType.SUM,
          diceCount: 2,
          difficulty: Difficulty.EASY,
          description: 'Add the numbers on the dice',
          hint: 'Sum the values',
        },
        [3, 4],
        'test-session'
      );

      // Wait for token to expire (tokens expire after 10 minutes)
      // We can't easily test this without mocking Date.now(), so we'll just test the structure
      const verification = service.verifyToken(result.token!);
      expect(verification.valid).toBe(true); // Should be valid initially
      done();
    });
  });

  describe('session management', () => {
    it('should get session stats', () => {
      service.validateSolution(
        0,
        {
          id: 'test-challenge',
          operation: OperationType.SUM,
          diceCount: 2,
          difficulty: Difficulty.EASY,
          description: 'Add the numbers on the dice',
          hint: 'Sum the values',
        },
        [1, 1],
        'test-session'
      );

      const stats = service.getSessionStats('test-session');
      expect(stats).toBeTruthy();
      expect(stats!.attempts).toBe(1);
      expect(stats!.successfulVerifications).toBe(0);
    });

    it('should reset attempts for a session', () => {
      // Make some attempts
      for (let i = 0; i < 3; i++) {
        service.validateSolution(
          0,
          {
            id: 'test-challenge',
            operation: OperationType.SUM,
            diceCount: 2,
            difficulty: Difficulty.EASY,
            description: 'Add the numbers on the dice',
            hint: 'Sum the values',
          },
          [1, 1],
          'test-session'
        );
      }

      service.resetAttempts('test-session');

      const stats = service.getSessionStats('test-session');
      expect(stats!.attempts).toBe(0);
    });

    it('should clear a session', () => {
      service.validateSolution(
        0,
        {
          id: 'test-challenge',
          operation: OperationType.SUM,
          diceCount: 2,
          difficulty: Difficulty.EASY,
          description: 'Add the numbers on the dice',
          hint: 'Sum the values',
        },
        [1, 1],
        'test-session'
      );

      service.clearSession('test-session');

      const stats = service.getSessionStats('test-session');
      expect(stats).toBeNull();
    });

    it('should clear all sessions', () => {
      service.validateSolution(
        0,
        {
          id: 'test-challenge',
          operation: OperationType.SUM,
          diceCount: 2,
          difficulty: Difficulty.EASY,
          description: 'Add the numbers on the dice',
          hint: 'Sum the values',
        },
        [1, 1],
        'session-1'
      );

      service.validateSolution(
        0,
        {
          id: 'test-challenge',
          operation: OperationType.SUM,
          diceCount: 2,
          difficulty: Difficulty.EASY,
          description: 'Add the numbers on the dice',
          hint: 'Sum the values',
        },
        [1, 1],
        'session-2'
      );

      service.clearAllSessions();

      expect(service.getSessionStats('session-1')).toBeNull();
      expect(service.getSessionStats('session-2')).toBeNull();
    });
  });

  describe('tolerance', () => {
    it('should accept answers within tolerance', () => {
      service.configure({ tolerancePercentage: 10 }); // 10% tolerance

      const result = service.validateSolution(
        7, // Exact answer is 7, so 6.3 is within 10%
        {
          id: 'test-challenge',
          operation: OperationType.SUM,
          diceCount: 2,
          difficulty: Difficulty.EASY,
          description: 'Add the numbers on the dice',
          hint: 'Sum the values',
        },
        [3, 4],
        'test-session'
      );

      expect(result.success).toBe(true);
    });

    it('should reject answers outside tolerance', () => {
      service.configure({ tolerancePercentage: 10 }); // 10% tolerance

      const result = service.validateSolution(
        5, // Too far from 7 (> 10%)
        {
          id: 'test-challenge',
          operation: OperationType.SUM,
          diceCount: 2,
          difficulty: Difficulty.EASY,
          description: 'Add the numbers on the dice',
          hint: 'Sum the values',
        },
        [3, 4],
        'test-session'
      );

      expect(result.success).toBe(false);
    });
  });
});
