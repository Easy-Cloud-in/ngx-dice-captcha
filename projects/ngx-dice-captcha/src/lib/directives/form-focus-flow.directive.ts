import {
    Directive,
    input,
    effect,
    ElementRef,
    inject,
    afterNextRender,
} from '@angular/core';

/**
 * Directive that manages focus flow in forms with automatic navigation.
 * 
 * Features:
 * - Auto-focus first input when form becomes active
 * - Arrow key navigation between inputs
 * - Enter key moves to next input or submits
 * - Backspace on empty input moves to previous
 * - Configurable submit button selector
 * 
 * @example
 * ```html
 * <form ngxFormFocusFlow [autoFocus]="true" submitButtonSelector=".btn-verify">
 *   <input type="text" data-focus-index="0" />
 *   <input type="text" data-focus-index="1" />
 *   <button class="btn-verify">Submit</button>
 * </form>
 * ```
 * 
 * @public
 * @since 2.1.0
 */
@Directive({
    selector: '[ngxFormFocusFlow]',
    standalone: true,
})
export class FormFocusFlowDirective {
    /**
     * Whether to auto-focus the first input when activated
     */
    autoFocus = input<boolean>(false);

    /**
     * CSS selector for the submit button
     */
    submitButtonSelector = input<string>('.btn-verify, [type="submit"]');

    /**
     * Delay before auto-focusing (ms)
     */
    focusDelay = input<number>(150);

    /**
     * Enable focus trap - arrow keys wrap around, Escape to exit
     */
    enableFocusTrap = input<boolean>(true);

    private elementRef = inject(ElementRef);

    constructor() {
        // Setup keyboard event listeners
        afterNextRender(() => {
            this.setupEventListeners();
        });

        // Handle auto-focus with proper timing for DOM updates
        effect(() => {
            if (this.autoFocus()) {
                // Use longer delay to ensure @if blocks have rendered
                setTimeout(() => {
                    this.focusFirstInput();
                }, this.focusDelay());
            }
        });
    }

