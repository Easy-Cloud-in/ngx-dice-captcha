import { DiceType } from './dice.model';
import { Difficulty } from './challenge.model';
import { VerificationMode } from './verification-mode.model';
import { ResponsiveConfig } from './responsive-config.model';

/**
 * Main configuration interface for the dice CAPTCHA component.
 *
 * Comprehensive configuration object controlling all aspects of the CAPTCHA
 * including dice behavior, physics simulation, visual theme, difficulty,
 * and security parameters.
 *
 * @example
 * ```typescript
 * const config: CaptchaConfig = {
 *   diceCount: 3,
 *   diceType: DiceType.D6,
 *   difficulty: Difficulty.MEDIUM,
 *   theme: {
 *     primaryColor: '#667eea',
 *     backgroundColor: '#f0f0f0',
 *     diceColor: '#ffffff',
 *     dotColor: '#000000',
 *     enableShadows: true,
 *     enableAmbientLight: true
 *   },
 *   physics: {
 *     gravity: -15,
 *     restitution: 0.3,
 *     friction: 0.4,
 *     linearDamping: 0.1,
 *     angularDamping: 0.1,
 *     collisionIterations: 10
 *   },
 *   timeout: 120000,
 *   maxAttempts: 3
 * };
 * ```
 *
 * @public
 * @since 1.0.0
 */
export interface CaptchaConfig {
  /** Number of dice to display and roll */
  diceCount: number;

  /** Type of dice to use */
  diceType: DiceType;

  /** Difficulty level of the challenge */
  difficulty: Difficulty;

  /**
   * Size of each dice in the 3D scene coordinate system.
   * Larger values create bigger dice visually.
   *
   * **Recommended ranges:**
   * - For 3 dice: 1.0 - 2.5 (default: 1.5)
   * - For 1 dice: up to 4.0
   * - For 5+ dice: 1.0 - 1.5
   *
   * **Technical limits:** 0.5 (minimum visible) to 5.0 (maximum before overlap)
   *
   * **Note:** Dice size does NOT affect:
   * - Face value detection (rotation-based)
   * - Physics behavior (scales proportionally)
   * - Animation quality
   *
   * @default 1.5
   */
  diceSize?: number;

  /** Theme and visual configuration */
  theme: ThemeConfig;

  /** Physics simulation parameters */
  physics: PhysicsConfig;

  /** Timeout duration in milliseconds (0 to disable) */
  timeout?: number;

  /** Maximum number of verification attempts allowed */
  maxAttempts: number;

  /** Verification mode (default: INDIVIDUAL_DICE) */
  verificationMode?: VerificationMode;

  /** Position of control overlay (default: 'top-center') */
  overlayPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center';

  /** Show countdown timer (default: false) */
  showTimer?: boolean;

  /** Show remaining attempts counter (default: true) */
  showAttempts?: boolean;

  /** Enable compact mode for smaller displays (default: false) */
  compactMode?: boolean;

  /** Timeout behavior when timer expires (default: 'deduct-attempt') */
  timeoutBehavior?: 'deduct-attempt' | 'lock' | 'soft-reset';

  /** Enable haptic feedback for mobile devices (default: false) */
  enableHaptics?: boolean;

  /** Custom haptic feedback patterns */
  hapticPatterns?: HapticPatterns;

  /**
   * Responsive behavior configuration
   * Controls how the CAPTCHA adapts to different screen sizes
   * @since 2.2.0
   */
  responsive?: Partial<ResponsiveConfig>;

  /**
   * Fixed results display position
   * @default 'bottom-right'
   * @since 2.2.0
   */
  resultsDisplayPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  /**
   * Maintain aspect ratio when resizing the CAPTCHA container.
   * When true, the canvas will preserve the 16:9 aspect ratio.
   * When false, the canvas will adapt to the container's dimensions.
   *
   * @default true
   * @since 2.2.0
   *
   * @example
   * ```typescript
   * // Maintain 16:9 aspect ratio (default behavior)
   * { maintainAspectRatio: true }
   *
   * // Allow container to dictate dimensions
   * { maintainAspectRatio: false, fillContainer: true }
   * ```
   */
  maintainAspectRatio?: boolean;

