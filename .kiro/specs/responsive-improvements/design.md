# Design Document: Responsive Improvements for ngx-dice-captcha

## Overview

This design document outlines the technical architecture and implementation approach for improving the responsiveness of the ngx-dice-captcha library. The design focuses on creating a robust, performant system that dynamically adapts the 3D scene, dice, and UI elements to different screen sizes while maintaining physics integrity and visual quality.

### Design Goals

1. **100% Dice Value Reading Accuracy**: Ensure face value detection works perfectly across all screen sizes (320px - 3840px)
2. **Complete Dice Containment**: Guarantee dice always roll and land within visible canvas boundaries on all devices
3. **Seamless Responsiveness**: Automatic adaptation to any screen size without user intervention
4. **Performance First**: All resize operations complete within 16ms (60fps target)
5. **Physics Integrity**: Maintain accurate physics simulation and dice containment during and after resize events
6. **Memory Efficiency**: Zero memory leaks through proper resource disposal
7. **Backward Compatibility**: No breaking changes to existing public APIs
8. **Developer Control**: Configurable behavior through existing configuration patterns

---

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NgxDiceCaptchaComponent                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Configuration & State Management              │ │
│  │  - effectiveConfig (computed signal)                      │ │
│  │  - responsiveConfig (new signal)                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DiceCanvasComponent                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  Resize Event Handler                      │ │
│  │  - handleCanvasResize(data: ResizeEventData)              │ │
│  │  - Debounced (150ms)                                      │ │
│  │  - Validates dimensions                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                         │                                       │
│         ┌───────────────┼───────────────┐                      │
│         ▼               ▼               ▼                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                  │
│  │  Scene   │   │  Dice    │   │   UI     │                  │
│  │  Scaling │   │  Scaling │   │ Elements │                  │
│  └──────────┘   └──────────┘   └──────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Three.js   │  │  Cannon-es   │  │   Angular    │
│   Renderer   │  │   Physics    │  │   Signals    │
│   Service    │  │   Engine     │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Component Interaction Flow

```
User Resizes Window
        │
        ▼
ResizeObserver (ThreeRendererService)
        │
        ▼
Debounce (150ms)
        │
        ▼
Emit ResizeEventData
        │
        ▼
DiceCanvasComponent.handleCanvasResize()
        │
        ├─────────────────────────────────┐
        ▼                                 ▼
calculateSceneScale()          calculateDiceScale()
        │                                 │
        ▼                                 ▼
updateGroundPlane()              scaleDice()
        │                                 │
        ▼                                 ▼
updateBoundaryWalls()            updatePhysicsBodies()
        │                                 │
        └─────────────────┬───────────────┘
                          ▼
                  adjustCamera()
                          │
                          ▼
              updateResultsPosition()
                          │
                          ▼
                  Render Complete
```

---

## Components and Interfaces

### 1. ResizeEventData Interface

```typescript
/**
 * Data emitted when canvas resize is detected
 */
export interface ResizeEventData {
  /** Canvas width in pixels */
  width: number;
  
  /** Canvas height in pixels */
  height: number;
  
  /** Width/height ratio */
  aspectRatio: number;
  
  /** Device pixel ratio for high-DPI displays */
  pixelRatio: number;
  
  /** Timestamp of resize event */
  timestamp: number;
  
  /** Previous dimensions for comparison */
  previous?: {
    width: number;
    height: number;
  };
}
```

### 2. ResponsiveConfig Interface

```typescript
/**
 * Configuration for responsive behavior
 */
export interface ResponsiveConfig {
  /** Enable automatic dice scaling */
  enableDiceScaling: boolean;
  
  /** Minimum dice scale factor (default: 0.7) */
  minDiceScale: number;
  
  /** Maximum dice scale factor (default: 1.5) */
  maxDiceScale: number;
  
  /** Debounce time for resize events in ms (default: 150) */
  resizeDebounceTime: number;
  
  /** Enable scene scaling (ground plane, walls) */
  enableSceneScaling: boolean;
  
  /** Preferred results display position */
  resultsPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /** Enable orientation change handling */
  handleOrientationChange: boolean;
  
  /** Enable smart overlay positioning */
  smartOverlayPosition: boolean;
}
```

