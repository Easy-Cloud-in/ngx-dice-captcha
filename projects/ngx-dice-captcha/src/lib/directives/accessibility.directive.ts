import {
  Directive,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  output,
  inject,
  effect,
  signal,
  input,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Directive to enhance accessibility features
 * - Manages focus
 * - Detects reduced motion preference
 * - Detects high contrast mode
 * - Handles keyboard shortcuts
 */
@Directive({
  selector: '[ngxDiceAccessibility]',
  standalone: true,
})
export class AccessibilityDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly document = inject(DOCUMENT);
  private mediaQueryReducedMotion?: MediaQueryList;
  private mediaQueryHighContrast?: MediaQueryList;

  // Inputs
  enableKeyboardShortcuts = input<boolean>(true);
  autoFocus = input<boolean>(false);

  // Outputs
  keyboardAction = output<string>();
  reducedMotionChange = output<boolean>();
  highContrastChange = output<boolean>();

  // Signals
  prefersReducedMotion = signal<boolean>(false);
  prefersHighContrast = signal<boolean>(false);

  constructor() {
    // Effect to handle auto-focus
    effect(() => {
      if (this.autoFocus()) {
        this.setFocus();
      }
    });
  }

  ngOnInit(): void {
    this.initializeMediaQueries();
    this.checkAccessibilityPreferences();
  }

  ngOnDestroy(): void {
    this.cleanupMediaQueries();
  }

  /**
   * Initialize media query listeners for accessibility preferences
   */
  private initializeMediaQueries(): void {
    // Check for reduced motion preference
    if (this.document.defaultView?.matchMedia) {
      this.mediaQueryReducedMotion = this.document.defaultView.matchMedia(
        '(prefers-reduced-motion: reduce)'
      );

      this.mediaQueryReducedMotion.addEventListener(
        'change',
        this.handleReducedMotionChange.bind(this)
      );

      // Check for high contrast preference (Windows)
      this.mediaQueryHighContrast = this.document.defaultView.matchMedia(
        '(prefers-contrast: high), (-ms-high-contrast: active)'
      );

      this.mediaQueryHighContrast.addEventListener(
        'change',
        this.handleHighContrastChange.bind(this)
      );
    }
  }

  /**
   * Clean up media query listeners
   */
  private cleanupMediaQueries(): void {
    if (this.mediaQueryReducedMotion) {
      this.mediaQueryReducedMotion.removeEventListener(
        'change',
        this.handleReducedMotionChange.bind(this)
      );
    }

    if (this.mediaQueryHighContrast) {
      this.mediaQueryHighContrast.removeEventListener(
        'change',
        this.handleHighContrastChange.bind(this)
      );
    }
  }

  /**
   * Check current accessibility preferences
   */
  private checkAccessibilityPreferences(): void {
    if (this.mediaQueryReducedMotion) {
      this.prefersReducedMotion.set(this.mediaQueryReducedMotion.matches);
      this.reducedMotionChange.emit(this.mediaQueryReducedMotion.matches);
    }

    if (this.mediaQueryHighContrast) {
      this.prefersHighContrast.set(this.mediaQueryHighContrast.matches);
      this.highContrastChange.emit(this.mediaQueryHighContrast.matches);
    }
  }

  /**
   * Handle reduced motion preference change
   */
  private handleReducedMotionChange(event: MediaQueryListEvent): void {
    this.prefersReducedMotion.set(event.matches);
    this.reducedMotionChange.emit(event.matches);
  }

  /**
   * Handle high contrast preference change
   */
  private handleHighContrastChange(event: MediaQueryListEvent): void {
    this.prefersHighContrast.set(event.matches);
    this.highContrastChange.emit(event.matches);
  }

  /**
   * Set focus to the host element
   */
  setFocus(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }

  /**
   * Handle keyboard events for shortcuts
   */
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.enableKeyboardShortcuts()) {
      return;
    }

    const key = event.key.toLowerCase();
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

    // Space or Enter to activate
    if (key === ' ' || key === 'enter') {
      if (this.isActionableElement(event.target as HTMLElement)) {
        event.preventDefault();
        this.keyboardAction.emit('activate');
      }
    }

    // Escape to cancel
    if (key === 'escape') {
      event.preventDefault();
      this.keyboardAction.emit('cancel');
    }

    // R to retry/reset (with modifier key)
    if (key === 'r' && hasModifier) {
      event.preventDefault();
      this.keyboardAction.emit('reset');
    }

    // H to show help (with modifier key)
    if (key === 'h' && hasModifier) {
      event.preventDefault();
      this.keyboardAction.emit('help');
    }
  }

  /**
   * Check if element is actionable (button, link, input)
   */
  private isActionableElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'button' ||
      tagName === 'a' ||
      tagName === 'input' ||
      (element.hasAttribute('role') &&
        ['button', 'link'].includes(element.getAttribute('role') || ''))
    );
  }

  /**
   * Announce message to screen readers
   */
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = this.document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    // Add visually hidden styles
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    this.document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      this.document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Get current accessibility state
   */
  getAccessibilityState(): {
    reducedMotion: boolean;
    highContrast: boolean;
  } {
    return {
      reducedMotion: this.prefersReducedMotion(),
      highContrast: this.prefersHighContrast(),
    };
  }
}
