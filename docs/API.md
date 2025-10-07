# NGX Dice CAPTCHA - API Documentation

Complete API reference for ngx-dice-captcha library.

## Table of Contents

- [Components](#components)
- [Services](#services)
- [Models & Interfaces](#models--interfaces)
- [Directives](#directives)
- [Utilities](#utilities)
- [Injection Tokens](#injection-tokens)

## Components

### NgxDiceCaptchaComponent

Main component that orchestrates the CAPTCHA functionality.

#### Selector

```typescript
'ngx-dice-captcha';
```

#### Inputs

| Input       | Type                     | Default        | Description                                      |
| ----------- | ------------------------ | -------------- | ------------------------------------------------ |
| `config`    | `Partial<CaptchaConfig>` | Default config | Configuration object for CAPTCHA behavior        |
| `autoStart` | `boolean`                | `true`         | Whether to start challenge automatically on init |
| `sessionId` | `string`                 | Auto-generated | Custom session identifier for tracking           |

#### Outputs

| Output               | Type                               | Description                           |
| -------------------- | ---------------------------------- | ------------------------------------- |
| `verified`           | `EventEmitter<VerificationResult>` | Emitted when verification succeeds    |
| `failed`             | `EventEmitter<VerificationResult>` | Emitted when verification fails       |
| `challengeGenerated` | `EventEmitter<Challenge>`          | Emitted when new challenge is created |
| `diceRolled`         | `EventEmitter<number[]>`           | Emitted when dice finish rolling      |

#### Methods

```typescript
/**
 * Manually reset the CAPTCHA to initial state
 */
reset(): void

/**
 * Get the current verification result
 * @returns Current VerificationResult or null if not verified
 */
getVerificationResult(): VerificationResult | null

/**
 * Check if CAPTCHA is currently verified
 * @returns true if verified, false otherwise
 */
isCurrentlyVerified(): boolean
```

#### Example Usage

```typescript
import { Component, ViewChild } from '@angular/core';
import { NgxDiceCaptchaComponent, VerificationResult } from 'ngx-dice-captcha';

@Component({
  selector: 'app-example',
  template: `
    <ngx-dice-captcha
      [config]="captchaConfig"
      (verified)="onVerified($event)"
      (failed)="onFailed($event)"
    />
  `,
})
export class ExampleComponent {
  @ViewChild(NgxDiceCaptchaComponent) captcha!: NgxDiceCaptchaComponent;

  captchaConfig = {
    diceCount: 3,
    maxAttempts: 3,
  };

  onVerified(result: VerificationResult) {
    console.log('Verified!', result.token);
  }

  onFailed(result: VerificationResult) {
    console.log('Failed:', result.message);
  }

  resetCaptcha() {
    this.captcha.reset();
  }
}
```

---

### DiceCanvasComponent

Handles 3D rendering of dice using Three.js.

#### Selector

```typescript
'dice-canvas';
```

#### Inputs

| Input       | Type       | Default       | Description                        |
| ----------- | ---------- | ------------- | ---------------------------------- |
| `diceCount` | `number`   | `3`           | Number of dice to display          |
| `diceType`  | `DiceType` | `DiceType.D6` | Type of dice (D6, D8, D12, D20)    |
| `autoRoll`  | `boolean`  | `false`       | Whether to roll dice automatically |
| `diceSize`  | `number`   | `1.5`         | Size of dice in 3D space           |

#### Outputs

| Output         | Type                     | Description                                   |
| -------------- | ------------------------ | --------------------------------------------- |
| `diceRolled`   | `EventEmitter<number[]>` | Emitted when dice finish rolling with results |
| `rollComplete` | `EventEmitter<void>`     | Emitted when roll animation completes         |

#### Methods

```typescript
/**
 * Manually trigger dice roll
 */
rollDice(): void

/**
 * Get current dice values
 * @returns Array of dice face values
 */
getDiceValues(): number[]
```

---

### VerificationDisplayComponent

Displays verification results in a modal/popup.

#### Selector

```typescript
'ngx-verification-display';
```

#### Inputs

| Input               | Type                 | Default  | Description                            |
| ------------------- | -------------------- | -------- | -------------------------------------- |
| `result`            | `VerificationResult` | Required | Verification result to display         |
| `showToken`         | `boolean`            | `false`  | Whether to show the verification token |
| `autoClose`         | `boolean`            | `false`  | Auto-close after duration              |
| `autoCloseDuration` | `number`             | `3000`   | Duration before auto-close (ms)        |

#### Outputs

| Output  | Type                 | Description                          |
| ------- | -------------------- | ------------------------------------ |
| `close` | `EventEmitter<void>` | Emitted when user closes the display |
| `retry` | `EventEmitter<void>` | Emitted when user clicks retry       |

---

### CaptchaChallengeComponent

Displays challenge text and timer.

#### Selector

```typescript
'captcha-challenge';
```

#### Inputs

| Input               | Type        | Description                    |
| ------------------- | ----------- | ------------------------------ |
| `challenge`         | `Challenge` | Challenge to display           |
| `timeRemaining`     | `number`    | Time remaining in milliseconds |
| `attemptsRemaining` | `number`    | Attempts remaining             |
| `showTimer`         | `boolean`   | Whether to show timer          |

---

### ControlOverlayComponent

Provides input controls for dice verification.

#### Selector

```typescript
'control-overlay';
```

#### Inputs

| Input              | Type                                                           | Description                         |
| ------------------ | -------------------------------------------------------------- | ----------------------------------- |
| `diceCount`        | `number`                                                       | Number of dice to create inputs for |
| `verificationMode` | `VerificationMode`                                             | Mode of verification                |
| `position`         | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | Overlay position                    |

#### Outputs

| Output   | Type                                                   | Description                      |
| -------- | ------------------------------------------------------ | -------------------------------- |
| `submit` | `EventEmitter<{ diceValues: number[], sum?: number }>` | Emitted when user submits values |

---

## Services

### ThreeRendererService

Manages Three.js scene, camera, and rendering.

#### Injectable

```typescript
@Injectable({ providedIn: 'root' })
```

#### Methods

```typescript
/**
 * Initialize the Three.js renderer
 * @param canvas HTML canvas element
 * @param config Optional renderer configuration
 */
initialize(canvas: HTMLCanvasElement, config?: Partial<RendererConfig>): void

/**
 * Start the render loop
 */
startRendering(): void

/**
 * Stop the render loop
 */
stopRendering(): void

/**
 * Resize the renderer and camera
 * @param width New width
 * @param height New height
 */
resize(width: number, height: number): void

/**
 * Subscribe to resize events
 * @param callback Function to call on resize
 * @returns Cleanup function
 */
onResize(callback: (data: ResizeEventData) => void): () => void

/**
 * Get the current scene
 * @returns Three.js Scene object
 */
getScene(): THREE.Scene

/**
 * Get the current camera
 * @returns Three.js Camera object
 */
getCamera(): THREE.Camera

/**
 * Clean up resources
 */
dispose(): void
```

---

### PhysicsEngineService

Handles Cannon-es physics simulation.

#### Injectable

```typescript
@Injectable({ providedIn: 'root' })
```

#### Methods

```typescript
/**
 * Initialize physics world
 * @param config Physics configuration
 */
initialize(config: PhysicsConfig): void

/**
 * Add a body to the physics world
 * @param body Cannon.js Body
 */
addBody(body: CANNON.Body): void

/**
 * Remove a body from the physics world
 * @param body Cannon.js Body
 */
removeBody(body: CANNON.Body): void

/**
 * Step the physics simulation
 * @param deltaTime Time since last step
 */
step(deltaTime: number): void

/**
 * Get the physics world
 * @returns Cannon.js World
 */
getWorld(): CANNON.World

/**
 * Clean up physics resources
 */
dispose(): void
```

---

### DiceFactoryService

Creates and manages dice instances.

#### Injectable

```typescript
@Injectable({ providedIn: 'root' })
```

#### Methods

```typescript
/**
 * Create dice instances
 * @param count Number of dice to create
 * @param type Type of dice
 * @param config Dice configuration
 * @returns Array of Dice objects
 */
createDice(count: number, type: DiceType, config: DiceConfig): Dice[]

/**
 * Create a single die
 * @param type Type of dice
 * @param config Dice configuration
 * @returns Dice object
 */
createSingleDie(type: DiceType, config: DiceConfig): Dice

/**
 * Update dice materials
 * @param dice Array of dice
 * @param materialConfig Material configuration
 */
updateMaterials(dice: Dice[], materialConfig: DiceMaterial): void
```

---

### ChallengeGeneratorService

Generates mathematical challenges.

#### Injectable

```typescript
@Injectable({ providedIn: 'root' })
```

#### Methods

```typescript
/**
 * Generate a new challenge
 * @param difficulty Difficulty level
 * @param diceCount Number of dice
 * @returns Challenge object
 */
generateChallenge(difficulty: Difficulty, diceCount: number): Challenge

/**
 * Calculate the expected solution for a challenge
 * @param diceResults Array of dice values
 * @param challenge Challenge object
 * @returns Expected solution value
 */
calculateSolution(diceResults: number[], challenge: Challenge): number

/**
 * Validate if a challenge is solvable
 * @param challenge Challenge to validate
 * @returns true if solvable
 */
validateChallenge(challenge: Challenge): boolean
```

---

### CaptchaValidatorService

Validates user answers.

#### Injectable

```typescript
@Injectable({ providedIn: 'root' })
```

#### Methods

```typescript
/**
 * Validate user answer
 * @param userAnswer User's submitted answer
 * @param expectedAnswer Expected correct answer
 * @param challenge Current challenge
 * @returns VerificationResult
 */
validate(
  userAnswer: number | number[],
  expectedAnswer: number | number[],
  challenge: Challenge
): VerificationResult

/**
 * Generate verification token
 * @param sessionId Session identifier
 * @param timestamp Verification timestamp
 * @returns Verification token string
 */
generateToken(sessionId: string, timestamp: number): string

/**
 * Track verification attempt
 * @param sessionId Session identifier
 * @param success Whether attempt was successful
 */
trackAttempt(sessionId: string, success: boolean): void
```

---

## Models & Interfaces

### CaptchaConfig

Main configuration interface.

```typescript
interface CaptchaConfig {
  // Dice Configuration
  diceCount: number;
  diceType: DiceType;
  diceSize?: number;

  // Challenge Configuration
  difficulty: Difficulty;
  verificationMode: VerificationMode;

  // Timing
  timeout: number;
  maxAttempts: number;
  timeoutBehavior: 'deduct-attempt' | 'reset' | 'end-session';

  // Visual Configuration
  theme: ThemeConfig;
  overlayPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compactMode: boolean;
  showTimer: boolean;
  showAttempts: boolean;

  // Physics
  physics: PhysicsConfig;

  // Accessibility
  enableHaptics: boolean;
  hapticPatterns?: {
    input?: number[];
    success?: number[];
    error?: number[];
  };

  // Responsive
  responsive?: ResponsiveConfig;
}
```

### ThemeConfig

Visual theme configuration.

```typescript
interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  diceColor: string;
  dotColor: string;
  enableShadows: boolean;
  enableAmbientLight: boolean;
  shadowIntensity?: number;
  lightIntensity?: number;
}
```

### PhysicsConfig

Physics simulation parameters.

```typescript
interface PhysicsConfig {
  gravity: number;
  restitution: number;
  friction: number;
  linearDamping: number;
  angularDamping: number;
  collisionIterations: number;
}
```

### Challenge

Challenge definition.

```typescript
interface Challenge {
  id: string;
  difficulty: Difficulty;
  operation: OperationType;
  diceCount: number;
  targetValue?: number;
  description: string;
  hint?: string;
  createdAt: number;
}
```

### VerificationResult

Verification outcome.

```typescript
interface VerificationResult {
  success: boolean;
  message: string;
  timestamp: number;
  token?: string;
  diceValues?: number[];
  userDiceInputs?: number[];
  expectedSum?: number;
  userSumInput?: number;
  attemptsRemaining?: number;
  partialMatch?: {
    correctDice: number;
    totalDice: number;
    sumCorrect?: boolean;
  };
}
```

### ResizeEventData

Resize event data structure.

```typescript
interface ResizeEventData {
  width: number;
  height: number;
  aspectRatio: number;
  pixelRatio: number;
  timestamp: number;
}
```

### Enums

#### DiceType

```typescript
enum DiceType {
  D6 = 'D6',
  D8 = 'D8',
  D12 = 'D12',
  D20 = 'D20',
}
```

#### Difficulty

```typescript
enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}
```

#### VerificationMode

```typescript
enum VerificationMode {
  INDIVIDUAL_DICE = 'INDIVIDUAL_DICE',
  CALCULATION_ONLY = 'CALCULATION_ONLY',
  BOTH = 'BOTH',
}
```

#### OperationType

```typescript
enum OperationType {
  SUM = 'SUM',
  PRODUCT = 'PRODUCT',
  DIFFERENCE = 'DIFFERENCE',
  SPECIFIC_NUMBER = 'SPECIFIC_NUMBER',
}
```

---

## Directives

### AccessibilityDirective

Enhances accessibility features.

#### Selector

```typescript
'[ngxDiceCaptchaAccessibility]';
```

#### Usage

```html
<div ngxDiceCaptchaAccessibility [ariaLabel]="'Dice CAPTCHA challenge'" [role]="'application'">
  <!-- Content -->
</div>
```

---

## Utilities

### Dice Geometry Utilities

```typescript
/**
 * Create geometry for specified dice type
 * @param diceType Type of dice
 * @returns Three.js BufferGeometry
 */
export function createDiceGeometry(diceType: DiceType): THREE.BufferGeometry;

/**
 * Get dice dimensions
 * @param diceType Type of dice
 * @returns Bounding box dimensions
 */
export function getDiceDimensions(diceType: DiceType): {
  width: number;
  height: number;
  depth: number;
};
```

### Physics Helpers

```typescript
/**
 * Apply rolling force to physics body
 * @param body Cannon.js Body
 * @param direction Force direction
 * @param magnitude Force magnitude
 */
export function applyRollingForce(
  body: CANNON.Body,
  direction: CANNON.Vec3,
  magnitude: number
): void;
```

### Random Utilities

```typescript
/**
 * Generate cryptographically secure random number
 * @returns Random number between 0 and 1
 */
export function secureRandom(): number;

/**
 * Generate random number in range
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Random number
 */
export function randomBetween(min: number, max: number): number;
```

### Color Utilities

```typescript
/**
 * Convert hex color to RGB
 * @param hex Hex color string
 * @returns RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number };

/**
 * Adjust color brightness
 * @param color Color string
 * @param amount Brightness adjustment (-100 to 100)
 * @returns Adjusted color string
 */
export function adjustBrightness(color: string, amount: number): string;
```

---

## Injection Tokens

### DICE_CAPTCHA_I18N_TOKEN

Injection token for internationalization.

```typescript
const DICE_CAPTCHA_I18N_TOKEN = new InjectionToken<DiceCaptchaI18n>('DICE_CAPTCHA_I18N');

interface DiceCaptchaI18n {
  rollDice: string;
  submit: string;
  retry: string;
  rollingDice: string;
  verifying: string;
  success: string;
  failure: string;
  invalidInput: string;
  timeExpired: string;
  diceRolledAnnouncement: (results: number[]) => string;
  verificationResultAnnouncement: (success: boolean, message: string) => string;
  timeRemainingAnnouncement: (seconds: number) => string;
  attemptsRemainingAnnouncement: (attempts: number) => string;
}
```

#### Usage

```typescript
import { DICE_CAPTCHA_I18N_TOKEN, DiceCaptchaI18n } from 'ngx-dice-captcha';

const customI18n: DiceCaptchaI18n = {
  rollDice: 'Lancer les dés',
  submit: 'Soumettre',
  // ... other translations
};

@Component({
  providers: [{ provide: DICE_CAPTCHA_I18N_TOKEN, useValue: customI18n }],
})
export class MyComponent {}
```

---

## TypeScript Types

All public types are exported from the main entry point:

```typescript
import type {
  CaptchaConfig,
  Challenge,
  VerificationResult,
  Dice,
  DiceType,
  Difficulty,
  VerificationMode,
  // ... other types
} from 'ngx-dice-captcha';
```

---

## Version Information

This API documentation is for version 1.0.0 of ngx-dice-captcha.

For migration guides between versions, see [`MIGRATION.md`](MIGRATION.md).

---

Made with ❤️ for the Angular community
