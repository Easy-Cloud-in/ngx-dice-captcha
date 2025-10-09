# FormFocusFlowDirective - Universal Usage Guide

## Overview

The `FormFocusFlowDirective` is a **universal, reusable Angular 20+ directive** that provides intelligent keyboard navigation and focus management for any form in any application. It's completely decoupled from the dice captcha and can be used standalone.

## Quick Start

### Installation

```bash
npm install ngx-dice-captcha
```

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { FormFocusFlowDirective } from 'ngx-dice-captcha';

@Component({
  selector: 'app-my-form',
  standalone: true,
  imports: [FormFocusFlowDirective],
  template: `
    <form ngxFormFocusFlow [autoFocus]="true">
      <input type="text" placeholder="First Name" />
      <input type="text" placeholder="Last Name" />
      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyFormComponent {}
```

That's it! Your form now has intelligent keyboard navigation.

## Features

- ✨ **Auto-focus** - Automatically focus first input when form appears
- ⌨️ **Arrow Navigation** - Navigate through ALL elements (inputs + buttons)
- 🔄 **Auto-advance** - Single-character inputs auto-advance to next field
- 🎯 **Smart Submit** - Enter on last field focuses submit button
- 🔒 **Focus Trap** - Circular navigation with Escape to exit
- 📱 **Accessible** - WCAG 2.1 AA compliant, screen reader compatible
- 🚀 **Zero Dependencies** - Pure Angular 20 with signals

## Configuration

### Inputs

| Input                  | Type      | Default                          | Description                                    |
| ---------------------- | --------- | -------------------------------- | ---------------------------------------------- |
| `autoFocus`            | `boolean` | `false`                          | Auto-focus first input when activated          |
| `submitButtonSelector` | `string`  | `'.btn-verify, [type="submit"]'` | CSS selector for submit button                 |
| `focusDelay`           | `number`  | `150`                            | Delay before auto-focusing (ms)                |
| `enableFocusTrap`      | `boolean` | `true`                           | Enable circular navigation with Escape to exit |

### Example with All Options

```html
<form
  ngxFormFocusFlow
  [autoFocus]="true"
  [enableFocusTrap]="true"
  [focusDelay]="200"
  submitButtonSelector=".btn-submit"
>
  <!-- Your form elements -->
</form>
```

## Keyboard Shortcuts

| Key                  | Action                                                        |
| -------------------- | ------------------------------------------------------------- |
| **Enter**            | Move to next input or focus submit button (on last input)     |
| **Arrow Right/Down** | Move to next element (wraps to first at end)                  |
| **Arrow Left/Up**    | Move to previous element (wraps to last at start)             |
| **Escape**           | Exit focus trap (blur current element)                        |
| **Backspace**        | Move to previous input (when current input is empty)          |
| **Auto-advance**     | Single-char inputs (maxlength="1") move to next automatically |

## Real-World Examples

### 1. Login Form

```typescript
import { Component, signal, computed } from '@angular/core';
import { FormFocusFlowDirective } from 'ngx-dice-captcha';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormFocusFlowDirective, FormsModule],
  template: `
    <div class="login-container">
      <h1>Login</h1>

      <form
        ngxFormFocusFlow
        [autoFocus]="true"
        [enableFocusTrap]="true"
        submitButtonSelector=".btn-login"
      >
        <input type="email" placeholder="Email" [(ngModel)]="email" name="email" />

        <input type="password" placeholder="Password" [(ngModel)]="password" name="password" />

        <button class="btn-login" (click)="login()" [disabled]="!canLogin()">Login</button>
      </form>
    </div>
  `,
  styles: [
    `
      .login-container {
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
      }

      input {
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      button {
        width: 100%;
        padding: 0.75rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class LoginComponent {
  email = signal('');
  password = signal('');

  canLogin = computed(() => this.email().length > 0 && this.password().length > 0);

  login() {
    console.log('Logging in...', {
      email: this.email(),
      password: this.password(),
    });
  }
}
```

### 2. PIN/OTP Input

```typescript
@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [FormFocusFlowDirective, FormsModule],
  template: `
    <div class="otp-container">
      <h2>Enter OTP</h2>

      <div
        ngxFormFocusFlow
        [autoFocus]="true"
        [enableFocusTrap]="true"
        submitButtonSelector=".btn-verify"
      >
        <div class="otp-inputs">
          @for (digit of digits(); track $index) {
          <input
            type="text"
            maxlength="1"
            [(ngModel)]="digits()[$index]"
            [name]="'digit' + $index"
            class="otp-digit"
          />
          }
        </div>

        <button class="btn-verify" (click)="verify()" [disabled]="!isComplete()">Verify</button>
      </div>
    </div>
  `,
  styles: [
    `
      .otp-inputs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .otp-digit {
        width: 3rem;
        height: 3rem;
        text-align: center;
        font-size: 1.5rem;
        border: 2px solid #ccc;
        border-radius: 4px;
      }

      .otp-digit:focus {
        border-color: #007bff;
        outline: none;
      }
    `,
  ],
})
export class OtpInputComponent {
  digits = signal(['', '', '', '', '', '']);

  isComplete = computed(() => this.digits().every((d) => d.length === 1));

  verify() {
    const otp = this.digits().join('');
    console.log('Verifying OTP:', otp);
  }
}
```

### 3. Search Filter Form

```typescript
@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [FormFocusFlowDirective, FormsModule],
  template: `
    <div class="filters">
      <h3>Search Filters</h3>

      <form
        ngxFormFocusFlow
        [autoFocus]="false"
        [enableFocusTrap]="false"
        submitButtonSelector=".btn-search"
      >
        <input type="text" placeholder="Name" [(ngModel)]="filters.name" name="name" />

        <input type="number" placeholder="Min Age" [(ngModel)]="filters.minAge" name="minAge" />

        <input type="number" placeholder="Max Age" [(ngModel)]="filters.maxAge" name="maxAge" />

        <input type="text" placeholder="City" [(ngModel)]="filters.city" name="city" />

        <button class="btn-search" (click)="search()">Search</button>

        <button type="button" (click)="reset()">Reset</button>
      </form>
    </div>
  `,
})
export class SearchFiltersComponent {
  filters = {
    name: '',
    minAge: null,
    maxAge: null,
    city: '',
  };

