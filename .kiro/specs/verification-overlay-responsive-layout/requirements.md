# Requirements Document: Control Overlay Responsive Layout

## Introduction

This document outlines the requirements for making the **control-overlay component** (the input overlay where users enter dice values and sum) responsive based on screen size. Currently, the control overlay uses a fixed layout that can overflow on small screens (< 785px). The improvement will automatically position the overlay vertically on the left side for mobile/small screens and horizontally at the top for larger screens.

This enhancement will ensure the control overlay displays properly within the canvas boundaries across all device sizes, providing an optimal user experience without content overflow.

**Important:** This feature ONLY modifies the control-overlay component. No other components (verification-display, dice-canvas, etc.) will be changed. This ensures backward compatibility and prevents breaking existing functionality.

---

## Requirements

### Requirement 1: Automatic Control Overlay Layout Detection

**User Story:** As a user on any device, I want the control overlay (dice input form) to automatically adapt its layout based on my screen size, so that the input fields and buttons are always fully visible and properly positioned within the canvas.

#### Acceptance Criteria

1. WHEN the canvas width is less than 785px THEN the overlay SHALL use a vertical left-aligned layout
2. WHEN the canvas width is 785px or greater THEN the overlay SHALL use a horizontal top-center layout
3. WHEN the canvas is resized across the 785px threshold THEN the overlay layout SHALL update automatically
4. WHEN the layout changes THEN the transition SHALL be smooth without visual glitches
5. IF a verification result is currently displayed THEN resizing SHALL maintain the overlay visibility
6. WHEN the layout is determined THEN it SHALL be based on the canvas container width, not viewport width
7. WHEN the overlay layout changes THEN all content SHALL remain readable and accessible
8. WHEN the canvas is embedded in a small container THEN the overlay SHALL detect the container size correctly
9. WHEN multiple captcha instances exist THEN each SHALL independently determine its layout
10. WHEN the layout is calculated THEN it SHALL execute within 50ms of size detection

### Requirement 2: Vertical Left-Aligned Layout for Small Screens

**User Story:** As a mobile user or user with a narrow screen (< 785px), I want the verification overlay to display vertically on the left side of the canvas, so that all content fits within the visible area without horizontal scrolling or overflow.

#### Acceptance Criteria

1. WHEN the canvas width is less than 785px THEN the overlay SHALL position at the left edge of the canvas
2. WHEN using vertical layout THEN the overlay SHALL align to the top-left corner with minimal padding
3. WHEN using vertical layout THEN the overlay card SHALL take full width of the canvas minus minimal margins
4. WHEN using vertical layout THEN all content SHALL stack vertically (icon, title, message, dice values, buttons)
5. WHEN using vertical layout THEN buttons SHALL stack vertically with full width
6. WHEN using vertical layout THEN the dice values grid SHALL use 2 columns maximum
7. WHEN using vertical layout THEN font sizes SHALL scale down appropriately (title: 1rem, message: 0.75rem)
8. WHEN using vertical layout THEN icon size SHALL be 32px
9. WHEN using vertical layout THEN padding SHALL be minimal (0.25rem overlay, 0.5rem card)
10. WHEN using vertical layout THEN the overlay SHALL be scrollable if content exceeds canvas height

### Requirement 3: Horizontal Top-Center Layout for Large Screens

**User Story:** As a desktop user or user with a wide screen (≥ 785px), I want the verification overlay to display horizontally at the top-center of the canvas, so that it doesn't obstruct the dice and provides a traditional centered modal experience.

#### Acceptance Criteria

1. WHEN the canvas width is 785px or greater THEN the overlay SHALL position at the top-center of the canvas
2. WHEN using horizontal layout THEN the overlay SHALL be centered horizontally
3. WHEN using horizontal layout THEN the overlay card SHALL have a maximum width of 500px
4. WHEN using horizontal layout THEN buttons SHALL display in a horizontal row
5. WHEN using horizontal layout THEN the dice values grid SHALL use auto-fit columns
6. WHEN using horizontal layout THEN font sizes SHALL use standard sizing (title: 1.5rem, message: 1rem)
7. WHEN using horizontal layout THEN icon size SHALL be 64px
8. WHEN using horizontal layout THEN padding SHALL be standard (0.5rem overlay, 1rem card)
9. WHEN using horizontal layout THEN the overlay SHALL center vertically within the canvas
10. WHEN using horizontal layout THEN the card SHALL have standard elevation and shadows

