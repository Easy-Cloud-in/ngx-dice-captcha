# Implementation Plan: Responsive Improvements

This implementation plan breaks down the responsive improvements into discrete, manageable coding tasks. Each task builds incrementally on previous work and includes specific requirements references.

---

## Task List

- [x] 1. Create responsive configuration interfaces and models

  - Create `ResponsiveConfig` interface in `models/responsive-config.model.ts`
  - Create `SceneScale` interface in `models/scene-scale.model.ts`
  - Create `DiceScaleInfo` interface in `models/dice-scale-info.model.ts`
  - Update `CaptchaConfig` interface to include optional `responsive` property
  - Add default responsive configuration constant
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 2. Enhance ThreeRendererService with resize callback system

  - [x] 2.1 Add resize callback registration method `onResize()`

    - Implement callback array storage
    - Create method to register resize callbacks
    - Create method to unregister callbacks
    - Return cleanup function from `onResize()`
    - _Requirements: 1.3_

  - [x] 2.2 Update resize handler to notify callbacks

    - Modify existing `handleResize()` to emit `ResizeEventData`
    - Include previous dimensions in event data
    - Add timestamp to event data
    - Notify all registered callbacks
    - _Requirements: 1.3_

  - [x] 2.3 Add dimension validation guards
    - Validate minimum dimensions (50px)
    - Validate maximum aspect ratio (5:1)
    - Log warnings for invalid dimensions
    - Skip resize operations for invalid dimensions
    - _Requirements: 1.3, 7.2_

- [x] 3. Implement scene scale calculation and updates with dice containment

  - [x] 3.1 Create FOV-based scene scale calculation with containment validation

    - Implement `calculateSceneScale()` method using trigonometry
    - Calculate visible width and height based on camera FOV
    - Apply 15% padding for better framing and dice containment
    - Update `sceneScale` signal with new values
    - Add debug logging for scene dimensions
    - Create `calculateExpectedGroundCoverage()` helper method
    - _Requirements: 0.1, 0.2, 0.3, 1.1, 1.3, 1.7, 1.10_

  - [x] 3.2 Implement ground plane update method with coverage validation

    - Create `updateGroundPlane()` method
    - Dispose old geometry properly
    - Create new `PlaneGeometry` with updated scale
    - Assign new geometry to existing mesh
    - Validate ground plane covers visible viewport area
    - Add warning if ground plane is too small for dice containment
    - Add debug logging for ground plane dimensions
    - Add error handling and recovery
    - _Requirements: 0.1, 0.3, 1.1, 1.3, 1.4, 1.10, 7.6_

  - [x] 3.3 Implement boundary walls update method with containment validation
    - Create `updateBoundaryWalls()` method
    - Remove old wall bodies from physics world
    - Calculate new wall positions based on scene scale
    - Create new wall bodies with correct dimensions to contain dice
    - Add new walls to physics world
    - Add debug logging for wall positions
    - Create `validateDiceContainment()` method
    - Validate walls create proper containment area
    - Add warning if containment area is too small
    - _Requirements: 0.1, 0.3, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 4. Implement dice scaling system with value reading accuracy

  - [x] 4.1 Create dice scale calculation algorithm with accuracy validation

    - Implement `calculateDiceScale()` method
    - Calculate scale based on canvas area (sqrt of width \* height)
    - Apply configurable min/max scale limits (0.7 - 1.5)
    - Return clamped scale value
    - Add debug logging for scale calculations
    - Create `validateFaceDetectionAtScale()` method for testing
    - Document that face detection is scale-independent (uses quaternions)
    - _Requirements: 0.1, 0.2, 0.3, 0.8, 0.9, 2.1, 2.3, 2.4, 2.8, 2.9, 2.10_

  - [x] 4.2 Implement dice scaling method with state preservation

    - Create `scaleDice()` method
    - Check if dice are at rest before scaling
    - Scale Three.js mesh using `mesh.scale.setScalar()`
    - Store dice state (position, rotation, velocity)
    - Recreate physics bodies with new size matching visual mesh exactly
    - Restore dice state to new bodies
    - Validate dice remain within boundaries after scaling
    - _Requirements: 0.2, 0.9, 2.2, 2.6, 2.7_

  - [x] 4.3 Add texture quality preservation

    - Ensure textures remain sharp at different scales
    - Use mipmapping for smooth scaling
    - Test texture quality at min and max scales
    - _Requirements: 2.5_

  - [x] 4.4 Verify face value detection accuracy across scales
    - Test face value reading at 0.7x scale (mobile)
    - Test face value reading at 1.0x scale (base)
    - Test face value reading at 1.5x scale (ultra-wide)
    - Verify quaternion-based detection works identically at all scales
    - Add unit tests for scale-independent face detection
    - _Requirements: 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.10_

