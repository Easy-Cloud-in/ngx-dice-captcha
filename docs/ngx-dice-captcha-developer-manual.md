# NGX Dice CAPTCHA - Developer Manual

## Overview

**NGX Dice CAPTCHA** is a modern Angular 20 library that implements an interactive 3D dice-based CAPTCHA system. It uses Three.js for 3D rendering and Cannon-es for physics simulation to create an engaging and accessible CAPTCHA experience.

### Key Features

- **3D Dice Rendering**: Interactive 3D dice with realistic physics simulation
- **Multiple Dice Types**: Support for D6, D8, D12, and D20 dice
- **Challenge Generation**: Mathematical challenges (sum, product, difference, specific numbers)
- **Accessibility**: Full WCAG 2.1 compliance with ARIA labels and keyboard navigation
- **Responsive Design**: Adaptive layout for mobile and desktop
- **Angular 20**: Built with modern Angular signals and zoneless architecture
- **TypeScript**: Full type safety and IntelliSense support

### Technology Stack

- **Angular 20**: Framework with signals and standalone components
- **Three.js**: 3D rendering engine
- **Cannon-es**: Physics simulation engine
- **SCSS**: Styling with theming support
- **TypeScript**: Type-safe development

## Library Structure

```
projects/ngx-dice-captcha/
├── src/
│   ├── public-api.ts                    # Main entry point - exports all public APIs
│   ├── lib/
│   │   ├── ngx-dice-captcha.component.* # Main component - orchestrates all functionality
│   │   ├── components/                  # Sub-components
│   │   │   ├── dice-canvas/             # 3D canvas and dice rendering
│   │   │   ├── captcha-challenge/       # Challenge display and interaction
│   │   │   ├── verification-display/    # Verification result display
│   │   │   └── control-overlay/         # User input controls
│   │   ├── services/                    # Core business logic services
│   │   │   ├── challenge-generator.service.ts    # Mathematical challenge creation
│   │   │   ├── captcha-validator.service.ts     # Answer validation logic
│   │   │   ├── three-renderer.service.ts        # Three.js scene management
│   │   │   ├── physics-engine.service.ts        # Cannon-es physics simulation
│   │   │   ├── dice-factory.service.ts          # Dice creation and management
│   │   │   ├── animation.service.ts             # Animation coordination
│   │   │   └── error-reporting.service.ts       # Error handling and reporting
│   │   ├── models/                      # TypeScript interfaces and types
│   │   │   ├── captcha-config.model.ts          # Main configuration interface
│   │   │   ├── challenge.model.ts               # Challenge data structures
│   │   │   ├── dice.model.ts                    # Dice type definitions
│   │   │   ├── verification-result.model.ts     # Verification response types
│   │   │   ├── verification-mode.model.ts       # Verification mode enums
│   │   │   ├── dice-material.model.ts           # 3D material configurations
│   │   │   ├── responsive-config.model.ts       # Responsive behavior settings
│   │   │   ├── scene-scale.model.ts             # 3D scene scaling data
│   │   │   ├── dice-scale-info.model.ts         # Dice scaling information
│   │   │   └── resize-event.model.ts            # Resize event data structures
│   │   ├── utils/                       # Utility functions
│   │   │   ├── dice-geometry.util.ts            # 3D geometry calculations
│   │   │   ├── physics-helpers.util.ts          # Physics simulation helpers
│   │   │   ├── random.util.ts                   # Random number generation
│   │   │   ├── color.util.ts                    # Color manipulation utilities
│   │   │   ├── error-handler.util.ts            # Error handling utilities
│   │   │   ├── object-pool.util.ts              # Object pooling for performance
│   │   │   └── type-adapters.util.ts            # Type conversion utilities
│   │   ├── directives/                 # Angular directives
│   │   │   └── accessibility.directive.ts      # Accessibility enhancements
│   │   ├── tokens/                      # Angular injection tokens
│   │   │   └── dice-captcha-i18n.token.ts       # Internationalization token
│   │   └── styles/                      # SCSS styling
│   │       ├── index.scss               # Main stylesheet imports
│   │       ├── _variables.scss          # CSS custom properties
│   │       ├── _theme.scss              # Theme definitions
│   │       └── _mixins.scss             # Reusable SCSS mixins
│   └── test.ts                          # Test entry point
├── package.json                         # Library package configuration
├── README.md                           # Library documentation
├── tsconfig.lib.json                   # TypeScript library configuration
└── ng-package.json                     # Angular library build configuration
```