  search() {
    console.log('Searching with filters:', this.filters);
  }

  reset() {
    this.filters = {
      name: '',
      minAge: null,
      maxAge: null,
      city: '',
    };
  }
}
```

### 4. Modal Dialog

```typescript
@Component({
  selector: 'app-modal-form',
  standalone: true,
  imports: [FormFocusFlowDirective, FormsModule],
  template: `
    @if (isOpen()) {
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h2>Contact Us</h2>

        <form
          ngxFormFocusFlow
          [autoFocus]="true"
          [enableFocusTrap]="true"
          submitButtonSelector=".btn-send"
        >
          <input type="text" placeholder="Your Name" [(ngModel)]="form.name" name="name" />

          <input type="email" placeholder="Your Email" [(ngModel)]="form.email" name="email" />

          <textarea
            placeholder="Message"
            [(ngModel)]="form.message"
            name="message"
            rows="4"
          ></textarea>

          <div class="modal-actions">
            <button class="btn-send" (click)="send()">Send</button>
            <button type="button" (click)="close()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
      }

      input,
      textarea {
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      .modal-actions {
        display: flex;
        gap: 1rem;
      }

      button {
        flex: 1;
        padding: 0.75rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .btn-send {
        background: #28a745;
        color: white;
      }
    `,
  ],
})
export class ModalFormComponent {
  isOpen = signal(false);