- [ ] 5. Implement main resize handler with containment validation

  - [x] 5.1 Create `handleCanvasResize()` method with validation

    - Add dimension validation guards
    - Set `isResizing` signal to true
    - Call `calculateSceneScale()`
    - Call `updateGroundPlane()`
    - Call `updateBoundaryWalls()`
    - Call `validateDiceContainment()`
    - Call `scaleDice()` if enabled
    - Call `adjustCamera()`
    - Verify dice are still within boundaries if they exist
    - Set `isResizing` signal to false
    - Add try-catch error handling
    - Add debug logging for resize operations
    - _Requirements: 0.1, 0.3, 1.1, 1.2, 1.3, 1.8, 1.9, 2.1_

  - [x] 5.2 Subscribe to resize events in ngOnInit

    - Call `threeRenderer.onResize()` with handler
    - Store cleanup function
    - Call cleanup in ngOnDestroy
    - _Requirements: 1.3_

  - [x] 5.3 Add runtime dice containment monitoring
    - Create method to check if dice are within boundaries
    - Monitor dice positions during physics simulation
    - Log warning if dice approach boundary edges
    - Log error if dice escape boundaries
    - Add telemetry for dice containment failures
    - _Requirements: 0.3, 1.3, 1.8, 1.9_

- [x] 6. Implement results display positioning

  - [x] 6.1 Update dice-canvas SCSS for fixed positioning

    - Ensure `.dice-results` uses absolute positioning
    - Set `bottom` and `right` properties
    - Add responsive margins (6px mobile, 12px desktop)
    - Ensure z-index is above overlay (1002)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.2 Add collision detection with overlay

    - Create method to detect overlay/results overlap
    - Adjust results position if overlap detected
    - Add configurable offset for spacing
    - _Requirements: 3.5_

  - [x] 6.3 Implement slide-in animation
    - Add `slideInFromRight` keyframe animation
    - Apply animation to `.dice-results`
    - Respect `prefers-reduced-motion` setting
    - _Requirements: 3.6, 8.1, 8.2_

- [x] 7. Implement orientation change handling

  - [x] 7.1 Add orientation change listener

    - Create `@HostListener('window:orientationchange')` method
    - Check if orientation handling is enabled in config
    - Pause physics simulation
    - _Requirements: 4.1, 4.4_

  - [x] 7.2 Implement scene recalculation on orientation change

    - Wait 300ms for orientation transition
    - Recalculate scene scale
    - Update ground plane and walls
    - Resume physics simulation
    - _Requirements: 4.2, 4.3, 4.5_

  - [x] 7.3 Handle overlay repositioning
    - Detect new orientation (portrait/landscape)
    - Reposition overlay based on orientation
    - Animate transition smoothly
    - _Requirements: 4.6, 4.7_

