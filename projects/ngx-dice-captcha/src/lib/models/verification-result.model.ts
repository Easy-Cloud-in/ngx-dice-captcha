/**
 * Partial match information for individual dice verification
 */
export interface PartialMatch {
  /** Number of dice values that were correctly entered */
  correctDice?: number;

  /** Total number of dice in the challenge */
  totalDice?: number;

  /** Whether the sum calculation was correct (for BOTH mode) */
  sumCorrect?: boolean;
}

/**
 * Result of a CAPTCHA verification attempt.
 *
 * Contains the outcome of validating a user's answer, including success status,
 * explanatory message, remaining attempts, verification token (on success),
 * and timestamp.
 *
 * @example
 * ```typescript
 * const result: VerificationResult = {
 *   success: true,
 *   message: 'CAPTCHA verification successful',
 *   token: 'eyJhbGc...',
 *   timestamp: Date.now()
 * };
 * ```
 *
 * @public
 * @since 1.0.0
 */
export interface VerificationResult {
  /** Whether the verification was successful */
  success: boolean;

  /** Message explaining the result (success or failure reason) */
  message: string;

  /** Number of attempts remaining before lockout (optional) */
  attemptsRemaining?: number;

  /** Security token issued on successful verification (optional) */
  token?: string;

  /** Timestamp when the verification was completed (unix timestamp) */
  timestamp: number;

  /** Actual dice values from the roll (for INDIVIDUAL_DICE mode) */
  diceValues?: number[];

  /** User's entered dice values (for INDIVIDUAL_DICE mode) */
  userDiceInputs?: number[];

  /** Expected sum of dice (for CALCULATION_ONLY or BOTH mode) */
  expectedSum?: number;

  /** User's entered sum value (for CALCULATION_ONLY or BOTH mode) */
  userSumInput?: number;

  /** Partial match information (for progressive feedback) */
  partialMatch?: PartialMatch;
}
