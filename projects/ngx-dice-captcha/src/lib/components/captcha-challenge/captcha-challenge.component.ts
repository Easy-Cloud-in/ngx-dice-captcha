import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  input,
  output,
  effect,
  ChangeDetectionStrategy,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Challenge } from '../../models/challenge.model';
import { AccessibilityDirective } from '../../directives/accessibility.directive';
import { DICE_CAPTCHA_I18N_TOKEN, DiceCaptchaI18n } from '../../tokens/dice-captcha-i18n.token';

/**
 * Component for displaying the CAPTCHA challenge and capturing user input.
 *
 * Presents the challenge description, provides an input field for the answer,
 * manages the countdown timer, tracks attempts, and handles user interactions.
 * Uses Angular Material components and signals for reactive state management.
 *
 * @example
 * ```typescript
 * <ngx-captcha-challenge
 *   [challenge]="currentChallenge"
 *   [maxAttempts]="3"
 *   [timeoutSeconds]="120"
 *   [isRolling]="isRolling"
 *   [diceResults]="results"
 *   (rollClicked)="onRollDice()"
 *   (answerSubmitted)="onSubmitAnswer($event)"
 *   (timeExpired)="onTimeExpired()">
 * </ngx-captcha-challenge>
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Component({
  selector: 'ngx-captcha-challenge',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AccessibilityDirective,
  ],
  templateUrl: './captcha-challenge.component.html',
  styleUrls: ['./captcha-challenge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaptchaChallengeComponent implements OnInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  readonly i18n = inject(DICE_CAPTCHA_I18N_TOKEN);

  // Inputs
  /**
   * The current challenge to display to the user.
   * Contains the challenge description and requirements.
   */
  readonly challenge = input.required<Challenge>();

  /**
   * Maximum number of verification attempts allowed.
   * @default 3
   */
  readonly maxAttempts = input<number>(3);

  /**
   * Challenge timeout duration in seconds.
   * @default 120
   */
  readonly timeoutSeconds = input<number>(120);

  /**
   * Whether dice are currently rolling.
   * Used to disable interactions during animation.
   * @default false
   */
  readonly isRolling = input<boolean>(false);

  /**
   * Current dice face values from the last roll.
   * Used to enable/disable submit button.
   */
  readonly diceResults = input<number[]>([]);

  // Outputs
  /**
   * Emitted when the user clicks the roll dice button.
   */
  readonly rollClicked = output<void>();

  /**
   * Emitted when the user submits an answer.
   * Contains the numeric answer value.
   */
  readonly answerSubmitted = output<number>();

  /**
   * Emitted when the user clicks the retry button.
   */
  readonly retryClicked = output<void>();

  /**
   * Emitted when the challenge timer expires.
   */
  readonly timeExpired = output<void>();

  // State signals
  readonly userAnswer = signal<number | null>(null);
  readonly attemptsUsed = signal<number>(0);
  readonly timeRemaining = signal<number>(0);
  readonly isSubmitting = signal<boolean>(false);
  readonly showHint = signal<boolean>(false);
  readonly validationError = signal<string>('');
  readonly announcement = signal<string>('');

  // Computed signals
  readonly attemptsRemaining = computed(() => this.maxAttempts() - this.attemptsUsed());

  readonly canSubmit = computed(
    () =>
      this.userAnswer() !== null &&
      !this.isRolling() &&
      !this.isSubmitting() &&
      this.attemptsRemaining() > 0 &&
      this.timeRemaining() > 0 &&
      this.diceResults().length > 0
  );

  readonly canRoll = computed(
    () =>
      !this.isRolling() &&
      !this.isSubmitting() &&
      this.attemptsRemaining() > 0 &&
      this.timeRemaining() > 0
  );

  readonly isTimeout = computed(() => this.timeRemaining() === 0);

  readonly isAttemptsExhausted = computed(() => this.attemptsRemaining() === 0);

  readonly timeRemainingFormatted = computed(() => {
    const seconds = this.timeRemaining();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  });

  readonly progressPercent = computed(() => (this.timeRemaining() / this.timeoutSeconds()) * 100);

  // Private state
  private timerIntervalId?: number;

  constructor() {
    // Effect to start timer when component initializes
    effect(() => {
      if (this.challenge()) {
        this.startTimer();
      }
    });
  }

  ngOnInit(): void {
    this.timeRemaining.set(this.timeoutSeconds());
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  /**
   * Starts the countdown timer using setInterval.
   *
   * Runs outside Angular's zone for performance. Decrements time
   * remaining every second and emits timeExpired when it reaches zero.
   *
   * @private
   */
  private startTimer(): void {
    this.stopTimer();

    this.ngZone.runOutsideAngular(() => {
      this.timerIntervalId = window.setInterval(() => {
        this.ngZone.run(() => {
          const remaining = this.timeRemaining();
          if (remaining > 0) {
            this.timeRemaining.set(remaining - 1);
          } else {
            this.stopTimer();
            this.timeExpired.emit();
          }
        });
      }, 1000);
    });
  }

  /**
   * Stops the countdown timer.
   *
   * Clears the interval and resets the timer ID.
   *
   * @private
   */
  private stopTimer(): void {
    if (this.timerIntervalId !== undefined) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = undefined;
    }
  }

  /**
   * Resets the timer to its initial value and restarts it.
   *
   * Useful when starting a new challenge or retry attempt.
   *
   * @public
   */
  resetTimer(): void {
    this.timeRemaining.set(this.timeoutSeconds());
    this.startTimer();
  }

  /**
   * Handles the roll dice button click.
   *
   * Validates that rolling is allowed before emitting the event.
   *
   * @internal
   */
  onRollDice(): void {
    if (!this.canRoll()) {
      return;
    }
    this.rollClicked.emit();
  }

  /**
   * Handles the submit answer button click.
   *
   * Validates the input, updates state, announces to screen readers,
   * and emits the answer for validation.
   *
   * @internal
   */
  onSubmitAnswer(): void {
    if (!this.canSubmit()) {
      return;
    }

    const answer = this.userAnswer();
    if (answer === null) {
      this.validationError.set(this.i18n.invalidInput);
      this.announcement.set(this.i18n.invalidInput);
      return;
    }

    this.validationError.set('');
    this.isSubmitting.set(true);
    this.attemptsUsed.update((val) => val + 1);

    // Announce submission to screen readers
    this.announcement.set(this.i18n.verifying);

    // Emit answer for validation
    this.answerSubmitted.emit(answer);

    // Reset submitting state after a short delay
    setTimeout(() => {
      this.isSubmitting.set(false);
    }, 500);
  }

  /**
   * Handles the retry button click.
   *
   * Resets component state and emits retry event.
   *
   * @internal
   */
  onRetry(): void {
    this.resetState();
    this.retryClicked.emit();
  }

  /**
   * Toggles the visibility of the challenge hint.
   *
   * Hints provide additional context about the challenge.
   *
   * @public
   */
  toggleHint(): void {
    this.showHint.update((val) => !val);
  }

  /**
   * Resets all component state to initial values.
   *
   * Clears answer, attempts, submitting status, and restarts timer.
   *
   * @public
   */
  resetState(): void {
    this.userAnswer.set(null);
    this.attemptsUsed.set(0);
    this.isSubmitting.set(false);
    this.showHint.set(false);
    this.resetTimer();
  }

  /**
   * Handles Enter key press in the answer input field.
   *
   * Submits the answer if validation passes.
   *
   * @internal
   */
  onEnterPressed(): void {
    if (this.canSubmit()) {
      this.onSubmitAnswer();
    }
  }

  /**
   * Updates the answer value from input field changes.
   *
   * Parses the string to number and clears validation errors.
   *
   * @param value - The input string from the text field
   * @public
   */
  updateAnswer(value: string): void {
    const parsed = parseInt(value, 10);
    this.userAnswer.set(isNaN(parsed) ? null : parsed);
    // Clear validation error when user starts typing
    if (this.validationError()) {
      this.validationError.set('');
    }
  }

  /**
   * Gets the color class based on attempts remaining.
   *
   * Returns different colors to indicate urgency level.
   *
   * @returns Material color name ('warn', 'accent', or 'primary')
   * @public
   */
  getAttemptsColor(): string {
    const remaining = this.attemptsRemaining();
    if (remaining <= 1) return 'warn';
    if (remaining <= 2) return 'accent';
    return 'primary';
  }

  /**
   * Gets the color class based on time remaining percentage.
   *
   * Returns different colors to indicate urgency level.
   *
   * @returns Material color name ('warn', 'accent', or 'primary')
   * @public
   */
  getTimerColor(): string {
    const percent = this.progressPercent();
    if (percent <= 25) return 'warn';
    if (percent <= 50) return 'accent';
    return 'primary';
  }

  /**
   * Handles keyboard actions from the accessibility directive.
   *
   * Supports keyboard shortcuts for common actions.
   *
   * @param action - The keyboard action (e.g., 'cancel', 'reset')
   * @internal
   */
  onKeyboardAction(action: string): void {
    if (action === 'cancel') {
      this.resetState();
    } else if (action === 'reset') {
      this.onRetry();
    }
  }

  /**
   * Announces time warnings to screen readers at critical intervals.
   *
   * Called at 30 and 10 seconds remaining for accessibility.
   *
   * @public
   */
  announceTimeWarning(): void {
    const remaining = this.timeRemaining();
    if (remaining === 30 || remaining === 10) {
      this.announcement.set(this.i18n.timeRemainingAnnouncement(remaining));
    }
  }

  /**
   * Announces attempts warnings to screen readers when low.
   *
   * Called when only 1 attempt remains for accessibility.
   *
   * @public
   */
  announceAttemptsWarning(): void {
    const remaining = this.attemptsRemaining();
    if (remaining <= 1) {
      this.announcement.set(this.i18n.attemptsRemainingAnnouncement(remaining));
    }
  }
}