## Main Entry Point

**File**: `projects/ngx-dice-captcha/src/public-api.ts`

The main entry point exports all public APIs of the library:

```typescript
// Main Component
export * from './lib/ngx-dice-captcha.component';

// Sub-components
export * from './lib/components/dice-canvas/dice-canvas.component';
export * from './lib/components/captcha-challenge/captcha-challenge.component';
export * from './lib/components/verification-display/verification-display.component';
export * from './lib/components/control-overlay/control-overlay.component';

// Services
export * from './lib/services/three-renderer.service';
export * from './lib/services/physics-engine.service';
export * from './lib/services/dice-factory.service';
export * from './lib/services/challenge-generator.service';
export * from './lib/services/captcha-validator.service';

// Models
export * from './lib/models/dice.model';
export * from './lib/models/captcha-config.model';
export * from './lib/models/challenge.model';
export * from './lib/models/verification-result.model';
export * from './lib/models/verification-mode.model';
export * from './lib/models/dice-material.model';
export * from './lib/models/resize-event.model';
export * from './lib/models/responsive-config.model';
export * from './lib/models/scene-scale.model';
export * from './lib/models/dice-scale-info.model';

// Utilities
export * from './lib/utils/dice-geometry.util';
export * from './lib/utils/physics-helpers.util';
export * from './lib/utils/random.util';
export * from './lib/utils/color.util';

// Directives
export * from './lib/directives/accessibility.directive';

// Tokens
export * from './lib/tokens/dice-captcha-i18n.token';
```

## Core Components

### 1. NgxDiceCaptchaComponent (Main Component)

**Files**:

- `projects/ngx-dice-captcha/src/lib/ngx-dice-captcha.component.ts`
- `projects/ngx-dice-captcha/src/lib/ngx-dice-captcha.component.html`
- `projects/ngx-dice-captcha/src/lib/ngx-dice-captcha.component.scss`

**Purpose**: Main orchestrating component that coordinates all sub-components and manages the overall CAPTCHA flow.

**Key Features**:

- **State Management**: Uses Angular signals for reactive state management
- **Challenge Coordination**: Manages challenge generation and verification
- **Event Handling**: Emits events for verification success/failure
- **Responsive Behavior**: Handles mobile detection and responsive layout
- **Cooldown System**: Implements retry limits with cooldown periods

**Inputs**:

- `config`: Partial configuration object (merged with defaults)
- `autoStart`: Whether to start challenge automatically (default: true)
- `sessionId`: Unique session identifier (auto-generated if not provided)

**Outputs**:

- `verified`: Emitted on successful verification
- `failed`: Emitted on verification failure
- `challengeGenerated`: Emitted when new challenge is created
- `diceRolled`: Emitted when dice roll completes

**Dependencies**:

- `ChallengeGeneratorService`: For creating mathematical challenges
- `CaptchaValidatorService`: For validating user answers
- `DiceCanvasComponent`: For 3D dice rendering
- `VerificationDisplayComponent`: For showing results

### 2. DiceCanvasComponent

**Files**:

- `projects/ngx-dice-captcha/src/lib/components/dice-canvas/dice-canvas.component.ts`
- `projects/ngx-dice-captcha/src/lib/components/dice-canvas/dice-canvas.component.html`
- `projects/ngx-dice-captcha/src/lib/components/dice-canvas/dice-canvas.component.scss`

**Purpose**: Handles 3D scene rendering, physics simulation, and dice management.

**Key Features**:

- **Three.js Integration**: Manages WebGL canvas and 3D scene
- **Physics Simulation**: Uses Cannon-es for realistic dice physics
- **Dice Factory**: Creates and manages multiple dice instances
- **Responsive Sizing**: Adapts to container dimensions
- **Performance Optimization**: Runs outside Angular zone for smooth animations

