# NGX Dice CAPTCHA

[![npm version](https://img.shields.io/npm/v/ngx-dice-captcha.svg)](https://www.npmjs.com/package/ngx-dice-captcha)
[![npm downloads](https://img.shields.io/npm/dm/ngx-dice-captcha.svg)](https://www.npmjs.com/package/ngx-dice-captcha)
[![Angular](https://img.shields.io/badge/Angular-20-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/ngx-dice-captcha)](https://bundlephobia.com/package/ngx-dice-captcha)

A modern Angular 20 library providing an interactive 3D dice-based CAPTCHA system with realistic physics simulation using Three.js and Cannon-es.

> 🎲 **Interactive 3D Dice CAPTCHA** - Engage users with realistic physics-based dice rolling in a beautiful WebGL canvas with customizable themes and multiple verification modes.

## ✨ Features

- 🎲 **Realistic 3D Dice** - Physics-based dice rolling using Three.js and Cannon-es
- ✨ **Overlay CAPTCHA (NEW in v2.0)** - Beautiful glassmorphism overlay with individual dice verification
- 📐 **Dynamic Canvas Resizing (NEW in v2.1)** - Automatic canvas adaptation to container size changes with debounced resize events
- 🎨 **Customizable Themes** - Full control over colors, materials, and visual effects
- ♿ **Accessible** - WCAG 2.1 compliant with screen reader support and keyboard navigation
- ⚡ **High Performance** - Built with Angular 20 signals and zoneless architecture
- 🌍 **Internationalization** - Multi-language support with custom i18n tokens
- 🔒 **Security** - Rate limiting, session tracking, and verification tokens
- 📱 **Responsive** - Automatic vertical/horizontal layout switching for mobile
- 🎯 **Multiple Verification Modes** - Individual dice, calculation, or both
- 🔧 **Highly Configurable** - Extensive configuration options for all aspects

## 📦 Installation

Install the package using npm:

```bash
npm install ngx-dice-captcha
```

Or using yarn:

```bash
yarn add ngx-dice-captcha
```

Or using pnpm:

```bash
pnpm add ngx-dice-captcha
```

### Peer Dependencies

This library requires the following peer dependencies:

- `@angular/core`: ^20.0.0
- `@angular/common`: ^20.0.0
- `three`: ^0.180.0
- `cannon-es`: ^0.20.0

> **Note**: `@angular/material` is optional and only needed if you want to use the pre-built verification display component with Material Design styling.

## 🚀 Quick Start

### Basic Usage

The library provides the dice rolling and validation logic. **You control how verification results are displayed** to maintain flexibility in your UI/UX:

```typescript
import { Component, signal } from '@angular/core';
import { NgxDiceCaptchaComponent, VerificationMode } from 'ngx-dice-captcha';
import type { VerificationResult } from 'ngx-dice-captcha';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgxDiceCaptchaComponent],
  template: `
    <form>
      <!-- Your form fields -->

      <ngx-dice-captcha
        [config]="captchaConfig"
        (verified)="onCaptchaVerified($event)"
        (failed)="onCaptchaFailed($event)"
      />

      <!-- Display verification results in your own UI -->
      @if (verificationMessage()) {
      <div [class]="captchaVerified() ? 'success-message' : 'error-message'">
        {{ verificationMessage() }}
      </div>
      }

      <button [disabled]="!captchaVerified()">Submit</button>
    </form>
  `,
})
export class LoginComponent {
  captchaVerified = signal(false);
  verificationMessage = signal('');

  captchaConfig = {
    diceCount: 3,
    verificationMode: VerificationMode.INDIVIDUAL_DICE,
    overlayPosition: 'top-left',
    maxAttempts: 3,
  };

  onCaptchaVerified(result: VerificationResult) {
    this.captchaVerified.set(true);
    this.verificationMessage.set('✅ CAPTCHA verified! You can proceed.');
    console.log('Token:', result.token);
    // Send token to your backend for validation
  }

  onCaptchaFailed(result: VerificationResult) {
    this.captchaVerified.set(false);
    this.verificationMessage.set(`❌ ${result.message}`);
    console.log('Attempts remaining:', result.attemptsRemaining);
  }
}
```

### Using the Optional Verification Display Component

For a pre-built popup modal, import the `VerificationDisplayComponent`:

```typescript
import { Component, signal } from '@angular/core';
import {
  NgxDiceCaptchaComponent,
  VerificationDisplayComponent,
  VerificationMode,
} from 'ngx-dice-captcha';
import type { VerificationResult } from 'ngx-dice-captcha';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgxDiceCaptchaComponent, VerificationDisplayComponent],
  template: `
    <ngx-dice-captcha
      [config]="captchaConfig"
      (verified)="onCaptchaVerified($event)"
      (failed)="onCaptchaFailed($event)"
    />

    <!-- Optional: Use the provided popup component -->
    @if (verificationResult()) {
    <ngx-verification-display
      [result]="verificationResult()"
      [showToken]="true"
      (close)="onCloseVerification()"
      (retry)="onRetryVerification()"
    />
    }
  `,
})
export class LoginComponent {
  verificationResult = signal<VerificationResult | null>(null);

  captchaConfig = {
    diceCount: 3,
    verificationMode: VerificationMode.INDIVIDUAL_DICE,
    maxAttempts: 3,
  };

  onCaptchaVerified(result: VerificationResult) {
    this.verificationResult.set(result);
  }

  onCaptchaFailed(result: VerificationResult) {
    this.verificationResult.set(result);
  }

  onCloseVerification() {
    this.verificationResult.set(null);
  }

  onRetryVerification() {
    this.verificationResult.set(null);
  }
}
```

### Option 2: Legacy Calculation Mode

For backward compatibility, the original calculation-based mode is still supported:

```typescript
captchaConfig = {
  diceCount: 3,
  verificationMode: VerificationMode.CALCULATION_ONLY, // Legacy mode
  difficulty: 'MEDIUM',
  timeout: 120000,
  maxAttempts: 3,
};
```

### 2. Configure Angular Material (if not already done)

```bash
ng add @angular/material
```

## 📖 Configuration

### Basic Configuration

```typescript
import { CaptchaConfig, Difficulty, DiceType, VerificationMode } from 'ngx-dice-captcha';

const config: CaptchaConfig = {
  diceCount: 3,
  diceType: DiceType.D6,
  difficulty: Difficulty.MEDIUM,
  maxAttempts: 3,

  // NEW in v2.0: Verification mode
  verificationMode: VerificationMode.INDIVIDUAL_DICE, // or CALCULATION_ONLY

  // NEW in v2.0: Overlay options
  overlayPosition: 'top-left', // Control overlay position
  showTimer: false,
  showAttempts: true,
  compactMode: false,

  // Optional: Timeout (0 = disabled)
  timeout: 0,
  timeoutBehavior: 'deduct-attempt',

  // Optional: Haptic feedback for mobile
  enableHaptics: false,
  hapticPatterns: {
    input: [10],
    success: [10, 50, 10],
    error: [100],
  },

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
};
```

### Configuration Options

| Property           | Type               | Default            | Description                               |
| ------------------ | ------------------ | ------------------ | ----------------------------------------- |
| `diceCount`        | `number`           | `3`                | Number of dice to roll                    |
| `diceType`         | `DiceType`         | `D6`               | Type of dice (D6, D8, D12, D20)           |
| `difficulty`       | `Difficulty`       | `MEDIUM`           | Challenge difficulty (EASY, MEDIUM, HARD) |
| `timeout`          | `number`           | `120000`           | Time limit in milliseconds                |
| `maxAttempts`      | `number`           | `3`                | Maximum verification attempts             |
| `theme`            | `ThemeConfig`      | See below          | Visual theme configuration                |
| `physics`          | `PhysicsConfig`    | See below          | Physics simulation parameters             |
| `verificationMode` | `VerificationMode` | `INDIVIDUAL_DICE`  | Verification mode (v2.0+)                 |
| `overlayPosition`  | `string`           | `'top-left'`       | Overlay position (v2.0+)                  |
| `showTimer`        | `boolean`          | `false`            | Show countdown timer (v2.0+)              |
| `showAttempts`     | `boolean`          | `true`             | Show attempts remaining (v2.0+)           |
| `compactMode`      | `boolean`          | `false`            | Enable compact mode (v2.0+)               |
| `timeoutBehavior`  | `string`           | `'deduct-attempt'` | Timeout behavior (v2.0+)                  |
| `enableHaptics`    | `boolean`          | `false`            | Enable haptic feedback (v2.0+)            |

### Theme Configuration

```typescript
theme: {
  primaryColor: '#667eea',        // Primary UI color
  backgroundColor: '#f0f0f0',     // 3D scene background
  diceColor: '#ffffff',           // Dice color
  dotColor: '#000000',            // Dice dots/numbers color
  enableShadows: true,            // Enable shadow rendering
  enableAmbientLight: true        // Enable ambient lighting
}
```

### Physics Configuration

```typescript
physics: {
  gravity: -15,              // Gravity force (negative = down)
  restitution: 0.3,          // Bounciness (0-1)
  friction: 0.4,             // Surface friction (0-1)
  linearDamping: 0.1,        // Linear velocity damping
  angularDamping: 0.1,       // Angular velocity damping
  collisionIterations: 10    // Collision detection precision
}
```

## 📐 Dynamic Canvas Resizing

The library automatically handles canvas resizing to adapt to container size changes. Additionally, you can monitor resize events for custom logic.

### Automatic Resizing

The canvas automatically resizes when:

- Browser window is resized
- Container element dimensions change
- Device orientation changes

Resize events are debounced (150ms) to optimize performance.

### Monitoring Resize Events

Access the `ThreeRendererService` to monitor resize events:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { ThreeRendererService, ResizeEventData } from 'ngx-dice-captcha';

@Component({
  selector: 'app-responsive-captcha',
  template: `
    <ngx-dice-captcha />
    <div class="resize-info">Canvas Size: {{ canvasWidth() }}x{{ canvasHeight() }}</div>
  `,
})
export class ResponsiveCaptchaComponent implements OnInit {
  private threeRenderer = inject(ThreeRendererService);
  canvasWidth = signal(0);
  canvasHeight = signal(0);
  private resizeCleanup?: () => void;

  ngOnInit() {
    // Subscribe to resize events
    this.resizeCleanup = this.threeRenderer.onResize((data: ResizeEventData) => {
      this.canvasWidth.set(data.width);
      this.canvasHeight.set(data.height);
      console.log('Canvas resized:', data);
      // data.aspectRatio, data.pixelRatio, data.timestamp also available
    });
  }

  ngOnDestroy() {
    // Cleanup resize callback
    this.resizeCleanup?.();
  }
}
```

### ResizeEventData Interface

```typescript
interface ResizeEventData {
  width: number; // Canvas width in pixels
  height: number; // Canvas height in pixels
  aspectRatio: number; // Width/height ratio
  pixelRatio: number; // Device pixel ratio (for high-DPI displays)
  timestamp: number; // Event timestamp
}
```

## 🎮 Component API

### Inputs

| Input       | Type                     | Description                                    |
| ----------- | ------------------------ | ---------------------------------------------- |
| `config`    | `Partial<CaptchaConfig>` | CAPTCHA configuration (merged with defaults)   |
| `autoStart` | `boolean`                | Auto-start challenge on init (default: `true`) |
| `sessionId` | `string`                 | Custom session ID for tracking                 |

### Outputs

| Output               | Type                 | Description                           |
| -------------------- | -------------------- | ------------------------------------- |
| `verified`           | `VerificationResult` | Emitted on successful verification    |
| `failed`             | `VerificationResult` | Emitted on failed verification        |
| `challengeGenerated` | `Challenge`          | Emitted when new challenge is created |
| `diceRolled`         | `number[]`           | Emitted when dice stop rolling        |

### Methods

| Method                    | Returns                      | Description                     |
| ------------------------- | ---------------------------- | ------------------------------- |
| `reset()`                 | `void`                       | Manually reset the CAPTCHA      |
| `getVerificationResult()` | `VerificationResult \| null` | Get current verification result |
| `isCurrentlyVerified()`   | `boolean`                    | Check if CAPTCHA is verified    |

## ♿ Accessibility

The library is fully accessible and WCAG 2.1 AA compliant:

- **Screen Reader Support** - ARIA labels and live regions for all interactions
- **Keyboard Navigation** - Full keyboard support (Space/Enter to roll, Tab navigation)
- **Reduced Motion** - Respects `prefers-reduced-motion` media query
- **Color Contrast** - Configurable colors for sufficient contrast
- **Focus Management** - Clear focus indicators and logical tab order

### Keyboard Shortcuts

- `Space` or `Enter` - Roll dice
- `Tab` - Navigate between elements
- `Escape` - Cancel/close dialogs

## 🌍 Internationalization

Provide custom translations using the injection token:

```typescript
import { DICE_CAPTCHA_I18N_TOKEN, DiceCaptchaI18n } from 'ngx-dice-captcha';

const customI18n: DiceCaptchaI18n = {
  rollDice: 'Throw Dice',
  submit: 'Submit Answer',
  retry: 'Try Again',
  rollingDice: 'Rolling dice...',
  verifying: 'Verifying answer...',
  success: 'Success!',
  failure: 'Incorrect',
  invalidInput: 'Please enter a valid number',
  timeExpired: 'Time has expired',
  diceRolledAnnouncement: (results: number[]) => `Dice results: ${results.join(', ')}`,
  verificationResultAnnouncement: (success: boolean, message: string) =>
    `${success ? 'Success' : 'Failed'}: ${message}`,
  timeRemainingAnnouncement: (seconds: number) => `${seconds} seconds remaining`,
  attemptsRemainingAnnouncement: (attempts: number) =>
    `${attempts} ${attempts === 1 ? 'attempt' : 'attempts'} remaining`,
};

// In your component or module
providers: [{ provide: DICE_CAPTCHA_I18N_TOKEN, useValue: customI18n }];
```

## 🔒 Security

### Backend Validation

Always validate the CAPTCHA token on your backend:

```typescript
// Frontend
onCaptchaVerified(result: VerificationResult) {
  this.http.post('/api/verify-captcha', {
    token: result.token
  }).subscribe(response => {
    // Proceed with form submission
  });
}
```

```javascript
// Backend (Node.js example)
app.post('/api/verify-captcha', (req, res) => {
  const { token } = req.body;

  // Verify token (decode, check signature, validate timestamp)
  const isValid = verifyCaptchaToken(token);

  if (isValid) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Invalid CAPTCHA' });
  }
});
```

### Rate Limiting

The library includes built-in rate limiting:

- Default: 5 attempts per minute per session
- Configurable lockout duration (default: 5 minutes)
- Automatic session cleanup

## 🎨 Theming with Angular Material

The library integrates with Angular Material theming:

```scss
@use '@angular/material' as mat;
@include mat.core();

$primary: mat.define-palette(mat.$indigo-palette);
$accent: mat.define-palette(mat.$pink-palette);

$theme: mat.define-light-theme(
  (
    color: (
      primary: $primary,
      accent: $accent,
    ),
  )
);

@include mat.all-component-themes($theme);
```

## 📊 Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android latest

## 🆕 Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for the complete version history and recent updates.

## 🧪 Testing

### Unit Tests

```bash
ng test ngx-dice-captcha
```

### Integration Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha';

describe('NgxDiceCaptchaComponent', () => {
  let component: NgxDiceCaptchaComponent;
  let fixture: ComponentFixture<NgxDiceCaptchaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxDiceCaptchaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxDiceCaptchaComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate challenge on init', () => {
    fixture.detectChanges();
    expect(component.currentChallenge()).toBeTruthy();
  });
});
```

## 📝 Examples

### With Reactive Forms

```typescript
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgxDiceCaptchaComponent],
  template: `
    <form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
      <input formControlName="name" placeholder="Name" />
      <input formControlName="email" placeholder="Email" />
      <textarea formControlName="message" placeholder="Message"></textarea>

      <ngx-dice-captcha (verified)="onCaptchaVerified($event)"> </ngx-dice-captcha>

      <button [disabled]="!contactForm.valid || !captchaVerified">Send Message</button>
    </form>
  `,
})
export class ContactFormComponent {
  contactForm: FormGroup;
  captchaVerified = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required],
    });
  }

  onCaptchaVerified(result: any) {
    this.captchaVerified = true;
  }

  onSubmit() {
    if (this.contactForm.valid && this.captchaVerified) {
      // Submit form
    }
  }
}
```

### Custom Styling

```scss
::ng-deep {
  ngx-dice-captcha {
    .challenge-card {
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .dice-canvas {
      border-radius: 8px;
    }

    button {
      text-transform: uppercase;
      font-weight: 600;
    }
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](../../CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js** - 3D rendering engine
- **Cannon-es** - Physics simulation
- **Angular Material** - UI components
- **Angular Team** - Amazing framework

## 📚 Documentation

- [Developer Manual](ngx-dice-captcha-developer-manual.md) - In-depth technical documentation
- [API Documentation](../../API.md) - Complete API reference
- [Migration Guide](../../MIGRATION.md) - Version migration guide
- [Changelog](../../CHANGELOG.md) - Version history and updates

## 💬 Support

- 📫 Email: contact@easy-cloud.in
- 🐛 Issues: [GitHub Issues](https://github.com/Easy-Cloud-in/ngx-dice-captcha/issues)
- 💡 Discussions: [GitHub Discussions](https://github.com/Easy-Cloud-in/ngx-dice-captcha/discussions)
- 📚 Documentation: [Full Documentation](../../README.md)

## 🗺️ Roadmap

- [ ] Additional dice types (D4, D10, D100)
- [ ] Custom dice textures and models
- [ ] Audio effects for dice rolling
- [ ] More challenge types
- [ ] Multiplayer challenges
- [ ] Analytics dashboard

---

Made with ❤️ using Angular 20
