import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  output,
  effect,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VerificationResult } from '../../models/verification-result.model';
import { AccessibilityDirective } from '../../directives/accessibility.directive';
import { DICE_CAPTCHA_I18N_TOKEN, DiceCaptchaI18n } from '../../tokens/dice-captcha-i18n.token';

/**
 * Component for displaying CAPTCHA verification results with animations.
 *
 * Shows success or failure states with appropriate visual feedback, messaging,
 * and action buttons. Supports token display with masking, clipboard copy,
 * and auto-hide functionality. Provides full accessibility support with
 * ARIA announcements and screen reader optimizations.
 *
 * @example
 * ```typescript
 * <ngx-verification-display
 *   [result]="verificationResult"
 *   [showToken]="true"
 *   [autoHideDelay]="5000"
 *   (retry)="onRetry()"
 *   (close)="onClose()"
 *   (tokenCopied)="onTokenCopied($event)">
 * </ngx-verification-display>
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Component({
  selector: 'ngx-verification-display',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    AccessibilityDirective,
  ],
  templateUrl: './verification-display.component.html',
  styleUrls: ['./verification-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationDisplayComponent implements OnInit {
  readonly i18n = inject(DICE_CAPTCHA_I18N_TOKEN);

  // Inputs
  /**
   * The verification result to display.
   * Contains success status, message, and optional token.
   */
  readonly result = input<VerificationResult | null>(null);

  /**
   * Whether to display the verification token.
   * Token is masked by default and can be revealed.
   * @default true
   */
  readonly showToken = input<boolean>(true);

  /**
   * Auto-hide delay in milliseconds.
   * Set to 0 to disable auto-hide.
   * @default 0
   */
  readonly autoHideDelay = input<number>(0); // 0 = no auto-hide

  // Outputs
  /**
   * Emitted when the user clicks the retry button.
   */
  readonly retry = output<void>();

  /**
   * Emitted when the user clicks the close button.
   */
  readonly close = output<void>();

  /**
   * Emitted when the user successfully copies the token to clipboard.
   * Contains the copied token string.
   */
  readonly tokenCopied = output<string>();

  // State signals
  readonly showAnimation = signal<boolean>(false);
  readonly tokenVisible = signal<boolean>(false);
  readonly copySuccess = signal<boolean>(false);
  readonly announcement = signal<string>('');

  // Computed signals
  readonly isSuccess = computed(() => this.result()?.success === true);
  readonly isFailure = computed(() => this.result()?.success === false);
  readonly hasToken = computed(() => Boolean(this.result()?.token && this.showToken()));
  readonly tokenMasked = computed(() => {
    const token = this.result()?.token;
    if (!token) return '';
    if (this.tokenVisible()) return token;
    // Mask all but last 4 characters
    return token.length > 4
      ? '•'.repeat(token.length - 4) + token.slice(-4)
      : '•'.repeat(token.length);
  });

  constructor() {
    // Effect to trigger animation when result changes
    effect(() => {
      const result = this.result();
      if (result) {
        this.triggerAnimation();
        // Announce result to screen readers
        this.announcement.set(
          this.i18n.verificationResultAnnouncement(result.success, result.message)
        );
      }
    });

    // Effect to auto-hide after delay
    effect(() => {
      const delay = this.autoHideDelay();
      if (delay > 0 && this.result()) {
        setTimeout(() => {
          this.onClose();
        }, delay);
      }
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  /**
   * Triggers the entry animation for the verification display.
   *
   * Resets and restarts the animation to ensure it plays on every result change.
   *
   * @private
   */
  private triggerAnimation(): void {
    this.showAnimation.set(false);
    // Small delay to restart animation
    setTimeout(() => {
      this.showAnimation.set(true);
    }, 50);
  }

  /**
   * Handles the retry button click.
   *
   * Emits the retry event to allow parent to reset the challenge.
   *
   * @public
   */
  onRetry(): void {
    this.retry.emit();
  }

  /**
   * Handles the close button click.
   *
   * Emits the close event to allow parent to hide the display.
   *
   * @public
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Toggles between masked and visible token display.
   *
   * Allows users to reveal the full token when needed.
   *
   * @public
   */
  toggleTokenVisibility(): void {
    this.tokenVisible.update((val) => !val);
  }

  /**
   * Copies the verification token to the system clipboard.
   *
   * Uses the modern Clipboard API and shows success feedback.
   * Emits tokenCopied event on success.
   *
   * @returns Promise that resolves when copy is complete
   * @public
   */
  async copyToken(): Promise<void> {
    const token = this.result()?.token;
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      this.copySuccess.set(true);
      this.tokenCopied.emit(token);

      // Reset copy success indicator after 2 seconds
      setTimeout(() => {
        this.copySuccess.set(false);
      }, 2000);
    } catch (err) {
      // Silently handle copy failure
    }
  }

  /**
   * Gets the verification timestamp formatted for display.
   *
   * Uses the user's locale settings for formatting.
   *
   * @returns Formatted timestamp string or empty string if no result
   * @public
   */
  getFormattedTimestamp(): string {
    const timestamp = this.result()?.timestamp;
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Gets the appropriate Material icon name based on verification result.
   *
   * @returns 'check_circle' for success, 'cancel' for failure
   * @public
   */
  getIconName(): string {
    return this.isSuccess() ? 'check_circle' : 'cancel';
  }

  /**
   * Gets the CSS color class for the result icon.
   *
   * @returns 'success' or 'error' CSS class name
   * @public
   */
  getIconColorClass(): string {
    return this.isSuccess() ? 'success' : 'error';
  }

  /**
   * Gets the CSS color class for the card background.
   *
   * @returns 'success-card' or 'error-card' CSS class name
   * @public
   */
  getCardColorClass(): string {
    return this.isSuccess() ? 'success-card' : 'error-card';
  }

  /**
   * Gets localized status text for screen readers.
   *
   * Provides accessible text describing the verification outcome.
   *
   * @returns Localized 'Success' or 'Failure' text
   * @public
   */
  getResultStatusText(): string {
    const result = this.result();
    if (!result) return '';
    return result.success ? this.i18n.success : this.i18n.failure;
  }

  /**
   * Gets the appropriate ARIA live region priority.
   *
   * Failures use 'assertive' for immediate announcement,
   * successes use 'polite' to not interrupt.
   *
   * @returns ARIA live priority level
   * @public
   */
  getAriaLivePriority(): 'polite' | 'assertive' {
    return this.isSuccess() ? 'polite' : 'assertive';
  }
}