**Inputs**:

- `diceCount`: Number of dice to display (default: 3)
- `diceType`: Type of dice (D6, D8, D12, D20) (default: D6)
- `autoRoll`: Whether to roll dice automatically (default: false)
- `diceSize`: Size of dice in 3D space (default: 1.5)

**Dependencies**:

- `ThreeRendererService`: Three.js scene management
- `PhysicsEngineService`: Physics simulation
- `DiceFactoryService`: Dice creation and configuration
- `ControlOverlayComponent`: User interaction overlay

### 3. CaptchaChallengeComponent

**Files**:

- `projects/ngx-dice-captcha/src/lib/components/captcha-challenge/captcha-challenge.component.ts`
- `projects/ngx-dice-captcha/src/lib/components/captcha-challenge/captcha-challenge.component.html`
- `projects/ngx-dice-captcha/src/lib/components/captcha-challenge/captcha-challenge.component.scss`

**Purpose**: Displays the current challenge description and manages user interaction.

**Key Features**:

- **Challenge Display**: Shows mathematical challenge text
- **Timer Management**: Displays countdown timer if enabled
- **Attempts Counter**: Shows remaining verification attempts
- **Hint System**: Provides contextual hints for challenges

### 4. VerificationDisplayComponent

**Files**:

- `projects/ngx-dice-captcha/src/lib/components/verification-display/verification-display.component.ts`
- `projects/ngx-dice-captcha/src/lib/components/verification-display/verification-display.component.html`
- `projects/ngx-dice-captcha/src/lib/components/verification-display/verification-display.component.scss`

**Purpose**: Shows verification results and handles retry/close actions.

**Key Features**:

- **Result Display**: Shows success/failure messages
- **Retry Functionality**: Allows users to retry failed attempts
- **Token Display**: Shows verification token for successful attempts
- **Animation States**: Smooth transitions between states

### 5. ControlOverlayComponent

**Files**:

- `projects/ngx-dice-captcha/src/lib/components/control-overlay/control-overlay.component.ts`
- `projects/ngx-dice-captcha/src/lib/components/control-overlay/control-overlay.component.html`
- `projects/ngx-dice-captcha/src/lib/components/control-overlay/control-overlay.component.scss`

**Purpose**: Provides user input controls for dice value entry and verification.

**Key Features**:

- **Input Forms**: Number inputs for dice values and sum
- **Validation UI**: Real-time input validation feedback
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Layout**: Adapts to different screen sizes

## Services

### 1. ChallengeGeneratorService

**File**: `projects/ngx-dice-captcha/src/lib/services/challenge-generator.service.ts`

**Purpose**: Generates mathematical challenges based on dice rolls.

**Key Features**:

- **Multiple Operations**: Sum, Product, Difference, Specific Number
- **Difficulty Levels**: Easy (2 dice), Medium (3 dice), Hard (3-4 dice)
- **Solvability Validation**: Ensures all challenges are mathematically solvable
- **Solution Calculation**: Computes expected answers from dice results

**Methods**:

- `generateChallenge(difficulty)`: Creates a new challenge
- `calculateSolution(diceResults, challenge)`: Computes expected answer
- `validateChallenge(challenge)`: Validates challenge solvability

### 2. CaptchaValidatorService

**File**: `projects/ngx-dice-captcha/src/lib/services/captcha-validator.service.ts`

**Purpose**: Validates user answers against expected results.

**Key Features**:

- **Answer Validation**: Compares user input with expected values
- **Partial Matching**: Provides feedback on partially correct answers
- **Token Generation**: Creates verification tokens for successful attempts
- **Session Tracking**: Tracks verification attempts per session

### 3. ThreeRendererService

**File**: `projects/ngx-dice-captcha/src/lib/services/three-renderer.service.ts`

**Purpose**: Manages Three.js scene, camera, lighting, and rendering.

**Key Features**:

- **Scene Management**: Creates and configures 3D scene
- **Camera Controls**: Sets up perspective camera with proper positioning
- **Lighting Setup**: Configures ambient and directional lighting
- **Render Loop**: Manages animation frame updates