  form = {
    name: '',
    email: '',
    message: '',
  };

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  send() {
    console.log('Sending message:', this.form);
    this.close();
  }
}
```

### 5. Multi-Step Wizard

```typescript
@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [FormFocusFlowDirective, FormsModule],
  template: `
    <div class="wizard">
      <h2>Registration Wizard</h2>

      <!-- Step 1: Personal Info -->
      @if (currentStep() === 1) {
      <div
        ngxFormFocusFlow
        [autoFocus]="true"
        [enableFocusTrap]="false"
        submitButtonSelector=".btn-next"
      >
        <h3>Step 1: Personal Information</h3>

        <input type="text" placeholder="First Name" [(ngModel)]="data.firstName" name="firstName" />

        <input type="text" placeholder="Last Name" [(ngModel)]="data.lastName" name="lastName" />

        <button class="btn-next" (click)="nextStep()">Next</button>
      </div>
      }

      <!-- Step 2: Contact Info -->
      @if (currentStep() === 2) {
      <div
        ngxFormFocusFlow
        [autoFocus]="true"
        [enableFocusTrap]="false"
        submitButtonSelector=".btn-next"
      >
        <h3>Step 2: Contact Information</h3>

        <input type="email" placeholder="Email" [(ngModel)]="data.email" name="email" />

        <input type="tel" placeholder="Phone" [(ngModel)]="data.phone" name="phone" />

        <div class="wizard-actions">
          <button type="button" (click)="prevStep()">Back</button>
          <button class="btn-next" (click)="nextStep()">Next</button>
        </div>
      </div>
      }

      <!-- Step 3: Confirmation -->
      @if (currentStep() === 3) {
      <div
        ngxFormFocusFlow
        [autoFocus]="true"
        [enableFocusTrap]="true"
        submitButtonSelector=".btn-submit"
      >
        <h3>Step 3: Confirm</h3>

        <div class="summary">
          <p><strong>Name:</strong> {{ data.firstName }} {{ data.lastName }}</p>
          <p><strong>Email:</strong> {{ data.email }}</p>
          <p><strong>Phone:</strong> {{ data.phone }}</p>
        </div>

        <div class="wizard-actions">
          <button type="button" (click)="prevStep()">Back</button>
          <button class="btn-submit" (click)="submit()">Submit</button>
        </div>
      </div>
      }
    </div>
  `,
})
export class WizardComponent {
  currentStep = signal(1);

  data = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  nextStep() {
    this.currentStep.update((s) => s + 1);
  }

  prevStep() {
    this.currentStep.update((s) => s - 1);
  }

  submit() {
    console.log('Submitting:', this.data);
  }
}
```

## Use Cases

### Perfect For:

✅ **Login/Registration Forms** - Auto-focus and smooth navigation
✅ **PIN/OTP Inputs** - Auto-advance between digits
✅ **Search Filters** - Quick keyboard navigation
✅ **Modal Dialogs** - Focus trap keeps users in context
✅ **Settings Forms** - Navigate through multiple fields
✅ **Multi-Step Wizards** - Consistent navigation per step
✅ **Data Entry Forms** - Fast keyboard-only input
✅ **Admin Panels** - Power user keyboard shortcuts

### Configuration Tips:

| Use Case       | `autoFocus` | `enableFocusTrap` | Notes                             |
| -------------- | ----------- | ----------------- | --------------------------------- |
| Login Form     | `true`      | `true`            | Focus immediately, trap user      |
| Modal Dialog   | `true`      | `true`            | Standard modal behavior           |
| Search Filters | `false`     | `false`           | Don't trap, allow page navigation |
| Wizard Steps   | `true`      | `false`           | Focus each step, allow back/next  |
| PIN Input      | `true`      | `true`            | Focus and trap for security       |
| Settings Form  | `false`     | `false`           | User-initiated focus              |

## Supported Input Types

The directive works with:

```html
<!-- Text inputs -->
<input type="text" />
<input type="email" />
<input type="password" />
<input type="tel" />
<input type="number" />
<input type="url" />
<input type="search" />

<!-- Textareas -->
<textarea></textarea>

