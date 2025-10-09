# Design Document: Control Overlay Responsive Layout

## Overview

This design document outlines the implementation approach for making the control-overlay component responsive. The solution uses CSS container queries to detect canvas size and automatically switch between vertical (mobile) and horizontal (desktop) layouts without modifying any other library components.

### Design Goals

1. **Isolated Changes** - Only modify control-overlay component files
2. **Container-Based Detection** - Use container queries to respond to canvas size, not viewport
3. **Smooth Transitions** - Provide smooth layout transitions with reduced-motion support
4. **Zero Breaking Changes** - Maintain all existing functionality and APIs
5. **Performance** - Minimal performance impact (<5ms layout detection)

---

## Architecture

### Component Structure

```
control-overlay.component.ts (TypeScript)
├── Layout detection logic (container size monitoring)
├── Computed signals for layout mode
└── No changes to existing inputs/outputs

control-overlay.component.html (Template)
├── Existing structure maintained
├── Add layout mode class binding
└── No structural changes

control-overlay.component.scss (Styles)
├── Base styles (unchanged)
├── Container query for < 785px (vertical layout)
├── Container query for ≥ 785px (horizontal layout)
└── Transition animations
```

### Layout Detection Strategy

**Primary:** CSS Container Queries

- Modern, performant, declarative
- Automatically responds to container size changes
- No JavaScript required for layout switching

**Fallback:** ResizeObserver + Signal

- For browsers without container query support
- Monitors canvas container size
- Updates layout mode signal
- Minimal performance impact

---

## Components and Interfaces

### 1. Control Overlay Component (TypeScript)

**File:** `projects/ngx-dice-captcha/src/lib/components/control-overlay/control-overlay.component.ts`

#### New Computed Signals

```typescript
/**
 * Computed signal for layout mode based on container width.
 * Returns 'vertical' for < 785px, 'horizontal' for ≥ 785px.
 * Used as fallback for browsers without container query support.
 */
readonly layoutMode = computed<'vertical' | 'horizontal'>(() => {
  const width = this.containerWidth();
  return width < 785 ? 'vertical' : 'horizontal';
});

/**
 * Signal tracking the container width.
 * Updated by ResizeObserver for browsers without container query support.
 */
readonly containerWidth = signal<number>(1024); // Default to horizontal
```

#### New Private Methods

```typescript
/**
 * Initializes container size monitoring using ResizeObserver.
 * Only used as fallback for browsers without container query support.
 */
private initializeContainerMonitoring(): void {
  // Check if container queries are supported
  if (this.supportsContainerQueries()) {
    return; // CSS will handle layout
  }

  // Fallback: Use ResizeObserver
  const container = this.elementRef.nativeElement.closest('.dice-canvas-container');
  if (!container) return;

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      this.containerWidth.set(entry.contentRect.width);
    }
  });

  observer.observe(container);
  this.resizeObserver = observer;
}

/**
 * Checks if browser supports CSS container queries.
 */
private supportsContainerQueries(): boolean {
  return CSS.supports('container-type: inline-size');
}
```

#### Lifecycle Updates

```typescript
ngOnInit(): void {
  // Existing initialization code...

  // Initialize container monitoring for fallback
  this.initializeContainerMonitoring();
}

ngOnDestroy(): void {
  // Existing cleanup code...

  // Clean up ResizeObserver
  if (this.resizeObserver) {
    this.resizeObserver.disconnect();
  }
}
```

### 2. Control Overlay Template (HTML)

**File:** `projects/ngx-dice-captcha/src/lib/components/control-overlay/control-overlay.component.html`

#### Template Updates

```html
<!-- Add layout mode class to overlay container -->
<div
  class="control-overlay"
  [class.layout-vertical]="layoutMode() === 'vertical'"
  [class.layout-horizontal]="layoutMode() === 'horizontal'"
>
  <!-- Existing overlay content remains unchanged -->
  <mat-card class="control-card">
    <!-- Dice input fields -->
    <!-- Sum input field -->
    <!-- Action buttons -->
    <!-- All existing structure maintained -->
  </mat-card>
</div>
```

**Note:** Only the class bindings are added. All existing HTML structure, inputs, and outputs remain unchanged.

### 3. Control Overlay Styles (SCSS)

**File:** `projects/ngx-dice-captcha/src/lib/components/control-overlay/control-overlay.component.scss`

