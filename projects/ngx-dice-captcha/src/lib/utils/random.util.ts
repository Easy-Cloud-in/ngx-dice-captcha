/**
 * Random number generation utilities for dice CAPTCHA
 * Includes cryptographically secure random, deterministic random for testing,
 * and weighted random for difficulty adjustment.
 */

/**
 * Generates a cryptographically secure random integer between min and max (inclusive).
 * Uses the Web Crypto API for secure random number generation.
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns A random integer between min and max
 *
 * @throws Error if crypto API is not available or if min > max
 *
 * @example
 * ```typescript
 * const diceRoll = secureRandom(1, 6); // Random number 1-6
 * const challengeValue = secureRandom(10, 20); // Random number 10-20
 * ```
 */
export function secureRandom(min: number, max: number): number {
  if (min > max) {
    throw new Error('min must be less than or equal to max');
  }

  if (!window.crypto || !window.crypto.getRandomValues) {
    throw new Error('Web Crypto API not available');
  }

  // For integer range
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const randomBytes = new Uint8Array(bytesNeeded);

  let randomValue: number;

  // Rejection sampling to avoid modulo bias
  do {
    window.crypto.getRandomValues(randomBytes);
    randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = randomValue * 256 + randomBytes[i];
    }
  } while (randomValue >= maxValue - (maxValue % range));

  return min + (randomValue % range);
}

/**
 * Generates a cryptographically secure random floating point number between 0 and 1.
 * Similar to Math.random() but cryptographically secure.
 *
 * @returns A random number between 0 (inclusive) and 1 (exclusive)
 *
 * @example
 * ```typescript
 * const randomFloat = secureRandomFloat();
 * const percentage = randomFloat * 100;
 * ```
 */
export function secureRandomFloat(): number {
  if (!window.crypto || !window.crypto.getRandomValues) {
    throw new Error('Web Crypto API not available');
  }

  const randomBytes = new Uint32Array(1);
  window.crypto.getRandomValues(randomBytes);

  // Convert to float between 0 and 1
  return randomBytes[0] / (0xffffffff + 1);
}

/**
 * Creates a deterministic random number generator for testing.
 * Uses a simple Linear Congruential Generator (LCG) algorithm.
 *
 * @param seed - The seed value for reproducible random numbers
 * @returns A function that returns random numbers between 0 and 1
 *
 * @example
 * ```typescript
 * const random = deterministicRandom(12345);
 * const value1 = random(); // Always the same for this seed
 * const value2 = random(); // Next value in sequence
 *
 * // In tests
 * const testRandom = deterministicRandom(42);
 * const predictableRoll = Math.floor(testRandom() * 6) + 1;
 * ```
 */
export function deterministicRandom(seed: number): () => number {
  let state = seed;

  // LCG parameters (same as used in glibc)
  const a = 1103515245;
  const c = 12345;
  const m = Math.pow(2, 31);

  return function (): number {
    state = (a * state + c) % m;
    return state / m;
  };
}

/**
 * Selects a random index based on weighted probabilities.
 * The weights don't need to sum to 1; they will be normalized automatically.
 *
 * @param weights - Array of weights (higher weight = higher probability)
 * @returns The selected index
 *
 * @throws Error if weights array is empty or all weights are zero
 *
 * @example
 * ```typescript
 * // 50% chance of index 0, 30% chance of index 1, 20% chance of index 2
 * const weights = [5, 3, 2];
 * const selectedIndex = weightedRandom(weights);
 *
 * // Difficulty selection
 * const difficulties = ['easy', 'medium', 'hard'];
 * const difficultyWeights = [5, 3, 1]; // Prefer easier challenges
 * const difficulty = difficulties[weightedRandom(difficultyWeights)];
 * ```
 */
export function weightedRandom(weights: number[]): number {
  if (weights.length === 0) {
    throw new Error('Weights array cannot be empty');
  }

  // Calculate total weight
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalWeight <= 0) {
    throw new Error('Total weight must be positive');
  }

  // Generate random value between 0 and totalWeight
  const random = secureRandomFloat() * totalWeight;

  // Find the index corresponding to this random value
  let cumulativeWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return i;
    }
  }

  // Fallback (should never reach here due to floating point precision)
  return weights.length - 1;
}

/**
 * Returns a random element from an array using secure random generation.
 *
 * @param array - The array to select from
 * @returns A random element from the array
 *
 * @throws Error if array is empty
 *
 * @example
 * ```typescript
 * const colors = ['red', 'green', 'blue'];
 * const randomColor = randomChoice(colors);
 *
 * const operations = ['+', '-', '*'];
 * const operation = randomChoice(operations);
 * ```
 */
export function randomChoice<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot choose from empty array');
  }

  const index = secureRandom(0, array.length - 1);
  return array[index];
}

/**
 * Returns multiple random elements from an array without replacement.
 *
 * @param array - The array to select from
 * @param count - Number of elements to select
 * @returns Array of randomly selected elements
 *
 * @throws Error if count is greater than array length
 *
 * @example
 * ```typescript
 * const deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 * const hand = randomChoices(deck, 5); // Select 5 cards
 * ```
 */
export function randomChoices<T>(array: T[], count: number): T[] {
  if (count > array.length) {
    throw new Error('Cannot select more elements than array contains');
  }

  if (count < 0) {
    throw new Error('Count must be non-negative');
  }

  const shuffled = shuffleArray([...array]);
  return shuffled.slice(0, count);
}

