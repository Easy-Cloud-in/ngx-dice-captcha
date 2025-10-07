import { Component, signal, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha';

interface ContainerSize {
  name: string;
  emoji: string;
  width: number;
  diceCount: number;
  description: string;
  breakpoint: string;
}

@Component({
  selector: 'app-responsive-test',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxDiceCaptchaComponent],
  templateUrl: './responsive-test.component.html',
  styleUrls: ['./responsive-test.component.scss'],
})
export class ResponsiveTestComponent implements OnDestroy {
  @ViewChild('resizableContainer', { read: ElementRef }) resizableContainer?: ElementRef;

  // Interactive resize state
  protected readonly interactiveWidth = signal<number>(600);
  protected readonly enableDynamicResize = signal<boolean>(true);
  protected readonly resizeThreshold = signal<number>(50);
  protected readonly autoStartEnabled = signal<boolean>(true);

  // Resize tracking
  private isResizing = false;
  private startX = 0;
  private startWidth = 0;

  // Container sizes for side-by-side comparison
  protected readonly containerSizes: ContainerSize[] = [
    {
      name: 'Tiny',
      emoji: '📱',
      width: 280,
      diceCount: 2,
      description: 'Ultra-compact mobile view',
      breakpoint: 'compact',
    },
    {
      name: 'Small',
      emoji: '📱',
      width: 380,
      diceCount: 2,
      description: 'Mobile device container',
      breakpoint: 'compact',
    },
    {
      name: 'Medium',
      emoji: '💻',
      width: 550,
      diceCount: 3,
      description: 'Tablet & small desktop',
      breakpoint: 'standard',
    },
    {
      name: 'Large',
      emoji: '🖥️',
      width: 750,
      diceCount: 4,
      description: 'Desktop container',
      breakpoint: 'expanded',
    },
    {
      name: 'XL',
      emoji: '🎬',
      width: 1000,
      diceCount: 4,
      description: 'Wide desktop layout',
      breakpoint: 'expanded',
    },
    {
      name: 'XXL',
      emoji: '🖼️',
      width: 1400,
      diceCount: 5,
      description: 'Ultra-wide display',
      breakpoint: 'expanded',
    },
  ];

  // Example code for documentation
  protected readonly exampleCode = `<ngx-dice-captcha
  [config]="{
    diceCount: 3,
    fillContainer: false,
    maintainAspectRatio: true,
    enableDynamicResize: true,
    resizeThreshold: 50
  }"
  [autoStart]="false">
</ngx-dice-captcha>`;

  constructor() {
    // Bind event listeners for resize
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    this.stopResize();
  }

  /**
   * Set container width to predefined size
   */
  protected setContainerWidth(width: number): void {
    this.interactiveWidth.set(width);
  }

  /**
   * Start resize operation
   */
  protected startResize(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.isResizing = true;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.startX = clientX;
    this.startWidth = this.interactiveWidth();

    // Add global event listeners
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('touchmove', this.onMouseMove);
    document.addEventListener('touchend', this.onMouseUp);

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
  }

  /**
   * Handle mouse/touch move during resize
   */
  private onMouseMove(event: MouseEvent | TouchEvent): void {
    if (!this.isResizing) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const deltaX = clientX - this.startX;
    const newWidth = Math.max(200, Math.min(1600, this.startWidth + deltaX));

    this.interactiveWidth.set(Math.round(newWidth));
  }

  /**
   * Stop resize operation
   */
  private onMouseUp(): void {
    if (!this.isResizing) return;

    this.stopResize();
  }

  /**
   * Clean up resize listeners
   */
  private stopResize(): void {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onMouseMove);
    document.removeEventListener('touchend', this.onMouseUp);

    // Restore normal cursor and text selection
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }

  /**
   * Toggle dynamic resize feature
   */
  protected toggleDynamicResize(): void {
    this.enableDynamicResize.update((value) => !value);
  }

  /**
   * Toggle autoStart feature
   */
  protected toggleAutoStart(): void {
    this.autoStartEnabled.update((value) => !value);
  }

  /**
   * Update resize threshold
   */
  protected updateResizeThreshold(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.resizeThreshold.set(parseInt(input.value, 10));
  }

  /**
   * Handle verification result
   */
  protected onVerificationResult(result: any, containerName: string): void {
    console.log(`Verification result from ${containerName}:`, result);
  }
}