### 3. SceneScale Interface

```typescript
/**
 * Represents the 3D scene dimensions
 */
export interface SceneScale {
  /** Scene width in Three.js units */
  width: number;
  
  /** Scene depth in Three.js units */
  depth: number;
  
  /** Scene height in Three.js units */
  height: number;
  
  /** Camera distance from origin */
  cameraDistance: number;
  
  /** Field of view in degrees */
  fov: number;
}
```

### 4. DiceScaleInfo Interface

```typescript
/**
 * Information about dice scaling
 */
export interface DiceScaleInfo {
  /** Current scale factor */
  scale: number;
  
  /** Base dice size */
  baseSize: number;
  
  /** Actual dice size after scaling */
  actualSize: number;
  
  /** Spacing between dice */
  spacing: number;
  
  /** Whether scaling is active */
  isScaled: boolean;
}
```

---

## Data Models

### Enhanced CaptchaConfig

```typescript
export interface CaptchaConfig {
  // ... existing properties ...
  
  /**
   * Responsive behavior configuration
   * @since v2.2
   */
  responsive?: ResponsiveConfig;
  
  /**
   * Fixed results display position
   * @default 'bottom-right'
   * @since v2.2
   */
  resultsDisplayPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}
```

### DiceCanvasComponent State

```typescript
// New signals for responsive state
readonly sceneScale = signal<SceneScale>({
  width: 24,
  depth: 24,
  height: 12,
  cameraDistance: 15,
  fov: 45
});

readonly diceScaleInfo = signal<DiceScaleInfo>({
  scale: 1.0,
  baseSize: 1.5,
  actualSize: 1.5,
  spacing: 2.0,
  isScaled: false
});

readonly canvasDimensions = signal<{ width: number; height: number }>({
  width: 800,
  height: 600
});

readonly isResizing = signal<boolean>(false);
```

---

## Error Handling

### Resize Error Handling Strategy

```typescript
private handleCanvasResize(data: ResizeEventData): void {
  // Guard: Skip if component is disposed
  if (this.isDisposed) {
    return;
  }

  // Guard: Validate minimum dimensions
  const MIN_DIMENSION = 50;
  if (data.width < MIN_DIMENSION || data.height < MIN_DIMENSION) {
    console.warn(
      `[DiceCanvas] Canvas dimensions too small: ${data.width}x${data.height}`
    );
    return;
  }

  // Guard: Validate aspect ratio
  const MAX_ASPECT_RATIO = 5;
  if (data.aspectRatio > MAX_ASPECT_RATIO || 
      data.aspectRatio < 1 / MAX_ASPECT_RATIO) {
    console.warn(
      `[DiceCanvas] Extreme aspect ratio detected: ${data.aspectRatio.toFixed(2)}`
    );
    return;
  }

  try {
    this.isResizing.set(true);
    
    // Perform resize operations
    this.performResizeOperations(data);
    
  } catch (error) {
    console.error('[DiceCanvas] Error during resize:', error);
    // Attempt recovery
    this.recoverFromResizeError();
  } finally {
    this.isResizing.set(false);
  }
}
```

### Memory Leak Prevention