### Requirement 4: Responsive Content Scaling

**User Story:** As a user on any device, I want all overlay content (text, icons, buttons, dice values) to scale appropriately for my screen size, so that everything is readable and properly proportioned.

#### Acceptance Criteria

1. WHEN the layout is vertical THEN the result icon SHALL be 32px
2. WHEN the layout is horizontal THEN the result icon SHALL be 64px
3. WHEN the layout is vertical THEN the title SHALL be 1rem font size
4. WHEN the layout is horizontal THEN the title SHALL be 1.5rem font size
5. WHEN the layout is vertical THEN the message SHALL be 0.75rem font size
6. WHEN the layout is horizontal THEN the message SHALL be 1rem font size
7. WHEN the layout is vertical THEN button text SHALL be 0.75rem font size
8. WHEN the layout is horizontal THEN button text SHALL be 0.875rem font size
9. WHEN the layout is vertical THEN dice value numbers SHALL be 1rem font size
10. WHEN the layout is horizontal THEN dice value numbers SHALL be 1.5rem font size

### Requirement 5: Dice Values Display Adaptation

**User Story:** As a user viewing verification results, I want the dice values to be displayed in a grid that adapts to the available space, so that I can easily see all dice values without scrolling horizontally.

#### Acceptance Criteria

1. WHEN the layout is vertical THEN the dice values grid SHALL use 2 columns
2. WHEN the layout is horizontal THEN the dice values grid SHALL use auto-fit with minimum 80px columns
3. WHEN there are 2 dice THEN the vertical layout SHALL display them in 2 columns (1 row)
4. WHEN there are 3-4 dice THEN the vertical layout SHALL display them in 2 columns (2 rows)
5. WHEN there are 5-6 dice THEN the vertical layout SHALL display them in 2 columns (3 rows)
6. WHEN the layout is vertical THEN each dice value item SHALL have reduced padding (0.375rem)
7. WHEN the layout is horizontal THEN each dice value item SHALL have standard padding (0.75rem)
8. WHEN the layout is vertical THEN the sum display SHALL be compact (1.25rem font)
9. WHEN the layout is horizontal THEN the sum display SHALL be standard (2rem font)
10. WHEN dice values are displayed THEN they SHALL always be fully visible without overflow

### Requirement 6: Button Layout Adaptation

**User Story:** As a user interacting with the verification overlay, I want the action buttons to be arranged appropriately for my screen size, so that they are easy to tap/click without accidental presses.

#### Acceptance Criteria

1. WHEN the layout is vertical THEN buttons SHALL stack vertically
2. WHEN the layout is horizontal THEN buttons SHALL display in a horizontal row
3. WHEN the layout is vertical THEN each button SHALL take full width
4. WHEN the layout is horizontal THEN buttons SHALL have minimum width of 120px
5. WHEN the layout is vertical THEN button padding SHALL be 6px 12px
6. WHEN the layout is horizontal THEN button padding SHALL be 10px 24px
7. WHEN the layout is vertical THEN button gap SHALL be 0.375rem
8. WHEN the layout is horizontal THEN button gap SHALL be 1rem
9. WHEN buttons are displayed THEN they SHALL maintain proper touch target size (minimum 44x44px)
10. WHEN buttons are stacked vertically THEN the primary action SHALL be positioned first

### Requirement 7: Token Display Adaptation

**User Story:** As a user who needs to copy the verification token, I want the token display to adapt to my screen size, so that I can easily view and copy the token regardless of device.

#### Acceptance Criteria

1. WHEN the layout is vertical THEN the token display SHALL stack vertically (token value above actions)
2. WHEN the layout is horizontal THEN the token display SHALL be horizontal (token value beside actions)
3. WHEN the layout is vertical THEN the token value font SHALL be 0.625rem
4. WHEN the layout is horizontal THEN the token value font SHALL be 0.875rem
5. WHEN the layout is vertical THEN token actions SHALL center horizontally
6. WHEN the layout is horizontal THEN token actions SHALL align to the right
7. WHEN the layout is vertical THEN the token section padding SHALL be 0.5rem
8. WHEN the layout is horizontal THEN the token section padding SHALL be 1rem
9. WHEN the token is displayed THEN it SHALL always be fully visible without horizontal scrolling
10. WHEN the copy button is clicked THEN it SHALL provide visual feedback regardless of layout

### Requirement 8: Smooth Layout Transitions