#### Container Query Setup

```scss
// Set up container context on parent
:host {
  container-type: inline-size;
  container-name: control-overlay;
}

.control-overlay {
  // Base styles (existing)
  position: absolute;
  z-index: 100;

  // Default positioning (horizontal layout)
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);

  // Smooth transitions
  transition: all 300ms ease-in-out;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}
```

#### Vertical Layout (< 785px)

```scss
// Container query for small screens
@container control-overlay (max-width: 784px) {
  .control-overlay {
    // Position at top-left
    top: 0.25rem;
    left: 0.25rem;
    transform: none;

    // Full width minus margins
    width: calc(100% - 0.5rem);
    max-width: none;
  }

  .control-card {
    // Compact padding
    padding: 0.5rem !important;
    border-radius: 8px !important;

    // Vertical stacking
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  // Dice inputs grid - 2 columns
  .dice-inputs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.375rem;
  }

  .dice-input-field {
    // Compact sizing
    mat-form-field {
      font-size: 0.75rem;

      input {
        font-size: 0.875rem;
        padding: 0.375rem;
      }
    }
  }

  // Sum input - full width
  .sum-input-field {
    width: 100%;

    mat-form-field {
      width: 100%;
      font-size: 0.875rem;
    }
  }

  // Buttons - vertical stack
  .control-actions {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;

    button {
      width: 100%;
      padding: 6px 12px;
      font-size: 0.75rem;
      min-width: auto;
      border-radius: 6px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
  }

  // Timer and attempts - compact
  .overlay-header {
    font-size: 0.6875rem;
    padding: 0.375rem;
    gap: 0.25rem;

    mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
  }

  // Instructions - compact
  .instructions-text {
    font-size: 0.625rem;
    line-height: 1.3;
    padding: 0.375rem;
  }
}
```

#### Horizontal Layout (≥ 785px)

```scss
// Container query for large screens
@container control-overlay (min-width: 785px) {
  .control-overlay {
    // Centered at top
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);

    // Standard width
    max-width: 500px;
  }

  .control-card {
    // Standard padding
    padding: 1rem;
    border-radius: 12px;

    // Standard spacing
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  // Dice inputs grid - auto-fit
  .dice-inputs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.75rem;
  }

  .dice-input-field {
    // Standard sizing
    mat-form-field {
      font-size: 0.875rem;

      input {
        font-size: 1rem;
        padding: 0.5rem;
      }
    }
  }

  // Sum input - standard
  .sum-input-field {
    mat-form-field {
      font-size: 1rem;
    }
  }

  // Buttons - horizontal row
  .control-actions {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 1rem;

    button {
      min-width: 120px;
      padding: 10px 24px;
      font-size: 0.875rem;
      border-radius: 24px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
  }

  // Timer and attempts - standard
  .overlay-header {
    font-size: 0.875rem;
    padding: 0.5rem;
    gap: 0.5rem;

    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  }

  // Instructions - standard
  .instructions-text {
    font-size: 0.875rem;
    line-height: 1.5;
    padding: 0.5rem;
  }
}
```

#### Fallback for Non-Container-Query Browsers

```scss
// Fallback using class-based layout
@supports not (container-type: inline-size) {
  .control-overlay.layout-vertical {
    // Apply vertical layout styles
    top: 0.25rem;
    left: 0.25rem;
    transform: none;
    width: calc(100% - 0.5rem);
    // ... (same styles as container query)
  }

  .control-overlay.layout-horizontal {
    // Apply horizontal layout styles
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    max-width: 500px;
    // ... (same styles as container query)
  }
}
```

---

## Data Models

### Layout Mode Type

```typescript
/**
 * Layout mode for control overlay.
 * - 'vertical': Left-aligned, stacked layout for small screens (< 785px)
 * - 'horizontal': Centered, row layout for large screens (≥ 785px)
 */
export type ControlOverlayLayoutMode = 'vertical' | 'horizontal';
```

**Note:** This type is internal to the control-overlay component and not exported from the library.

---

## Error Handling

### Container Detection Failure

```typescript
private initializeContainerMonitoring(): void {
  try {
    const container = this.elementRef.nativeElement.closest('.dice-canvas-container');

    if (!container) {
      // Fallback to default horizontal layout
      console.warn('Control overlay: Canvas container not found, using default layout');
      this.containerWidth.set(1024);
      return;
    }

    // Set up ResizeObserver...
  } catch (error) {
    // Graceful degradation
    console.warn('Control overlay: Failed to initialize container monitoring', error);
    this.containerWidth.set(1024); // Default to horizontal
  }
}
```

