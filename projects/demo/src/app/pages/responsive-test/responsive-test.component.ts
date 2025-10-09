import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha';

interface ScreenSize {
  id: string;
  name: string;
  icon: string;
  width: number;
  height: number;
  diceCount: number;
  description: string;
  category: 'mobile' | 'tablet' | 'desktop';
}

@Component({
  selector: 'app-responsive-test',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    NgxDiceCaptchaComponent,
  ],
  templateUrl: './responsive-test.component.html',
  styleUrls: ['./responsive-test.component.scss'],
})
export class ResponsiveTestComponent {
  protected readonly selectedIndex = signal<number>(0);
  protected readonly captchaConfigs = new Map<string, any>();

  constructor(private router: Router) {
    this.initializeCaptchaConfigs();
  }

  private initializeCaptchaConfigs(): void {
    this.screenSizes.forEach(screen => {
      this.captchaConfigs.set(screen.id, {
        diceCount: screen.diceCount,
        fillContainer: true,
        maintainAspectRatio: false,
        enableDynamicResize: true,
        theme: {
          primaryColor: '#667eea',
          backgroundColor: '#f0f0f0',
          diceColor: '#ffffff',
          dotColor: '#000000',
          enableShadows: true,
          enableAmbientLight: true,
        },
        showTimer: true,
        showAttempts: true,
        compactMode: screen.category === 'mobile',
      });
    });
  }



  protected readonly screenSizes: ScreenSize[] = [
    {
      id: 'mobile-small',
      name: 'Mobile S',
      icon: 'smartphone',
      width: 320,
      height: 568,
      diceCount: 2,
      description: 'iPhone SE, Galaxy S8',
      category: 'mobile',
    },
    {
      id: 'mobile-medium',
      name: 'Mobile M',
      icon: 'phone_iphone',
      width: 375,
      height: 667,
      diceCount: 2,
      description: 'iPhone 8, iPhone X',
      category: 'mobile',
    },
    {
      id: 'mobile-large',
      name: 'Mobile L',
      icon: 'phone_android',
      width: 414,
      height: 896,
      diceCount: 3,
      description: 'iPhone 14 Pro Max, Pixel 7',
      category: 'mobile',
    },
    {
      id: 'tablet',
      name: 'Tablet',
      icon: 'tablet_mac',
      width: 768,
      height: 1024,
      diceCount: 4,
      description: 'iPad, Galaxy Tab',
      category: 'tablet',
    },
    {
      id: 'laptop',
      name: 'Laptop',
      icon: 'laptop',
      width: 1024,
      height: 768,
      diceCount: 4,
      description: 'Small laptops, netbooks',
      category: 'desktop',
    },
    {
      id: 'desktop',
      name: 'Desktop',
      icon: 'desktop_windows',
      width: 1440,
      height: 900,
      diceCount: 5,
      description: 'Standard desktop monitors',
      category: 'desktop',
    },
    {
      id: 'desktop-large',
      name: 'Desktop L',
      icon: 'monitor',
      width: 1920,
      height: 1080,
      diceCount: 6,
      description: 'Full HD displays',
      category: 'desktop',
    },
    {
      id: 'ultrawide',
      name: 'Ultrawide',
      icon: 'tv',
      width: 2560,
      height: 1080,
      diceCount: 6,
      description: 'Ultrawide monitors, 4K displays',
      category: 'desktop',
    },
  ];

  protected onTabChange(index: number): void {
    this.selectedIndex.set(index);
  }

  protected onVerified(result: any, screenName: string): void {
    console.log(`✓ Verified on ${screenName}:`, result);
  }

  protected getCaptchaConfig(screenId: string): any {
    return this.captchaConfigs.get(screenId) || {};
  }

  protected getCategoryColor(category: string): string {
    switch (category) {
      case 'mobile':
        return 'primary';
      case 'tablet':
        return 'accent';
      case 'desktop':
        return 'warn';
      default:
        return 'primary';
    }
  }

  protected goHome(): void {
    this.router.navigate(['/']);
  }
}