### 4. PhysicsEngineService

**File**: `projects/ngx-dice-captcha/src/lib/services/physics-engine.service.ts`

**Purpose**: Handles Cannon-es physics simulation for realistic dice behavior.

**Key Features**:

- **World Simulation**: Creates and manages physics world
- **Gravity Configuration**: Applies realistic gravity forces
- **Collision Detection**: Handles dice-to-dice and dice-to-ground collisions
- **Force Application**: Applies rolling forces to dice

### 5. DiceFactoryService

**File**: `projects/ngx-dice-captcha/src/lib/services/dice-factory.service.ts`

**Purpose**: Creates and configures dice instances with proper materials and physics bodies.

**Key Features**:

- **Dice Creation**: Instantiates dice with specified types and counts
- **Material Assignment**: Applies visual materials based on configuration
- **Physics Integration**: Creates corresponding physics bodies
- **Geometry Generation**: Creates 3D geometries for different dice types

### 6. AnimationService

**File**: `projects/ngx-dice-captcha/src/lib/services/animation.service.ts`

**Purpose**: Coordinates animations and transitions between states.

**Key Features**:

- **State Transitions**: Manages transitions between rolling, result, and idle states
- **Timing Control**: Coordinates animation timing with physics simulation
- **Event Coordination**: Synchronizes visual feedback with physics events

### 7. ErrorReportingService

**File**: `projects/ngx-dice-captcha/src/lib/services/error-reporting.service.ts`

**Purpose**: Handles error collection, formatting, and reporting.

**Key Features**:

- **Error Collection**: Gathers errors from all components and services
- **Context Preservation**: Maintains error context for debugging
- **User-Friendly Messages**: Converts technical errors to user-readable messages

## Models and Data Structures

### Core Configuration Models

#### 1. CaptchaConfig

**File**: `projects/ngx-dice-captcha/src/lib/models/captcha-config.model.ts`

Main configuration interface controlling all aspects of the CAPTCHA:

```typescript
interface CaptchaConfig {
  diceCount: number; // Number of dice
  diceType: DiceType; // Type of dice (D6, D8, D12, D20)
  difficulty: Difficulty; // Challenge difficulty level
  diceSize?: number; // Size of dice in 3D space
  theme: ThemeConfig; // Visual theme configuration
  physics: PhysicsConfig; // Physics simulation parameters
  timeout?: number; // Timeout in milliseconds
  maxAttempts: number; // Maximum verification attempts
  verificationMode?: VerificationMode; // Individual dice or sum verification
  // ... additional responsive and UI options
}
```

#### 2. Challenge Model

**File**: `projects/ngx-dice-captcha/src/lib/models/challenge.model.ts`

Defines mathematical challenges:

```typescript
interface Challenge {
  id: string; // Unique challenge identifier
  difficulty: Difficulty; // Challenge difficulty
  operation: OperationType; // SUM, PRODUCT, DIFFERENCE, SPECIFIC_NUMBER
  diceCount: number; // Number of dice required
  targetValue: number; // Target value for the operation
  description: string; // Human-readable challenge description
  hint: string; // Helpful hint for users
}
```

#### 3. VerificationResult Model

**File**: `projects/ngx-dice-captcha/src/lib/models/verification-result.model.ts`

Contains verification outcomes:

```typescript
interface VerificationResult {
  success: boolean; // Whether verification succeeded
  message: string; // User-friendly result message
  timestamp: number; // When verification occurred
  token?: string; // Verification token (success only)
  diceValues?: number[]; // Actual dice values
  userDiceInputs?: number[]; // User's entered dice values
  expectedSum?: number; // Expected sum (if applicable)
  userSumInput?: number; // User's entered sum
  attemptsRemaining?: number; // Remaining attempts
  partialMatch?: {
    // Partial match information
    correctDice: number;
    totalDice: number;
    sumCorrect?: boolean;
  };
}
```

### Supporting Models

#### Dice Models

- **Dice Model**: `dice.model.ts` - Dice type definitions and enums
- **Dice Material Model**: `dice-material.model.ts` - 3D material configurations
- **Dice Scale Info Model**: `dice-scale-info.model.ts` - Scaling information