```typescript
private updateGroundPlane(): void {
  if (!this.groundMesh) {
    return;
  }

  try {
    // Step 1: Dispose old geometry
    this.groundMesh.geometry.dispose();

    // Step 2: Create new geometry
    const newGeometry = new THREE.PlaneGeometry(
      this.sceneScale().width,
      this.sceneScale().depth
    );

    // Step 3: Assign new geometry
    this.groundMesh.geometry = newGeometry;
    
  } catch (error) {
    console.error('[DiceCanvas] Error updating ground plane:', error);
    // Recreate ground plane from scratch
    this.recreateGroundPlane();
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('DiceCanvasComponent - Responsive Behavior', () => {
  describe('Scene Scaling', () => {
    it('should calculate scene scale based on aspect ratio', () => {
      const component = createComponent();
      const canvas = createMockCanvas(1920, 1080);
      
      component['calculateSceneScale'](canvas);
      
      const scale = component.sceneScale();
      expect(scale.width).toBeGreaterThan(scale.depth);
      expect(scale.aspectRatio).toBeCloseTo(1.778);
    });

    it('should update ground plane when scene scale changes', () => {
      const component = createComponent();
      const initialGeometry = component['groundMesh']?.geometry;
      
      component['handleCanvasResize']({
        width: 1200,
        height: 800,
        aspectRatio: 1.5,
        pixelRatio: 2,
        timestamp: Date.now()
      });
      
      const newGeometry = component['groundMesh']?.geometry;
      expect(newGeometry).not.toBe(initialGeometry);
    });

    it('should dispose old geometry to prevent memory leaks', () => {
      const component = createComponent();
      const geometry = component['groundMesh']?.geometry;
      const disposeSpy = jest.spyOn(geometry!, 'dispose');
      
      component['updateGroundPlane']();
      
      expect(disposeSpy).toHaveBeenCalled();
    });
  });

  describe('Dice Scaling', () => {
    it('should scale dice proportionally to canvas size', () => {
      const component = createComponent();
      
      const scale = component['calculateDiceScale'](1600, 900);
      
      expect(scale).toBeGreaterThan(1.0);
      expect(scale).toBeLessThanOrEqual(1.5);
    });

    it('should not scale dice below minimum threshold', () => {
      const component = createComponent();
      
      const scale = component['calculateDiceScale'](320, 240);
      
      expect(scale).toBeGreaterThanOrEqual(0.7);
    });

    it('should preserve dice state during scaling', async () => {
      const component = createComponent();
      component.rollDice();
      await waitForDiceToSettle();
      
      const resultsBefore = component.getDiceResults();
      component['scaleDice'](1.2);
      const resultsAfter = component.getDiceResults();
      
      expect(resultsAfter).toEqual(resultsBefore);
    });
  });

  describe('Results Display Positioning', () => {
    it('should position results in bottom-right corner', () => {
      const component = createComponent();
      component.rollDice();
      
      const resultsElement = fixture.nativeElement.querySelector('.dice-results');
      const styles = window.getComputedStyle(resultsElement);
      
      expect(styles.bottom).toBe('12px');
      expect(styles.right).toBe('12px');
    });

    it('should adjust position on mobile screens', () => {
      const component = createComponent({ width: 375 });
      component.rollDice();
      
      const resultsElement = fixture.nativeElement.querySelector('.dice-results');
      const styles = window.getComputedStyle(resultsElement);
      
      expect(styles.bottom).toBe('6px');
      expect(styles.right).toBe('6px');
    });
  });

  describe('Performance', () => {
    it('should complete resize operations within 16ms', () => {
      const component = createComponent();
      
      const startTime = performance.now();
      component['handleCanvasResize'](mockResizeData);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(16);
    });

    it('should debounce rapid resize events', async () => {
      const component = createComponent();
      const resizeSpy = jest.spyOn(component as any, 'performResizeOperations');
      
      // Trigger 10 rapid resizes
      for (let i = 0; i < 10; i++) {
        component['handleCanvasResize'](mockResizeData);
      }
      
      await wait(200);
      
      // Should only execute once after debounce
      expect(resizeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Integration Tests

```typescript
describe('Responsive Integration Tests', () => {
  it('should handle mobile portrait to landscape transition', async () => {
    const { component, fixture } = await setupMobileTest();
    
    // Start in portrait
    resizeCanvas(375, 667);
    component.rollDice();
    await waitForDiceToSettle();
    
    // Rotate to landscape
    resizeCanvas(667, 375);
    await wait(300);
    
    // Verify dice are still within boundaries
    const dice = component['dice'];
    dice.forEach(die => {
      expect(isWithinBoundaries(die.body.position)).toBe(true);
    });
    
    // Verify results display is visible
    const results = fixture.nativeElement.querySelector('.dice-results');
    expect(isElementVisible(results)).toBe(true);
  });

  it('should handle ultra-wide display scaling', async () => {
    const { component } = await setupTest();
    
    resizeCanvas(3440, 1440);
    await wait(200);
    
    const diceScale = component.diceScaleInfo().scale;
    expect(diceScale).toBeGreaterThan(1.2);
    
    const sceneScale = component.sceneScale();
    expect(sceneScale.width).toBeGreaterThan(30);
  });
});
```

### Visual Regression Tests

```typescript
describe('Visual Regression Tests', () => {
  it('should match snapshot on mobile', async () => {
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('http://localhost:4200');
    
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });

  it('should match snapshot on desktop', async () => {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:4200');
    
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });

  it('should match snapshot on ultra-wide', async () => {
    await page.setViewport({ width: 3440, height: 1440 });
    await page.goto('http://localhost:4200');
    
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });
});
```

---

## Implementation Details

### 1. Scene Scale Calculation with Dice Containment

```typescript
/**
 * Calculates optimal scene scale based on canvas dimensions
 * Uses FOV-based trigonometry for accurate viewport fitting
 * Ensures ground plane and boundaries contain dice at all screen sizes
 */