<!-- Buttons -->
<button type="button">Action</button>
<button type="submit">Submit</button>
```

## Browser Compatibility

- ✅ Chrome/Edge (Chromium) 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android)

## Accessibility

### WCAG 2.1 Compliance

✅ **2.1.1 Keyboard (Level A)** - All functionality available via keyboard
✅ **2.1.2 No Keyboard Trap (Level A)** - Escape key exits focus trap
✅ **2.4.3 Focus Order (Level A)** - Logical, predictable focus order
✅ **2.4.7 Focus Visible (Level AA)** - Focus indicators remain visible

### Screen Reader Support

- Works with NVDA, JAWS, VoiceOver
- Announces each element as focus moves
- Circular navigation doesn't confuse screen readers
- Standard keyboard patterns

## Performance

- **Minimal overhead** - Only adds event listeners
- **No DOM mutations** - Pure focus management
- **No memory leaks** - Proper cleanup on destroy
- **Instant response** - No delays or animations
- **Signals-based** - Reactive and efficient

## Extracting for Standalone Use

If you don't want the entire library, you can copy just the directive:

```bash
# Copy from library
cp node_modules/ngx-dice-captcha/src/lib/directives/form-focus-flow.directive.ts \
   src/app/shared/directives/

# Update imports in your code
import { FormFocusFlowDirective } from './shared/directives/form-focus-flow.directive';
```

The directive is **standalone** with no external dependencies!

## Troubleshooting

### Focus not working?

1. Check that elements are not `disabled`
2. Ensure elements are visible (`display: none` won't work)
3. Verify `submitButtonSelector` matches your button

### Auto-advance not working?

- Only works on inputs with `maxlength="1"`
- Check that input type is `text` or `number`

### Focus trap not wrapping?

- Ensure `[enableFocusTrap]="true"`
- Check that there are multiple focusable elements

### Escape key not working?

- Make sure focus is inside the form
- Check browser console for errors

## Advanced Usage

### Custom Submit Button Selector

```html
<form ngxFormFocusFlow submitButtonSelector=".my-custom-button, #submit-btn">
  <input type="text" />
  <button class="my-custom-button">Submit</button>
</form>
```

### Dynamic Forms

```typescript
@Component({
  template: `
    <div ngxFormFocusFlow [autoFocus]="shouldAutoFocus()">
      @for (field of fields(); track field.id) {
      <input [type]="field.type" [placeholder]="field.label" />
      }
      <button>Submit</button>
    </div>
  `,
})
export class DynamicFormComponent {
  fields = signal([
    { id: 1, type: 'text', label: 'Name' },
    { id: 2, type: 'email', label: 'Email' },
  ]);

  shouldAutoFocus = signal(true);
}
```

### Conditional Focus Trap

```typescript
@Component({
  template: `
    <form ngxFormFocusFlow [enableFocusTrap]="isModal()">
      <!-- Form fields -->
    </form>
  `,
})
export class ConditionalFormComponent {
  isModal = signal(false);

  openAsModal() {
    this.isModal.set(true);
  }
}
```

## Migration from Manual Focus Management

### Before (Manual)

```typescript
@Component({
  template: `
    <form>
      <input #input1 (keydown)="onKeyDown($event, 0)" />
      <input #input2 (keydown)="onKeyDown($event, 1)" />
      <button #submitBtn>Submit</button>
    </form>
  `,
})
export class OldFormComponent {
  @ViewChildren('input') inputs!: QueryList<ElementRef>;
  @ViewChild('submitBtn') submitBtn!: ElementRef;

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Enter') {
      // Manual focus logic...
    }
    if (event.key === 'ArrowRight') {
      // Manual focus logic...
    }
    // 50+ lines of focus management code...
  }
}
```

### After (With Directive)

```typescript
@Component({
  template: `
    <form ngxFormFocusFlow [autoFocus]="true">
      <input />
      <input />
      <button>Submit</button>
    </form>
  `,
})
export class NewFormComponent {
  // That's it! No focus management code needed.
}
```

**Result**: ~200 lines of code removed! 🎉

## Contributing

Found a bug or have a feature request? Please open an issue on GitHub!

## License

MIT License - Use freely in personal and commercial projects.

## Support

- 📖 [Full Documentation](https://github.com/your-repo/ngx-dice-captcha)
- 🐛 [Report Issues](https://github.com/your-repo/ngx-dice-captcha/issues)
- 💬 [Discussions](https://github.com/your-repo/ngx-dice-captcha/discussions)

---

**Made with ❤️ for the Angular community**
