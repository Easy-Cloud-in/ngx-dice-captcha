import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  input,
  output,
  inject,
  ChangeDetectionStrategy,
  viewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceCanvasComponent } from './components/dice-canvas/dice-canvas.component';
import { VerificationDisplayComponent } from './components/verification-display/verification-display.component';
import { ChallengeGeneratorService } from './services/challenge-generator.service';
import { CaptchaValidatorService } from './services/captcha-validator.service';
import { CaptchaConfig } from './models/captcha-config.model';
import { Challenge, Difficulty } from './models/challenge.model';
import { VerificationResult } from './models/verification-result.model';
import { DiceType } from './models/dice.model';
import { VerificationMode } from './models/verification-mode.model';
import { ResponsiveConfig, DEFAULT_RESPONSIVE_CONFIG } from './models/responsive-config.model';

/**
 * Default configuration for the CAPTCHA
 */
const DEFAULT_CONFIG: CaptchaConfig = {
  diceCount: 3,
  diceType: DiceType.D6,
  difficulty: Difficulty.MEDIUM,
  theme: {
    primaryColor: '#667eea',
    backgroundColor: '#f0f0f0',
    diceColor: '#ffffff',
    dotColor: '#000000',
    enableShadows: true,
    enableAmbientLight: true,
  },
  physics: {
    gravity: -15,
    restitution: 0.3,
    friction: 0.4,
    linearDamping: 0.1,
    angularDamping: 0.1,
    collisionIterations: 10,
  },
  timeout: 120000, // 2 minutes
  maxAttempts: 3,

  // v2.0: New overlay captcha defaults
  verificationMode: VerificationMode.INDIVIDUAL_DICE,
  overlayPosition: 'top-center',
  showTimer: false,
  showAttempts: true,
  compactMode: false,

  // v2.2.0: Container behavior and dynamic resizing defaults
  // These defaults ensure backward compatibility - existing implementations continue to work exactly as before
  maintainAspectRatio: true, // Preserves 16:9 aspect ratio by default
  customAspectRatio: 1.7778, // 16:9 widescreen (default aspect ratio)
  fillContainer: false, // Does not fill container by default, maintains aspect ratio instead
  enableDynamicResize: true, // Scene updates on resize for responsive behavior
  resizeThreshold: 50, // 50px threshold prevents excessive updates during minor resizes
};