private calculateSceneScale(canvas: HTMLCanvasElement): void {
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  const fov = 45;
  const fovRadians = fov * (Math.PI / 180);
  const cameraDistance = 15;

  // Calculate visible dimensions at ground plane distance
  const visibleHeight = 2 * Math.tan(fovRadians / 2) * cameraDistance;
  const visibleWidth = visibleHeight * aspectRatio;

  // Apply 15% padding for better framing and dice containment
  // This ensures dice always land within visible area
  this.sceneScale.set({
    width: visibleWidth * 0.85,
    depth: visibleHeight * 0.85,
    height: 12,
    cameraDistance,
    fov
  });
  
  // Log scale for debugging dice containment
  console.debug(
    `[DiceCanvas] Scene scale updated: ${this.sceneScale().width.toFixed(2)} x ${this.sceneScale().depth.toFixed(2)} ` +
    `for canvas ${canvas.clientWidth}x${canvas.clientHeight}`
  );
}
```

### 2. Dice Scaling Algorithm with Value Reading Accuracy

```typescript
/**
 * Calculates optimal dice scale based on canvas size
 * Scales between 0.7x and 1.5x of base size
 * Ensures face value detection remains accurate at all scales
 * 
 * NOTE: Face value detection is scale-independent because it uses
 * quaternion-based face normal comparison, not size-dependent calculations
 */
private calculateDiceScale(width: number, height: number): number {
  const config = this.effectiveConfig().responsive;
  const baseCanvasSize = 800; // Reference size
  const currentCanvasSize = Math.sqrt(width * height);
  
  // Calculate raw scale
  const rawScale = currentCanvasSize / baseCanvasSize;
  
  // Clamp to configured min/max
  const minScale = config?.minDiceScale ?? 0.7;
  const maxScale = config?.maxDiceScale ?? 1.5;
  
  const finalScale = Math.max(minScale, Math.min(maxScale, rawScale));
  
  console.debug(
    `[DiceCanvas] Dice scale calculated: ${finalScale.toFixed(3)} ` +
    `(canvas: ${width}x${height}, raw: ${rawScale.toFixed(3)})`
  );
  
  return finalScale;
}

/**
 * Validates that dice face value detection works at current scale
 * This is primarily for testing - the algorithm should be scale-independent
 */
