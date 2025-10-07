import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CaptchaStateService } from '../../services/captcha-state.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly router = inject(Router);
  protected readonly captchaState = inject(CaptchaStateService);

  protected logout(): void {
    this.captchaState.reset();
    this.router.navigate(['/']);
  }
}
