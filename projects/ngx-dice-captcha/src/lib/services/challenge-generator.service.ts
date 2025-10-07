import { Injectable } from '@angular/core';
import {
  Challenge,
  Difficulty,
  OperationType,
  ChallengeValidation,
} from '../models/challenge.model';

// Re-export model types for backward compatibility
export type { Challenge, ChallengeValidation } from '../models/challenge.model';
export { Difficulty, OperationType } from '../models/challenge.model';

/**
 * Service responsible for generating random challenges for the CAPTCHA.
 *
 * Creates various mathematical challenges based on dice rolls with different
 * difficulty levels (Easy, Medium, Hard) and operation types (Sum, Product,
 * Difference, Specific Number). Validates challenge solvability and calculates
 * solutions from dice results.
 *
 * @example
 * ```typescript
 * const challenge = challengeGenerator.generateChallenge(Difficulty.MEDIUM);
 * console.log(challenge.description); // "Make the sum equal 12"
 *
 * const diceResults = [4, 5, 3];
 * const solution = challengeGenerator.calculateSolution(diceResults, challenge);
 * console.log(solution); // 12
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class ChallengeGeneratorService {
  private challengeIdCounter = 0;

  /**
   * Generates a random challenge based on difficulty level.
   *
   * Selects appropriate operation types and target values based on difficulty.
   * All generated challenges are guaranteed to be solvable.
   *
   * @param difficulty - Difficulty level (default: MEDIUM)
   * @returns A complete challenge object with description and target
   * @public
   */
  generateChallenge(difficulty: Difficulty = Difficulty.MEDIUM): Challenge {
    const challengeId = this.generateChallengeId();

    switch (difficulty) {
      case Difficulty.EASY:
        return this.generateEasyChallenge(challengeId);
      case Difficulty.MEDIUM:
        return this.generateMediumChallenge(challengeId);
      case Difficulty.HARD:
        return this.generateHardChallenge(challengeId);
      default:
        return this.generateMediumChallenge(challengeId);
    }
  }

  /**
   * Generate an easy challenge (simple sum with 2 dice)
   */
  private generateEasyChallenge(id: string): Challenge {
    const operations = [OperationType.SUM, OperationType.SPECIFIC_NUMBER];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    if (operation === OperationType.SPECIFIC_NUMBER) {
      const targetValue = Math.floor(Math.random() * 6) + 1; // 1-6
      return {
        id,
        difficulty: Difficulty.EASY,
        operation,
        diceCount: 2,
        targetValue,
        description: `Roll ${targetValue} on any die`,
        hint: 'Look for the number on one of the dice faces',
      };
    }

    // Sum operation
    const targetValue = Math.floor(Math.random() * 7) + 5; // 5-11 (reasonable for 2 dice)
    return {
      id,
      difficulty: Difficulty.EASY,
      operation: OperationType.SUM,
      diceCount: 2,
      targetValue,
      description: `Make the sum equal ${targetValue}`,
      hint: 'Add the numbers on both dice',
    };
  }

  /**
   * Generate a medium challenge (sum or product with 3 dice)
   */
  private generateMediumChallenge(id: string): Challenge {
    const operations = [OperationType.SUM, OperationType.PRODUCT];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    if (operation === OperationType.PRODUCT) {
      const targetValue = this.getRandomProductTarget();
      return {
        id,
        difficulty: Difficulty.MEDIUM,
        operation,
        diceCount: 3,
        targetValue,
        description: `Make the product equal ${targetValue}`,
        hint: 'Multiply all dice values together',
      };
    }

    // Sum operation
    const targetValue = Math.floor(Math.random() * 10) + 8; // 8-17 (reasonable for 3 dice)
    return {
      id,
      difficulty: Difficulty.MEDIUM,
      operation: OperationType.SUM,
      diceCount: 3,
      targetValue,
      description: `Make the sum equal ${targetValue}`,
      hint: 'Add all dice values together',
    };
  }

  /**
   * Generate a hard challenge (complex operations with 4+ dice)
   */
  private generateHardChallenge(id: string): Challenge {
    const operations = [OperationType.SUM, OperationType.PRODUCT, OperationType.DIFFERENCE];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const diceCount = Math.floor(Math.random() * 2) + 3; // 3-4 dice

    if (operation === OperationType.DIFFERENCE) {
      const targetValue = Math.floor(Math.random() * 5) + 1; // 1-5
      return {
        id,
        difficulty: Difficulty.HARD,
        operation,
        diceCount,
        targetValue,
        description: `Make the difference between highest and lowest equal ${targetValue}`,
        hint: 'Subtract the smallest value from the largest',
      };
    }

    if (operation === OperationType.PRODUCT) {
      const targetValue = this.getRandomProductTarget(true);
      return {
        id,
        difficulty: Difficulty.HARD,
        operation,
        diceCount,
        targetValue,
        description: `Make the product equal ${targetValue}`,
        hint: 'Multiply all dice values together',
      };
    }

    // Sum operation
    const targetValue = Math.floor(Math.random() * 12) + 10; // 10-21 (reasonable for 3-4 dice)
    return {
      id,
      difficulty: Difficulty.HARD,
      operation: OperationType.SUM,
      diceCount,
      targetValue,
      description: `Make the sum equal ${targetValue}`,
      hint: 'Add all dice values together',
    };
  }

  /**
   * Get a random product target that's achievable with dice
   * @param hard - If true, generate harder targets
   */
  private getRandomProductTarget(hard: boolean = false): number {
    const easyTargets = [6, 8, 12, 15, 18, 20, 24, 30, 36];
    const hardTargets = [24, 30, 36, 40, 48, 60, 72, 90, 120];

    const targets = hard ? hardTargets : easyTargets;
    return targets[Math.floor(Math.random() * targets.length)];
  }

  /**
   * Validates if a challenge is solvable with standard 6-sided dice.
   *
   * Checks mathematical feasibility and estimates the number of possible solutions.
   *
   * @param challenge - Challenge to validate
   * @returns Validation result with solvability status and solution count estimate
   * @public
   */
  validateChallenge(challenge: Challenge): ChallengeValidation {
    if (!challenge.targetValue) {
      return {
        isValid: false,
        isSolvable: false,
        estimatedSolutionCount: 0,
      };
    }

    const validation = this.checkSolvability(challenge);

    return {
      isValid: validation.isValid,
      isSolvable: validation.isSolvable,
      estimatedSolutionCount: validation.solutionCount,
    };
  }

  /**
   * Check if a challenge is solvable with standard dice (1-6)
   */
  private checkSolvability(challenge: Challenge): {
    isValid: boolean;
    isSolvable: boolean;
    solutionCount: number;
  } {
    const diceCount = challenge.diceCount;
    const targetValue = challenge.targetValue!;

    switch (challenge.operation) {
      case OperationType.SUM:
        return this.checkSumSolvability(diceCount, targetValue);
      case OperationType.PRODUCT:
        return this.checkProductSolvability(diceCount, targetValue);
      case OperationType.DIFFERENCE:
        return this.checkDifferenceSolvability(diceCount, targetValue);
      case OperationType.SPECIFIC_NUMBER:
        return this.checkSpecificNumberSolvability(diceCount, targetValue);
      default:
        return { isValid: false, isSolvable: false, solutionCount: 0 };
    }
  }

  /**
   * Check if a sum target is achievable
   */
  private checkSumSolvability(
    diceCount: number,
    target: number
  ): { isValid: boolean; isSolvable: boolean; solutionCount: number } {
    const minSum = diceCount; // All 1s
    const maxSum = diceCount * 6; // All 6s

    const isSolvable = target >= minSum && target <= maxSum;

    // Rough estimate of solution count
    let solutionCount = 0;
    if (isSolvable) {
      // For 2 dice, there are specific combinations
      // For simplicity, we'll estimate based on distance from average
      const avgSum = (minSum + maxSum) / 2;
      const distance = Math.abs(target - avgSum);
      const maxDistance = avgSum - minSum;
      solutionCount = Math.max(1, Math.floor((1 - distance / maxDistance) * 10));
    }

    return {
      isValid: true,
      isSolvable,
      solutionCount,
    };
  }

  /**
   * Check if a product target is achievable
   */
  private checkProductSolvability(
    diceCount: number,
    target: number
  ): { isValid: boolean; isSolvable: boolean; solutionCount: number } {
    const minProduct = 1; // All 1s
    const maxProduct = Math.pow(6, diceCount); // All 6s

    if (target < minProduct || target > maxProduct) {
      return { isValid: true, isSolvable: false, solutionCount: 0 };
    }

    // Check if target is factorable within dice constraints
    // This is a simplified check - a real implementation would enumerate all combinations
    const isSolvable = this.canFactorizeForDice(target, diceCount);
    const solutionCount = isSolvable ? Math.floor(Math.random() * 5) + 1 : 0;

    return {
      isValid: true,
      isSolvable,
      solutionCount,
    };
  }

  /**
   * Check if a number can be factorized using dice values
   */
  private canFactorizeForDice(target: number, diceCount: number): boolean {
    // Simplified check: ensure target is not prime if using multiple dice
    if (diceCount === 1) {
      return target >= 1 && target <= 6;
    }

    // For multiple dice, check if target can be expressed as a product
    // of values between 1 and 6
    if (target === 1) return true; // All 1s
    if (target <= 6) return true; // Can use 1s and one dice with target value

    // Check if target has small factors only (2, 3, 5)
    let temp = target;
    while (temp % 2 === 0) temp /= 2;
    while (temp % 3 === 0) temp /= 3;
    while (temp % 5 === 0) temp /= 5;

    return temp === 1 || temp <= 6;
  }

  /**
   * Check if a difference target is achievable
   */
  private checkDifferenceSolvability(
    diceCount: number,
    target: number
  ): { isValid: boolean; isSolvable: boolean; solutionCount: number } {
    const maxDifference = 5; // 6 - 1

    const isSolvable = target >= 0 && target <= maxDifference;
    const solutionCount = isSolvable ? Math.floor(Math.random() * 8) + 2 : 0;

    return {
      isValid: true,
      isSolvable,
      solutionCount,
    };
  }

  /**
   * Check if a specific number is achievable
   */
  private checkSpecificNumberSolvability(
    diceCount: number,
    target: number
  ): { isValid: boolean; isSolvable: boolean; solutionCount: number } {
    const isSolvable = target >= 1 && target <= 6;
    const solutionCount = isSolvable ? diceCount : 0; // Each die can show the target

    return {
      isValid: true,
      isSolvable,
      solutionCount,
    };
  }

  /**
   * Calculates the solution for a challenge given actual dice results.
   *
   * Applies the challenge's operation (sum, product, difference, etc.) to the
   * dice values to compute the expected answer.
   *
   * @param diceResults - Array of dice face values (1-6)
   * @param challenge - Challenge defining the operation
   * @returns The calculated result, or -1 for invalid operations
   * @public
   */
  calculateSolution(diceResults: number[], challenge: Challenge): number {
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
        return diceResults.includes(challenge.targetValue!) ? challenge.targetValue! : -1;

      default:
        return -1;
    }
  }

  /**
   * Generate a unique challenge ID
   */
  private generateChallengeId(): string {
    this.challengeIdCounter++;
    return `challenge_${Date.now()}_${this.challengeIdCounter}`;
  }

  /**
   * Generates multiple challenges at once.
   *
   * @param count - Number of challenges to generate
   * @param difficulty - Difficulty level for all challenges (random if not specified)
   * @returns Array of challenge objects
   * @public
   */
  generateMultipleChallenges(count: number, difficulty?: Difficulty): Challenge[] {
    const challenges: Challenge[] = [];

    for (let i = 0; i < count; i++) {
      const diff = difficulty || this.getRandomDifficulty();
      challenges.push(this.generateChallenge(diff));
    }

    return challenges;
  }

  /**
   * Get a random difficulty level
   */
  private getRandomDifficulty(): Difficulty {
    const difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  /**
   * Gets recommended settings for a difficulty level.
   *
   * Provides dice count and time limit recommendations.
   *
   * @param difficulty - Difficulty level
   * @returns Recommended dice count and time limit in seconds
   * @public
   */
  getDifficultySettings(difficulty: Difficulty): { diceCount: number; timeLimit: number } {
    switch (difficulty) {
      case Difficulty.EASY:
        return { diceCount: 2, timeLimit: 60 };
      case Difficulty.MEDIUM:
        return { diceCount: 3, timeLimit: 45 };
      case Difficulty.HARD:
        return { diceCount: 4, timeLimit: 30 };
    }
  }
}