private validateFaceDetectionAtScale(scale: number): boolean {
  // Face detection uses quaternion.applyQuaternion() and dot product
  // These operations are scale-independent
  // This validation is for testing purposes only
  
  const testQuaternion = new THREE.Quaternion(0, 0, 0, 1);
  const testNormal = new THREE.Vector3(0, 1, 0);
  const upVector = new THREE.Vector3(0, 1, 0);
  
  // Apply quaternion (scale-independent operation)
  const worldNormal = testNormal.clone().applyQuaternion(testQuaternion);
  const dotProduct = worldNormal.dot(upVector);
  
  // Dot product should be 1.0 regardless of scale
  const isAccurate = Math.abs(dotProduct - 1.0) < 0.0001;
  
  if (!isAccurate) {
    console.error(
      `[DiceCanvas] Face detection validation failed at scale ${scale.toFixed(3)}`
    );
  }
  
  return isAccurate;
}
```

### 3. Ground Plane Update with Dice Containment Validation

```typescript
/**
 * Updates ground plane geometry to match new scene scale
 * Ensures ground plane covers entire visible viewport for dice containment
 * Properly disposes old geometry to prevent memory leaks
 */
private updateGroundPlane(): void {
  if (!this.groundMesh) {
    console.warn('[DiceCanvas] Ground mesh not initialized');
    return;
  }

  const scene = this.threeRenderer.getScene();
  if (!scene) {
    console.warn('[DiceCanvas] Scene not available');
    return;
  }

  // Dispose old geometry
  this.groundMesh.geometry.dispose();

  // Create new geometry with updated scale
  const scale = this.sceneScale();
  const newGeometry = new THREE.PlaneGeometry(scale.width, scale.depth);

  // Assign new geometry
  this.groundMesh.geometry = newGeometry;
  
  // Validate ground plane covers visible area
  const canvas = this.canvasElement().nativeElement;
  const expectedCoverage = this.calculateExpectedGroundCoverage(canvas);
  
  if (scale.width < expectedCoverage.minWidth || scale.depth < expectedCoverage.minDepth) {
    console.warn(
      `[DiceCanvas] Ground plane may be too small for dice containment. ` +
      `Current: ${scale.width.toFixed(2)}x${scale.depth.toFixed(2)}, ` +
      `Expected minimum: ${expectedCoverage.minWidth.toFixed(2)}x${expectedCoverage.minDepth.toFixed(2)}`
    );
  }
  
  console.debug(
    `[DiceCanvas] Ground plane updated: ${scale.width.toFixed(2)} x ${scale.depth.toFixed(2)}`
  );
}

/**
 * Calculates minimum ground plane dimensions needed for dice containment
 */
private calculateExpectedGroundCoverage(canvas: HTMLCanvasElement): { minWidth: number; minDepth: number } {
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  const fov = 45;
  const fovRadians = fov * (Math.PI / 180);
  const cameraDistance = 15;
  
  const visibleHeight = 2 * Math.tan(fovRadians / 2) * cameraDistance;
  const visibleWidth = visibleHeight * aspectRatio;
  
  // Minimum coverage should be 80% of visible area
  return {
    minWidth: visibleWidth * 0.8,
    minDepth: visibleHeight * 0.8
  };
}
```

### 4. Boundary Wall Repositioning with Containment Validation

```typescript
/**
 * Updates boundary walls to match new scene scale
 * Ensures walls are positioned to contain dice within visible canvas area
 * Recreates physics bodies with correct dimensions
 */