#### Responsive Models

- **Responsive Config Model**: `responsive-config.model.ts` - Responsive behavior settings
- **Scene Scale Model**: `scene-scale.model.ts` - 3D scene scaling data
- **Resize Event Model**: `resize-event.model.ts` - Resize event data structures

#### Verification Models

- **Verification Mode Model**: `verification-mode.model.ts` - Verification mode enums

## Utilities

### 1. DiceGeometryUtil

**File**: `projects/ngx-dice-captcha/src/lib/utils/dice-geometry.util.ts`

**Purpose**: Provides 3D geometry calculations for different dice types.

**Key Functions**:

- `createDiceGeometry(diceType)`: Creates Three.js geometries for dice
- `calculateFaceNormals()`: Computes face normal vectors
- `getDiceDimensions(diceType)`: Gets bounding box dimensions

### 2. PhysicsHelpersUtil

**File**: `projects/ngx-dice-captcha/src/lib/utils/physics-helpers.util.ts`

**Purpose**: Helper functions for physics simulation.

**Key Functions**:

- `applyRollingForce(body, direction)`: Applies rolling forces to physics bodies
- `calculateImpactPoint(contact)`: Determines dice landing positions
- `stabilizeDice(body)`: Prevents dice from rolling indefinitely

### 3. RandomUtil

**File**: `projects/ngx-dice-captcha/src/lib/utils/random.util.ts`

**Purpose**: Provides cryptographically secure random number generation.

**Key Functions**:

- `secureRandom()`: Generates secure random numbers
- `randomBetween(min, max)`: Random numbers within range
- `shuffleArray(array)`: Shuffles arrays randomly

### 4. ColorUtil

**File**: `projects/ngx-dice-captcha/src/lib/utils/color.util.ts`

**Purpose**: Color manipulation and theme utilities.

**Key Functions**:

- `hexToRgb(hex)`: Converts hex colors to RGB
- `adjustBrightness(color, amount)`: Adjusts color brightness
- `generateDiceColors(theme)`: Generates dice colors from theme

### 5. ErrorHandlerUtil

**File**: `projects/ngx-dice-captcha/src/lib/utils/error-handler.util.ts`

**Purpose**: Centralized error handling and formatting.

**Key Functions**:

- `handleError(error, context)`: Processes and formats errors
- `isKnownError(error)`: Identifies known error types
- `createUserMessage(error)`: Creates user-friendly error messages

### 6. ObjectPoolUtil

**File**: `projects/ngx-dice-captcha/src/lib/utils/object-pool.util.ts`

**Purpose**: Object pooling for performance optimization.

**Key Functions**:

- `createPool(factory, reset)`: Creates object pools
- `acquire(pool)`: Gets object from pool
- `release(pool, object)`: Returns object to pool

### 7. TypeAdaptersUtil

**File**: `projects/ngx-dice-captcha/src/lib/utils/type-adapters.util.ts`

**Purpose**: Type conversion and validation utilities.

**Key Functions**:

- `toNumber(value)`: Safely converts values to numbers
- `validateDiceValue(value)`: Validates dice face values
- `normalizeConfig(config)`: Normalizes configuration objects

## Directives and Tokens

### 1. AccessibilityDirective

**File**: `projects/ngx-dice-captcha/src/lib/directives/accessibility.directive.ts`

**Purpose**: Enhances accessibility with ARIA labels and keyboard navigation.

**Features**:

- **ARIA Labels**: Automatic ARIA label generation
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Optimized for assistive technologies
- **Focus Management**: Proper focus handling for interactions

**Usage**:

```typescript
@Component({
  selector: '[diceAccessibility]',
  standalone: true,
  // Automatically applied to dice canvas and interactive elements
})
export class AccessibilityDirective {
  // Provides accessibility enhancements
}
```

### 2. DiceCaptchaI18nToken

**File**: `projects/ngx-dice-captcha/src/lib/tokens/dice-captcha-i18n.token.ts`

**Purpose**: Injection token for internationalization support.

**Features**:

