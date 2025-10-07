import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { CaptchaStateService } from '../services/captcha-state.service';

export const authGuard: CanActivateFn = () => {
  const captchaState = inject(CaptchaStateService);
  const router = inject(Router);

  if (captchaState.isVerified()) {
    return true;
  }

  // Redirect to home if not verified
  return router.createUrlTree(['/']);
};
