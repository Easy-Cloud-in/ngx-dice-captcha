# Implementation Plan: Control Overlay Responsive Layout

## Overview

This implementation plan breaks down the responsive control overlay feature into discrete, manageable coding tasks. Each task builds incrementally on previous work, following test-driven development principles where appropriate.

---

## Tasks

- [x] 1. Set up TypeScript infrastructure for layout detection

  - Add layout mode type definition to control-overlay component
  - Add containerWidth signal for tracking canvas size
  - Add layoutMode computed signal for determining layout based on width
  - Add ResizeObserver property for cleanup
  - _Requirements: 1.1, 1.6, 1.10_

- [x] 2. Implement container query support detection

  - [x] 2.1 Add supportsContainerQueries() private method

    - Use CSS.supports() to check for 'container-type: inline-size'
    - Return boolean indicating support
    - _Requirements: 9.1, 9.2_

  - [x] 2.2 Add initializeContainerMonitoring() private method

    - Check if container queries are supported, return early if yes
    - Find closest .dice-canvas-container element
    - Create ResizeObserver to monitor container size
    - Update containerWidth signal on resize
    - Handle errors gracefully with fallback to default width
    - _Requirements: 1.6, 1.10, 9.3, 9.4_

  - [x] 2.3 Update ngOnInit lifecycle hook

    - Call initializeContainerMonitoring() after existing initialization
    - Ensure no breaking changes to existing initialization logic
    - _Requirements: 1.1, 9.6_

  - [x] 2.4 Update ngOnDestroy lifecycle hook
    - Disconnect ResizeObserver if it exists
    - Ensure proper cleanup to prevent memory leaks
    - _Requirements: 9.5_

- [x] 3. Update component template for layout mode binding

  - [x] 3.1 Add layout mode class bindings to overlay container

    - Add [class.layout-vertical] binding to layoutMode() === 'vertical'
    - Add [class.layout-horizontal] binding to layoutMode() === 'horizontal'
    - Maintain all existing HTML structure and bindings
    - _Requirements: 1.7, 9.6_

  - [x] 3.2 Update getLayoutClass() method to use layoutMode()
    - Changed from using isHorizontal() input to layoutMode() computed signal
    - This ensures layout is based on actual container width, not parent input
    - _Requirements: 1.1, 1.7_

- [x] 4. Implement CSS container query setup

  - [x] 4.1 Add container context to :host

    - Set container-type: inline-size
    - Set container-name: control-overlay
    - _Requirements: 9.1_

  - [x] 4.2 Fix container query selectors

    - Removed container name from @container queries (use implicit container)
    - Changed from `@container control-overlay (max-width: 784px)` to `@container (max-width: 784px)`
    - This ensures queries work correctly with the :host container
    - _Requirements: 9.1_

  - [x] 4.2 Update base .control-overlay styles
    - Add smooth transition for all properties (300ms ease-in-out)
    - Add prefers-reduced-motion media query to disable transitions
    - Maintain existing positioning as default (horizontal layout)
    - _Requirements: 8.1, 8.2, 8.3, 8.9_