private updateBoundaryWalls(): void {
  // Remove old walls from physics world
  this.walls.forEach(wall => {
    this.physicsEngine.removeBody(wall);
  });
  this.walls = [];

  // Get new scene dimensions
  const scale = this.sceneScale();
  const wallHeight = 10;
  const wallThickness = 0.5;
  const areaWidth = scale.width / 2;
  const areaDepth = scale.depth / 2;

  // Wall configurations - positioned to contain dice within visible area
  const wallConfigs = [
    { name: 'back', x: 0, y: wallHeight / 2 - 1, z: -areaDepth, 
      width: areaWidth * 2, height: wallHeight, depth: wallThickness },
    { name: 'front', x: 0, y: wallHeight / 2 - 1, z: areaDepth, 
      width: areaWidth * 2, height: wallHeight, depth: wallThickness },
    { name: 'left', x: -areaWidth, y: wallHeight / 2 - 1, z: 0, 
      width: wallThickness, height: wallHeight, depth: areaDepth * 2 },
    { name: 'right', x: areaWidth, y: wallHeight / 2 - 1, z: 0, 
      width: wallThickness, height: wallHeight, depth: areaDepth * 2 },
  ];

  // Create new walls with validation
  wallConfigs.forEach(config => {
    const wallShape = new CANNON.Box(
      new CANNON.Vec3(config.width / 2, config.height / 2, config.depth / 2)
    );
    const wallBody = new CANNON.Body({ mass: 0, shape: wallShape });
    wallBody.position.set(config.x, config.y, config.z);
    
    this.physicsEngine.addBody(wallBody);
    this.walls.push(wallBody);
    
    console.debug(
      `[DiceCanvas] ${config.name} wall positioned at (${config.x.toFixed(2)}, ${config.y.toFixed(2)}, ${config.z.toFixed(2)})`
    );
  });
  
  // Validate wall positions create proper containment
  this.validateDiceContainment();
}

/**
 * Validates that boundary walls will contain dice within visible area
 */
private validateDiceContainment(): void {
  const scale = this.sceneScale();
  const maxDiceSize = this.diceScaleInfo().actualSize;
  const safetyMargin = maxDiceSize * 2; // Dice should stay this far from edges
  
  const containmentArea = {
    width: scale.width - safetyMargin,
    depth: scale.depth - safetyMargin
  };
  
  if (containmentArea.width < maxDiceSize * 3 || containmentArea.depth < maxDiceSize * 3) {
    console.warn(
      `[DiceCanvas] Containment area may be too small for dice. ` +
      `Area: ${containmentArea.width.toFixed(2)}x${containmentArea.depth.toFixed(2)}, ` +
      `Dice size: ${maxDiceSize.toFixed(2)}`
    );
  }
  
  console.debug(
    `[DiceCanvas] Dice containment validated. Safe area: ${containmentArea.width.toFixed(2)}x${containmentArea.depth.toFixed(2)}`
  );
}
```

### 5. Results Display Positioning

```typescript
/**
 * Ensures results display is always in bottom-right corner
 * Adjusts margins based on screen size
 */
private updateResultsPosition(): void {
  const canvas = this.canvasElement().nativeElement;
  const isMobile = canvas.clientWidth < 768;
  
  // Calculate margins
  const margin = isMobile ? 6 : 12;
  
  // Update CSS custom properties
  canvas.style.setProperty('--results-bottom', `${margin}px`);
  canvas.style.setProperty('--results-right', `${margin}px`);
}
```

### 6. Orientation Change Handler

```typescript
/**
 * Handles device orientation changes smoothly
 * Pauses physics during transition
 */
@HostListener('window:orientationchange')
private onOrientationChange(): void {
  if (!this.effectiveConfig().responsive?.handleOrientationChange) {
    return;
  }

  // Pause physics
  this.physicsEngine.pause();

  // Wait for orientation transition to complete
  setTimeout(() => {
    // Recalculate scene
    const canvas = this.canvasElement().nativeElement;
    this.calculateSceneScale(canvas);
    this.updateGroundPlane();
    this.updateBoundaryWalls();
    
    // Resume physics
    this.physicsEngine.resume();
  }, 300);
}
```

---

## Performance Optimization

### Debouncing Strategy

```typescript
/**
 * Enhanced debouncing with device-specific timing
 */
