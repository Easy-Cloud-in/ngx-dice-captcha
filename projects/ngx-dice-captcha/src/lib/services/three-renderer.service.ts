import { Injectable, NgZone, inject, isDevMode } from '@angular/core';
import * as THREE from 'three';
import { ResizeEventData } from '../models/resize-event.model';
import { ComponentError } from '../utils/error.util';
import { ErrorHandlerUtil, ErrorSeverity } from '../utils/error-handler.util';

/**
 * Service responsible for managing Three.js scene, camera, renderer, and rendering loop.
 *
 * Provides a complete Three.js setup with scene management, camera control, lighting,
 * and an optimized render loop that runs outside Angular's zone for maximum performance.
 * Automatically handles canvas resizing and resource cleanup.
 *
 * @example
 * ```typescript
 * const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
 * threeRenderer.initializeScene(canvas);
 * threeRenderer.startRenderLoop();
 *
 * // Add objects to scene
 * const mesh = new THREE.Mesh(geometry, material);
 * threeRenderer.addToScene(mesh);
 *
 * // Cleanup when done
 * threeRenderer.dispose();
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Injectable()
export class ThreeRendererService {
  private readonly ngZone = inject(NgZone);
  private readonly errorHandler = inject(ErrorHandlerUtil);

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private animationFrameId?: number;
  private canvas?: HTMLCanvasElement;
  private resizeObserver?: ResizeObserver;
  private resizeListener?: () => void;
  private resizeTimeout?: number;

  // Frustum culling
  private frustum = new THREE.Frustum();
  private cameraMatrix = new THREE.Matrix4();

  // Instanced mesh management
  private instancedMeshes = new Map<string, THREE.InstancedMesh>();
  private instanceData = new Map<
    string,
    {
      count: number;
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
      matrices: THREE.Matrix4[];
      colors?: THREE.Color[];
    }
  >();

  // Lighting
  private ambientLight?: THREE.AmbientLight;
  private directionalLight?: THREE.DirectionalLight;

  // State
  private isInitialized = false;
  private isRenderLoopRunning = false;

  // Resize callbacks
  private resizeCallbacks = new Set<(data: ResizeEventData) => void>();

  // Previous dimensions for comparison
  private previousDimensions?: { width: number; height: number };

  // Retry logic
  private retryAttempts = 0;
  private readonly maxRetryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second
  private isRetrying = false;

  // Disposal tracking
  private isDisposing = false;
  private contextLostHandler?: (event: Event) => void;
  private contextRestoredHandler?: () => void;

  /**
   * Initializes the Three.js scene with camera, renderer, and lighting.
   *
   * Sets up a perspective camera, WebGL renderer with shadows enabled,
   * ambient and directional lighting, and automatic resize handling.
   * This method should be called once before any rendering.
   *
   * @param canvas - HTML canvas element to render to
   * @throws Will log warning if scene is already initialized
   * @public
   */
  initializeScene(canvas: HTMLCanvasElement): void {
    if (this.isInitialized) {
      return;
    }

    this.canvas = canvas;

    try {
      this.initializeSceneInternal(canvas);
      this.isInitialized = true;
      this.retryAttempts = 0; // Reset retry counter on success
    } catch (error) {
      this.handleInitializationError(error as Error, canvas);
    }
  }

  /**
   * Internal method to initialize the Three.js scene.
   *
   * @param canvas - HTML canvas element to render to
   * @private
   */
  private initializeSceneInternal(canvas: HTMLCanvasElement): void {
    // Create scene with paper white background for better dice contrast
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfffef9); // Paper white background

    // Create camera
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Create renderer with alpha channel enabled for transparency
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true, // Enable transparency
      failIfMajorPerformanceCaveat: false, // Don't fail on performance issues
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Setup lighting
    this.setupLighting();

    // Handle window resize
    this.setupResizeHandler();

    // Set up WebGL context loss event handlers
    this.setupContextLossHandlers();
  }

  /**
   * Handles initialization errors with retry logic.
   *
   * @param error - The error that occurred
   * @param canvas - The canvas element
   * @private
   */
  private handleInitializationError(error: Error, canvas: HTMLCanvasElement): void {
    this.errorHandler.handleError(
      error,
      {
        component: 'ThreeRendererService',
        method: 'initializeScene',
        additionalData: {
          retryAttempts: this.retryAttempts,
          maxRetryAttempts: this.maxRetryAttempts,
          canvasWidth: canvas.clientWidth,
          canvasHeight: canvas.clientHeight,
        },
      },
      ErrorSeverity.HIGH,
      true,
      true
    );

    if (this.retryAttempts < this.maxRetryAttempts && !this.isRetrying) {
      this.isRetrying = true;
      this.retryAttempts++;

      // Wait before retrying with exponential backoff
      const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);

      setTimeout(() => {
        this.isRetrying = false;

        this.initializeScene(canvas);
      }, delay);
    } else {
      // Max retries reached, throw the error
      throw new ComponentError(
        'ThreeRendererService',
        'initializeScene',
        `Failed to initialize Three.js scene after ${this.maxRetryAttempts} attempts: ${error.message}`,
        {
          originalError: error,
          retryAttempts: this.retryAttempts,
        }
      );
    }
  }

  /**
   * Sets up WebGL context loss event handlers.
   *
   * @private
   */
  private setupContextLossHandlers(): void {
    if (!this.renderer) return;

    const canvas = this.renderer.domElement;

    // Handle context loss
    this.contextLostHandler = (event: Event) => {
      event.preventDefault();

      // Only log error if not intentionally disposing
      if (!this.isDisposing) {
        this.errorHandler.handleError(
          new Error('WebGL context lost'),
          {
            component: 'ThreeRendererService',
            method: 'webglcontextlost',
          },
          ErrorSeverity.HIGH,
          true,
          true
        );
      }

      // Stop render loop
      this.stopRenderLoop();
    };
    canvas.addEventListener('webglcontextlost', this.contextLostHandler);

    // Handle context restoration
    this.contextRestoredHandler = () => {
      this.errorHandler.handleError(
        new Error('WebGL context restored'),
        {
          component: 'ThreeRendererService',
          method: 'webglcontextrestored',
        },
        ErrorSeverity.LOW,
        false,
        false
      );

      // Reinitialize scene
      if (this.canvas) {
        this.isInitialized = false;
        this.retryAttempts = 0;
        this.initializeScene(this.canvas);
      }
    };
    canvas.addEventListener('webglcontextrestored', this.contextRestoredHandler);
  }

  /**
   * Sets up scene lighting with ambient and directional lights.
   *
   * Creates an ambient light for general illumination and a directional
   * light with shadow mapping configured for realistic dice rendering.
   *
   * @private
   */
  private setupLighting(): void {
    if (!this.scene) return;

    // Balanced ambient light for better contrast
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // Main directional light for shadows and depth
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;

    // Configure shadow properties with higher quality
    this.directionalLight.shadow.mapSize.width = 2048; // Increased from 1024
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -10;
    this.directionalLight.shadow.camera.right = 10;
    this.directionalLight.shadow.camera.top = 10;
    this.directionalLight.shadow.camera.bottom = -10;
    this.directionalLight.shadow.bias = -0.0001; // Reduce shadow acne

    this.scene.add(this.directionalLight);

    // Add a secondary fill light from the opposite side for better visibility
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -7);
    this.scene.add(fillLight);

    // Add a subtle rim light from behind for better depth perception
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 3, -10);
    this.scene.add(rimLight);
  }

  /**
   * Sets up resize handlers to maintain proper aspect ratio.
   *
   * Uses both ResizeObserver (for container changes) and window resize
   * (for orientation changes) to automatically update camera projection
   * and renderer size, ensuring the scene remains properly scaled.
   *
   * @private
   */
  private setupResizeHandler(): void {
    if (!this.canvas) return;

    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleResize = () => {
      if (!this.canvas || !this.camera || !this.renderer) return;

      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      const pixelRatio = window.devicePixelRatio;

      // Guard: Validate minimum dimensions (50px)
      const MIN_DIMENSION = 50;
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        return;
      }

      // Guard: Validate aspect ratio to prevent extreme distortions
      const aspectRatio = width / height;
      const MAX_ASPECT_RATIO = 5; // Max 5:1 or 1:5
      if (aspectRatio > MAX_ASPECT_RATIO || aspectRatio < 1 / MAX_ASPECT_RATIO) {
        return;
      }

      // Calculate delta from previous dimensions
      const delta = this.previousDimensions
        ? {
            width: Math.abs(width - this.previousDimensions.width),
            height: Math.abs(height - this.previousDimensions.height),
          }
        : { width: 0, height: 0 };

      // Determine if scene update is required based on threshold
      const requiresSceneUpdate = this.shouldUpdateScene(delta);

      // Store current camera position to preserve it
      const cameraPosition = this.camera.position.clone();
      const cameraTarget = new THREE.Vector3();
      this.camera.getWorldDirection(cameraTarget);
      cameraTarget.add(this.camera.position);

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height, false);
      this.renderer.setPixelRatio(Math.min(pixelRatio, 2));

      // Restore camera position
      this.camera.position.copy(cameraPosition);
      this.camera.lookAt(cameraTarget);

      // Notify all registered callbacks with enhanced data
      this.notifyResizeCallbacks({
        width,
        height,
        aspectRatio: width / height,
        pixelRatio,
        timestamp: Date.now(),
        previous: this.previousDimensions,
        delta,
        requiresSceneUpdate,
      });

      // Store current dimensions for next resize
      this.previousDimensions = { width, height };
    };

    // Debounced resize handler
    const debouncedResize = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        handleResize();
      }, 150) as unknown as number; // Increased from 100ms
    };

    // Store reference for cleanup
    this.resizeListener = debouncedResize;

    // Use ResizeObserver for better responsiveness to container size changes
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        debouncedResize();
      });
      this.resizeObserver.observe(this.canvas);
    }

    // Also listen to window resize for orientation changes
    window.addEventListener('resize', this.resizeListener);

    // Initial resize to ensure correct dimensions
    requestAnimationFrame(() => {
      handleResize();
    });
  }

  /**
   * Adds a Three.js object to the scene.
   *
   * @param object - Three.js object (mesh, light, group, etc.) to add
   * @throws Will throw error if scene is not initialized
   * @public
   */
  addToScene(object: THREE.Object3D): void {
    if (!this.scene) {
      throw new ComponentError(
        'ThreeRendererService',
        'addToScene',
        'Scene not initialized. Call initializeScene() before adding objects.',
        { isInitialized: this.isInitialized }
      );
    }
    this.scene.add(object);
  }

  /**
   * Removes a Three.js object from the scene.
   *
   * @param object - Three.js object to remove
   * @throws Will throw error if scene is not initialized
   * @public
   */
  removeFromScene(object: THREE.Object3D): void {
    if (!this.scene) {
      throw new ComponentError(
        'ThreeRendererService',
        'removeFromScene',
        'Scene not initialized. Call initializeScene() before removing objects.',
        { isInitialized: this.isInitialized }
      );
    }
    this.scene.remove(object);
  }

  /**
   * Creates or updates an instanced mesh for multiple objects of the same type.
   *
   * InstancedMesh is more efficient for rendering many similar objects as it reduces
   * draw calls. Use this when you have multiple dice of the same type.
   *
   * @param key - Unique identifier for the instanced mesh type
   * @param geometry - Geometry to use for all instances
   * @param material - Material to use for all instances
   * @param maxCount - Maximum number of instances
   * @returns InstancedMesh instance
   * @public
   */
  createInstancedMesh(
    key: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    maxCount: number
  ): THREE.InstancedMesh {
    if (!this.scene) {
      throw new ComponentError(
        'ThreeRendererService',
        'createInstancedMesh',
        'Scene not initialized. Call initializeScene() before creating instanced meshes.',
        { isInitialized: this.isInitialized }
      );
    }

    // Check if instanced mesh already exists
    let instancedMesh = this.instancedMeshes.get(key);

    if (!instancedMesh || instancedMesh.count < maxCount) {
      // Create new instanced mesh
      instancedMesh = new THREE.InstancedMesh(geometry, material, maxCount);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;

      // Store in scene and maps
      this.scene.add(instancedMesh);
      this.instancedMeshes.set(key, instancedMesh);

      // Initialize instance data
      this.instanceData.set(key, {
        count: 0,
        geometry,
        material,
        matrices: new Array(maxCount).fill(null).map(() => new THREE.Matrix4()),
        colors: new Array(maxCount).fill(null).map(() => new THREE.Color()),
      });
    }

    return instancedMesh;
  }

  /**
   * Updates the transformation matrix for a specific instance.
   *
   * @param key - Identifier for the instanced mesh
   * @param instanceId - Index of the instance to update
   * @param position - New position for the instance
   * @param rotation - New rotation for the instance (Euler angles in radians)
   * @param scale - New scale for the instance (default: 1, 1, 1)
   * @public
   */
  updateInstance(
    key: string,
    instanceId: number,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
  ): void {
    const instancedMesh = this.instancedMeshes.get(key);
    const data = this.instanceData.get(key);

    if (!instancedMesh || !data || instanceId >= instancedMesh.count) {
      return;
    }

    // Update transformation matrix
    const matrix = data.matrices[instanceId];
    matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);

    // Apply to instanced mesh
    instancedMesh.setMatrixAt(instanceId, matrix);
    instancedMesh.instanceMatrix.needsUpdate = true;

    // Update instance count if needed
    if (instanceId >= data.count) {
      data.count = instanceId + 1;
      instancedMesh.count = data.count;
    }
  }

  /**
   * Updates the color for a specific instance.
   *
   * @param key - Identifier for the instanced mesh
   * @param instanceId - Index of the instance to update
   * @param color - New color for the instance
   * @public
   */
  updateInstanceColor(key: string, instanceId: number, color: THREE.Color): void {
    const instancedMesh = this.instancedMeshes.get(key);
    const data = this.instanceData.get(key);

    if (!instancedMesh || !data || !data.colors || instanceId >= instancedMesh.count) {
      return;
    }

    // Update color
    data.colors[instanceId].copy(color);
    instancedMesh.setColorAt(instanceId, color);

    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Removes an instanced mesh from the scene and cleans up resources.
   *
   * @param key - Identifier for the instanced mesh to remove
   * @public
   */
  removeInstancedMesh(key: string): void {
    const instancedMesh = this.instancedMeshes.get(key);
    const data = this.instanceData.get(key);

    if (instancedMesh && this.scene) {
      this.scene.remove(instancedMesh);

      // Dispose geometry and material if they're not shared
      if (data) {
        // Only dispose if no other instanced mesh is using them
        let isShared = false;
        for (const [otherKey, otherData] of this.instanceData.entries()) {
          if (
            otherKey !== key &&
            otherData.geometry === data.geometry &&
            otherData.material === data.material
          ) {
            isShared = true;
            break;
          }
        }

        if (!isShared) {
          data.geometry.dispose();
          if (Array.isArray(data.material)) {
            data.material.forEach((mat) => mat.dispose());
          } else {
            data.material.dispose();
          }
        }
      }

      this.instancedMeshes.delete(key);
      this.instanceData.delete(key);
    }
  }

  /**
   * Gets an instanced mesh by key.
   *
   * @param key - Identifier for the instanced mesh
   * @returns InstancedMesh instance or undefined
   * @public
   */
  getInstancedMesh(key: string): THREE.InstancedMesh | undefined {
    return this.instancedMeshes.get(key);
  }

  /**
   * Gets the number of active instances for an instanced mesh.
   *
   * @param key - Identifier for the instanced mesh
   * @returns Number of active instances
   * @public
   */
  getInstanceCount(key: string): number {
    const data = this.instanceData.get(key);
    return data ? data.count : 0;
  }

  /**
   * Updates camera position and look-at target.
   *
   * @param position - New camera position in 3D space
   * @param target - Point for camera to look at
   * @throws Will throw error if camera is not initialized
   * @public
   */
  updateCamera(position: THREE.Vector3, target: THREE.Vector3): void {
    if (!this.camera) {
      throw new Error('ThreeRendererService: Camera not initialized');
    }
    this.camera.position.copy(position);
    this.camera.lookAt(target);
  }

  /**
   * Starts the render loop using requestAnimationFrame.
   *
   * Runs outside Angular's zone to prevent unnecessary change detection cycles,
   * maximizing rendering performance. The loop continues until stopRenderLoop()
   * is called or the service is disposed.
   *
   * @throws Will throw error if scene is not initialized
   * @throws Will log warning if render loop is already running
   * @public
   */
  startRenderLoop(): void {
    if (this.isRenderLoopRunning) {
      return;
    }

    if (!this.scene || !this.camera || !this.renderer) {
      throw new Error('ThreeRendererService: Scene not initialized');
    }

    this.isRenderLoopRunning = true;

    // Run animation loop outside Angular zone to prevent unnecessary change detection
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        if (!this.isRenderLoopRunning) return;

        this.animationFrameId = requestAnimationFrame(animate);

        if (this.renderer && this.scene && this.camera) {
          // Update frustum for culling
          this.updateFrustum();

          // Apply frustum culling before rendering
          this.applyFrustumCulling();

          this.renderer.render(this.scene, this.camera);
        }
      };

      animate();
    });
  }

  /**
   * Stops the render loop.
   *
   * Cancels the animation frame and prevents further rendering.
   * Safe to call even if loop is not running.
   *
   * @public
   */
  stopRenderLoop(): void {
    this.isRenderLoopRunning = false;
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  /**
   * Gets the current Three.js scene.
   *
   * @returns The scene instance or undefined if not initialized
   * @public
   */
  getScene(): THREE.Scene | undefined {
    return this.scene;
  }

  /**
   * Gets the current perspective camera.
   *
   * @returns The camera instance or undefined if not initialized
   * @public
   */
  getCamera(): THREE.PerspectiveCamera | undefined {
    return this.camera;
  }

  /**
   * Gets the current WebGL renderer.
   *
   * @returns The renderer instance or undefined if not initialized
   * @public
   */
  getRenderer(): THREE.WebGLRenderer | undefined {
    return this.renderer;
  }

  /**
   * Checks if the service has been initialized.
   *
   * @returns true if initializeScene() has been called successfully
   * @public
   */
  isSceneInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Register a callback to be notified when canvas resizes
   * @param callback Function to call with resize event data
   * @returns Cleanup function to unregister the callback
   * @public
   */
  onResize(callback: (data: ResizeEventData) => void): () => void {
    this.resizeCallbacks.add(callback);
    return () => this.resizeCallbacks.delete(callback);
  }
  /**
   * Determines if a scene update is required based on resize delta.
   *
   * Returns true on first initialization or when delta exceeds threshold (50px default).
   * This prevents unnecessary scene updates for minor resizes while ensuring
   * proper updates for significant dimension changes.
   *
   * @param delta - Width and height change from previous dimensions
   * @returns true if scene should be updated, false for minor adjustments only
   * @private
   * @since 2.2.0
   */
  private shouldUpdateScene(delta: { width: number; height: number }): boolean {
    // First initialization - always update
    if (!this.previousDimensions) {
      return true;
    }

    // Check if delta exceeds threshold (default 50px)
    const RESIZE_THRESHOLD = 50;
    const exceedsThreshold = delta.width >= RESIZE_THRESHOLD || delta.height >= RESIZE_THRESHOLD;

    return exceedsThreshold;
  }

  /**
   * Notify all registered callbacks about resize event
   * @param data Resize event data
   * @private
   */
  private notifyResizeCallbacks(data: ResizeEventData): void {
    this.resizeCallbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {}
    });
  }

  /**
   * Disposes of all resources and performs cleanup.
   *
   * Stops the render loop, disposes of renderer and all geometries/materials,
   * clears the scene, and resets all references. Should be called when the
   * service is no longer needed to prevent memory leaks.
   *
   * @public
   */
  dispose(): void {
    // Stop render loop
    this.stopRenderLoop();

    // Clear all callbacks
    this.resizeCallbacks.clear();

    // Clear any pending resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = undefined;
    }

    // Remove window resize listener
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = undefined;
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    // Aggressive resource disposal
    if (this.scene) {
      this.scene.traverse((object) => {
        // Dispose meshes
        if (object instanceof THREE.Mesh) {
          // Dispose geometry
          if (object.geometry) {
            object.geometry.dispose();
          }

          // Dispose materials (including textures)
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => {
                this.disposeMaterial(material);
              });
            } else {
              this.disposeMaterial(object.material);
            }
          }
        }

        // Dispose lights
        if (object instanceof THREE.Light) {
          // Dispose any shadow maps
          const light = object as THREE.DirectionalLight | THREE.SpotLight;
          if (light.shadow && light.shadow.map) {
            light.shadow.map.dispose();
          }
        }

        // Dispose render targets
        if (object instanceof THREE.WebGLRenderTarget) {
          object.dispose();
        }
      });

      // Clear scene
      this.scene.clear();
      this.scene = undefined;
    }

    // Dispose renderer with aggressive cleanup
    if (this.renderer) {
      // Set disposal flag to prevent error logging during intentional context loss
      this.isDisposing = true;

      // Remove WebGL context event listeners
      const canvas = this.renderer.domElement;
      if (this.contextLostHandler) {
        canvas.removeEventListener('webglcontextlost', this.contextLostHandler);
        this.contextLostHandler = undefined;
      }
      if (this.contextRestoredHandler) {
        canvas.removeEventListener('webglcontextrestored', this.contextRestoredHandler);
        this.contextRestoredHandler = undefined;
      }

      // Force context loss if available
      const gl = this.renderer.getContext();
      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }

      // Dispose render targets
      const renderer = this.renderer as THREE.WebGLRenderer;
      (renderer as any).renderTargets?.forEach((target: THREE.WebGLRenderTarget) => {
        target.dispose();
      });

      // Dispose properties (state doesn't have a dispose method in Three.js)
      (renderer as any).properties?.dispose();

      // Dispose renderer
      this.renderer.dispose();
      this.renderer = undefined;

      // Reset disposal flag
      this.isDisposing = false;
    }

    // Clear camera
    if (this.camera) {
      // Dispose any camera-related resources
      this.camera = undefined;
    }

    // Clear other references
    this.ambientLight = undefined;
    this.directionalLight = undefined;
    this.canvas = undefined;
    this.previousDimensions = undefined;
    this.isInitialized = false;
  }

  /**
   * Updates the camera frustum for culling calculations.
   *
   * Calculates the frustum based on the current camera position and projection matrix.
   * This should be called before applying frustum culling.
   *
   * @private
   */
  private updateFrustum(): void {
    if (!this.camera) return;

    // Update frustum with camera's projection and matrix world
    this.cameraMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }

  /**
   * Applies frustum culling to all objects in the scene.
   *
   * Traverses the scene and sets the visible property of objects based on
   * whether they intersect with the camera frustum. Objects outside the frustum
   * are not rendered, improving performance.
   *
   * @private
   */
  private applyFrustumCulling(): void {
    if (!this.scene) return;

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Skip culling for objects that are always visible (like UI elements)
        if ((object.userData as { alwaysVisible?: boolean }).alwaysVisible) {
          object.visible = true;
          return;
        }

        // Check if object intersects with frustum
        // Use bounding box for accurate culling
        if (!object.geometry.boundingBox) {
          object.geometry.computeBoundingBox();
        }

        if (object.geometry.boundingBox) {
          // Clone bounding box to avoid modifying original
          const boundingBox = object.geometry.boundingBox.clone();
          boundingBox.applyMatrix4(object.matrixWorld);

          // Set visibility based on frustum intersection
          object.visible = this.frustum.intersectsBox(boundingBox);
        }
      }
    });
  }

  /**
   * Disposes a material and all its textures.
   *
   * @param material - Three.js material to dispose
   * @private
   */
  private disposeMaterial(material: THREE.Material): void {
    // Dispose all textures in the material
    const textureProperties = [
      'map',
      'normalMap',
      'bumpMap',
      'roughnessMap',
      'metalnessMap',
      'aoMap',
      'envMap',
      'lightMap',
      'emissiveMap',
    ];

    textureProperties.forEach((prop) => {
      const texture = (material as THREE.MeshStandardMaterial)[
        prop as keyof THREE.MeshStandardMaterial
      ] as THREE.Texture | undefined;
      if (texture) {
        texture.dispose();
      }
    });

    // Dispose material-specific resources
    if (material instanceof THREE.MeshStandardMaterial) {
      // Standard material cleanup
      material.envMap?.dispose();
    } else if (material instanceof THREE.MeshBasicMaterial) {
      // Basic material cleanup
      material.map?.dispose();
    }

    // Dispose the material itself
    material.dispose();
  }

  /**
   * Sets an object to always be visible, bypassing frustum culling.
   *
   * Useful for UI elements, skyboxes, or other objects that should always render.
   *
   * @param object - Three.js object to set as always visible
   * @param alwaysVisible - Whether the object should always be visible
   * @public
   */
  setAlwaysVisible(object: THREE.Object3D, alwaysVisible: boolean = true): void {
    (object.userData as { alwaysVisible?: boolean }).alwaysVisible = alwaysVisible;
  }

  /**
   * Gets the current frustum for debugging purposes.
   *
   * @returns The current camera frustum
   * @public
   */
  getFrustum(): THREE.Frustum {
    return this.frustum;
  }
}
