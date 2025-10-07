import { Component, input, output, signal, computed, effect, ElementRef, inject, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Control overlay component that displays dice roll and verification controls.
 *
 * Provides a glassmorphism-styled overlay with:
 * - Roll dice button
 * - Individual dice input fields (after roll)
 * - Verify button (enabled when all inputs are valid)
 * - Responsive positioning (top-left, top-right, bottom-left, bottom-right)
 * - Horizontal/vertical layout switching for mobile
 *
 * @example
 * ```html
 * <ngx-control-overlay
 *   [diceCount]="3"
 *   [isRolling]="false"
 *   [diceRolled]="true"
 *   [position]="'top-left'"
 *   [isHorizontal]="false"
 *   (rollClicked)="onRoll()"
 *   (verifyClicked)="onVerify($event)"
 * />
 * ```
 *
 * @public
 * @since 2.0.0
 */
@Component({
  selector: 'ngx-control-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './control-overlay.component.html',
  styleUrls: ['./control-overlay.component.scss'],
})
export class ControlOverlayComponent {
  /**
   * Number of dice in the challenge
   */
  diceCount = input.required<number>();

  /**
   * Whether dice are currently rolling
   */
  isRolling = input<boolean>(false);

  /**
   * Whether dice have been rolled (shows input fields)
   */
  diceRolled = input<boolean>(false);

  /**
   * Position of the overlay on the canvas
   */
  position = input<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center'>(
    'top-center'
  );

  /**
   * Whether to use horizontal layout (for mobile)
   */
  isHorizontal = input<boolean>(false);

  /**
   * Whether the captcha is in cooldown mode
   */
  isInCooldown = input<boolean>(false);

  /**
   * Time remaining in cooldown (seconds)
   */
  cooldownTimeRemaining = input<number>(0);

  /**
   * Emitted when the roll button is clicked
   */
  rollClicked = output<void>();

  /**
   * Emitted when the verify button is clicked with dice values and sum
   */
  verifyClicked = output<{ diceValues: number[]; sum: number }>();

  /**
   * Emitted when the re-roll button is clicked (after dice have been rolled)
   */
  reRollClicked = output<void>();

  /**
   * Enable smart positioning to avoid overlaps
   * @since v2.2
   */
  enableSmartPositioning = input<boolean>(false);

  /**
   * Results display position (for overlap detection)
   * @since v2.2
   */
  resultsDisplayPosition = input<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');

  /**
   * Canvas dimensions for positioning calculations
   * @since v2.2
   */
  canvasWidth = input<number>(800);

  /**
   * Canvas height for positioning calculations
   * @since v2.2
   */
  canvasHeight = input<number>(600);

  /**
   * Array of dice input values (1-6)
   * Automatically updates when diceCount changes
   */
  diceInputs = linkedSignal(() => Array(this.diceCount()).fill(null));

  /**
   * User's calculated sum input
   */
  sumInput = signal<number | null>(null);

  /**
   * Whether the roll button can be clicked
   */
  canRoll = computed(() => !this.isRolling() && !this.isInCooldown());

  /**
   * Whether the verify button can be clicked
   */
  canVerify = computed(() => {
    const inputs = this.diceInputs();
    if (inputs.length !== this.diceCount()) return false;
    const allDiceValid = inputs.every((val) => val !== null && val >= 1 && val <= 6);
    const sumValid = this.sumInput() !== null && this.sumInput()! > 0;
    return allDiceValid && sumValid;
  });

  /**
   * Array indices for template iteration
   */
  diceIndices = computed(() => {
    const count = this.diceCount();
    return Array.from({ length: count }, (_, i) => i);
  });

  /**
   * Computed optimal position based on smart positioning logic
   * @since v2.2
   */
  optimalPosition = computed(() => {
    if (!this.enableSmartPositioning()) {
      return this.position();
    }

    return this.calculateOptimalPosition();
  });

  /**
   * Whether the overlay is currently animating position change
   * @since v2.2
   */
  private isAnimatingPosition = signal<boolean>(false);

  private elementRef = inject(ElementRef);

  constructor() {
    // React to position changes for smart positioning
    effect(() => {
      if (this.enableSmartPositioning()) {
        this.optimalPosition(); // Trigger recalculation
      }
    });
  }

  /**
   * Handle roll button click
   */
  onRoll(): void {
    if (this.canRoll()) {
      // If dice have been rolled, this is a re-roll
      if (this.diceRolled()) {
        this.reset(); // Clear inputs before re-rolling
        this.reRollClicked.emit();
      } else {
        this.rollClicked.emit();
      }
    }
  }

  /**
   * Handle verify button click
   */
  onVerify(): void {
    if (this.canVerify()) {
      const values = this.diceInputs().filter((v): v is number => v !== null);
      const sum = this.sumInput()!;
      this.verifyClicked.emit({ diceValues: values, sum });
    }
  }

  /**
   * Update the sum input value
   */
  updateSumInput(value: string): void {
    const numValue = value === '' ? null : parseInt(value, 10);

    // Validate reasonable range
    if (numValue !== null && (numValue < 1 || numValue > 120)) {
      return;
    }

    this.sumInput.set(numValue);
  }

  /**
   * Update a specific dice input value
   */
  updateDiceInput(index: number, value: string): void {
    const numValue = value === '' ? null : parseInt(value, 10);

    // Validate range (1-6)
    if (numValue !== null && (numValue < 1 || numValue > 6)) {
      return;
    }

    const currentInputs = [...this.diceInputs()];
    currentInputs[index] = numValue;
    this.diceInputs.set(currentInputs);
  }

  /**
   * Reset the control overlay to initial state
   */
  reset(): void {
    this.diceInputs.set(Array(this.diceCount()).fill(null));
    this.sumInput.set(null);
  }

  /**
   * Get CSS classes for positioning
   */
  getPositionClass(): string {
    const position = this.enableSmartPositioning() ? this.optimalPosition() : this.position();
    const animatingClass = this.isAnimatingPosition() ? ' animating-position' : '';
    return `overlay-${position}${animatingClass}`;
  }

  /**
   * Get CSS classes for layout
   */
  getLayoutClass(): string {
    return this.isHorizontal() ? 'layout-horizontal' : 'layout-vertical';
  }

  /**
   * Format cooldown time remaining as MM:SS
   */
  formatCooldownTime(): string {
    const seconds = this.cooldownTimeRemaining();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate optimal overlay position based on available space and overlaps
   * Requirements: 5.3, 5.4, 5.5, 5.6, 5.7
   * @since v2.2
   */
  private calculateOptimalPosition(): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' {
    const width = this.canvasWidth();
    const height = this.canvasHeight();
    const resultsPos = this.resultsDisplayPosition();
    const currentPos = this.position();

    // Detect orientation
    const isPortrait = height > width;
    const isLandscape = width > height;

    // Check if current position would overlap with results display
    const wouldOverlap = this.detectOverlap(currentPos, resultsPos);

    // If no overlap and smart positioning is just for orientation, use orientation-based logic
    if (!wouldOverlap) {
      // Requirement 5.5: Portrait orientation prefers top-center
      if (isPortrait) {
        return 'top-center';
      }

      // Requirement 5.6: Landscape orientation prefers top-left or top-right
      if (isLandscape) {
        // Choose based on results position to avoid future overlap
        if (resultsPos === 'bottom-right' || resultsPos === 'top-right') {
          return 'top-left';
        } else {
          return 'top-right';
        }
      }
    }

    // Requirement 5.4: If overlay would overlap with results, reposition
    if (wouldOverlap) {
      return this.findAlternativePosition(resultsPos, isPortrait);
    }

    return currentPos;
  }

  /**
   * Detect if overlay position would overlap with results display
   * Requirement: 5.3
   * @since v2.2
   */
  private detectOverlap(
    overlayPos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center',
    resultsPos: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  ): boolean {
    // Simple overlap detection based on position names
    // Overlaps occur when both are in the same corner
    if (overlayPos === resultsPos) {
      return true;
    }

    // Top-center can overlap with top-left or top-right if canvas is narrow
    if (overlayPos === 'top-center' && this.canvasWidth() < 600) {
      if (resultsPos === 'top-left' || resultsPos === 'top-right') {
        return true;
      }
    }

    return false;
  }

  /**
   * Find alternative position that doesn't overlap with results display
   * Requirement: 5.4
   * @since v2.2
   */
  private findAlternativePosition(
    resultsPos: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
    isPortrait: boolean
  ): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' {
    // Priority order for alternative positions based on results position
    const alternatives: Record<string, ('top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center')[]> = {
      'bottom-right': isPortrait ? ['top-center', 'top-left', 'bottom-left'] : ['top-left', 'top-right', 'bottom-left'],
      'bottom-left': isPortrait ? ['top-center', 'top-right', 'bottom-right'] : ['top-right', 'top-left', 'bottom-right'],
      'top-right': isPortrait ? ['top-center', 'top-left', 'bottom-left', 'bottom-right'] : ['top-left', 'bottom-left', 'bottom-right'],
      'top-left': isPortrait ? ['top-center', 'top-right', 'bottom-right', 'bottom-left'] : ['top-right', 'bottom-right', 'bottom-left'],
    };

    const alternativeList = alternatives[resultsPos] || ['top-left'];
    
    // Return first alternative that doesn't overlap
    for (const alt of alternativeList) {
      if (!this.detectOverlap(alt, resultsPos)) {
        return alt;
      }
    }

    // Fallback to first alternative
    return alternativeList[0];
  }

  /**
   * Detect available space around the overlay
   * Requirement: 5.3
   * @since v2.2
   */
  private detectAvailableSpace(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    const element = this.elementRef.nativeElement as HTMLElement;
    const overlay = element.querySelector('.control-overlay') as HTMLElement;
    
    if (!overlay) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const rect = overlay.getBoundingClientRect();
    const canvasWidth = this.canvasWidth();
    const canvasHeight = this.canvasHeight();

    return {
      top: rect.top,
      right: canvasWidth - rect.right,
      bottom: canvasHeight - rect.bottom,
      left: rect.left,
    };
  }

  /**
   * Animate position change smoothly
   * Requirement: 5.7
   * @since v2.2
   */
  animatePositionChange(newPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center'): void {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // No animation, instant change
      return;
    }

    this.isAnimatingPosition.set(true);

    // Animation completes after CSS transition (300ms)
    setTimeout(() => {
      this.isAnimatingPosition.set(false);
    }, 300);
  }
}