**User Story:** As a user resizing my browser or rotating my device, I want the overlay layout to transition smoothly between vertical and horizontal modes, so that the change is not jarring or disruptive.

#### Acceptance Criteria

1. WHEN the canvas crosses the 785px threshold THEN the layout SHALL transition smoothly
2. WHEN the layout transitions THEN it SHALL complete within 300ms
3. WHEN the layout transitions THEN content SHALL not flicker or jump
4. WHEN the layout transitions THEN the overlay SHALL remain visible throughout
5. IF prefers-reduced-motion is enabled THEN transitions SHALL be instant
6. WHEN the layout transitions THEN focus SHALL be maintained on the current element
7. WHEN the layout transitions THEN scroll position SHALL be preserved if applicable
8. WHEN the layout transitions THEN no content SHALL be temporarily hidden or clipped
9. WHEN the layout transitions THEN the card SHALL smoothly reposition from center to left or vice versa
10. WHEN the layout transitions THEN all animations SHALL use ease-in-out timing

### Requirement 9: Container Query Support

**User Story:** As a developer embedding the captcha in various container sizes, I want the overlay to respond to its container size rather than viewport size, so that it works correctly in sidebars, modals, and other constrained layouts.

#### Acceptance Criteria

1. WHEN the captcha is in a container THEN the overlay SHALL detect the container width
2. WHEN the container is less than 785px wide THEN the overlay SHALL use vertical layout
3. WHEN the container is 785px or wider THEN the overlay SHALL use horizontal layout
4. WHEN the container size changes THEN the overlay SHALL update its layout accordingly
5. IF container queries are not supported THEN the overlay SHALL fall back to viewport-based detection
6. WHEN multiple captcha instances exist in different sized containers THEN each SHALL have independent layout
7. WHEN the container is in a CSS Grid or Flexbox THEN the overlay SHALL detect size correctly
8. WHEN the container has padding or borders THEN the overlay SHALL account for content box sizing
9. WHEN the container is hidden and then shown THEN the overlay SHALL recalculate layout
10. WHEN the overlay is rendered THEN it SHALL use the most accurate size detection method available

### Requirement 10: Accessibility and Screen Reader Support

**User Story:** As a user with accessibility needs, I want the verification overlay to remain accessible regardless of layout mode, so that I can use screen readers and keyboard navigation effectively.

#### Acceptance Criteria

1. WHEN the layout changes THEN screen readers SHALL announce the layout mode
2. WHEN the layout is vertical THEN keyboard navigation SHALL follow logical top-to-bottom order
3. WHEN the layout is horizontal THEN keyboard navigation SHALL follow logical left-to-right order
4. WHEN the overlay appears THEN focus SHALL move to the first interactive element
5. WHEN buttons are stacked vertically THEN tab order SHALL be top to bottom
6. WHEN buttons are horizontal THEN tab order SHALL be left to right
7. WHEN the layout changes THEN ARIA labels SHALL remain accurate
8. WHEN content is scrollable THEN screen readers SHALL announce scrollable region
9. WHEN the overlay is displayed THEN it SHALL have proper ARIA role and properties
10. WHEN the layout transitions THEN focus SHALL not be lost or moved unexpectedly

---

## Non-Functional Requirements

### Performance

- Layout detection must complete within 50ms
- Layout transitions must complete within 300ms
- No layout thrashing or reflow loops
- Memory usage must remain stable across layout changes

### Compatibility

- Must work on all browsers supporting CSS Container Queries (Chrome 105+, Safari 16+, Firefox 110+)
- Must provide fallback for browsers without container query support
- Must work with both mouse and touch input
- Must support screen sizes from 320px to 3840px

### Accessibility

- Must maintain WCAG 2.1 AA compliance in both layouts
- Must respect prefers-reduced-motion preference
- Must support keyboard navigation in both layouts
- Must provide proper ARIA announcements for layout changes

### Maintainability

- Layout logic must be centralized and reusable
- CSS must use modern layout techniques (Flexbox, Grid)
- Code must maintain >90% test coverage
- Must follow existing library patterns and conventions

---

## Success Metrics

1. **Layout Detection Accuracy**: 100% correct layout selection based on canvas width across all test cases
2. **No Overflow**: 0 instances of content overflow in vertical layout on screens 320px-784px
3. **Smooth Transitions**: 95% of layout transitions complete within 300ms on mid-range devices
4. **Accessibility**: 100% WCAG 2.1 AA compliance maintained in both layouts
5. **User Satisfaction**: No user reports of overlay overflow or positioning issues on small screens
6. **Performance**: Layout detection adds <5ms to render time
7. **Cross-Browser**: Works correctly in 100% of supported browsers