- [x] 8. Implement responsive control overlay

  - [x] 8.1 Add compact mode for small screens

    - Update control-overlay SCSS for screens < 600px
    - Reduce padding and font sizes
    - Adjust input field sizes
    - _Requirements: 5.1_

  - [x] 8.2 Add expanded mode for large screens

    - Update control-overlay SCSS for screens > 1024px
    - Increase padding and font sizes
    - Enlarge input fields and buttons
    - _Requirements: 5.2_

  - [x] 8.3 Implement smart positioning
    - Create method to detect available space
    - Calculate optimal overlay position
    - Avoid overlapping with results display
    - Animate position changes
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 9. Implement ultra-wide display support

  - [x] 9.1 Add ultra-wide detection and scaling

    - Detect canvas width > 2000px
    - Scale dice up to 1.5x
    - Expand scene scale proportionally
    - _Requirements: 6.1, 6.2_

  - [x] 9.2 Adjust layout for ultra-wide

    - Set maximum canvas height to 900px
    - Increase dice spacing
    - Maintain maximum aspect ratio of 3:1
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 9.3 Scale UI elements for ultra-wide
    - Increase control overlay size
    - Use larger font sizes in results display
    - Adjust margins and padding
    - _Requirements: 6.6, 6.7_

- [x] 10. Implement performance optimizations

  - [x] 10.1 Add device-specific debounce timing

    - Detect device capabilities (CPU cores)
    - Detect mobile vs desktop
    - Adjust debounce time (150ms desktop, 250ms low-end mobile)
    - _Requirements: 7.1, 7.5_

  - [x] 10.2 Implement progressive resize updates

    - Create `performProgressiveResize()` method
    - Spread updates across multiple frames using `requestAnimationFrame`
    - Update critical elements first (camera, renderer)
    - Update visual elements second (ground plane)
    - Update physics elements last (walls, dice)
    - _Requirements: 7.2_

  - [x] 10.3 Add memory leak prevention
    - Ensure all geometries are disposed before recreation
    - Track memory usage in development mode
    - Add disposal validation in tests
    - _Requirements: 7.3, 7.6_

- [x] 11. Implement accessibility features

  - [x] 11.1 Add reduced motion support

    - Create `shouldUseAnimations()` method
    - Check `prefers-reduced-motion` media query
    - Disable animations when reduced motion is preferred
    - Apply instant updates instead of animations
    - _Requirements: 8.1, 8.2_

  - [x] 11.2 Add screen reader announcements

    - Create `announceResize()` method
    - Update `announcement` signal with resize info
    - Announce "Canvas resized" to screen readers
    - _Requirements: 8.3_

  - [x] 11.3 Maintain focus and keyboard navigation

    - Preserve focus on current element during resize
    - Ensure keyboard navigation works after resize
    - Test tab order remains logical
    - _Requirements: 8.6, 8.7_

  - [x] 11.4 Ensure color contrast compliance
    - Verify results display maintains 4.5:1 contrast
    - Test in both light and dark modes
    - Validate with accessibility tools
    - _Requirements: 8.4_

- [x] 12. Add configuration and customization

  - [x] 12.1 Implement responsive config in CaptchaConfig

    - Add `responsive` property to config interface
    - Merge user config with defaults
    - Create computed signal for effective responsive config
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 12.2 Add enable/disable flags

    - Check `enableDiceScaling` before scaling dice
    - Check `enableSceneScaling` before updating scene
    - Check `handleOrientationChange` before handling orientation
    - _Requirements: 10.5_

  - [x] 12.3 Add custom scale limits

    - Use `minDiceScale` and `maxDiceScale` from config
    - Validate scale limits are within reasonable range
    - Apply limits in `calculateDiceScale()`
    - _Requirements: 10.6_

  - [x] 12.4 Add results position configuration
    - Read `resultsDisplayPosition` from config
    - Apply position to results display CSS
    - Support all four corner positions
    - _Requirements: 10.7_