- [x] 5. Implement vertical layout styles (< 785px)

  - [x] 5.1 Add container query for max-width 784px

    - Position overlay at top-left (0.25rem, 0.25rem)
    - Set width to calc(100% - 0.5rem)
    - Remove transform (no centering)
    - _Requirements: 2.1, 2.2, 2.3, 2.9_

  - [x] 5.2 Style control card for vertical layout

    - Set padding to 0.5rem
    - Set border-radius to 8px
    - Set flex-direction to column
    - Set gap to 0.5rem
    - _Requirements: 2.9_

  - [x] 5.3 Style dice inputs grid for vertical layout

    - Set grid-template-columns to repeat(2, 1fr)
    - Set gap to 0.375rem
    - Reduce font sizes (input: 0.875rem, label: 0.75rem)
    - Reduce input padding to 0.375rem
    - _Requirements: 2.6, 4.1, 4.2, 5.1, 5.2_

  - [x] 5.4 Style sum input for vertical layout

    - Set width to 100%
    - Set font-size to 0.875rem
    - _Requirements: 4.3, 4.4_

  - [x] 5.5 Style action buttons for vertical layout

    - Set flex-direction to column
    - Set gap to 0.375rem
    - Set button width to 100%
    - Set button padding to 6px 12px
    - Set button font-size to 0.75rem
    - Set button border-radius to 6px
    - Set icon size to 16px
    - _Requirements: 2.4, 2.5, 4.5, 4.6, 6.1, 6.3, 6.5, 6.7, 6.10_

  - [x] 5.6 Style overlay header for vertical layout

    - Set font-size to 0.6875rem
    - Set padding to 0.375rem
    - Set gap to 0.25rem
    - Set icon size to 14px
    - _Requirements: 4.7, 4.8_

  - [x] 5.7 Style instructions text for vertical layout
    - Set font-size to 0.625rem
    - Set line-height to 1.3
    - Set padding to 0.375rem
    - _Requirements: 4.9, 4.10_

- [x] 6. Implement horizontal layout styles (≥ 785px)

  - [x] 6.1 Add container query for min-width 785px

    - Position overlay at top-center (1rem from top, centered)
    - Set max-width to 500px
    - Apply translateX(-50%) for centering
    - _Requirements: 3.1, 3.2, 3.3, 3.9_

  - [x] 6.2 Style control card for horizontal layout

    - Set padding to 1rem
    - Set border-radius to 12px
    - Set flex-direction to column
    - Set gap to 1rem
    - _Requirements: 3.8_

  - [x] 6.3 Style dice inputs grid for horizontal layout

    - Set grid-template-columns to repeat(auto-fit, minmax(80px, 1fr))
    - Set gap to 0.75rem
    - Use standard font sizes (input: 1rem, label: 0.875rem)
    - Use standard input padding (0.5rem)
    - _Requirements: 3.5, 4.1, 4.2, 5.3, 5.4_

  - [x] 6.4 Style sum input for horizontal layout

    - Use standard font-size (1rem)
    - _Requirements: 4.3, 4.4_

  - [x] 6.5 Style action buttons for horizontal layout

    - Set flex-direction to row
    - Set justify-content to center
    - Set gap to 1rem
    - Set button min-width to 120px
    - Set button padding to 10px 24px
    - Set button font-size to 0.875rem
    - Set button border-radius to 24px
    - Set icon size to 20px
    - _Requirements: 3.4, 4.5, 4.6, 6.2, 6.4, 6.6, 6.8_

  - [x] 6.6 Style overlay header for horizontal layout

    - Set font-size to 0.875rem
    - Set padding to 0.5rem
    - Set gap to 0.5rem
    - Set icon size to 18px
    - _Requirements: 4.7, 4.8_

  - [x] 6.7 Style instructions text for horizontal layout
    - Set font-size to 0.875rem
    - Set line-height to 1.5
    - Set padding to 0.5rem
    - _Requirements: 4.9, 4.10_

- [x] 7. Implement fallback styles for non-container-query browsers

  - [x] 7.1 Add @supports not (container-type: inline-size) block
    - Duplicate vertical layout styles under .layout-vertical class
    - Duplicate horizontal layout styles under .layout-horizontal class
    - Ensure styles match container query versions exactly
    - _Requirements: 9.2, 9.5_