---

## Out of Scope

The following items are explicitly out of scope for this feature:

1. Changing the verification logic or security mechanisms
2. Adding new verification modes
3. Modifying the dice rolling or physics simulation
4. Creating custom overlay themes or skins
5. Adding animation effects beyond layout transitions
6. Implementing drag-and-drop overlay positioning
7. Adding user preferences for layout mode
8. Creating a configuration UI for overlay settings
9. **Modifying the verification-display component** - This feature ONLY affects control-overlay
10. **Modifying the dice-canvas component** - No changes to canvas rendering
11. **Modifying the ngx-dice-captcha main component** - Only control-overlay is updated
12. **Breaking existing control-overlay functionality** - All current features must continue working

---

## Dependencies

- Angular 20.x with signals
- CSS Container Queries (with fallback)
- ResizeObserver API
- Modern CSS Flexbox and Grid

---

## Assumptions

1. The canvas container has defined dimensions
2. Users have JavaScript enabled
3. The overlay is rendered within the canvas container
4. The library is used in a client-side rendered application
5. Developers will test the overlay in their specific layouts

---

## Risks and Mitigations

| Risk                                  | Impact | Probability | Mitigation                                  |
| ------------------------------------- | ------ | ----------- | ------------------------------------------- |
| Container query browser support       | Medium | Low         | Implement ResizeObserver fallback           |
| Layout thrashing during resize        | Medium | Medium      | Debounce resize detection, use RAF          |
| Content clipping in vertical layout   | High   | Low         | Implement scrolling, test thoroughly        |
| Breaking existing custom CSS          | Medium | Low         | Use scoped styles, maintain specificity     |
| Performance impact on low-end devices | Low    | Low         | Optimize layout detection, minimize reflows |
| Accessibility regression              | High   | Low         | Comprehensive accessibility testing         |

---

## Acceptance Testing Scenarios

### Scenario 1: Vertical Layout on Mobile

1. Open CAPTCHA on mobile device (375px width)
2. Complete verification to show overlay
3. Verify overlay is positioned at top-left
4. Verify all content is visible without scrolling horizontally
5. Verify buttons are stacked vertically
6. Verify dice values use 2-column grid
7. Verify no content overflow

### Scenario 2: Horizontal Layout on Desktop

1. Open CAPTCHA on desktop (1920px width)
2. Complete verification to show overlay
3. Verify overlay is centered horizontally
4. Verify buttons are in a horizontal row
5. Verify dice values use auto-fit grid
6. Verify standard font sizes and spacing

### Scenario 3: Layout Transition on Resize

1. Open CAPTCHA at 1024px width (horizontal layout)
2. Complete verification to show overlay
3. Resize window to 600px width
4. Verify smooth transition to vertical layout
5. Verify no content flicker or jump
6. Verify all content remains visible

### Scenario 4: Container Query Detection

1. Embed CAPTCHA in 400px wide sidebar
2. Complete verification
3. Verify vertical layout is used despite wide viewport
4. Embed CAPTCHA in 1000px wide main content
5. Complete verification
6. Verify horizontal layout is used

### Scenario 5: Accessibility in Both Layouts

1. Enable screen reader
2. Test vertical layout (600px width)
3. Verify logical tab order (top to bottom)
4. Verify screen reader announces layout
5. Test horizontal layout (1200px width)
6. Verify logical tab order (left to right)
7. Verify all content is accessible

### Scenario 6: Reduced Motion Preference

1. Enable prefers-reduced-motion
2. Resize from 1024px to 600px
3. Verify instant layout change (no animation)
4. Verify content is still properly positioned
5. Verify no visual glitches

### Scenario 7: Multiple Dice Counts

1. Test with 2 dice in vertical layout
2. Verify 2-column grid (1 row)
3. Test with 4 dice in vertical layout
4. Verify 2-column grid (2 rows)
5. Test with 6 dice in vertical layout
6. Verify 2-column grid (3 rows)
7. Verify all layouts fit without overflow

### Scenario 8: Token Display in Both Layouts

1. Complete verification with token display
2. Test vertical layout (600px)
3. Verify token stacks vertically
4. Verify copy button is accessible
5. Test horizontal layout (1200px)
6. Verify token displays horizontally
7. Verify copy functionality works in both layouts
