import { Injectable, OnDestroy } from '@angular/core';
import { Challenge, OperationType } from '../models/challenge.model';
import { VerificationResult } from '../models/verification-result.model';
import { VerificationMode } from '../models/verification-mode.model';

// Re-export model types for backward compatibility
export type { VerificationResult } from '../models/verification-result.model';

/**
 * Session tracking for rate limiting
 */
interface SessionData {
  attempts: number;
  lastAttempt: number;
  lockoutUntil?: number;
  successfulVerifications: number;
}

/**
 * Session key wrapper for WeakMap usage
 */
class SessionKey {
  constructor(public readonly sessionId: string) {}

  toString(): string {
    return this.sessionId;
  }

  equals(other: SessionKey): boolean {
    return this.sessionId === other.sessionId;
  }
}

/**
 * Configuration for the validator
 */
export interface ValidatorConfig {
  maxAttempts?: number;
  lockoutDuration?: number; // in milliseconds
  attemptWindowDuration?: number; // in milliseconds
  tolerancePercentage?: number; // Tolerance for numerical comparisons
  cleanupInterval?: number; // in milliseconds (default: 5 minutes)
  sessionMaxAge?: number; // in milliseconds (default: 1 hour)
}

/**
 * Service responsible for validating CAPTCHA solutions and managing rate limiting.
 *
 * Validates user answers against challenges, implements rate limiting and session
 * tracking to prevent abuse, generates verification tokens, and manages lockouts
 * for excessive failed attempts. Provides configurable security parameters.
 *
 * @example
 * ```typescript
 * const result = validator.validateSolution(
 *   userAnswer: 12,
 *   challenge,
 *   [4, 5, 3],
 *   'session-123'
 * );
 *
 * if (result.success) {
 *   console.log('Token:', result.token);
 *   // Send token to backend for verification
 * }
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class CaptchaValidatorService implements OnDestroy {
  private sessions: WeakMap<SessionKey, SessionData> = new WeakMap();
  private sessionKeyMap: Map<string, SessionKey> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  private readonly defaultConfig: Required<ValidatorConfig> = {
    maxAttempts: 5,
    lockoutDuration: 5 * 60 * 1000, // 5 minutes
    attemptWindowDuration: 60 * 1000, // 1 minute
    tolerancePercentage: 0,
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    sessionMaxAge: 60 * 60 * 1000, // 1 hour
  };

  private config: Required<ValidatorConfig> = { ...this.defaultConfig };

  constructor() {
    this.startAutomaticCleanup();
  }

  /**
   * Configures the validator with custom settings.
   *
   * Merges provided configuration with defaults. Call before using the validator.
   *
   * @param config - Configuration options (maxAttempts, lockoutDuration, etc.)
   * @public
   */
  configure(config: ValidatorConfig): void {
    this.config = { ...this.defaultConfig, ...config };

    // Restart cleanup timer with new interval if changed
    if (config.cleanupInterval) {
      this.stopAutomaticCleanup();
      this.startAutomaticCleanup();
    }
  }

  /**
   * Validates a user's solution against the challenge.
   *
   * Checks rate limits, validates dice results, calculates expected answer,
   * compares with user's answer, and generates verification tokens on success.
   * Updates session tracking for rate limiting.
   *
   * @param userAnswer - User's submitted answer
   * @param challenge - Challenge to validate against
   * @param diceResults - Actual dice face values from the roll
   * @param sessionId - Session identifier for rate limiting and tracking
   * @returns Verification result with success status, message, and optional token
   * @public
   */
  validateSolution(
    userAnswer: number,
    challenge: Challenge,
    diceResults: number[],
    sessionId: string
  ): VerificationResult {
    // Check rate limit
    const rateLimitCheck = this.checkRateLimit(sessionId);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        message: rateLimitCheck.message,
        attemptsRemaining: rateLimitCheck.attemptsRemaining,
        timestamp: Date.now(),
      };
    }

    // Validate dice results
    if (!this.validateDiceResults(diceResults, challenge.diceCount)) {
      return {
        success: false,
        message: 'Invalid dice results',
        timestamp: Date.now(),
      };
    }

    // Calculate expected answer
    const expectedAnswer = this.calculateExpectedAnswer(challenge, diceResults);

    // Check if user's answer matches
    const isCorrect = this.compareAnswers(userAnswer, expectedAnswer, challenge.operation);

    // Update session
    this.updateSession(sessionId, isCorrect);

    if (isCorrect) {
      const token = this.generateVerificationToken(sessionId);

      return {
        success: true,
        message: 'CAPTCHA verification successful',
        token,
        timestamp: Date.now(),
      };
    } else {
      const sessionKey = this.getSessionKey(sessionId);
      const session = sessionKey ? this.sessions.get(sessionKey) : undefined;
      const attemptsRemaining = this.config.maxAttempts - (session?.attempts || 0);

      return {
        success: false,
        message: `Incorrect answer. Expected: ${expectedAnswer}, Got: ${userAnswer}`,
        attemptsRemaining: Math.max(0, attemptsRemaining),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Validates individual dice values against actual rolled values.
   *
   * Checks rate limits, validates each dice value, calculates partial matches,
   * and generates verification tokens on success. Designed for INDIVIDUAL_DICE
   * verification mode.
   *
   * @param userDiceInputs - User's entered dice values
   * @param actualDiceValues - Actual dice face values from the roll
   * @param sessionId - Session identifier for rate limiting and tracking
   * @returns Verification result with success status, partial match info, and optional token
   * @public
   */
  validateIndividualDice(
    userDiceInputs: number[],
    actualDiceValues: number[],
    sessionId: string
  ): VerificationResult {
    // Check rate limit
    const rateLimitCheck = this.checkRateLimit(sessionId);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        message: rateLimitCheck.message,
        attemptsRemaining: rateLimitCheck.attemptsRemaining,
        timestamp: Date.now(),
      };
    }

    // Validate input lengths match
    if (userDiceInputs.length !== actualDiceValues.length) {
      return {
        success: false,
        message: 'Invalid number of dice values provided',
        timestamp: Date.now(),
        attemptsRemaining: rateLimitCheck.attemptsRemaining,
      };
    }

    // Validate all inputs are valid dice values (1-6)
    const validInputs = userDiceInputs.every(
      (val) => Number.isInteger(val) && val >= 1 && val <= 6
    );
    if (!validInputs) {
      return {
        success: false,
        message: 'Invalid dice values. Each value must be between 1 and 6',
        timestamp: Date.now(),
        attemptsRemaining: rateLimitCheck.attemptsRemaining,
      };
    }

    // Calculate matches
    const correctCount = userDiceInputs.filter((val, idx) => val === actualDiceValues[idx]).length;
    const totalCount = actualDiceValues.length;
    const allCorrect = correctCount === totalCount;

    // Update session
    this.updateSession(sessionId, allCorrect);

    if (allCorrect) {
      const token = this.generateVerificationToken(sessionId);

      return {
        success: true,
        message: 'All dice values correctly identified!',
        token,
        timestamp: Date.now(),
        diceValues: actualDiceValues,
        userDiceInputs,
        expectedSum: actualDiceValues.reduce((sum, val) => sum + val, 0),
        userSumInput: userDiceInputs.reduce((sum, val) => sum + val, 0),
      };
    } else {
      const sessionKey = this.getSessionKey(sessionId);
      const session = sessionKey ? this.sessions.get(sessionKey) : undefined;
      const attemptsRemaining = this.config.maxAttempts - (session?.attempts || 0);

      return {
        success: false,
        message: `${correctCount} out of ${totalCount} dice values correct. Try again!`,
        attemptsRemaining: Math.max(0, attemptsRemaining),
        timestamp: Date.now(),
        diceValues: actualDiceValues,
        userDiceInputs,
        partialMatch: {
          correctDice: correctCount,
          totalDice: totalCount,
        },
      };
    }
  }

  /**
   * Checks if a session is within rate limits.
   *
   * Validates attempt counts, lockout status, and attempt windows.
   * Automatically resets attempts after the window expires.
   *
   * @param sessionId - Session identifier
   * @returns Object with allowed status, message, and attempts remaining
   * @public
   */
  checkRateLimit(sessionId: string): {
    allowed: boolean;
    message: string;
    attemptsRemaining?: number;
  } {
    const sessionKey = this.getSessionKey(sessionId);
    const session = sessionKey ? this.sessions.get(sessionKey) : undefined;
    const now = Date.now();

    // Check if session is locked out
    if (session?.lockoutUntil && now < session.lockoutUntil) {
      const remainingTime = Math.ceil((session.lockoutUntil - now) / 1000);
      return {
        allowed: false,
        message: `Too many attempts. Please try again in ${remainingTime} seconds.`,
      };
    }

    // Clean expired lockout
    if (session?.lockoutUntil && now >= session.lockoutUntil) {
      session.lockoutUntil = undefined;
      session.attempts = 0;
    }

    // Check attempt window
    if (session && now - session.lastAttempt > this.config.attemptWindowDuration) {
      // Reset attempts if outside window
      session.attempts = 0;
    }

    // Check max attempts
    if (session && session.attempts >= this.config.maxAttempts) {
      // Lock out the session
      session.lockoutUntil = now + this.config.lockoutDuration;

      return {
        allowed: false,
        message: 'Maximum attempts exceeded. Please try again later.',
      };
    }

    const attemptsRemaining = this.config.maxAttempts - (session?.attempts || 0);

    return {
      allowed: true,
      message: 'Rate limit check passed',
      attemptsRemaining,
    };
  }

  /**
   * Resets attempt counter for a session.
   *
   * Clears attempts and removes lockout. Useful for allowing retries
   * after a successful verification or administrative reset.
   *
   * @param sessionId - Session identifier
   * @public
   */
  resetAttempts(sessionId: string): void {
    const sessionKey = this.getSessionKey(sessionId);
    if (sessionKey) {
      const session = this.sessions.get(sessionKey);
      if (session) {
        session.attempts = 0;
        session.lockoutUntil = undefined;
      }
    }
  }

  /**
   * Clears a session completely from tracking.
   *
   * Removes all session data including attempts, lockouts, and statistics.
   *
   * @param sessionId - Session identifier
   * @public
   */
  clearSession(sessionId: string): void {
    const sessionKey = this.getSessionKey(sessionId);
    if (sessionKey) {
      this.sessions.delete(sessionKey);
      this.sessionKeyMap.delete(sessionId);
    }
  }

  /**
   * Validate dice results are valid
   */
  private validateDiceResults(diceResults: number[], expectedCount: number): boolean {
    if (!Array.isArray(diceResults)) {
      return false;
    }

    if (diceResults.length !== expectedCount) {
      return false;
    }

    // Check all values are valid dice values (1-6)
    return diceResults.every((val) => Number.isInteger(val) && val >= 1 && val <= 6);
  }

  /**
   * Calculate the expected answer based on challenge and dice results
   */
  private calculateExpectedAnswer(challenge: Challenge, diceResults: number[]): number {
    switch (challenge.operation) {
      case OperationType.SUM:
        return diceResults.reduce((sum, val) => sum + val, 0);

      case OperationType.PRODUCT:
        return diceResults.reduce((product, val) => product * val, 1);

      case OperationType.DIFFERENCE:
        const max = Math.max(...diceResults);
        const min = Math.min(...diceResults);
        return max - min;

      case OperationType.SPECIFIC_NUMBER:
        // Check if any dice shows the target value
        return diceResults.includes(challenge.targetValue!) ? 1 : 0;

      default:
        return -1;
    }
  }

  /**
   * Compare user answer with expected answer
   */
  private compareAnswers(
    userAnswer: number,
    expectedAnswer: number,
    operation: OperationType
  ): boolean {
    // For specific number, user answer should be 1 (yes) or 0 (no)
    if (operation === OperationType.SPECIFIC_NUMBER) {
      return (
        (userAnswer === 1 && expectedAnswer === 1) || (userAnswer === 0 && expectedAnswer === 0)
      );
    }

    // For other operations, check numerical equality with tolerance
    if (this.config.tolerancePercentage > 0) {
      const tolerance = Math.abs((expectedAnswer * this.config.tolerancePercentage) / 100);
      return Math.abs(userAnswer - expectedAnswer) <= tolerance;
    }

    return userAnswer === expectedAnswer;
  }

  /**
   * Update session data after an attempt
   */
  private updateSession(sessionId: string, success: boolean): void {
    let sessionKey = this.getSessionKey(sessionId);
    let session = sessionKey ? this.sessions.get(sessionKey) : undefined;

    if (!session) {
      session = {
        attempts: 0,
        lastAttempt: Date.now(),
        successfulVerifications: 0,
      };
      sessionKey = new SessionKey(sessionId);
      this.sessions.set(sessionKey, session);
      this.sessionKeyMap.set(sessionId, sessionKey);
    }

    session.attempts += 1;
    session.lastAttempt = Date.now();

    if (success) {
      session.successfulVerifications += 1;
      // Reset attempts on success
      session.attempts = 0;
      session.lockoutUntil = undefined;
    }
  }

  /**
   * Gets or creates a session key for the given session ID.
   *
   * @param sessionId - Session identifier
   * @returns Session key instance or undefined if not found
   * @private
   */
  private getSessionKey(sessionId: string): SessionKey | undefined {
    return this.sessionKeyMap.get(sessionId);
  }

  /**
   * Generate a verification token
   */
  private generateVerificationToken(sessionId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const payload = `${sessionId}:${timestamp}:${random}`;

    // In a real implementation, this should be a proper JWT or signed token
    return btoa(payload);
  }

  /**
   * Verifies if a token is valid and not expired.
   *
   * Decodes the token and checks age (max 10 minutes). In production,
   * this should use proper JWT verification with signatures.
   *
   * @param token - Token to verify
   * @returns Object with validity status and decoded data
   * @public
   */
  verifyToken(token: string): { valid: boolean; sessionId?: string; timestamp?: number } {
    try {
      const decoded = atob(token);
      const [sessionId, timestamp, random] = decoded.split(':');

      if (!sessionId || !timestamp || !random) {
        return { valid: false };
      }

      const tokenAge = Date.now() - parseInt(timestamp, 10);
      const maxAge = 10 * 60 * 1000; // 10 minutes

      if (tokenAge > maxAge) {
        return { valid: false };
      }

      return {
        valid: true,
        sessionId,
        timestamp: parseInt(timestamp, 10),
      };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Gets statistics for a session.
   *
   * @param sessionId - Session identifier
   * @returns Session data including attempts, lockout status, and success count
   * @public
   */
  getSessionStats(sessionId: string): SessionData | null {
    const sessionKey = this.getSessionKey(sessionId);
    return sessionKey ? this.sessions.get(sessionKey) || null : null;
  }

  /**
   * Cleans up old sessions to prevent memory leaks.
   *
   * Should be called periodically (e.g., every hour) to remove stale sessions.
   *
   * @param maxAge - Maximum age in milliseconds (default: 1 hour)
   * @returns Number of sessions cleaned up
   * @public
   */
  cleanupOldSessions(maxAge: number = this.config.sessionMaxAge): number {
    const now = Date.now();
    let cleaned = 0;

    // Convert to array to avoid MapIterator issues with older TypeScript targets
    const entries = Array.from(this.sessionKeyMap.entries());
    for (const [sessionId, sessionKey] of entries) {
      const session = this.sessions.get(sessionKey);
      if (session && now - session.lastAttempt > maxAge) {
        this.sessions.delete(sessionKey);
        this.sessionKeyMap.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Starts automatic cleanup of old sessions.
   *
   * Sets up a timer to periodically clean up expired sessions.
   *
   * @private
   */
  private startAutomaticCleanup(): void {
    this.stopAutomaticCleanup(); // Clear any existing timer

    this.cleanupTimer = setInterval(() => {
      this.cleanupOldSessions();
    }, this.config.cleanupInterval);
  }

  /**
   * Stops automatic cleanup timer.
   *
   * @private
   */
  private stopAutomaticCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cleanup method called when service is destroyed.
   *
   * Ensures timers are cleared to prevent memory leaks.
   *
   * @public
   */
  ngOnDestroy(): void {
    this.stopAutomaticCleanup();
  }

  /**
   * Gets the current validator configuration.
   *
   * @returns Copy of current configuration
   * @public
   */
  getConfig(): Required<ValidatorConfig> {
    return { ...this.config };
  }

  /**
   * Resets configuration to default values.
   *
   * @public
   */
  resetConfig(): void {
    this.config = { ...this.defaultConfig };
  }

  /**
   * Clears all tracked sessions.
   *
   * Useful for testing or administrative cleanup.
   *
   * @public
   */
  clearAllSessions(): void {
    this.sessions = new WeakMap();
    this.sessionKeyMap.clear();
  }
}