- [ ] 13. Write comprehensive tests

  - [ ] 13.1 Write unit tests for dice value reading accuracy

    - Test face value detection at 0.7x scale (mobile)
    - Test face value detection at 1.0x scale (base)
    - Test face value detection at 1.5x scale (ultra-wide)
    - Test quaternion-based detection is scale-independent
    - Test face normal calculations work at all scales
    - Test 100 dice rolls at each scale for accuracy
    - Verify 100% accuracy across all scales
    - _Requirements: 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.10_

  - [ ] 13.2 Write unit tests for scene scaling and dice containment

    - Test `calculateSceneScale()` with various aspect ratios
    - Test ground plane update and disposal
    - Test ground plane covers visible viewport area
    - Test boundary wall repositioning
    - Test boundary walls contain dice within visible area
    - Test dimension validation guards
    - Test `validateDiceContainment()` method
    - Test dice cannot escape boundaries at any screen size
    - _Requirements: 0.1, 0.3, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ] 13.3 Write unit tests for dice scaling with accuracy

    - Test `calculateDiceScale()` with various canvas sizes
    - Test scale clamping to min/max limits
    - Test dice state preservation during scaling
    - Test physics body recreation matches visual mesh size
    - Test face value reading remains accurate after scaling
    - Test dice remain within boundaries after scaling
    - _Requirements: 0.2, 0.9, 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ] 13.4 Write unit tests for results positioning

    - Test bottom-right positioning
    - Test responsive margins
    - Test collision detection with overlay
    - Test animation application
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 13.5 Write integration tests for dice containment and accuracy

    - Test dice containment on mobile portrait (375x667)
    - Test dice containment on mobile landscape (667x375)
    - Test dice containment on tablet (768x1024 and 1024x768)
    - Test dice containment on desktop (1920x1080)
    - Test dice containment on ultra-wide (3440x1440)
    - Test dice value accuracy on all screen sizes (50 rolls each)
    - Test mobile portrait to landscape transition with dice containment
    - Test browser window resize with dice in motion
    - Test dice remain within boundaries during rapid resize
    - Test boundary walls prevent dice escape at all sizes
    - Test reduced motion preference
    - _Requirements: 0.1, 0.3, 0.4, 0.5, 0.6, 0.7, 0.10, 1.3, 1.8, 1.9_

  - [ ] 13.6 Write performance tests

    - Test resize operation completes within 16ms
    - Test debouncing of rapid events
    - Test memory usage remains stable
    - Test no memory leaks after 100 resizes
    - _Requirements: 7.1, 7.2, 7.3, 7.6_

  - [ ] 13.7 Write visual regression tests with dice containment

    - Create snapshots for mobile portrait with dice visible
    - Create snapshots for mobile landscape with dice visible
    - Create snapshots for tablet with dice visible
    - Create snapshots for desktop with dice visible
    - Create snapshots for ultra-wide with dice visible
    - Verify dice are within canvas boundaries in all snapshots
    - Verify ground plane covers visible area in all snapshots
    - _Requirements: 0.3, 1.3, 1.10, All requirements_

  - [ ] 13.8 Write dice value reading accuracy stress tests
    - Test 1000 dice rolls on mobile (320px-768px) - expect 100% accuracy
    - Test 1000 dice rolls on tablet (768px-1024px) - expect 100% accuracy
    - Test 1000 dice rolls on desktop (1024px-2560px) - expect 100% accuracy
    - Test 1000 dice rolls on ultra-wide (>2560px) - expect 100% accuracy
    - Test dice value reading during resize operations
    - Test dice value reading after orientation changes
    - Document any failures with detailed logs
    - _Requirements: 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.10_

- [ ] 14. Update documentation

  - [ ] 14.1 Update README with responsive features

    - Document new responsive configuration options
    - Add examples of custom responsive config
    - Explain automatic scaling behavior
    - Document results display positioning
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 14.2 Create responsive configuration guide

    - Document all `ResponsiveConfig` properties
    - Provide configuration examples
    - Explain when to enable/disable features
    - Add troubleshooting section
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 14.3 Update API documentation

    - Document new interfaces and types
    - Document new methods and signals
    - Add JSDoc comments to all new code
    - Update changelog with v2.2 features
    - _Requirements: 9.1, 9.2_

  - [ ] 14.4 Create migration guide
    - Explain backward compatibility
    - Show before/after configuration examples
    - Document any behavior changes
    - Provide upgrade checklist
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7_

