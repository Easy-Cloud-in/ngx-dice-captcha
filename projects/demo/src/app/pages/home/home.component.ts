import { Component, signal, inject, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxDiceCaptchaComponent, VerificationMode, Difficulty, DiceType } from 'ngx-dice-captcha';
import type { VerificationResult, CaptchaConfig } from 'ngx-dice-captcha';
import { CaptchaStateService } from '../../services/captcha-state.service';

@Component({
  selector: 'app-home',
  imports: [NgxDiceCaptchaComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly captchaState = inject(CaptchaStateService);

  // Get reference to the captcha component
  private readonly captcha = viewChild<NgxDiceCaptchaComponent>('captcha');

  protected readonly attemptsRemaining = signal(3);
  protected readonly currentDiceValues = signal<number[]>([]);
  protected readonly currentDiceSum = signal<number>(0);
  protected readonly isRefreshing = signal(false);
  protected readonly showCaptcha = signal(true); // Controls component lifecycle

  protected readonly captchaConfig: Partial<CaptchaConfig> = {
    diceCount: 3,
    diceType: DiceType.D6,
    difficulty: Difficulty.MEDIUM,
    diceSize: 1.2,
    verificationMode: VerificationMode.INDIVIDUAL_DICE,
    overlayPosition: 'top-left',
    showTimer: false,
    showAttempts: true,
    compactMode: true,
    maxAttempts: 3,
    timeout: 0,
    enableHaptics: false,
    theme: {
      primaryColor: '#667eea',
      backgroundColor: '#f0f0f0',
      diceColor: '#ffffff',
      dotColor: '#000000',
      enableShadows: true,
      enableAmbientLight: true,
    },
  };

  protected onVerified(result: VerificationResult): void {
    if (result.success) {
      // Store verification state and navigate to dashboard
      this.captchaState.setVerified(result);
      this.router.navigate(['/dashboard']);
    }
  }

  protected onFailed(result: VerificationResult): void {
    const remaining = result.attemptsRemaining ?? 0;
    this.attemptsRemaining.set(remaining);

    // Show snackbar at top center
    this.snackBar.open(
      `❌ Verification failed. ${remaining} attempt${remaining === 1 ? '' : 's'
      } remaining. Please retry.`,
      'Dismiss',
      {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      }
    );
  }

  protected onDiceRolled(values: number[]): void {
    this.currentDiceValues.set(values);
    this.currentDiceSum.set(values.reduce((sum, val) => sum + val, 0));
  }

  /**
   * Completely reload the captcha component by destroying and recreating it.
   * This simulates a page refresh for the component only.
   */
  protected refreshCaptcha(): void {
    this.isRefreshing.set(true);

    // Reset display values
    this.currentDiceValues.set([]);
    this.currentDiceSum.set(0);

    // Hide the component (this will destroy it)
    this.showCaptcha.set(false);

    // Show feedback
    this.snackBar.open('🔄 Reloading captcha...', 'Dismiss', {
      duration: 1500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['info-snackbar'],
    });

    // After a brief delay, show the component again (this will recreate it)
    setTimeout(() => {
      this.showCaptcha.set(true);
      this.isRefreshing.set(false);
    }, 100);
  }
}