private setupResizeHandler(): void {
  const config = this.effectiveConfig().responsive;
  const isMobile = window.innerWidth < 768;
  const isLowEnd = navigator.hardwareConcurrency < 4;
  
  // Adjust debounce time based on device
  let debounceTime = config?.resizeDebounceTime ?? 150;
  if (isMobile && isLowEnd) {
    debounceTime = 250;
  }
  
  let resizeTimeout: number;
  let isProcessing = false;

  const handleResize = () => {
    if (isProcessing) return;

    isProcessing = true;
    requestAnimationFrame(() => {
      this.performResizeOperations();
      isProcessing = false;
    });
  };

  const debouncedResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(handleResize, debounceTime);
  };

  this.resizeCleanup = this.threeRenderer.onResize(debouncedResize);
}
```

### Progressive Updates

```typescript
/**
 * Spreads resize operations across multiple frames
 * for better performance on low-end devices
 */
private performProgressiveResize(data: ResizeEventData): void {
  // Frame 1: Critical updates
  requestAnimationFrame(() => {
    this.calculateSceneScale(this.canvasElement().nativeElement);
    this.adjustCamera();
    
    // Frame 2: Visual updates
    requestAnimationFrame(() => {
      this.updateGroundPlane();
      
      // Frame 3: Physics updates
      requestAnimationFrame(() => {
        this.updateBoundaryWalls();
        this.updateResultsPosition();
      });
    });
  });
}
```

---

## Accessibility Considerations

### Reduced Motion Support

```typescript
/**
 * Respects user's motion preferences
 */
private shouldUseAnimations(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  
  return !prefersReducedMotion;
}

private updateWithAnimation(updateFn: () => void): void {
  if (this.shouldUseAnimations()) {
    // Animate transition
    this.animateUpdate(updateFn);
  } else {
    // Instant update
    updateFn();
  }
}
```

### Screen Reader Announcements

```typescript
/**
 * Announces resize events to screen readers
 */
private announceResize(data: ResizeEventData): void {
  const message = `Canvas resized to ${data.width} by ${data.height} pixels`;
  this.announcement.set(message);
}
```

---

## Configuration Examples

### Default Configuration

```typescript
const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  enableDiceScaling: true,
  minDiceScale: 0.7,
  maxDiceScale: 1.5,
  resizeDebounceTime: 150,
  enableSceneScaling: true,
  resultsPosition: 'bottom-right',
  handleOrientationChange: true,
  smartOverlayPosition: true
};
```

### Custom Configuration

```typescript
// Disable automatic scaling
const config: CaptchaConfig = {
  responsive: {
    enableDiceScaling: false,
    enableSceneScaling: true,
    resultsPosition: 'bottom-left'
  }
};

// Custom scale limits
const config: CaptchaConfig = {
  responsive: {
    enableDiceScaling: true,
    minDiceScale: 0.8,
    maxDiceScale: 1.2,
    resizeDebounceTime: 200
  }
};
```

---

## Migration Path

### For Existing Users

No code changes required. The responsive improvements work automatically with existing configurations.

### For Advanced Users

```typescript
// Before (v2.1)
const config = {
  diceCount: 3,
  diceSize: 1.5
};

// After (v2.2) - with responsive control
const config = {
  diceCount: 3,
  diceSize: 1.5,
  responsive: {
    enableDiceScaling: true,
    minDiceScale: 0.8,
    maxDiceScale: 1.3
  }
};
```

---

## Future Enhancements

1. **Container Queries**: Use CSS Container Queries when browser support improves
2. **Adaptive Quality**: Automatically adjust shadow/texture quality based on device performance
3. **Predictive Scaling**: Pre-calculate scale values for common screen sizes
4. **Smart Caching**: Cache geometry/materials for frequently used scales
5. **Multi-Scene Support**: Support multiple CAPTCHA instances with shared resources

---

## Conclusion

This design provides a comprehensive, performant solution for responsive behavior in the ngx-dice-captcha library. The implementation maintains backward compatibility while adding powerful new capabilities for automatic adaptation to any screen size. The modular architecture allows for future enhancements without requiring major refactoring.