- **Multi-language Support**: Configurable text for different languages
- **Customizable Messages**: All user-facing text can be customized
- **Runtime Language Switching**: Support for dynamic language changes

**Usage**:

```typescript
export interface DiceCaptchaI18n {
  rollDice: string;
  verify: string;
  success: string;
  failure: string;
  // ... additional translatable strings
}
```

## Styling System

### SCSS Architecture

The library uses a modular SCSS architecture:

```
styles/
├── index.scss              # Main entry point - imports all styles
├── _variables.scss         # CSS custom properties and design tokens
├── _theme.scss             # Theme definitions and color schemes
└── _mixins.scss            # Reusable SCSS mixins and utilities
```

### 1. Variables (`_variables.scss`)

Defines design tokens and CSS custom properties:

```scss
:root {
  // Colors
  --dice-primary-color: #667eea;
  --dice-background-color: #f0f0f0;
  --dice-surface-color: #ffffff;
  --dice-text-color: #000000;

  // Spacing
  --dice-spacing-xs: 0.25rem;
  --dice-spacing-sm: 0.5rem;
  --dice-spacing-md: 1rem;
  --dice-spacing-lg: 1.5rem;

  // Typography
  --dice-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --dice-font-size-sm: 0.875rem;
  --dice-font-size-md: 1rem;
  --dice-font-size-lg: 1.125rem;

  // Shadows
  --dice-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --dice-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --dice-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  // Transitions
  --dice-transition-fast: 150ms ease-in-out;
  --dice-transition-normal: 250ms ease-in-out;
  --dice-transition-slow: 350ms ease-in-out;
}
```

### 2. Theme (`_theme.scss`)

Provides theme definitions and dark mode support:

```scss
// Light theme (default)
.dice-captcha-theme-light {
  --dice-primary-color: #667eea;
  --dice-background-color: #f0f0f0;
  --dice-surface-color: #ffffff;
  --dice-text-color: #000000;
}

// Dark theme
.dice-captcha-theme-dark {
  --dice-primary-color: #9f7aea;
  --dice-background-color: #1a1a1a;
  --dice-surface-color: #2d2d2d;
  --dice-text-color: #ffffff;
}

// High contrast theme
.dice-captcha-theme-high-contrast {
  --dice-primary-color: #0000ff;
  --dice-background-color: #ffffff;
  --dice-surface-color: #ffffff;
  --dice-text-color: #000000;
}
```

### 3. Mixins (`_mixins.scss`)

Reusable SCSS mixins for common patterns:

```scss
// Responsive breakpoint mixin
@mixin dice-respond-to($breakpoint) {
  @if $breakpoint == 'sm' {
    @media (min-width: 640px) {
      @content;
    }
  }
  @if $breakpoint == 'md' {
    @media (min-width: 768px) {
      @content;
    }
  }
  @if $breakpoint == 'lg' {
    @media (min-width: 1024px) {
      @content;
    }
  }
}

// Animation keyframes mixin
@mixin dice-keyframes($name) {
  @keyframes #{$name} {
    @content;
  }
}

// Focus styles mixin
@mixin dice-focus-styles {
  outline: 2px solid var(--dice-primary-color);
  outline-offset: 2px;
}
```

## File Dependencies and Relationships

### Component Dependencies

```
NgxDiceCaptchaComponent
├── ChallengeGeneratorService (challenge creation)
├── CaptchaValidatorService (answer validation)
├── DiceCanvasComponent (dice rendering)
│   ├── ThreeRendererService (3D scene)
│   ├── PhysicsEngineService (physics simulation)
│   ├── DiceFactoryService (dice creation)
│   └── ControlOverlayComponent (user input)
│       └── AccessibilityDirective (a11y support)
└── VerificationDisplayComponent (result display)
```

### Service Dependencies

```
ChallengeGeneratorService
└── RandomUtil (random number generation)

CaptchaValidatorService
├── ChallengeGeneratorService (solution calculation)
└── ErrorReportingService (error handling)

ThreeRendererService
├── ColorUtil (color management)
└── DiceGeometryUtil (3D geometry)

PhysicsEngineService
├── PhysicsHelpersUtil (physics calculations)
└── RandomUtil (random forces)

DiceFactoryService
├── ThreeRendererService (3D materials)
├── PhysicsEngineService (physics bodies)
└── DiceGeometryUtil (dice shapes)

AnimationService
├── ThreeRendererService (render timing)
└── PhysicsEngineService (physics timing)

ErrorReportingService
└── ErrorHandlerUtil (error processing)
```