/**
 * Main CAPTCHA component that orchestrates all sub-components.
 *
 * Provides a complete 3D dice-based CAPTCHA experience with physics-based dice rolling,
 * challenge generation, and verification. Built with Angular 20 signals and zoneless
 * architecture for optimal performance.
 *
 * @example
 * ```typescript
 * import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha';
 *
 * @Component({
 *   selector: 'app-form',
 *   standalone: true,
 *   imports: [NgxDiceCaptchaComponent],
 *   template: `
 *     <ngx-dice-captcha
 *       [config]="captchaConfig"
 *       [autoStart]="true"
 *       (verified)="onVerified($event)"
 *       (failed)="onFailed($event)">
 *     </ngx-dice-captcha>
 *   `
 * })
 * export class AppFormComponent {
 *   captchaConfig = {
 *     diceCount: 3,
 *     difficulty: Difficulty.MEDIUM
 *   };
 *
 *   onVerified(result: VerificationResult) {
 *     console.log('CAPTCHA verified:', result.token);
 *   }
 * }
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Component({
  selector: 'ngx-dice-captcha',
  standalone: true,
  imports: [CommonModule, DiceCanvasComponent, VerificationDisplayComponent],
  templateUrl: './ngx-dice-captcha.component.html',
  styleUrls: ['./ngx-dice-captcha.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxDiceCaptchaComponent implements OnInit, OnDestroy {
  // ViewChild for DiceCanvasComponent
  private readonly diceCanvas = viewChild<DiceCanvasComponent>('diceCanvas');

  // Injected services
  private readonly challengeGenerator = inject(ChallengeGeneratorService);
  private readonly validator = inject(CaptchaValidatorService);

  // Inputs
  /**
   * Configuration options for the CAPTCHA.
   * Partial configuration will be merged with default values.
   *
   * @see {@link CaptchaConfig} for all available options
   */
  readonly config = input<Partial<CaptchaConfig>>({});

  /**
   * Whether to automatically start a challenge when the component initializes.
   * @default true
   */
  readonly autoStart = input<boolean>(true);

  /**
   * Unique session identifier for tracking verification attempts.
   * Auto-generated if not provided.
   */
  readonly sessionId = input<string>(this.generateSessionId());

  // Outputs
  /**
   * Emitted when the user successfully completes the CAPTCHA challenge.
   * Contains the verification result with a token for backend validation.
   */
  readonly verified = output<VerificationResult>();

  /**
   * Emitted when the user fails the CAPTCHA challenge.
   * Contains the failure reason and remaining attempts.
   */
  readonly failed = output<VerificationResult>();

  /**
   * Emitted when a new challenge is generated.
   * Useful for tracking or logging challenge creation.
   */
  readonly challengeGenerated = output<Challenge>();

  /**
   * Emitted when dice rolling is complete.
   * Contains the face values of all rolled dice.
   */
  readonly diceRolled = output<number[]>();

  // State signals
  readonly currentChallenge = signal<Challenge | null>(null);
  readonly diceResults = signal<number[]>([]);
  readonly storedDiceValues = signal<number[]>([]); // Actual dice values from the roll
  readonly isRolling = signal<boolean>(false);
  readonly attemptsUsed = signal<number>(0);
  readonly isMobile = signal<boolean>(false);
  readonly isInCooldown = signal<boolean>(false);
  readonly cooldownTimeRemaining = signal<number>(0);
  readonly verificationResult = signal<VerificationResult | null>(null);
  private cooldownInterval?: number;
  private readonly COOLDOWN_DURATION = 30; // 30 seconds cooldown

  // Computed signals
  readonly effectiveConfig = computed<CaptchaConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...this.config(),
  }));

  /**
   * Computed signal for effective responsive configuration.
   * Merges user-provided responsive config with defaults.
   * @since 2.2.0
   */
  readonly effectiveResponsiveConfig = computed<ResponsiveConfig>(() => {
    const userConfig = this.config().responsive;
    return {
      ...DEFAULT_RESPONSIVE_CONFIG,
      ...userConfig,
    };
  });

  readonly canRetry = computed(() => this.attemptsUsed() < this.effectiveConfig().maxAttempts);

  readonly verificationMode = computed(
    () => this.effectiveConfig().verificationMode ?? VerificationMode.INDIVIDUAL_DICE
  );

  readonly overlayPosition = computed(() => this.effectiveConfig().overlayPosition ?? 'top-center');

  ngOnInit(): void {
    this.checkMobileView();
    if (this.autoStart()) {
      this.startNewChallenge();
    }
  }

  ngOnDestroy(): void {
    // Clear cooldown interval if active
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  /**
   * Starts a new CAPTCHA challenge.
   *
   * Generates a new challenge based on the configured difficulty,
   * resets all state including dice results and verification status,
   * and emits the challenge through the challengeGenerated output.
   *
   * @public
   */
  startNewChallenge(): void {
    const config = this.effectiveConfig();
    const challenge = this.challengeGenerator.generateChallenge(config.difficulty);

    this.currentChallenge.set(challenge);
    this.diceResults.set([]);
    this.storedDiceValues.set([]); // Reset stored dice values
    this.attemptsUsed.set(0);
    this.isRolling.set(false);

    // Reset dice canvas and control overlay
    const canvas = this.diceCanvas();
    if (canvas) {
      canvas.resetForNewRoll();
    }

    this.challengeGenerated.emit(challenge);
  }

  /**
   * Handles the completion of a dice roll.
   *
   * Updates the component state with the rolled dice values and emits
   * the results through the diceRolled output.
   *
   * @param results - Array of face values from the rolled dice (1-based)
   * @internal
   */
  onDiceRollComplete(results: number[]): void {
    this.diceResults.set(results);
    this.storedDiceValues.set(results); // Store the actual dice values
    this.isRolling.set(false);
    this.diceRolled.emit(results);
  }

  /**
   * Handles verification request from control overlay.
   *
   * Validates the user's entered dice values against the actual rolled values,
   * updates attempt counter, and emits appropriate success or failure events.
   *
   * @param data - Object containing dice values and sum entered by the user
   * @internal
   */
  onVerificationRequested(data: { diceValues: number[]; sum: number }): void {
    const actualValues = this.storedDiceValues();

    if (actualValues.length === 0) {
      return;
    }

    // Validate dice values and sum
    const result = this.validateDiceValuesAndSum(data.diceValues, data.sum, actualValues);

    this.attemptsUsed.update((val) => val + 1);

    // Only show verification popup for successful verifications
    // Failed verifications will be handled by the parent component (e.g., snackbar)
    if (result.success) {
      this.verificationResult.set(result);
      this.verified.emit(result);
    } else {
      // Don't show popup for failures, just emit the failed event
      this.failed.emit(result);

      // Check if max attempts reached
      if (this.attemptsUsed() >= this.effectiveConfig().maxAttempts) {
        // Start cooldown period
        this.startCooldown();
      }
    }
  }

  /**
   * Validates user-entered dice values against actual rolled values.
   *
   * @param userInputs - Array of dice values entered by the user
   * @param actualValues - Actual dice values from the roll
   * @returns Verification result with success status and details
   * @private
   */
  private validateDiceValues(userInputs: number[], actualValues: number[]): VerificationResult {
    if (userInputs.length !== actualValues.length) {
      return {
        success: false,
        message: 'Invalid number of dice values',
        timestamp: Date.now(),
        attemptsRemaining: this.effectiveConfig().maxAttempts - this.attemptsUsed() - 1,
      };
    }

    // Check if all values match
    const allMatch = userInputs.every((val, idx) => val === actualValues[idx]);

    if (allMatch) {
      return {
        success: true,
        message: 'CAPTCHA verified successfully!',
        timestamp: Date.now(),
        token: this.generateVerificationToken(),
        diceValues: actualValues,
        userDiceInputs: userInputs,
      };
    }

    // Calculate partial match
    const correctCount = userInputs.filter((val, idx) => val === actualValues[idx]).length;

    return {
      success: false,
      message: `Incorrect dice values. ${correctCount}/${actualValues.length} correct.`,
      timestamp: Date.now(),
      attemptsRemaining: this.effectiveConfig().maxAttempts - this.attemptsUsed() - 1,
      diceValues: actualValues,
      userDiceInputs: userInputs,
      partialMatch: {
        correctDice: correctCount,
        totalDice: actualValues.length,
      },
    };
  }
  /**
   * Validates user-entered dice values and sum against actual rolled values.
   *
   * @param userInputs - Array of dice values entered by the user
   * @param userSum - Sum entered by the user
   * @param actualValues - Actual dice values from the roll
   * @returns Verification result with success status and details
   * @private
   */
  private validateDiceValuesAndSum(
    userInputs: number[],
    userSum: number,
    actualValues: number[]
  ): VerificationResult {
    if (userInputs.length !== actualValues.length) {
      return {
        success: false,
        message: 'Invalid number of dice values',
        timestamp: Date.now(),
        attemptsRemaining: this.effectiveConfig().maxAttempts - this.attemptsUsed() - 1,
      };
    }

    // Calculate actual sum
    const actualSum = actualValues.reduce((sum, val) => sum + val, 0);

    // Check if all dice values match
    const allDiceMatch = userInputs.every((val, idx) => val === actualValues[idx]);

    // Check if sum matches
    const sumMatches = userSum === actualSum;

    if (allDiceMatch && sumMatches) {
      return {
        success: true,
        message: 'CAPTCHA verified successfully!',
        timestamp: Date.now(),
        token: this.generateVerificationToken(),
        diceValues: actualValues,
        userDiceInputs: userInputs,
        expectedSum: actualSum,
        userSumInput: userSum,
      };
    }

    // Calculate partial match
    const correctDiceCount = userInputs.filter((val, idx) => val === actualValues[idx]).length;

    let message = '';
    if (!allDiceMatch && !sumMatches) {
      message = `Incorrect values. ${correctDiceCount}/${actualValues.length} dice correct. Sum is also incorrect.`;
    } else if (!allDiceMatch) {
      message = `Incorrect dice values. ${correctDiceCount}/${actualValues.length} correct. Sum is correct.`;
    } else {
      message = `Dice values are correct, but sum is incorrect.`;
    }

    return {
      success: false,
      message,
      timestamp: Date.now(),
      attemptsRemaining: this.effectiveConfig().maxAttempts - this.attemptsUsed() - 1,
      diceValues: actualValues,
      userDiceInputs: userInputs,
      expectedSum: actualSum,
      userSumInput: userSum,
      partialMatch: {
        correctDice: correctDiceCount,
        totalDice: actualValues.length,
        sumCorrect: sumMatches,
      },
    };
  }

  /**
   * Checks if the current view is mobile-sized.
   *
   * @private
   */
  private checkMobileView(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  /**
   * Handles window resize events to update mobile state.
   *
   * @internal
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkMobileView();
  }

  /**
   * Handles the start of a dice rolling animation.
   *
   * Triggers the actual dice roll on the canvas component and sets
   * the rolling state to prevent multiple simultaneous rolls.
   *
   * @internal
   */
  onDiceRollStart(): void {
    const canvas = this.diceCanvas();
    if (canvas) {
      canvas.rollDice();
    }
    this.isRolling.set(true);
  }

  /**
   * Handles user answer submission for validation.
   *
   * Validates the submitted answer against the current challenge and dice results,
   * updates attempt counter, and emits appropriate success or failure events.
   *
   * @param answer - The numeric answer submitted by the user
   * @internal
   */
  onAnswerSubmitted(answer: number): void {
    const challenge = this.currentChallenge();
    const results = this.diceResults();

    if (!challenge || results.length === 0) {
      return;
    }

    // Validate the answer
    const result = this.validator.validateSolution(answer, challenge, results, this.sessionId());

    this.attemptsUsed.update((val) => val + 1);

    // Emit appropriate event - let parent handle UI display
    if (result.success) {
      this.verified.emit(result);
    } else {
      this.failed.emit(result);
    }
  }

  /**
   * Handles challenge timeout expiration.
   *
   * Creates a failure result and emits it through the failed output.
   *
   * @internal
   */
  onTimeExpired(): void {
    const result: VerificationResult = {
      success: false,
      message: 'Time expired. Please try again.',
      timestamp: Date.now(),
    };

    this.failed.emit(result);
  }

  /**
   * Manually resets the CAPTCHA to start over.
   *
   * Generates a new challenge and resets all state. This can be called
   * programmatically from parent components.
   *
   * @example
   * ```typescript
   * @ViewChild(NgxDiceCaptchaComponent) captcha!: NgxDiceCaptchaComponent;
   *
   * resetForm() {
   *   this.captcha.reset();
   * }
   * ```
   *
   * @public
   */
  reset(): void {
    this.startNewChallenge();
  }

  /**
   * Generates a unique session identifier.
   *
   * Combines current timestamp with a random string for uniqueness.
   *
   * @returns A unique session ID string
   * @private
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a verification token for successful CAPTCHA completion.
   *
   * Creates a JWT-like token with session info, timestamp, and random salt.
   *
   * @returns A verification token string
   * @private
   */
  private generateVerificationToken(): string {
    const payload = {
      sessionId: this.sessionId(),
      timestamp: Date.now(),
      salt: Math.random().toString(36).substr(2, 16),
    };
    return `token-${btoa(JSON.stringify(payload))}`;
  }

  /**
   * Starts a cooldown period after max attempts are exhausted.
   *
   * Prevents further verification attempts for a specified duration,
   * displays countdown timer to user, and automatically resets after expiry.
   *
   * @private
   */
  private startCooldown(): void {
    this.isInCooldown.set(true);
    this.cooldownTimeRemaining.set(this.COOLDOWN_DURATION);

    // Clear any existing interval
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    // Start countdown
    this.cooldownInterval = window.setInterval(() => {
      const remaining = this.cooldownTimeRemaining();
      if (remaining <= 1) {
        // Cooldown complete
        this.endCooldown();
      } else {
        this.cooldownTimeRemaining.set(remaining - 1);
      }
    }, 1000);
  }

  /**
   * Ends the cooldown period and resets for a new challenge.
   *
   * @private
   */
  private endCooldown(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = undefined;
    }

    this.isInCooldown.set(false);
    this.cooldownTimeRemaining.set(0);

    // Start a fresh challenge after cooldown
    this.startNewChallenge();
  }

  /**
   * Handles retry action from verification display.
   * Clears the verification result and resets the control overlay.
   *
   * @public
   */
  onVerificationRetry(): void {
    this.verificationResult.set(null);

    // Reset the control overlay forms
    const canvas = this.diceCanvas();
    const overlay = canvas?.controlOverlay();
    if (overlay) {
      overlay.reset();
    }
  }

  /**
   * Handles close action from verification display.
   * Clears the verification result and starts a new challenge if successful.
   *
   * @public
   */
  onVerificationClose(): void {
    const result = this.verificationResult();
    this.verificationResult.set(null);

    // If verification was successful, start a new challenge
    if (result?.success) {
      this.startNewChallenge();
    } else {
      // For failed verification, just clear the overlay and let user try again
      const canvas = this.diceCanvas();
      const overlay = canvas?.controlOverlay();
      if (overlay) {
        overlay.reset();
      }
    }
  }
}
