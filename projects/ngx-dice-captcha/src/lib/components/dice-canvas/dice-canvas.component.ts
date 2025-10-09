import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  signal,
  computed,
  viewChild,
  output,
  input,
  ChangeDetectionStrategy,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ThreeRendererService } from '../../services/three-renderer.service';
import { PhysicsEngineService } from '../../services/physics-engine.service';
import { DiceFactoryService, DiceConfig } from '../../services/dice-factory.service';
import { Dice, DiceType } from '../../models/dice.model';
import { ResizeEventData } from '../../models/resize-event.model';
import { ResponsiveConfig } from '../../models/responsive-config.model';
import { AccessibilityDirective } from '../../directives/accessibility.directive';
import { DICE_CAPTCHA_I18N_TOKEN, DiceCaptchaI18n } from '../../tokens/dice-captcha-i18n.token';
import { ControlOverlayComponent } from '../control-overlay/control-overlay.component';

/**
 * Component responsible for rendering the 3D dice canvas and handling dice physics.
 *
 * Manages the Three.js scene, Cannon-es physics simulation, and dice rendering.
 * Uses Angular 20 signals and zoneless architecture with runOutsideAngular
 * for optimal performance. Provides full accessibility support through ARIA
 * labels and keyboard navigation.
 *
 * @example
 * ```typescript
 * <ngx-dice-canvas
 *   [diceCount]="3"
 *   [diceType]="DiceType.D6"
 *   [autoRoll]="false"
 *   (rollComplete)="onRollComplete($event)"
 *   (rollStarted)="onRollStarted()">
 * </ngx-dice-canvas>
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Component({
  selector: 'ngx-dice-canvas',
  standalone: true,
  imports: [CommonModule, AccessibilityDirective, ControlOverlayComponent],
  templateUrl: './dice-canvas.component.html',
  styleUrls: ['./dice-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ThreeRendererService, PhysicsEngineService, DiceFactoryService],
})
export class DiceCanvasComponent implements OnInit, OnDestroy {
  // Injected services
  private readonly threeRenderer = inject(ThreeRendererService);
  private readonly physicsEngine = inject(PhysicsEngineService);
  private readonly diceFactory = inject(DiceFactoryService);
  private readonly ngZone = inject(NgZone);
  readonly i18n = inject(DICE_CAPTCHA_I18N_TOKEN);

  // ViewChild for canvas and control overlay
  readonly canvasElement = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  readonly controlOverlay = viewChild<ControlOverlayComponent>('controlOverlay');

  // Inputs
  /**
   * Number of dice to create and display in the scene.
   * @default 3
   */
  readonly diceCount = input<number>(3);

  /**
   * Type of dice to use (D6, D8, D12, D20).
   * @default DiceType.D6
   */
  readonly diceType = input<DiceType>(DiceType.D6);

  /**
   * Whether to automatically roll dice when component initializes.
   * @default false
   */
  readonly autoRoll = input<boolean>(false);

  /**
   * Size of each dice in the 3D scene coordinate system.
   * Larger values create bigger dice.
   * @default 1.5
   */
  readonly diceSize = input<number>(1.5);

  /**
   * Enable reduced motion for accessibility compliance (WCAG 2.1).
   * Reduces animation speed and intensity.
   * @default false
   */
  readonly enableReducedMotion = input<boolean>(false);

  /**
   * Whether to show the control overlay (for overlay captcha mode).
   * @default true
   */
  readonly showOverlay = input<boolean>(true);

  /**
   * Position of the control overlay.
   * @default 'top-left'
   */
  readonly overlayPosition = input<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center'
  >('top-center');

  /**
   * Whether to use horizontal layout for the overlay (mobile).
   * @default false
   */
  readonly isHorizontalLayout = input<boolean>(false);

  /**
   * Whether the captcha is in cooldown mode
   * @default false
   */
  readonly isInCooldown = input<boolean>(false);

  /**
   * Time remaining in cooldown (seconds)
   * @default 0
   */
  readonly cooldownTimeRemaining = input<number>(0);

  /**
   * Responsive configuration for dynamic sizing
   * @since 2.2.0
   */
  readonly responsiveConfig = input<ResponsiveConfig>();

  /**
   * Position where results are displayed
   * @default 'bottom-right'
   */
  readonly resultsDisplayPosition = input<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >('bottom-right');

  /**
   * Maintain aspect ratio when resizing the canvas.
   * When true, the canvas will preserve the configured aspect ratio.
   * When false, the canvas will adapt to the container's dimensions.
   * @default true
   * @since 2.2.0
   */
  readonly maintainAspectRatio = input<boolean>(true);

  /**
   * Custom aspect ratio for the canvas (width:height).
   * Only applies when maintainAspectRatio is true.
   * Common values: 1.7778 (16:9), 1.3333 (4:3), 2.0 (2:1), 1.0 (square)
   * @default 1.7778
   * @since 2.2.0
   */
  readonly customAspectRatio = input<number>(1.7778);

  /**
   * Fill the parent container completely, ignoring aspect ratio.
   * When true, canvas stretches to fill 100% of container width and height.
   * @default false
   * @since 2.2.0
   */
  readonly fillContainer = input<boolean>(false);

  /**
   * Enable dynamic resizing of the 3D scene when container size changes.
   * When true, scene updates physics boundaries and camera on resize.
   * @default true
   * @since 2.2.0
   */
  readonly enableDynamicResize = input<boolean>(true);

  /**
   * Minimum size change in pixels to trigger a full scene update.
   * Prevents excessive updates during minor resize events.
   * @default 50
   * @since 2.2.0
   */
  readonly resizeThreshold = input<number>(50);

  // Outputs
  /**
   * Emitted when dice rolling is complete with final face values.
   * Values are 1-based (1-6 for D6, 1-8 for D8, etc.).
   */
  readonly rollComplete = output<number[]>();

  /**
   * Emitted when dice rolling animation starts.
   */
  readonly rollStarted = output<void>();

  /**
   * Emitted when verification is requested from the overlay.
   */
  readonly verificationRequested = output<{ diceValues: number[]; sum: number }>();

  // State signals
  readonly isRolling = signal<boolean>(false);
  readonly isInitialized = signal<boolean>(false);
  readonly diceResults = signal<number[]>([]);
  readonly reducedMotionActive = signal<boolean>(false);
  readonly announcement = signal<string>('');
  readonly diceRolled = signal<boolean>(false);

  // Computed signals
  readonly canInteract = computed(() => this.isInitialized() && !this.isRolling());

  // Private state
  private dice: Dice[] = [];
  private groundPlane?: CANNON.Body;
  private groundMesh?: THREE.Mesh;

  /**
   * Ground plane geometry reference for dynamic updates.
   * Stored to allow proper disposal and recreation during resize operations.
   * @private
   * @since 2.2.0
   */
  private groundGeometry?: THREE.PlaneGeometry;

  /**
   * Ground plane material reference for dynamic updates.
   * Stored to allow proper disposal and recreation during resize operations.
   * @private
   * @since 2.2.0
   */
  private groundMaterial?: THREE.ShadowMaterial;

  /**
   * Previous scene scale dimensions for delta calculation.
   * Used to determine if ground plane geometry needs to be updated.
   * @private
   * @since 2.2.0
   */
  private previousSceneScale?: { width: number; height: number; depth: number };

  private walls: CANNON.Body[] = [];
  private animationFrameId?: number;
  private isDisposed = false;
  private sceneScale = { width: 24, height: 12, depth: 24 };
  private resizeCleanup?: () => void;

  ngOnInit(): void {
    // Wait for view to be ready before initializing
    setTimeout(() => {
      this.initializeScene();
      if (this.autoRoll()) {
        this.rollDice();
      }

      // Initialize focus on roll button after scene is ready
      this.initializeFocus();
    }, 0);
  }

  /**
   * Initialize focus on the roll button
   * @private
   */
  private initializeFocus(): void {
    const overlay = this.controlOverlay();
    if (overlay) {
      setTimeout(() => {
        overlay.initializeFocus();
      }, 200); // Delay to ensure overlay is fully rendered
    }
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  /**
   * Initializes the Three.js scene and Cannon-es physics world.
   *
   * Sets up the renderer, camera, lighting, physics world, ground plane,
   * and creates all dice objects. Starts the render and physics loops.
   *
   * @private
   */
  private initializeScene(): void {
    const canvas = this.canvasElement().nativeElement;

    // Ensure canvas has explicit dimensions before initialization
    const container = canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Phase 2 - Task 2.3: Configure container behavior (fill-container, custom-aspect)
      this.configureContainerBehavior(container);
    }

    // Calculate scene scale based on canvas dimensions
    this.calculateSceneScale(canvas);

    // Initialize Three.js renderer
    this.threeRenderer.initializeScene(canvas);

    // Adjust camera based on scene scale
    this.adjustCamera();

    // Initialize physics world with stronger gravity for faster settling
    this.physicsEngine.initializeWorld(new CANNON.Vec3(0, -30, 0));

    // Create ground plane
    this.createGroundPlane();

    // Create boundary walls to contain dice
    this.createBoundaryWalls();

    // Create dice
    this.createDice();

    // Start render loop
    this.threeRenderer.startRenderLoop();

    // Start physics update loop
    this.startPhysicsLoop();

    // Subscribe to resize events
    this.resizeCleanup = this.threeRenderer.onResize((data) => {
      this.handleCanvasResize(data);
    });

    this.isInitialized.set(true);
  }

  /**
   * Configure container behavior based on fillContainer and aspect ratio settings.
   * Applies CSS classes and custom properties to control container sizing.
   *
   * Phase 2 - Task 2.3: Container Behavior Configuration
   * @param container The container element to configure
   * @private
   * @since 2.2.0
   */
  private configureContainerBehavior(container: HTMLElement): void {
    // Remove any existing mode classes to start fresh
    container.classList.remove('fill-container', 'custom-aspect');

    // Mode 1: Fill container mode - ignore aspect ratio
    if (this.fillContainer()) {
      container.classList.add('fill-container');
      return;
    }

    // Mode 2: Custom aspect ratio mode
    if (this.maintainAspectRatio()) {
      const aspectRatio = this.customAspectRatio();
      container.classList.add('custom-aspect');
      container.style.setProperty('--dice-canvas-aspect-ratio', aspectRatio.toString());
      return;
    }

    // Mode 3: Default mode - use CSS fallback (16:9)
  }

  /**
   * Handle canvas resize events with intelligent threshold-based updates
   *
   * Implements a two-tier resize strategy:
   * - Minor resizes (< threshold): Only adjust camera
   * - Major resizes (>= threshold): Full scene update including physics
   *
   * @param data Resize event data including delta and requiresSceneUpdate flag
   * @private
   * @since 2.2.0 Enhanced with threshold logic
   */
  private handleCanvasResize(data: ResizeEventData): void {
    // Guard: Skip if component is disposed
    if (this.isDisposed) {
      return;
    }

    // Guard: Check if dynamic resize is enabled
    if (!this.enableDynamicResize()) {
      return;
    }

    // Guard: Validate minimum dimensions to prevent rendering issues
    const MIN_DIMENSION = 50;
    if (data.width < MIN_DIMENSION || data.height < MIN_DIMENSION) {
      return;
    }

    // Guard: Validate aspect ratio to prevent extreme distortions
    const MAX_ASPECT_RATIO = 5; // Max 5:1 or 1:5
    if (data.aspectRatio > MAX_ASPECT_RATIO || data.aspectRatio < 1 / MAX_ASPECT_RATIO) {
      return;
    }

    const canvas = this.canvasElement().nativeElement;

    try {
      // Check if this is a major resize requiring full scene update
      const requiresFullUpdate = data.requiresSceneUpdate ?? true;

      if (!requiresFullUpdate && data.delta) {
        // Minor resize: Only adjust camera for small changes
        this.adjustCamera();
        return;
      }

      // Major resize: Execute full pipeline

      // Step 1: Recalculate scene dimensions based on new aspect ratio
      this.calculateSceneScale(canvas);

      // Step 2: Adjust camera for new scene scale
      this.adjustCamera();

      // Step 3: Update ground plane geometry (Phase 4 implementation)
      this.updateGroundPlaneGeometry();

      // Step 4: Update physics boundaries (Phase 5 implementation)
      this.updatePhysicsBoundaries();

      // Step 5: Validate dice positions (Phase 5 implementation)
      this.validateDicePositions();
    } catch (error) {
      // Don't rethrow - allow the application to continue
    }
  }

  /**
   * Calculates scene scale based on canvas aspect ratio.
   * This ensures the scene fits properly regardless of canvas size.
   *
   * @private
   */
  private calculateSceneScale(canvas: HTMLCanvasElement): void {
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;

    // Calculate scene size based on camera FOV to fill entire viewport
    // FOV is 45 degrees, camera will be positioned to see the entire plane
    const fov = 45;
    const fovRadians = fov * (Math.PI / 180);

    // We want the ground plane to fill the viewport
    // Using a fixed camera distance and calculating plane size from it
    const cameraDistance = 15; // Fixed camera distance

    // Calculate the visible height at the ground plane distance
    const baseHeight = 2 * Math.tan(fovRadians / 2) * cameraDistance;

    // Calculate visible width based on aspect ratio
    const baseWidth = baseHeight * aspectRatio;

    // Use MINIMUM dimension scaling to prevent excessive growth on small screens
    const minDimension = Math.min(baseWidth, baseHeight);
    const maxDimension = Math.max(baseWidth, baseHeight);
    const dimensionRatio = maxDimension / minDimension;

    // Cap the dimension ratio to prevent extreme distortions (especially in portrait mode)
    const MAX_RATIO = 2.5;
    const constrainedRatio = Math.min(dimensionRatio, MAX_RATIO);

    // Responsive scaling factor: Create tighter boundaries to ensure dice containment
    // Small screens (< 500px): 75% to create smaller playable area
    // Medium screens (500px - 800px): 70% for tablets - CRITICAL for dice containment at 768px
    // Large screens (> 800px): 85% fill for consistent framing
    let scaleFactor: number;
    if (canvas.clientWidth < 500) {
      scaleFactor = 0.75; // Tighter boundaries for mobile
    } else if (canvas.clientWidth < 800) {
      scaleFactor = 0.7; // Even tighter for tablets to prevent escape
    } else {
      scaleFactor = 0.85; // Normal for desktop
    }

    // Apply constrained scaling based on aspect ratio
    if (aspectRatio >= 1) {
      // Landscape or square - normal scaling
      this.sceneScale.width = baseWidth * scaleFactor;
      this.sceneScale.depth = Math.min(
        baseHeight * scaleFactor,
        (baseWidth * scaleFactor) / constrainedRatio
      );
    } else {
      // Portrait - constrain depth growth to prevent vertical expansion
      this.sceneScale.width = baseWidth * scaleFactor;
      this.sceneScale.depth = Math.min(
        baseHeight * scaleFactor,
        baseWidth * scaleFactor * constrainedRatio
      );
    }

    // Height remains constant - physics ground plane is at y = -8
    this.sceneScale.height = 12;
  }

  /**
   * Adjusts camera position and settings based on scene scale.
   *
   * @private
   */
  private adjustCamera(): void {
    const camera = this.threeRenderer.getCamera();
    if (!camera) return;

    // Fixed camera position that works with the calculated scene scale
    const cameraDistance = 15;

    camera.position.set(0, cameraDistance * 0.4, cameraDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  /**
   * Creates the ground plane for dice to land on.
   *
   * Creates both a visual mesh (Three.js) and a physics body (Cannon-es)
   * with appropriate materials and collision properties.
   * Stores references for dynamic updates during resize operations.
   *
   * @private
   * @since 2.2.0 Enhanced to store geometry, material, and scale references
   */
  private createGroundPlane(): void {
    // Create visual ground plane scaled to scene matching the scene background color
    this.groundGeometry = new THREE.PlaneGeometry(this.sceneScale.width, this.sceneScale.depth);
    this.groundMaterial = new THREE.ShadowMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.25,
    });
    this.groundMaterial.depthWrite = false; // Prevent ground from occluding dice
    this.groundMesh = new THREE.Mesh(this.groundGeometry, this.groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true; // Receive shadows
    this.groundMesh.position.y = -3; // Positioned to keep dice visible and readable
    this.groundMesh.visible = true; // Show only shadows, not a solid plane

    this.threeRenderer.addToScene(this.groundMesh);

    // Initialize previous scale tracking for delta calculation
    this.previousSceneScale = { ...this.sceneScale };

    // Create physics ground plane (infinite plane in Cannon-es)
    const groundShape = new CANNON.Plane();
    const groundPhysicsMaterial = new CANNON.Material('ground');
    this.groundPlane = new CANNON.Body({
      mass: 0, // Static body
      shape: groundShape,
      material: groundPhysicsMaterial,
    });
    this.groundPlane.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.groundPlane.position.y = -3; // Match visual ground plane position

    this.physicsEngine.addBody(this.groundPlane);
  }

  /**
   * Update ground plane geometry to match new scene scale
   * Disposes old geometry and creates new one to prevent memory leaks
   *
   * Note: The physics ground plane (Cannon.js) is an infinite plane and never changes.
   * Only the visual plane (Three.js) is updated to match the constrained scene dimensions
   * calculated by calculateSceneScale(). The new scene scale logic prevents excessive
   * depth/width growth on small screens while maintaining proper aspect ratios.
   *
   * @deprecated Use updateGroundPlaneGeometry() for Phase 4+ implementations
   * @private
   */
  private updateGroundPlane(): void {
    if (!this.groundMesh) {
      return;
    }

    const scene = this.threeRenderer.getScene();
    if (!scene) {
      return;
    }

    // Step 1: Dispose old geometry to prevent memory leak
    this.groundMesh.geometry.dispose();

    // Step 2: Create new geometry with updated scale (constrained by calculateSceneScale)
    // Width and depth are now constrained to prevent visual distortion on small screens
    const newGeometry = new THREE.PlaneGeometry(this.sceneScale.width, this.sceneScale.depth);

    // Step 3: Assign new geometry to existing mesh
    this.groundMesh.geometry = newGeometry;

    // Note: No need to remove/re-add mesh to scene
    // Just updating geometry is sufficient
    // The Y position remains fixed at -3, preventing height growth
  }

  /**
   * Updates ground plane geometry during dynamic resize operations.
   *
   * Performs intelligent updates with delta checking to avoid unnecessary
   * geometry recreation. Only updates if scale change is significant (>1 unit).
   * Properly disposes old geometry to prevent memory leaks.
   *
   * Phase 4 - Task 4.3: Ground Plane Geometry Update
   *
   * @private
   * @since 2.2.0
   */
  private updateGroundPlaneGeometry(): void {
    // Guard: Check if all required references exist
    if (!this.groundMesh || !this.groundGeometry || !this.groundMaterial) {
      return;
    }

    // Calculate scale delta if previous scale exists
    if (this.previousSceneScale) {
      const deltaWidth = Math.abs(this.sceneScale.width - this.previousSceneScale.width);
      const deltaDepth = Math.abs(this.sceneScale.depth - this.previousSceneScale.depth);
      const maxDelta = Math.max(deltaWidth, deltaDepth);

      // Skip update if change is too small (< 1 unit)
      if (maxDelta < 1) {
        return;
      }
    }

    // Step 1: Dispose old geometry to prevent memory leaks
    this.groundGeometry.dispose();

    // Step 2: Create new geometry with updated dimensions
    this.groundGeometry = new THREE.PlaneGeometry(this.sceneScale.width, this.sceneScale.depth);

    // Step 3: Assign new geometry to mesh
    this.groundMesh.geometry = this.groundGeometry;

    // Step 4: Update physics body
    this.updateGroundPhysicsBody();

    // Step 5: Update previous scale for next delta calculation
    this.previousSceneScale = { ...this.sceneScale };
  }

  /**
   * Updates ground plane physics body after geometry changes.
   *
   * Ensures the physics body remains properly positioned and synchronized
   * with the visual mesh. Wakes up physics bodies to recalculate interactions.
   *
   * Phase 4 - Task 4.4: Ground Plane Physics Body Update
   *
   * @private
   * @since 2.2.0
   */
  private updateGroundPhysicsBody(): void {
    // Guard: Check if ground plane physics body exists
    if (!this.groundPlane) {
      return;
    }

    // Ensure ground plane is at correct Y position
    this.groundPlane.position.y = -3; // Match visual ground plane position

    // Wake all physics bodies to recalculate boundaries
    this.physicsEngine.wakeAllBodies();
  }

  /**
   * Updates physics boundary walls to match new scene scale.
   *
   * Adjusts wall positions based on the current scene dimensions and triggers
   * wall shape recreation if the aspect ratio has changed significantly.
   * Ensures physics boundaries remain synchronized with visual scene scale.
   *
   * Phase 5 - Task 5.2: Physics Boundaries Update
   *
   * @private
   * @since 2.2.0
   */
  private updatePhysicsBoundaries(): void {
    // Guard: Validate wall count
    if (this.walls.length !== 4) {
      return;
    }

    // Calculate new wall positions based on current scene scale
    const wallHeight = 15;
    const wallThickness = 1.0;
    const safetyMargin = 0.5;
    const areaWidth = this.sceneScale.width / 2 - safetyMargin;
    const areaDepth = this.sceneScale.depth / 2 - safetyMargin;

    // Update wall positions: [0]=Back, [1]=Front, [2]=Left, [3]=Right
    // Back wall (North)
    this.walls[0].position.set(0, wallHeight / 2 - 3, -areaDepth);

    // Front wall (South)
    this.walls[1].position.set(0, wallHeight / 2 - 3, areaDepth);

    // Left wall (East)
    this.walls[2].position.set(-areaWidth, wallHeight / 2 - 3, 0);

    // Right wall (West)
    this.walls[3].position.set(areaWidth, wallHeight / 2 - 3, 0);

    // Check if wall shapes need to be updated due to aspect ratio change
    this.updateWallShapes();

    // Wake all physics bodies to recalculate collisions
    this.physicsEngine.wakeAllBodies();
  }

  /**
   * Updates wall shapes if aspect ratio has changed significantly.
   *
   * Recreates boundary walls when the aspect ratio changes by more than 20%,
   * ensuring proper physics containment after significant resizing.
   * Removes old walls and creates new ones with updated dimensions.
   *
   * Phase 5 - Task 5.3: Wall Shapes Update
   *
   * @private
   * @since 2.2.0
   */
  private updateWallShapes(): void {
    // Guard: Check if we have previous scale data
    if (!this.previousSceneScale) {
      return;
    }

    // Calculate aspect ratios
    const previousAspectRatio = this.previousSceneScale.width / this.previousSceneScale.depth;
    const currentAspectRatio = this.sceneScale.width / this.sceneScale.depth;

    // Calculate ratio delta (percentage change)
    const ratioDelta = Math.abs(currentAspectRatio - previousAspectRatio) / previousAspectRatio;

    // Skip if aspect ratio change is less than 20%
    if (ratioDelta < 0.2) {
      return;
    }

    // Step 1: Remove old walls from physics world
    this.walls.forEach((wall) => {
      this.physicsEngine.removeBody(wall);
    });
    this.walls = [];

    // Step 2: Recreate walls with new dimensions
    const wallHeight = 15;
    const wallThickness = 1.0;
    const safetyMargin = 0.5;
    const areaWidth = this.sceneScale.width / 2 - safetyMargin;
    const areaDepth = this.sceneScale.depth / 2 - safetyMargin;

    const wallConfigs = [
      // Back wall
      {
        x: 0,
        y: wallHeight / 2 - 3, // Match ground plane position
        z: -areaDepth,
        width: areaWidth * 2 + wallThickness * 2,
        height: wallHeight,
        depth: wallThickness,
      },
      // Front wall
      {
        x: 0,
        y: wallHeight / 2 - 3, // Match ground plane position
        z: areaDepth,
        width: areaWidth * 2 + wallThickness * 2,
        height: wallHeight,
        depth: wallThickness,
      },
      // Left wall
      {
        x: -areaWidth,
        y: wallHeight / 2 - 3, // Match ground plane position
        z: 0,
        width: wallThickness,
        height: wallHeight,
        depth: areaDepth * 2 + wallThickness * 2,
      },
      // Right wall
      {
        x: areaWidth,
        y: wallHeight / 2 - 3, // Match ground plane position
        z: 0,
        width: wallThickness,
        height: wallHeight,
        depth: areaDepth * 2 + wallThickness * 2,
      },
    ];

    // Step 3: Create and add new wall bodies
    wallConfigs.forEach((config) => {
      const wallShape = new CANNON.Box(
        new CANNON.Vec3(config.width / 2, config.height / 2, config.depth / 2)
      );
      const wallBody = new CANNON.Body({
        mass: 0, // Static body
        shape: wallShape,
      });
      wallBody.position.set(config.x, config.y, config.z);

      this.physicsEngine.addBody(wallBody);
      this.walls.push(wallBody);
    });
  }

  /**
   * Validates and corrects dice positions to ensure they remain within boundaries.
   *
   * Checks all dice against scene boundaries and corrects any that have escaped
   * or fallen through the ground. Clamps positions, resets velocities, and wakes
   * up corrected dice for proper physics recalculation.
   *
   * Phase 5 - Task 5.4: Dice Position Validation
   *
   * @private
   * @since 2.2.0
   */
  private validateDicePositions(): void {
    // Guard: Skip if no dice exist
    if (this.dice.length === 0) {
      return;
    }

    // Calculate boundaries with safety margin
    const safetyMargin = 0.5;
    const maxX = this.sceneScale.width / 2 - safetyMargin - 1;
    const maxZ = this.sceneScale.depth / 2 - safetyMargin - 1;
    const minY = -0.5; // Slightly below ground plane

    let correctionCount = 0;

    this.dice.forEach((dice, index) => {
      const pos = dice.body.position;
      let needsCorrection = false;

      // Check X boundary violations
      if (Math.abs(pos.x) > maxX) {
        pos.x = Math.sign(pos.x) * maxX;
        needsCorrection = true;
      }

      // Check Z boundary violations
      if (Math.abs(pos.z) > maxZ) {
        pos.z = Math.sign(pos.z) * maxZ;
        needsCorrection = true;
      }

      // Check Y boundary violations (falling through ground)
      if (pos.y < minY) {
        pos.y = minY + 1; // Place above ground
        needsCorrection = true;
      }

      // Apply corrections if needed
      if (needsCorrection) {
        // Reset velocities to prevent continued motion
        dice.body.velocity.set(0, 0, 0);
        dice.body.angularVelocity.set(0, 0, 0);

        // Wake up the body to recalculate physics
        dice.body.wakeUp();

        correctionCount++;
      }
    });
  }

  /**
   * Creates invisible boundary walls to contain dice within the visible area.
   *
   * Creates four vertical walls around the dice area to prevent them from
   * rolling out of the camera's view. Walls are physics-only (not rendered).
   *
   * @private
   */
  private createBoundaryWalls(): void {
    // Increased wall height to prevent dice from jumping over
    const wallHeight = 35; // Increased from 25 for better containment
    const wallThickness = 2.0; // Increased from 1.0 for better containment

    // Add safety margin to ensure walls fully contain the dice area
    const safetyMargin = 2.0; // Increased safety margin for better containment
    const areaWidth = this.sceneScale.width / 2 - safetyMargin;
    const areaDepth = this.sceneScale.depth / 2 - safetyMargin;

    // Wall configurations scaled to scene dimensions with safety margin
    const wallConfigs = [
      // Back wall
      {
        x: 0,
        y: wallHeight / 2 - 3, // Match ground plane position
        z: -areaDepth,
        width: areaWidth * 2 + wallThickness * 2, // Extend to corners
        height: wallHeight,
        depth: wallThickness,
      },
      // Front wall
      {
        x: 0,
        y: wallHeight / 2 - 3, // Match ground plane position
        z: areaDepth,
        width: areaWidth * 2 + wallThickness * 2, // Extend to corners
        height: wallHeight,
        depth: wallThickness,
      },
      // Left wall
      {
        x: -areaWidth,
        y: wallHeight / 2 - 3, // Match ground plane position
        z: 0,
        width: wallThickness,
        height: wallHeight,
        depth: areaDepth * 2 + wallThickness * 2, // Extend to corners
      },
      // Right wall
      {
        x: areaWidth,
        y: wallHeight / 2 - 3, // Match ground plane position
        z: 0,
        width: wallThickness,
        height: wallHeight,
        depth: areaDepth * 2 + wallThickness * 2, // Extend to corners
      },
    ];

    wallConfigs.forEach((config) => {
      const wallShape = new CANNON.Box(
        new CANNON.Vec3(config.width / 2, config.height / 2, config.depth / 2)
      );
      const wallBody = new CANNON.Body({
        mass: 0, // Static body
        shape: wallShape,
      });
      wallBody.position.set(config.x, config.y, config.z);

      this.physicsEngine.addBody(wallBody);
      this.walls.push(wallBody);
    });
  }

  /**
   * Update boundary walls to match new scene scale
   * Removes old walls and creates new ones with updated dimensions
   * @private
   */
  private updateBoundaryWalls(): void {
    // Step 1: Remove old walls from physics world
    this.walls.forEach((wall) => {
      this.physicsEngine.removeBody(wall);
    });
    this.walls = [];

    // Step 2: Create new walls with updated scene scale
    // Match the values from createBoundaryWalls for consistency
    const wallHeight = 35; // Increased from 25 for better containment
    const wallThickness = 2.0; // Increased from 1.0 for better containment

    // Add safety margin to ensure walls fully contain the dice area
    const safetyMargin = 2.0; // Increased safety margin for better containment
    const areaWidth = this.sceneScale.width / 2 - safetyMargin;
    const areaDepth = this.sceneScale.depth / 2 - safetyMargin;

    // Wall configurations scaled to new scene dimensions with safety margin
    const wallConfigs = [
      // Back wall
      {
        x: 0,
        y: wallHeight / 2 - 8, // Match ground plane position
        z: -areaDepth,
        width: areaWidth * 2 + wallThickness * 2, // Extend to corners
        height: wallHeight,
        depth: wallThickness,
      },
      // Front wall
      {
        x: 0,
        y: wallHeight / 2 - 8, // Match ground plane position
        z: areaDepth,
        width: areaWidth * 2 + wallThickness * 2, // Extend to corners
        height: wallHeight,
        depth: wallThickness,
      },
      // Left wall
      {
        x: -areaWidth,
        y: wallHeight / 2 - 8, // Match ground plane position
        z: 0,
        width: wallThickness,
        height: wallHeight,
        depth: areaDepth * 2 + wallThickness * 2, // Extend to corners
      },
      // Right wall
      {
        x: areaWidth,
        y: wallHeight / 2 - 8, // Match ground plane position
        z: 0,
        width: wallThickness,
        height: wallHeight,
        depth: areaDepth * 2 + wallThickness * 2, // Extend to corners
      },
    ];

    // Step 3: Create and add new wall bodies
    wallConfigs.forEach((config) => {
      const wallShape = new CANNON.Box(
        new CANNON.Vec3(config.width / 2, config.height / 2, config.depth / 2)
      );
      const wallBody = new CANNON.Body({
        mass: 0, // Static body
        shape: wallShape,
      });
      wallBody.position.set(config.x, config.y, config.z);

      this.physicsEngine.addBody(wallBody);
      this.walls.push(wallBody);
    });
  }

  /**
   * Creates dice objects with both rendering and physics components.
   *
   * Instantiates the specified number of dice, positions them in the scene,
   * and adds them to both the Three.js scene and Cannon-es physics world.
   * Enhanced with proper spacing to prevent dice from landing too close together.
   *
   * @private
   */
  private createDice(): void {
    const count = this.diceCount();
    const type = this.diceType();
    const userSize = this.diceSize();

    // Use user size directly - no 2x scaling
    const size = userSize;

    // Drop zone in top-right corner area
    const dropAreaWidth = this.sceneScale.width * 0.25; // Use 25% of width
    const dropHeight = 5; // Fixed reasonable drop height

    // Enhanced spacing: Ensure minimum gap of 1.5x dice size between dice centers
    // This prevents dice from landing too close together
    const minSpacing = size * 2.5; // Minimum 2.5x dice size for proper gaps
    const availableWidth = dropAreaWidth * 2; // Use more horizontal space
    const calculatedSpacing = availableWidth / (count + 1);
    const spacing = Math.max(minSpacing, calculatedSpacing);

    for (let i = 0; i < count; i++) {
      // Position dice at top-center, spread horizontally with proper spacing
      // Keep all dice at same Z depth for uniform size appearance
      const startX = (i - (count - 1) / 2) * spacing;

      // Add slight Z variation to prevent perfect alignment (more natural)
      const startZ = -this.sceneScale.depth * 0.35 + (Math.random() - 0.5) * size * 0.8;

      const config: DiceConfig = {
        type,
        size,
        position: new THREE.Vector3(
          startX + (Math.random() - 0.5) * size * 0.4, // Reduced randomness for better spacing
          dropHeight + Math.random() * 0.5,
          startZ
        ),
        castShadow: true,
        receiveShadow: true,
        envMap: this.threeRenderer.getEnvironmentMap(), // Add environment map for reflections
      };

      const dice = this.diceFactory.createDice(config);
      this.dice.push(dice);

      // Enhanced damping for fast, reliable settling
      dice.body.linearDamping = 0.8; // Very high damping for rapid stabilization
      dice.body.angularDamping = 0.8; // Very high damping for rapid stabilization

      // Add to scene and physics world
      this.threeRenderer.addToScene(dice.mesh);
      this.physicsEngine.addBody(dice.body, `dice-${i}`);
    }
  }

  /**
   * Starts the physics simulation loop using requestAnimationFrame.
   *
   * Runs outside Angular's zone for performance. Steps the physics simulation,
   * syncs Three.js objects with physics bodies, and checks for roll completion.
   *
   * @private
   */
  private startPhysicsLoop(): void {
    let lastTime = performance.now();

    const updatePhysics = () => {
      if (this.isDisposed) return;

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Step physics simulation
      this.physicsEngine.stepSimulation(deltaTime);

      // Sync Three.js meshes with physics bodies
      this.dice.forEach((dice) => {
        this.physicsEngine.syncWithThreeJS(dice.mesh, dice.body);
      });

      // Check if dice have stopped rolling
      if (this.isRolling()) {
        this.checkRollComplete();
      }

      this.animationFrameId = requestAnimationFrame(updatePhysics);
    };

    this.ngZone.runOutsideAngular(() => {
      updatePhysics();
    });
  }

  /**
   * Initiates a dice roll with random physics forces.
   *
   * Resets dice positions and velocities, applies random impulses and torques,
   * and respects reduced motion preferences by adjusting force intensity.
   * Announces the action to screen readers for accessibility.
   * Enhanced with proper spacing to prevent dice from landing too close together.
   *
   * @public
   */
  rollDice(): void {
    if (!this.canInteract()) {
      return;
    }

    this.isRolling.set(true);
    this.diceRolled.set(true);
    this.rollStarted.emit();

    // Announce to screen readers
    this.announcement.set(this.i18n.rollingDice);

    // Drop zone in top-right corner area
    const dropAreaWidth = this.sceneScale.width * 0.25; // Use 25% of width
    const dropHeight = 5; // Fixed reasonable drop height
    const userSize = this.diceSize();
    const size = userSize; // No 2x scaling

    // Enhanced spacing: Ensure minimum gap of 1.5x dice size between dice centers
    const minSpacing = size * 2.5; // Minimum 2.5x dice size for proper gaps
    const availableWidth = dropAreaWidth * 2; // Use more horizontal space
    const calculatedSpacing = availableWidth / (this.dice.length + 1);
    const spacing = Math.max(minSpacing, calculatedSpacing);

    this.dice.forEach((dice, index) => {
      // Position dice at top-center, spread horizontally with proper spacing
      // Keep all dice at same Z depth for uniform size appearance
      const startX = (index - (this.dice.length - 1) / 2) * spacing;

      // Add slight Z variation to prevent perfect alignment (more natural)
      const startZ = -this.sceneScale.depth * 0.35 + (Math.random() - 0.5) * size * 0.8;

      dice.body.position.set(
        startX + (Math.random() - 0.5) * size * 0.4, // Reduced randomness for better spacing
        dropHeight + Math.random() * 0.5,
        startZ
      );

      // Reset rotation with random initial rotation for variety
      const randomQuat = this.diceFactory.getRandomRotation();
      dice.body.quaternion.copy(randomQuat);

      // Reset velocities
      dice.body.velocity.set(0, 0, 0);
      dice.body.angularVelocity.set(0, 0, 0);

      // Wake up the body
      dice.body.wakeUp();

      // Drop from top-center and let gravity + random forces create natural rolling
      // This uses the full ground plane evenly
      // Increased force factors for faster animation across all screen sizes
      const canvas = this.canvasElement().nativeElement;
      const isSmallScreen = canvas.clientWidth <= 700;
      let forceFactor: number;

      if (this.reducedMotionActive()) {
        forceFactor = 0.4; // Increased from 0.3 for slightly faster reduced motion
      } else if (isSmallScreen) {
        forceFactor = 0.9; // Increased from 0.75 for faster animation on small screens
      } else {
        forceFactor = 0.7; // Increased from 0.5 for faster animation on normal screens
      }

      // Apply gentle random forces in all horizontal directions for varied rolling
      // Slightly varied per dice to encourage separation
      const lateralVariation = (index - (this.dice.length - 1) / 2) * 0.3; // Spread dice apart
      const force = new CANNON.Vec3(
        ((Math.random() - 0.5) * 4 + lateralVariation) * forceFactor, // Random horizontal force with separation bias
        -1.5 * forceFactor, // Downward force
        (Math.random() * 0.8 + 0.2) * 6 * forceFactor // Forward force (toward bottom) with bias
      );
      dice.body.applyImpulse(force, dice.body.position);

      // Random torque for tumbling
      const torque = new CANNON.Vec3(
        (Math.random() - 0.5) * 10 * forceFactor,
        (Math.random() - 0.5) * 10 * forceFactor,
        (Math.random() - 0.5) * 10 * forceFactor
      );
      dice.body.applyTorque(torque);
    });
  }

  /**
   * Checks if all dice have stopped rolling based on velocity thresholds.
   *
   * Monitors linear and angular velocities. When all dice are stable,
   * calculates face values, emits results, and announces to screen readers.
   * Uses proper low thresholds and confirmation delay to ensure accurate settling.
   *
   * @private
   */
  private checkRollComplete(): void {
    const allStopped = this.dice.every((dice) => {
      const velocity = dice.body.velocity.length();
      const angularVelocity = dice.body.angularVelocity.length();
      // Use proper low thresholds for accurate settling detection
      return velocity < 0.05 && angularVelocity < 0.05;
    });

    if (allStopped) {
      // Reduced confirmation delay for faster response while maintaining accuracy
      const delay = this.reducedMotionActive() ? 50 : 250;
      setTimeout(() => {
        // Double-check that dice are still stopped before emitting results
        const stillStopped = this.dice.every((dice) => {
          const velocity = dice.body.velocity.length();
          const angularVelocity = dice.body.angularVelocity.length();
          return velocity < 0.02 && angularVelocity < 0.02;
        });

        if (stillStopped) {
          this.ngZone.run(() => {
            const results = this.dice.map((dice) => this.getDiceFaceValue(dice));
            this.diceResults.set(results);
            this.isRolling.set(false);

            // Announce results to screen readers
            this.announcement.set(this.i18n.diceRolledAnnouncement(results));

            this.rollComplete.emit(results);
          });
        }
      }, delay);
    }
  }

  /**
   * Determines which face is pointing upward for a dice.
   *
   * Compares the dice's rotation against known face normals to find
   * which face has the highest dot product with the up vector.
   *
   * @param dice - The dice object to check
   * @returns The face value (1-based: 1-6 for D6, 1-8 for D8, etc.)
   * @private
   */
  private getDiceFaceValue(dice: Dice): number {
    const upVector = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion(
      dice.body.quaternion.x,
      dice.body.quaternion.y,
      dice.body.quaternion.z,
      dice.body.quaternion.w
    );

    // For D6, check which face is pointing up
    // This is a simplified version - real implementation would need face normals
    const faceNormals = this.getDiceFaceNormals(dice.type);
    let maxDot = -Infinity;
    let faceValue = 1;

    faceNormals.forEach((normal, index) => {
      const worldNormal = normal.clone().applyQuaternion(quaternion);
      const dot = worldNormal.dot(upVector);
      if (dot > maxDot) {
        maxDot = dot;
        faceValue = index + 1;
      }
    });

    return faceValue;
  }

  /**
   * Gets the face normal vectors for a specific dice type.
   *
   * Returns an array of vectors pointing outward from each face.
   * Used to determine which face is pointing up after a roll.
   *
   * @param type - The dice type (D6, D8, D12, D20)
   * @returns Array of normalized face vectors
   * @private
   */
  private getDiceFaceNormals(type: DiceType): THREE.Vector3[] {
    // For D6 - face normals matching material order in dice-factory.service.ts
    // Materials are applied as: [right=4, left=3, top=6, bottom=1, front=5, back=2]
    // Returns array where index corresponds to face value (normals[0] = face 1, etc.)
    if (type === DiceType.D6) {
      return [
        new THREE.Vector3(0, -1, 0), // Face 1: bottom (-Y)
        new THREE.Vector3(0, 0, -1), // Face 2: back (-Z)
        new THREE.Vector3(-1, 0, 0), // Face 3: left (-X)
        new THREE.Vector3(1, 0, 0), // Face 4: right (+X)
        new THREE.Vector3(0, 0, 1), // Face 5: front (+Z)
        new THREE.Vector3(0, 1, 0), // Face 6: top (+Y)
      ];
    }

    // For other dice types, return simplified normals
    // In a real implementation, you'd calculate proper face normals for each dice type
    const faceCount = parseInt(type.substring(1));
    return Array.from({ length: faceCount }, (_, i) => {
      const angle = (i / faceCount) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    });
  }

  /**
   * Gets the current dice face values from the last roll.
   *
   * @returns Array of face values (1-based)
   * @public
   */
  getDiceResults(): number[] {
    return this.diceResults();
  }

  /**
   * Gets the sum of all dice face values from the last roll.
   *
   * @returns Sum of all dice values
   * @public
   */
  getDiceTotal(): number {
    return this.diceResults().reduce((sum, val) => sum + val, 0);
  }
  /**
   * Handles verification request from control overlay.
   *
   * @param data - Object containing dice values and sum entered by the user
   * @public
   */
  onVerify(data: { diceValues: number[]; sum: number }): void {
    this.verificationRequested.emit(data);
  }

  /**
   * Resets the dice canvas to allow a new roll.
   *
   * Clears dice results, resets the rolled state, and resets the control overlay.
   *
   * @public
   */
  resetForNewRoll(): void {
    this.diceResults.set([]);
    this.diceRolled.set(false);
    const overlay = this.controlOverlay();
    if (overlay) {
      overlay.reset();
    }
  }

  /**
   * Handles keyboard actions from the accessibility directive.
   *
   * Supports keyboard-based dice rolling for users who cannot use a mouse.
   *
   * @param action - The keyboard action (e.g., 'activate')
   * @internal
   */
  onKeyboardAction(action: string): void {
    if (action === 'activate' && this.canInteract()) {
      this.rollDice();
    }
  }

  /**
   * Handles changes to reduced motion preference.
   *
   * Updates internal state when user's motion preference changes,
   * either from system settings or component input.
   *
   * @param enabled - Whether reduced motion is enabled
   * @internal
   */
  onReducedMotionChange(enabled: boolean): void {
    this.reducedMotionActive.set(enabled || this.enableReducedMotion());
  }

  /**
   * Cleans up all resources when component is destroyed.
   *
   * Cancels animation frames, removes objects from scene and physics world,
   * and clears all references to prevent memory leaks.
   *
   * @private
   */
  private dispose(): void {
    this.isDisposed = true;

    // Unregister resize callback
    if (this.resizeCleanup) {
      this.resizeCleanup();
    }

    // Cancel animation frame
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Remove dice from scene and physics
    this.dice.forEach((dice, index) => {
      this.threeRenderer.removeFromScene(dice.mesh);
      this.physicsEngine.removeBody(dice.body, `dice-${index}`);
    });

    // Remove ground plane
    if (this.groundPlane) {
      this.physicsEngine.removeBody(this.groundPlane);
    }

    // Remove boundary walls
    this.walls.forEach((wall) => {
      this.physicsEngine.removeBody(wall);
    });
    this.walls = [];

    // Dispose renderer and reset service state
    this.threeRenderer.dispose();

    // Clear arrays
    this.dice = [];
  }
}