### Model Relationships

```
CaptchaConfig
├── ThemeConfig (visual styling)
├── PhysicsConfig (physics behavior)
├── ResponsiveConfig (responsive settings)
├── DiceType (dice type enum)
├── Difficulty (difficulty enum)
└── VerificationMode (verification mode enum)

Challenge
├── OperationType (operation enum)
└── Difficulty (difficulty reference)

VerificationResult
├── Challenge (source challenge)
└── PartialMatch (partial match info)
```

## Usage Examples

### Basic Implementation

```typescript
import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha';

@Component({
  selector: 'app-captcha-form',
  standalone: true,
  imports: [NgxDiceCaptchaComponent],
  template: `
    <ngx-dice-captcha
      [config]="captchaConfig"
      [autoStart]="true"
      (verified)="onVerified($event)"
      (failed)="onFailed($event)"
    >
    </ngx-dice-captcha>
  `,
})
export class CaptchaFormComponent {
  captchaConfig = {
    diceCount: 3,
    difficulty: Difficulty.MEDIUM,
    theme: {
      primaryColor: '#667eea',
      backgroundColor: '#f0f0f0',
      diceColor: '#ffffff',
      dotColor: '#000000',
      enableShadows: true,
      enableAmbientLight: true,
    },
  };

  onVerified(result: VerificationResult) {
    console.log('CAPTCHA verified:', result.token);
    // Send token to backend for validation
  }

  onFailed(result: VerificationResult) {
    console.log('CAPTCHA failed:', result.message);
    // Show error message to user
  }
}
```

### Advanced Configuration

```typescript
@Component({
  selector: 'app-advanced-captcha',
  template: `
    <ngx-dice-captcha
      [config]="advancedConfig"
      [sessionId]="customSessionId"
      (challengeGenerated)="onChallengeGenerated($event)"
      (diceRolled)="onDiceRolled($event)"
    >
    </ngx-dice-captcha>
  `,
})
export class AdvancedCaptchaComponent {
  customSessionId = 'custom-session-123';

  advancedConfig: CaptchaConfig = {
    diceCount: 4,
    diceType: DiceType.D20,
    difficulty: Difficulty.HARD,
    diceSize: 2.0,
    theme: {
      primaryColor: '#ff6b6b',
      backgroundColor: '#2c3e50',
      diceColor: '#ecf0f1',
      dotColor: '#2c3e50',
      enableShadows: true,
      enableAmbientLight: true,
    },
    physics: {
      gravity: -20,
      restitution: 0.4,
      friction: 0.3,
      linearDamping: 0.05,
      angularDamping: 0.05,
      collisionIterations: 15,
    },
    timeout: 180000, // 3 minutes
    maxAttempts: 5,
    verificationMode: VerificationMode.INDIVIDUAL_DICE,
    responsive: {
      maintainAspectRatio: true,
      customAspectRatio: 1.7778,
      enableDynamicResize: true,
      resizeThreshold: 50,
    },
  };

  onChallengeGenerated(challenge: Challenge) {
    console.log('New challenge:', challenge.description);
  }

  onDiceRolled(values: number[]) {
    console.log('Dice rolled:', values);
  }
}
```

### Custom Styling

```scss
// Custom theme variables
.captcha-container {
  :root {
    --dice-primary-color: #your-brand-color;
    --dice-background-color: #your-bg-color;
    --dice-font-family: 'Your-Font', sans-serif;
  }

  // Custom component styles
  ngx-dice-captcha {
    .dice-canvas {
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .control-overlay {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 8px;
    }
  }
}
```

## Performance Considerations

### Optimization Techniques

