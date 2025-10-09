import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CaptchaStateService } from '../../services/captcha-state.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly captchaState = inject(CaptchaStateService);

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected logout(): void {
    this.captchaState.reset();
    this.router.navigate(['/']);
  }
}