    /**
     * Setup keyboard event listeners on the form
     */
    private setupEventListeners(): void {
        const form = this.elementRef.nativeElement as HTMLElement;

        form.addEventListener('keydown', (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;

            // Handle Escape key to exit focus trap
            if (event.key === 'Escape') {
                event.preventDefault();
                this.exitFocusTrap();
                return;
            }

            // Get all focusable elements (inputs + buttons)
            const focusableElements = this.getAllFocusableElements();
            const currentIndex = focusableElements.indexOf(target);

            if (currentIndex === -1) return;

            // Handle arrow keys for all focusable elements
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                this.focusElementWithWrap(focusableElements, currentIndex + 1);
                return;
            }

            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                this.focusElementWithWrap(focusableElements, currentIndex - 1);
                return;
            }

            // If target is a button and Enter is pressed, trigger click explicitly
            if (target.tagName === 'BUTTON' && event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                (target as HTMLButtonElement).click();
                return;
            }

            // Input-specific handling
            if (!this.isFormInput(target)) return;

            const inputs = this.getFormInputs();
            const inputIndex = inputs.indexOf(target as HTMLInputElement);

            if (inputIndex === -1) return;

            switch (event.key) {
                case 'Enter':
                    event.preventDefault();
                    event.stopPropagation(); // Prevent event from bubbling to parent elements
                    this.handleEnterKey(inputs, inputIndex);
                    break;

                case 'Backspace':
                    if ((target as HTMLInputElement).value === '') {
                        event.preventDefault();
                        this.focusInput(inputs, inputIndex - 1);
                    }
                    break;
            }
        });

        // Auto-advance on single-character inputs
        form.addEventListener('input', (event: Event) => {
            const target = event.target as HTMLInputElement;

            if (!this.isFormInput(target)) return;

            const maxLength = parseInt(target.getAttribute('maxlength') || '0', 10);

            if (maxLength === 1 && target.value.length === 1) {
                const inputs = this.getFormInputs();
                const currentIndex = inputs.indexOf(target);
                this.focusInput(inputs, currentIndex + 1);
            }
        });
    }

    /**
     * Handle Enter key press
     */
    private handleEnterKey(inputs: HTMLInputElement[], currentIndex: number): void {
        // If not on last input, move to next
        if (currentIndex < inputs.length - 1) {
            this.focusInput(inputs, currentIndex + 1);
            return;
        }

        // On last input, focus the submit button
        // User can then press Enter again to submit
        this.focusSubmitButton();
    }

    /**
     * Focus input at specific index
     */
    private focusInput(inputs: HTMLInputElement[], index: number): void {
        if (index < 0 || index >= inputs.length) return;

        setTimeout(() => {
            inputs[index]?.focus();
            inputs[index]?.select();
        }, 0);
    }

    /**
     * Focus the first input in the form
     */
    private focusFirstInput(): void {
        // Query inputs directly without delay since we're already in a setTimeout
        const inputs = this.getFormInputs();

        if (inputs.length === 0) return;

        inputs[0]?.focus();
        inputs[0]?.select();
    }

    /**
     * Focus the submit button (without clicking)
     */
    private focusSubmitButton(): void {
        const form = this.elementRef.nativeElement as HTMLElement;
        const button = form.querySelector(this.submitButtonSelector()) as HTMLButtonElement;

        if (!button) return;

        // Use longer delay to ensure Enter key event completes before button receives focus
        // This prevents the keyup event from triggering an accidental click
        setTimeout(() => {
            button?.focus();
        }, 100);
    }

    /**
     * Click the submit button programmatically
     */
    private clickSubmitButton(): void {
        const form = this.elementRef.nativeElement as HTMLElement;
        const button = form.querySelector(this.submitButtonSelector()) as HTMLButtonElement;

        if (!button || button.disabled) return;

        // Small delay to ensure Enter key event completes
        setTimeout(() => {
            button?.click();
        }, 50);
    }

    /**
     * Get all form inputs in order
     */
    private getFormInputs(): HTMLInputElement[] {
        const form = this.elementRef.nativeElement as HTMLElement;
        const inputs = Array.from(
            form.querySelectorAll('input[type="text"], input[type="number"], input:not([type])')
        ) as HTMLInputElement[];

        return inputs.filter(input =>
            !input.disabled &&
            !input.readOnly &&
            input.offsetParent !== null // visible
        );
    }

    /**
     * Get all focusable elements (inputs + buttons) in order
     */
    private getAllFocusableElements(): HTMLElement[] {
        const form = this.elementRef.nativeElement as HTMLElement;
        const elements = Array.from(
            form.querySelectorAll('input, button')
        ) as HTMLElement[];

        return elements.filter(element =>
            !(element as HTMLButtonElement | HTMLInputElement).disabled &&
            element.offsetParent !== null // visible
        );
    }

    /**
     * Focus any element at specific index
     */
    private focusElement(elements: HTMLElement[], index: number): void {
        if (index < 0 || index >= elements.length) return;

        setTimeout(() => {
            elements[index]?.focus();
            // Select text if it's an input
            if (elements[index] instanceof HTMLInputElement) {
                (elements[index] as HTMLInputElement).select();
            }
        }, 0);
    }

    /**
     * Focus element with wrap-around (circular navigation)
     */
    private focusElementWithWrap(elements: HTMLElement[], index: number): void {
        if (elements.length === 0) return;

        // If focus trap is disabled, use normal focus (no wrap)
        if (!this.enableFocusTrap()) {
            this.focusElement(elements, index);
            return;
        }

        // Wrap around: if index is out of bounds, wrap to other end
        let wrappedIndex = index;

        if (index < 0) {
            // Going left from first element → wrap to last
            wrappedIndex = elements.length - 1;
        } else if (index >= elements.length) {
            // Going right from last element → wrap to first
            wrappedIndex = 0;
        }

        this.focusElement(elements, wrappedIndex);
    }

    /**
     * Exit focus trap by blurring current element
     */
    private exitFocusTrap(): void {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
            activeElement.blur();
        }
    }

    /**
     * Check if element is a form input
     */
    private isFormInput(element: HTMLElement): boolean {
        return element.tagName === 'INPUT' &&
            ['text', 'number', ''].includes((element as HTMLInputElement).type);
    }
}
