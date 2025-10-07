import { Injectable, signal } from '@angular/core';
import type { VerificationResult } from 'ngx-dice-captcha';

@Injectable({
  providedIn: 'root',
})
export class CaptchaStateService {
  private readonly _isVerified = signal(false);
  private readonly _verificationToken = signal<string | null>(null);
  private readonly _verificationResult = signal<VerificationResult | null>(null);

  readonly isVerified = this._isVerified.asReadonly();
  readonly verificationToken = this._verificationToken.asReadonly();
  readonly verificationResult = this._verificationResult.asReadonly();

  setVerified(result: VerificationResult): void {
    this._isVerified.set(true);
    this._verificationToken.set(result.token ?? null);
    this._verificationResult.set(result);
  }

  reset(): void {
    this._isVerified.set(false);
    this._verificationToken.set(null);
    this._verificationResult.set(null);
  }
}