- [ ] 8. Add unit tests for layout detection logic

  - [ ] 8.1 Test default layout mode

    - Verify layoutMode() returns 'horizontal' by default
    - _Requirements: 1.1_

  - [ ] 8.2 Test vertical layout detection

    - Set containerWidth to 600px
    - Verify layoutMode() returns 'vertical'
    - _Requirements: 1.1, 2.1_

  - [ ] 8.3 Test horizontal layout detection

    - Set containerWidth to 800px
    - Verify layoutMode() returns 'horizontal'
    - _Requirements: 1.1, 3.1_

  - [ ] 8.4 Test threshold boundary

    - Set containerWidth to 784px, verify 'vertical'
    - Set containerWidth to 785px, verify 'horizontal'
    - _Requirements: 1.1_

  - [ ] 8.5 Test container query support detection

    - Call supportsContainerQueries()
    - Verify it returns a boolean
    - _Requirements: 9.1_

  - [ ] 8.6 Test ResizeObserver cleanup
    - Create component with ResizeObserver
    - Call ngOnDestroy()
    - Verify disconnect() was called
    - _Requirements: 9.5_

- [ ] 9. Add integration tests for layout application

  - [ ] 9.1 Test vertical layout class application

    - Create component with containerWidth 600px
    - Verify .layout-vertical class is present
    - Verify .layout-horizontal class is not present
    - _Requirements: 1.7, 2.1_

  - [ ] 9.2 Test horizontal layout class application

    - Create component with containerWidth 1024px
    - Verify .layout-horizontal class is present
    - Verify .layout-vertical class is not present
    - _Requirements: 1.7, 3.1_

  - [ ] 9.3 Test functionality preservation in vertical layout

    - Create component with containerWidth 600px
    - Test dice input fields accept values
    - Test sum input field accepts value
    - Test submit button triggers verification
    - Verify no breaking changes to existing functionality
    - _Requirements: 2.10, 9.6_

  - [ ] 9.4 Test functionality preservation in horizontal layout
    - Create component with containerWidth 1024px
    - Test dice input fields accept values
    - Test sum input field accepts value
    - Test submit button triggers verification
    - Verify no breaking changes to existing functionality
    - _Requirements: 3.10, 9.6_

- [ ]\* 10. Add visual regression tests

  - [ ]\* 10.1 Capture vertical layout snapshot at 375px

    - Create component with containerWidth 375px
    - Capture screenshot
    - Compare against baseline
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]\* 10.2 Capture vertical layout snapshot at 600px

    - Create component with containerWidth 600px
    - Capture screenshot
    - Compare against baseline
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]\* 10.3 Capture horizontal layout snapshot at 1024px

    - Create component with containerWidth 1024px
    - Capture screenshot
    - Compare against baseline
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]\* 10.4 Capture horizontal layout snapshot at 1920px
    - Create component with containerWidth 1920px
    - Capture screenshot
    - Compare against baseline
    - _Requirements: 3.1, 3.2, 3.3_

- [ ]\* 11. Add accessibility tests

  - [ ]\* 11.1 Test keyboard navigation in vertical layout

    - Create component with containerWidth 600px
    - Simulate tab key presses
    - Verify focus moves through inputs and buttons in correct order
    - Verify no focus traps
    - _Requirements: 10.2, 10.5_

  - [ ]\* 11.2 Test keyboard navigation in horizontal layout

    - Create component with containerWidth 1024px
    - Simulate tab key presses
    - Verify focus moves through inputs and buttons in correct order
    - Verify no focus traps
    - _Requirements: 10.3, 10.6_

  - [ ]\* 11.3 Test ARIA labels in both layouts

    - Verify all form fields have proper labels
    - Verify buttons have proper aria-label attributes
    - Verify layout changes are announced to screen readers
    - _Requirements: 10.7, 10.9_

  - [ ]\* 11.4 Test prefers-reduced-motion support
    - Enable prefers-reduced-motion
    - Trigger layout change
    - Verify no transitions occur
    - Verify layout still changes correctly
    - _Requirements: 8.5, 10.10_

- [ ] 12. Update component documentation

  - [ ] 12.1 Update JSDoc for control-overlay component

    - Add description of responsive layout feature
    - Document layout modes (vertical < 785px, horizontal ≥ 785px)
    - Add @since 2.3.0 tag
    - _Requirements: 9.6_

  - [ ] 12.2 Add inline code comments
    - Comment layout detection logic
    - Comment container query setup
    - Comment fallback mechanism
    - _Requirements: 9.6_

