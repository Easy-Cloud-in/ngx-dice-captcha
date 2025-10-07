import { InjectionToken } from '@angular/core';

/**
 * Interface defining all translatable strings in the library
 */
export interface DiceCaptchaI18n {
  // Canvas labels
  canvasLabel: string;
  canvasDescription: string;
  diceRolling: string;
  diceSettled: string;
  diceResult: string;

  // Challenge labels
  challengeTitle: string;
  challengeDescription: string;
  answerLabel: string;
  answerPlaceholder: string;
  attemptsLabel: string;
  timeLabel: string;

  // Button labels
  rollDiceButton: string;
  submitButton: string;
  retryButton: string;
  resetButton: string;

  // Status messages
  rollingDice: string;
  analyzing: string;
  verifying: string;
  success: string;
  failure: string;
  timeout: string;
  maxAttemptsReached: string;

  // Error messages
  invalidInput: string;
  incorrectAnswer: string;
  timeExpired: string;
  noAttemptsLeft: string;

  // Success messages
  verificationSuccess: string;
  challengeComplete: string;

  // Instructions
  rollInstruction: string;
  answerInstruction: string;
  keyboardInstructions: string;

  // Accessibility announcements
  diceRolledAnnouncement: (results: number[]) => string;
  attemptsRemainingAnnouncement: (remaining: number) => string;
  timeRemainingAnnouncement: (seconds: number) => string;
  verificationResultAnnouncement: (success: boolean, message: string) => string;

  // ARIA labels
  ariaMainRegion: string;
  ariaCanvasRegion: string;
  ariaChallengeRegion: string;
  ariaResultRegion: string;
  ariaLiveRegion: string;
}

/**
 * Default English strings for the library
 */
export const DEFAULT_DICE_CAPTCHA_I18N: DiceCaptchaI18n = {
  // Canvas labels
  canvasLabel: '3D Dice CAPTCHA',
  // canvasDescription: 'Interactive 3D dice that can be rolled to generate random numbers',
  canvasDescription: '',

  diceRolling: 'Dice are rolling...',
  diceSettled: 'Dice have settled',
  diceResult: 'Dice show: {{values}}',

  // Challenge labels
  challengeTitle: 'CAPTCHA Challenge',
  challengeDescription: 'Roll the dice and solve the challenge',
  answerLabel: 'Your Answer',
  answerPlaceholder: 'Enter your answer',
  attemptsLabel: 'Attempts',
  timeLabel: 'Time',

  // Button labels
  rollDiceButton: 'Roll Dice',
  submitButton: 'Submit Answer',
  retryButton: 'Try Again',
  resetButton: 'Reset',

  // Status messages
  rollingDice: 'Rolling dice...',
  analyzing: 'Analyzing results...',
  verifying: 'Verifying answer...',
  success: 'Success!',
  failure: 'Incorrect',
  timeout: 'Time expired',
  maxAttemptsReached: 'Maximum attempts reached',

  // Error messages
  invalidInput: 'Please enter a valid number',
  incorrectAnswer: 'The answer is incorrect. Please try again.',
  timeExpired: 'Time has expired. Please start over.',
  noAttemptsLeft: 'No attempts remaining. Please reset.',

  // Success messages
  verificationSuccess: 'Verification successful! You may proceed.',
  challengeComplete: 'Challenge completed successfully',

  // Instructions
  rollInstruction: 'Click "Roll Dice" or press Space to begin',
  answerInstruction: 'Enter the sum of the dice values and submit',
  keyboardInstructions: 'Use Space to roll, Enter to submit, Escape to cancel',

  // Accessibility announcements
  diceRolledAnnouncement: (results: number[]) =>
    `Dice rolled. Results: ${results.join(', ')}. Total: ${results.reduce((a, b) => a + b, 0)}`,

  attemptsRemainingAnnouncement: (remaining: number) =>
    `${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining`,

  timeRemainingAnnouncement: (seconds: number) =>
    `${seconds} ${seconds === 1 ? 'second' : 'seconds'} remaining`,

  verificationResultAnnouncement: (success: boolean, message: string) =>
    success ? `Success! ${message}` : `Incorrect. ${message}`,

  // ARIA labels
  ariaMainRegion: 'Dice CAPTCHA',
  ariaCanvasRegion: '3D Dice Canvas',
  ariaChallengeRegion: 'Challenge Input',
  ariaResultRegion: 'Verification Result',
  ariaLiveRegion: 'Status Updates',
};

/**
 * Injection token for providing custom i18n strings
 *
 * @example
 * ```typescript
 * // In your app configuration
 * import { DICE_CAPTCHA_I18N_TOKEN, DiceCaptchaI18n } from 'ngx-dice-captcha';
 *
 * const spanishStrings: DiceCaptchaI18n = {
 *   canvasLabel: 'CAPTCHA de Dados 3D',
 *   rollDiceButton: 'Tirar Dados',
 *   // ... other translations
 * };
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: DICE_CAPTCHA_I18N_TOKEN, useValue: spanishStrings }
 *   ]
 * };
 * ```
 */
export const DICE_CAPTCHA_I18N_TOKEN = new InjectionToken<DiceCaptchaI18n>('DICE_CAPTCHA_I18N', {
  providedIn: 'root',
  factory: () => DEFAULT_DICE_CAPTCHA_I18N,
});

/**
 * Helper function to create partial i18n overrides
 * Merges provided strings with defaults
 *
 * @param overrides - Partial i18n strings to override defaults
 * @returns Complete i18n configuration
 *
 * @example
 * ```typescript
 * const customStrings = createDiceCaptchaI18n({
 *   rollDiceButton: 'Custom Roll Text',
 *   submitButton: 'Custom Submit',
 * });
 *
 * { provide: DICE_CAPTCHA_I18N_TOKEN, useValue: customStrings }
 * ```
 */
export function createDiceCaptchaI18n(overrides: Partial<DiceCaptchaI18n>): DiceCaptchaI18n {
  return {
    ...DEFAULT_DICE_CAPTCHA_I18N,
    ...overrides,
  };
}

/**
 * Type guard to check if i18n configuration is valid
 */
export function isValidI18nConfig(config: unknown): config is DiceCaptchaI18n {
  return (
    config !== null &&
    typeof config === 'object' &&
    'canvasLabel' in config &&
    typeof (config as DiceCaptchaI18n).canvasLabel === 'string' &&
    'rollDiceButton' in config &&
    typeof (config as DiceCaptchaI18n).rollDiceButton === 'string' &&
    'submitButton' in config &&
    typeof (config as DiceCaptchaI18n).submitButton === 'string' &&
    'diceRolledAnnouncement' in config &&
    typeof (config as DiceCaptchaI18n).diceRolledAnnouncement === 'function'
  );
}