1. **Zoneless Architecture**: Runs animations outside Angular's change detection
2. **Object Pooling**: Reuses objects to reduce garbage collection
3. **Efficient Rendering**: Uses appropriate Three.js materials and geometries
4. **Physics Optimization**: Configurable collision detection iterations
5. **Responsive Updates**: Throttled resize event handling

### Performance Settings

```typescript
// High-performance configuration
const performanceConfig: CaptchaConfig = {
  physics: {
    collisionIterations: 5, // Reduce for better performance
    linearDamping: 0.2, // Faster settling
    angularDamping: 0.2,
  },
  responsive: {
    resizeThreshold: 100, // Reduce resize frequency
    enableDynamicResize: false, // Disable for fixed-size containers
  },
};
```

## Accessibility Features

### WCAG 2.1 Compliance

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: High contrast ratios for all text and UI elements
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Clear focus indicators and logical tab order

### Accessibility Configuration

```typescript
// Accessibility-optimized configuration
const accessibleConfig: CaptchaConfig = {
  enableHaptics: false, // Disable for motion-sensitive users
  theme: {
    primaryColor: '#0066cc', // High contrast blue
    backgroundColor: '#ffffff',
    diceColor: '#ffffff',
    dotColor: '#000000',
  },
  compactMode: true, // Smaller UI for screen readers
};
```

## Browser Support

### Supported Browsers

- **Chrome**: 88+ (WebGL support required)
- **Firefox**: 85+ (WebGL support required)
- **Safari**: 14+ (WebGL support required)
- **Edge**: 88+ (WebGL support required)

### Required Features

- **WebGL**: Hardware-accelerated 3D graphics
- **ES2020**: Modern JavaScript features
- **CSS Custom Properties**: For theming support
- **Intersection Observer**: For responsive behavior

## Troubleshooting

### Common Issues

1. **WebGL Not Supported**

   ```typescript
   // Check for WebGL support
   if (!this.isWebGLSupported()) {
     this.fallbackToCanvas2D();
   }
   ```

2. **Performance Issues**

   ```typescript
   // Reduce physics iterations for slower devices
   config.physics.collisionIterations = 5;
   config.physics.linearDamping = 0.3;
   ```

3. **Mobile Responsiveness**
   ```typescript
   // Enable responsive features
   config.responsive = {
     maintainAspectRatio: true,
     enableDynamicResize: true,
     resizeThreshold: 50,
   };
   ```

### Debug Mode

```typescript
// Enable debug logging
const debugConfig: CaptchaConfig = {
  // Add debug-specific settings
  enableDebugLogging: true,
  logLevel: 'verbose',
};
```

## Migration Guide

### From v1.x to v2.x

1. **Configuration Changes**

   ```typescript
   // v1.x
   const oldConfig = {
     diceCount: 3,
     difficulty: 'medium',
   };

   // v2.x
   const newConfig: CaptchaConfig = {
     diceCount: 3,
     difficulty: Difficulty.MEDIUM, // Enum instead of string
     theme: {
       /* required theme config */
     },
     physics: {
       /* required physics config */
     },
   };
   ```

2. **Import Changes**

   ```typescript
   // v1.x
   import { DiceCaptchaComponent } from 'ngx-dice-captcha';

   // v2.x
   import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha';
   import { Difficulty, DiceType } from 'ngx-dice-captcha';
   ```

## Contributing

### Development Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   ng serve demo
   ```

3. **Run Tests**

   ```bash
   npm test
   ```

4. **Build Library**
   ```bash
   npm run build:lib
   ```

### Code Style

- **TypeScript**: Strict mode enabled
- **SCSS**: BEM methodology for class naming
- **Angular**: Standalone components preferred
- **Testing**: Jest with Testing Library

## License

MIT License - See LICENSE file for details.

## Support

For issues, questions, or contributions, please visit:

- **GitHub Issues**: [https://github.com/Easy-Cloud-in/ngx-dice-captcha/issues](https://github.com/Easy-Cloud-in/ngx-dice-captcha/issues)
- **Documentation**: [https://github.com/Easy-Cloud-in/ngx-dice-captcha#readme](https://github.com/Easy-Cloud-in/ngx-dice-captcha#readme)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-07
**Author**: SAKAR.SR <contact@easy-cloud.in>