- [ ] 15. Final integration and testing

  - [ ] 15.1 Test on real devices with dice containment and accuracy validation

    - Test on iPhone (portrait and landscape)
      - Roll dice 20 times, verify 100% value reading accuracy
      - Verify dice always land within canvas boundaries
      - Verify ground plane covers visible area
    - Test on Android phone (portrait and landscape)
      - Roll dice 20 times, verify 100% value reading accuracy
      - Verify dice always land within canvas boundaries
      - Verify ground plane covers visible area
    - Test on iPad (portrait and landscape)
      - Roll dice 20 times, verify 100% value reading accuracy
      - Verify dice always land within canvas boundaries
      - Verify ground plane covers visible area
    - Test on desktop browsers (Chrome, Firefox, Safari, Edge)
      - Roll dice 20 times each browser, verify 100% accuracy
      - Verify dice containment in all browsers
    - Test on ultra-wide monitor
      - Roll dice 20 times, verify 100% value reading accuracy
      - Verify dice scale appropriately and remain contained
      - Verify ground plane utilizes available width
    - _Requirements: 0.1, 0.3, 0.4, 0.5, 0.6, 0.7, 0.10, 1.3, 1.8, 1.9, All requirements_

  - [ ] 15.2 Perform accessibility audit

    - Run axe DevTools accessibility scan
    - Test with screen reader (NVDA/JAWS)
    - Test keyboard navigation
    - Verify WCAG 2.1 AA compliance
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 15.3 Perform performance audit

    - Run Lighthouse performance test
    - Profile resize operations in Chrome DevTools
    - Check memory usage over time
    - Verify 60fps during resize
    - _Requirements: 7.1, 7.2, 7.3, 7.6_

  - [ ] 15.4 Update demo application
    - Add responsive configuration examples
    - Add device size indicator
    - Add toggle for responsive features
    - Add performance metrics display
    - _Requirements: All requirements_

---

## Implementation Notes

### Task Dependencies

- Tasks 1-2 must be completed before task 3
- Task 3 must be completed before task 5
- Task 4 must be completed before task 5
- Tasks 6-9 can be done in parallel after task 5
- Task 10 should be done after tasks 3-5
- Task 11 can be done in parallel with tasks 6-9
- Task 12 can be done in parallel with tasks 6-11
- Task 13 should be done incrementally alongside implementation tasks
- Task 14 should be done after all implementation is complete
- Task 15 should be done last

### Estimated Timeline

- **Week 1**: Tasks 1-3 (Foundation and scene scaling)
- **Week 2**: Tasks 4-5 (Dice scaling and main handler)
- **Week 3**: Tasks 6-9 (UI positioning and responsive features)
- **Week 4**: Tasks 10-12 (Performance, accessibility, configuration)
- **Week 5**: Tasks 13-14 (Testing and documentation)
- **Week 6**: Task 15 (Final integration and testing)

### Testing Strategy

- Write unit tests alongside implementation (TDD approach)
- Run integration tests after each major feature
- Perform visual regression tests weekly
- Conduct performance tests before each milestone
- Schedule accessibility audit for week 5

### Code Review Checkpoints

1. After task 3: Review scene scaling implementation
2. After task 5: Review main resize handler
3. After task 9: Review all responsive features
4. After task 12: Review configuration system
5. After task 13: Review test coverage
6. After task 15: Final code review before release

---

## Success Criteria

- [ ] **Dice Value Reading Accuracy**: 100% accuracy in 1000 test rolls across all screen sizes (mobile, tablet, desktop, ultra-wide)
- [ ] **Dice Containment**: 100% of dice rolls result in dice landing within visible canvas boundaries on all screen sizes
- [ ] **Ground Plane Coverage**: Ground plane covers 100% of visible viewport area on all screen sizes with appropriate padding
- [ ] All unit tests pass with >90% coverage
- [ ] All integration tests pass including dice containment tests
- [ ] Visual regression tests show no unexpected changes and dice are always visible within canvas
- [ ] Performance tests show <16ms resize operations
- [ ] Accessibility audit shows WCAG 2.1 AA compliance
- [ ] Manual testing on all target devices successful with verified dice containment and accuracy
- [ ] Documentation complete and accurate
- [ ] Demo application showcases all features including dice containment validation
- [ ] No breaking changes to public API
- [ ] Memory leak tests pass (0 leaks after 100 resizes)
- [ ] Boundary wall effectiveness: 0 dice escapes in 1000 test rolls across all screen sizes