### ResizeObserver Errors

```typescript
const observer = new ResizeObserver((entries) => {
  try {
    for (const entry of entries) {
      this.containerWidth.set(entry.contentRect.width);
    }
  } catch (error) {
    console.warn('Control overlay: Resize observation error', error);
  }
});
```

---

## Testing Strategy

### Unit Tests

**File:** `control-overlay.component.spec.ts`

```typescript
describe('ControlOverlayComponent - Responsive Layout', () => {
  describe('Layout Mode Detection', () => {
    it('should default to horizontal layout', () => {
      const component = createComponent();
      expect(component.layoutMode()).toBe('horizontal');
    });

    it('should switch to vertical layout when width < 785px', () => {
      const component = createComponent();
      component.containerWidth.set(600);
      expect(component.layoutMode()).toBe('vertical');
    });

    it('should switch to horizontal layout when width >= 785px', () => {
      const component = createComponent();
      component.containerWidth.set(800);
      expect(component.layoutMode()).toBe('horizontal');
    });

    it('should handle threshold boundary correctly', () => {
      const component = createComponent();
      component.containerWidth.set(784);
      expect(component.layoutMode()).toBe('vertical');
      component.containerWidth.set(785);
      expect(component.layoutMode()).toBe('horizontal');
    });
  });

  describe('Container Query Support Detection', () => {
    it('should detect container query support', () => {
      const component = createComponent();
      const supported = component['supportsContainerQueries']();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('ResizeObserver Cleanup', () => {
    it('should disconnect ResizeObserver on destroy', () => {
      const component = createComponent();
      const spy = jasmine.createSpy('disconnect');
      component['resizeObserver'] = { disconnect: spy } as any;
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
```

### Integration Tests

```typescript
describe('ControlOverlayComponent - Layout Integration', () => {
  it('should apply vertical layout class when width < 785px', () => {
    const fixture = createFixture({ containerWidth: 600 });
    const overlay = fixture.nativeElement.querySelector('.control-overlay');
    expect(overlay.classList.contains('layout-vertical')).toBe(true);
  });

  it('should apply horizontal layout class when width >= 785px', () => {
    const fixture = createFixture({ containerWidth: 1024 });
    const overlay = fixture.nativeElement.querySelector('.control-overlay');
    expect(overlay.classList.contains('layout-horizontal')).toBe(true);
  });

  it('should maintain all existing functionality in vertical layout', () => {
    const fixture = createFixture({ containerWidth: 600 });
    // Test dice inputs, sum input, buttons all work
    // Verify no breaking changes
  });

  it('should maintain all existing functionality in horizontal layout', () => {
    const fixture = createFixture({ containerWidth: 1024 });
    // Test dice inputs, sum input, buttons all work
    // Verify no breaking changes
  });
});
```

### Visual Regression Tests

```typescript
describe('ControlOverlayComponent - Visual Regression', () => {
  it('should match vertical layout snapshot at 375px', async () => {
    const fixture = createFixture({ containerWidth: 375 });
    await expectMatchesSnapshot(fixture, 'vertical-375px');
  });

  it('should match vertical layout snapshot at 600px', async () => {
    const fixture = createFixture({ containerWidth: 600 });
    await expectMatchesSnapshot(fixture, 'vertical-600px');
  });

  it('should match horizontal layout snapshot at 1024px', async () => {
    const fixture = createFixture({ containerWidth: 1024 });
    await expectMatchesSnapshot(fixture, 'horizontal-1024px');
  });

  it('should match horizontal layout snapshot at 1920px', async () => {
    const fixture = createFixture({ containerWidth: 1920 });
    await expectMatchesSnapshot(fixture, 'horizontal-1920px');
  });
});
```

### Accessibility Tests

```typescript
describe('ControlOverlayComponent - Accessibility', () => {
  it('should maintain keyboard navigation in vertical layout', () => {
    const fixture = createFixture({ containerWidth: 600 });
    // Test tab order, focus management
  });

  it('should maintain keyboard navigation in horizontal layout', () => {
    const fixture = createFixture({ containerWidth: 1024 });
    // Test tab order, focus management
  });

  it('should have proper ARIA labels in both layouts', () => {
    // Test ARIA attributes are present and correct
  });

  it('should respect prefers-reduced-motion', () => {
    // Test transitions are disabled when prefers-reduced-motion is set
  });
});
```