/**
 * Shuffles an array using the Fisher-Yates algorithm with secure random.
 * Returns a new array; does not modify the original.
 *
 * @param array - The array to shuffle
 * @returns A new shuffled array
 *
 * @example
 * ```typescript
 * const original = [1, 2, 3, 4, 5];
 * const shuffled = shuffleArray(original);
 * // original is unchanged, shuffled is a random permutation
 * ```
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandom(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Generates a random boolean with optional probability.
 *
 * @param probability - Probability of returning true (0-1, default: 0.5)
 * @returns Random boolean value
 *
 * @throws Error if probability is not between 0 and 1
 *
 * @example
 * ```typescript
 * const coinFlip = randomBoolean(); // 50/50 chance
 * const biasedCoin = randomBoolean(0.7); // 70% chance of true
 *
 * // Use in challenge generation
 * const includeBonus = randomBoolean(0.2); // 20% chance of bonus
 * ```
 */
export function randomBoolean(probability: number = 0.5): boolean {
  if (probability < 0 || probability > 1) {
    throw new Error('Probability must be between 0 and 1');
  }

  return secureRandomFloat() < probability;
}

/**
 * Generates a random string of specified length using secure random.
 * Useful for generating tokens or IDs.
 *
 * @param length - Length of the string to generate
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Random string
 *
 * @example
 * ```typescript
 * const token = randomString(32); // 32-character token
 * const code = randomString(6, '0123456789'); // 6-digit code
 * ```
 */
export function randomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  if (length < 0) {
    throw new Error('Length must be non-negative');
  }

  if (charset.length === 0) {
    throw new Error('Charset cannot be empty');
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    const index = secureRandom(0, charset.length - 1);
    result += charset[index];
  }

  return result;
}

/**
 * Generates a random UUID v4 string using secure random.
 *
 * @returns A UUID v4 string
 *
 * @example
 * ```typescript
 * const id = randomUUID();
 * // e.g., "a3d5e8f1-4b2c-4d9e-8f3a-1b2c3d4e5f6g"
 * ```
 */
export function randomUUID(): string {
  // Try to use native crypto.randomUUID if available
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  // Fallback implementation
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);

  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

/**
 * Generates a random integer from a normal (Gaussian) distribution.
 * Uses the Box-Muller transform.
 *
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation of the distribution
 * @returns Random number from normal distribution
 *
 * @example
 * ```typescript
 * // Generate challenge values centered around 10 with spread of 2
 * const challengeValue = Math.round(randomNormal(10, 2));
 * ```
 */
export function randomNormal(mean: number = 0, stdDev: number = 1): number {
  // Box-Muller transform
  const u1 = secureRandomFloat();
  const u2 = secureRandomFloat();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  return z0 * stdDev + mean;
}

/**
 * Generates a random integer from a normal distribution, clamped to a range.
 *
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer clamped to range
 *
 * @example
 * ```typescript
 * // Generate difficulty-adjusted challenge values
 * const easyValue = randomNormalInt(5, 1, 1, 10); // Centered low
 * const hardValue = randomNormalInt(15, 2, 10, 20); // Centered high
 * ```
 */
export function randomNormalInt(mean: number, stdDev: number, min: number, max: number): number {
  const value = Math.round(randomNormal(mean, stdDev));
  return Math.max(min, Math.min(max, value));
}

/**
 * Samples from an array with replacement.
 *
 * @param array - The array to sample from
 * @param count - Number of samples
 * @returns Array of sampled elements (may contain duplicates)
 *
 * @example
 * ```typescript
 * const dice = [1, 2, 3, 4, 5, 6];
 * const rolls = sampleWithReplacement(dice, 10); // 10 dice rolls
 * ```
 */
export function sampleWithReplacement<T>(array: T[], count: number): T[] {
  if (array.length === 0) {
    throw new Error('Cannot sample from empty array');
  }

  if (count < 0) {
    throw new Error('Count must be non-negative');
  }

  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(randomChoice(array));
  }

  return result;
}

/**
 * Type for a seeded random generator
 */
export interface SeededRandom {
  random: () => number;
  randomInt: (min: number, max: number) => number;
  randomChoice: <T>(array: T[]) => T;
  shuffle: <T>(array: T[]) => T[];
  seed: number;
}

/**
 * Creates a complete seeded random number generator for testing.
 * Returns an object with multiple random functions using the same seed.
 *
 * @param seed - The seed value
 * @returns Object with seeded random functions
 *
 * @example
 * ```typescript
 * const rng = createSeededRandom(12345);
 * const value1 = rng.randomInt(1, 6);
 * const value2 = rng.randomInt(1, 6);
 * const choice = rng.randomChoice(['a', 'b', 'c']);
 *
 * // In tests, using the same seed gives same results
 * const testRng = createSeededRandom(42);
 * expect(testRng.randomInt(1, 6)).toBe(expectedValue);
 * ```
 */
export function createSeededRandom(seed: number): SeededRandom {
  const random = deterministicRandom(seed);

  return {
    random,
    randomInt: (min: number, max: number) => {
      return Math.floor(random() * (max - min + 1)) + min;
    },
    randomChoice: <T>(array: T[]): T => {
      if (array.length === 0) {
        throw new Error('Cannot choose from empty array');
      }
      const index = Math.floor(random() * array.length);
      return array[index];
    },
    shuffle: <T>(array: T[]): T[] => {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
    seed,
  };
}