- [ ] 13. Test in demo application

  - [ ] 13.1 Update responsive-test component to showcase feature

    - Verify control overlay adapts correctly in each device frame
    - Test mobile frames (320px, 375px, 414px) show vertical layout
    - Test tablet frames (768px, 1024px) show appropriate layout
    - Test desktop frames (1440px, 1920px, 2560px) show horizontal layout
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 13.2 Manual testing on real devices
    - Test on actual mobile device (iPhone/Android)
    - Test on actual tablet (iPad/Android tablet)
    - Test on desktop browser at various widths
    - Verify smooth transitions when resizing
    - Verify no content overflow in any layout
    - _Requirements: 1.4, 8.1, 8.2, 8.3_

- [ ] 14. Browser compatibility testing

  - [ ] 14.1 Test in Chrome (container query support)

    - Verify container queries work correctly
    - Verify layout switches at 785px threshold
    - Verify smooth transitions
    - _Requirements: 9.1_

  - [ ] 14.2 Test in Firefox (container query support)

    - Verify container queries work correctly
    - Verify layout switches at 785px threshold
    - Verify smooth transitions
    - _Requirements: 9.1_

  - [ ] 14.3 Test in Safari (container query support)

    - Verify container queries work correctly
    - Verify layout switches at 785px threshold
    - Verify smooth transitions
    - _Requirements: 9.1_

  - [ ] 14.4 Test in Edge (container query support)

    - Verify container queries work correctly
    - Verify layout switches at 785px threshold
    - Verify smooth transitions
    - _Requirements: 9.1_

  - [ ] 14.5 Test fallback in older browsers
    - Test in browser without container query support
    - Verify ResizeObserver fallback activates
    - Verify layout still switches correctly
    - _Requirements: 9.2, 9.5_

- [ ] 15. Performance validation

  - [ ] 15.1 Measure layout detection performance

    - Measure time from resize to layout update
    - Verify < 50ms on mid-range devices
    - _Requirements: 1.10_

  - [ ] 15.2 Measure transition performance

    - Measure transition duration
    - Verify completes within 300ms
    - Verify no frame drops during transition
    - _Requirements: 8.2_

  - [ ] 15.3 Check memory usage
    - Monitor memory before and after multiple layout switches
    - Verify no memory leaks
    - Verify ResizeObserver is properly cleaned up
    - _Requirements: 9.5_

- [ ] 16. Final integration and verification

  - [ ] 16.1 Run full test suite

    - Run all unit tests
    - Run all integration tests
    - Verify >90% code coverage
    - _Requirements: All_

  - [ ] 16.2 Verify no breaking changes

    - Test all existing verification modes
    - Test all existing configuration options
    - Verify all public APIs unchanged
    - Verify all events still emit correctly
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_

  - [ ] 16.3 Update CHANGELOG.md

    - Add entry for version 2.3.0
    - Document new responsive layout feature
    - Note backward compatibility
    - _Requirements: 9.6_

  - [ ] 16.4 Update README.md
    - Add section on responsive layout
    - Document automatic behavior
    - Add examples if needed
    - _Requirements: 9.6_

---

## Notes

- Tasks marked with `*` are optional testing tasks that enhance quality but are not required for core functionality
- Each task should be completed and tested before moving to the next
- All changes are isolated to the control-overlay component
- No breaking changes to existing functionality
- Maintain >90% test coverage throughout implementation

---

## Estimated Timeline

- Tasks 1-7: Core implementation (4-6 hours)
- Tasks 8-9: Essential testing (2-3 hours)
- Tasks 10-11: Optional testing (2-3 hours)
- Tasks 12-16: Documentation and validation (2-3 hours)

**Total: 10-15 hours** (excluding optional tests: 8-12 hours)
