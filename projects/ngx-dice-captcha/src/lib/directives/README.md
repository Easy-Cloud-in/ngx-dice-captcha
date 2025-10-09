# Form Focus Flow Directive

A modern Angular 20 directive that handles keyboard navigation and focus management in forms using signals.

## Features

- ✨ **Auto-focus**: Automatically focus the first input when activated (initial load & re-rolls)
- ⌨️ **Keyboard Navigation**: Arrow keys, Enter, and Backspace navigation
- 🔄 **Auto-advance**: Single-character inputs auto-advance to next field
- 🎯 **Smart Submit**: Enter on last field focuses submit button (user presses Enter again to submit)
- 🔁 **Re-roll Support**: Handles focus after verification failures
- 🔒 **Focus Trap**: Arrow keys wrap around (circular navigation), Escape to exit
- 📱 **Accessible**: Works with screen readers and keyboard-only users
- 🚀 **Zero Dependencies**: Pure Angular 20 with signals

## Usage

```typescript
import { FormFocusFlowDirective } from 'ngx-dice-captcha';

@Component({
  imports: [FormFocusFlowDirective],
  // ...
})
```

```html
<div ngxFormFocusFlow [autoFocus]="true" submitButtonSelector=".btn-submit">
  <input type="text" maxlength="1" />
  <input type="text" maxlength="1" />
  <input type="text" />

  <button class="btn-submit">Submit</button>
</div>
```

## Inputs

| Input                  | Type      | Default                          | Description                                            |
| ---------------------- | --------- | -------------------------------- | ------------------------------------------------------ |
| `autoFocus`            | `boolean` | `false`                          | Auto-focus first input when activated                  |
| `submitButtonSelector` | `string`  | `'.btn-verify, [type="submit"]'` | CSS selector for submit button                         |
| `focusDelay`           | `number`  | `150`                            | Delay before auto-focusing (ms) - allows @if rendering |
| `enableFocusTrap`      | `boolean` | `true`                           | Enable focus trap with wrap-around navigation          |

## Keyboard Shortcuts

- **Enter**: Move to next input or focus submit button (on last input)
  - User must press Enter again on button to submit
- **Arrow Right/Down**: Move to next element (inputs AND buttons)
  - Wraps to first element when at the end (circular navigation)
- **Arrow Left/Up**: Move to previous element (inputs AND buttons)
  - Wraps to last element when at the beginning (circular navigation)
- **Escape**: Exit focus trap (blur current element)
- **Backspace** (on empty input): Move to previous input
- **Auto-advance**: Single-char inputs move to next automatically

## Benefits Over Manual Implementation

- **Less Code**: ~200 lines of focus logic removed from component
- **Reusable**: Use across any form in your app
- **Maintainable**: Single source of truth for focus behavior
- **Testable**: Directive can be tested independently
- **Signals-based**: Reactive and performant with Angular 20