---

## Performance Considerations

### Layout Detection Performance

- **Container Queries:** Zero JavaScript overhead, handled by CSS engine
- **ResizeObserver Fallback:** ~1-2ms per resize event (debounced)
- **Signal Updates:** <1ms for computed signal recalculation

### Memory Impact

- **Container Queries:** No additional memory
- **ResizeObserver:** ~1KB per instance
- **Signals:** Negligible (<100 bytes)

### Optimization Strategies

1. **Lazy Initialization:** Only set up ResizeObserver if container queries not supported
2. **Debouncing:** ResizeObserver updates debounced to 150ms
3. **Cleanup:** Proper disposal of ResizeObserver on component destroy
4. **CSS-First:** Prefer CSS container queries over JavaScript

---

## Migration and Backward Compatibility

### Breaking Changes

**None.** This feature is 100% backward compatible.

### API Changes

**None.** No public APIs are added or modified.

### Configuration Changes

**None.** No new configuration options required.

### Existing Implementations

All existing implementations will continue to work without any changes. The responsive layout will automatically activate based on canvas size.

---

## Deployment Strategy

### Rollout Plan

1. **Phase 1:** Implement TypeScript changes (layout detection logic)
2. **Phase 2:** Implement SCSS changes (container queries and layouts)
3. **Phase 3:** Add unit tests
4. **Phase 4:** Add integration tests
5. **Phase 5:** Test in demo application
6. **Phase 6:** Release as minor version (e.g., 2.3.0)

### Testing Checklist

- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Visual regression tests pass
- [ ] Accessibility tests pass
- [ ] Manual testing on real devices (mobile, tablet, desktop)
- [ ] Browser compatibility testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance benchmarks meet targets
- [ ] No breaking changes detected
- [ ] Demo application works correctly

### Rollback Plan

If issues are discovered:

1. Revert the SCSS changes (removes layout switching)
2. Component will fall back to default horizontal layout
3. No data loss or functionality impact
4. Can be done via patch release

---

## Documentation Updates

### Component Documentation

Update `control-overlay.component.ts` JSDoc:

```typescript
/**
 * Control overlay component for dice value input.
 *
 * Provides an input form for users to enter dice values and sum.
 * Automatically adapts layout based on canvas size:
 * - Vertical layout (< 785px): Left-aligned, stacked inputs and buttons
 * - Horizontal layout (≥ 785px): Centered, row-based layout
 *
 * Uses CSS container queries for optimal performance with ResizeObserver fallback.
 *
 * @since 2.3.0 - Added responsive layout support
 */
```

### README Updates

Add section to library README:

```markdown
## Responsive Layout

The control overlay automatically adapts to different screen sizes:

- **Small screens (< 785px):** Vertical layout with stacked inputs
- **Large screens (≥ 785px):** Horizontal layout with row-based inputs

This happens automatically with no configuration required.
```

### Changelog Entry

```markdown
## [2.3.0] - 2024-XX-XX

### Added

- Responsive layout for control overlay component
  - Vertical layout for screens < 785px
  - Horizontal layout for screens ≥ 785px
  - Automatic detection using CSS container queries
  - ResizeObserver fallback for older browsers
  - Smooth transitions with reduced-motion support

### Changed

- None (100% backward compatible)

### Fixed

- Control overlay overflow on small screens
```

---

## Future Enhancements

Potential future improvements (out of scope for this feature):

1. **Configurable Breakpoint:** Allow developers to customize the 785px threshold
2. **Custom Layouts:** Support for custom layout modes
3. **Animation Customization:** Configurable transition timing and easing
4. **Layout Preferences:** Remember user's preferred layout mode
5. **Adaptive Dice Grid:** Dynamic column count based on dice count and width

---

## Conclusion

This design provides a robust, performant, and backward-compatible solution for responsive control overlay layout. By using CSS container queries as the primary mechanism with a ResizeObserver fallback, we achieve optimal performance while maintaining broad browser support.

The implementation is isolated to the control-overlay component, ensuring no breaking changes to other parts of the library. All existing functionality is preserved while adding automatic responsive behavior that improves the user experience on small screens.
