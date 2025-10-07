/**
 * Difficulty levels for CAPTCHA challenges.
 *
 * Determines the complexity of the mathematical operation and
 * the number of dice involved in the challenge.
 *
 * @public
 * @since 1.0.0
 */
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

/**
 * Type of mathematical operation for the challenge.
 *
 * Defines what calculation the user must perform on the dice results.
 *
 * @public
 * @since 1.0.0
 */
export enum OperationType {
  SUM = 'SUM',
  PRODUCT = 'PRODUCT',
  DIFFERENCE = 'DIFFERENCE',
  SPECIFIC_NUMBER = 'SPECIFIC_NUMBER',
}

/**
 * Represents a CAPTCHA challenge that the user must solve.
 *
 * Contains all information needed to present a challenge to the user
 * and validate their answer.
 *
 * @example
 * ```typescript
 * const challenge: Challenge = {
 *   id: 'challenge_123',
 *   difficulty: Difficulty.MEDIUM,
 *   operation: OperationType.SUM,
 *   diceCount: 3,
 *   targetValue: 12,
 *   description: 'Make the sum equal 12',
 *   hint: 'Add all dice values together'
 * };
 * ```
 *
 * @public
 * @since 1.0.0
 */
export interface Challenge {
  /** Unique identifier for the challenge */
  id: string;

  /** Difficulty level of the challenge */
  difficulty: Difficulty;

  /** Mathematical operation to perform on dice results */
  operation: OperationType;

  /** Number of dice involved in this challenge */
  diceCount: number;

  /** The target value the user needs to achieve (optional for some challenge types) */
  targetValue?: number;

  /** Human-readable description of the challenge */
  description: string;

  /** Optional hint to help the user */
  hint?: string;

  /** Minimum possible value for the challenge */
  minValue?: number;

  /** Maximum possible value for the challenge */
  maxValue?: number;
}

/**
 * Challenge validation result.
 *
 * Indicates whether a challenge is mathematically valid and solvable
 * with standard 6-sided dice.
 *
 * @public
 * @since 1.0.0
 */
export interface ChallengeValidation {
  /** Whether the challenge definition is valid */
  isValid: boolean;

  /** Whether the challenge can be solved with standard dice */
  isSolvable: boolean;

  /** Estimated number of different ways to solve the challenge */
  estimatedSolutionCount: number;
}