  /**
   * Custom aspect ratio for the canvas (width:height).
   * Only applies when `maintainAspectRatio` is true.
   *
   * Common values:
   * - 1.7778 (16:9 - default widescreen)
   * - 1.3333 (4:3 - classic)
   * - 2.0 (2:1 - ultra-wide)
   * - 1.0 (1:1 - square)
   *
   * @default 1.7778
   * @since 2.2.0
   *
   * @example
   * ```typescript
   * // Square container
   * { maintainAspectRatio: true, customAspectRatio: 1.0 }
   *
   * // Ultra-wide
   * { maintainAspectRatio: true, customAspectRatio: 2.0 }
   * ```
   */
  customAspectRatio?: number;

  /**
   * Fill the parent container completely, ignoring aspect ratio.
   * When true, the canvas will stretch to fill 100% of the container's width and height.
   * Overrides `maintainAspectRatio` setting.
   *
   * @default false
   * @since 2.2.0
   *
   * @example
   * ```typescript
   * // Fill fixed-size container
   * { fillContainer: true }
   *
   * // Useful for @container queries
   * { fillContainer: true, enableDynamicResize: true }
   * ```
   */
  fillContainer?: boolean;

  /**
   * Enable dynamic resizing of the 3D scene when the container size changes.
   * When true, the scene will update physics boundaries and camera when resized.
   * When false, only the canvas dimensions will change (may cause distortion).
   *
   * @default true
   * @since 2.2.0
   *
   * @example
   * ```typescript
   * // Enable responsive behavior (recommended)
   * { enableDynamicResize: true }
   *
   * // Disable for performance (not recommended)
   * { enableDynamicResize: false }
   * ```
   */
  enableDynamicResize?: boolean;

  /**
   * Minimum size change in pixels to trigger a full scene update.
   * Prevents excessive updates during minor resize events.
   * Smaller values = more responsive but higher CPU usage.
   *
   * @default 50
   * @since 2.2.0
   *
   * @example
   * ```typescript
   * // Very responsive (may impact performance)
   * { resizeThreshold: 20 }
   *
   * // Balanced (default)
   * { resizeThreshold: 50 }
   *
   * // Less responsive (better performance)
   * { resizeThreshold: 100 }
   * ```
   */
  resizeThreshold?: number;
}

/**
 * Haptic feedback patterns for different interactions.
 *
 * @public
 * @since 2.0.0
 */
export interface HapticPatterns {
  /** Haptic pattern for dice input (array of vibration durations in ms) */
  input?: number[];

  /** Haptic pattern for successful verification */
  success?: number[];

  /** Haptic pattern for error/failure */
  error?: number[];
}

/**
 * Theme and visual configuration for the CAPTCHA.
 *
 * Controls colors, lighting, and visual effects in the 3D scene.
 *
 * @public
 * @since 1.0.0
 */
export interface ThemeConfig {
  /** Primary color for dice and UI elements */
  primaryColor: string;

  /** Background color for the 3D scene */
  backgroundColor: string;

  /** Color of dice faces */
  diceColor: string;

  /** Color of dice dots/numbers */
  dotColor: string;

  /** Enable or disable shadows */
  enableShadows: boolean;

  /** Enable or disable ambient lighting */
  enableAmbientLight: boolean;
}

/**
 * Physics simulation configuration.
 *
 * Controls the Cannon-es physics parameters for realistic dice behavior.
 * Adjust these values to change how dice roll, bounce, and settle.
 *
 * @public
 * @since 1.0.0
 */
export interface PhysicsConfig {
  /** Gravity force (default: -9.82 for Earth-like gravity) */
  gravity: number;

  /** Restitution/bounciness of dice (0-1) */
  restitution: number;

  /** Friction coefficient (0-1) */
  friction: number;

  /** Linear damping to slow down movement */
  linearDamping: number;

  /** Angular damping to slow down rotation */
  angularDamping: number;

  /** Collision detection iterations */
  collisionIterations: number;
}
