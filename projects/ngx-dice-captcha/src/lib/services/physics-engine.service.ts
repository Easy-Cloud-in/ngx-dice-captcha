import { Injectable, NgZone, inject } from '@angular/core';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { TypeAdapters } from '../utils/type-adapters.util';
import { ComponentError } from '../utils/error.util';

/**
 * Service responsible for managing the Cannon-es physics world and simulating physics.
 *
 * Provides a complete physics simulation system with collision detection, body management,
 * and synchronization with Three.js rendering. Supports various physics shapes (box, sphere,
 * plane, cylinder) and handles forces, impulses, and torques.
 *
 * @example
 * ```typescript
 * physicsEngine.initializeWorld(new CANNON.Vec3(0, -9.82, 0));
 *
 * const boxBody = physicsEngine.createBoxBody(
 *   new CANNON.Vec3(0.5, 0.5, 0.5),
 *   1,
 *   new CANNON.Vec3(0, 5, 0)
 * );
 * physicsEngine.addBody(boxBody, 'my-box');
 *
 * // In animation loop
 * physicsEngine.stepSimulation(deltaTime);
 * physicsEngine.syncWithThreeJS(threeMesh, boxBody);
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Injectable()
export class PhysicsEngineService {
  private readonly ngZone = inject(NgZone);

  private world?: CANNON.World;
  private bodies: Map<string, CANNON.Body> = new Map();
  private isInitialized = false;

  // Simulation settings
  private readonly timeStep = 1 / 60; // 60 FPS
  private maxSubSteps = 3;

  /**
   * Initializes the Cannon-es physics world.
   *
   * Sets up the physics simulation with specified gravity, broadphase collision
   * detection, sleep optimization, and default contact materials for realistic
   * dice physics (friction and restitution).
   *
   * @param gravity - Gravity vector (default: -9.82 m/s² on Y-axis, Earth-like)
   * @throws Will log warning if world is already initialized
   * @public
   */
  initializeWorld(gravity: CANNON.Vec3 = new CANNON.Vec3(0, -9.82, 0)): void {
    if (this.isInitialized) {
      return;
    }

    this.world = new CANNON.World({
      gravity,
    });

    // Broadphase is used for collision detection optimization
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);

    // Allow sleep for better performance and faster settling
    this.world.allowSleep = true;

    // Set default contact material properties for faster settling
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
      friction: 0.6, // Increased friction for faster stopping
      restitution: 0.2, // Reduced bounciness for quicker settling
    });
    this.world.addContactMaterial(defaultContactMaterial);
    this.world.defaultContactMaterial = defaultContactMaterial;

    this.isInitialized = true;
  }

  /**
   * Adds a physics body to the simulation world.
   *
   * @param body - Cannon-es body to add
   * @param id - Optional unique identifier for retrieving the body later
   * @throws Will throw error if world is not initialized
   * @public
   */
  addBody(body: CANNON.Body, id?: string): void {
    if (!this.world) {
      throw new ComponentError(
        'PhysicsEngineService',
        'addBody',
        'Physics world not initialized. Call initializeWorld() before adding bodies.',
        { isInitialized: this.isInitialized, bodyId: id }
      );
    }

    this.world.addBody(body);

    if (id) {
      this.bodies.set(id, body);
    }
  }

  /**
   * Removes a physics body from the simulation world.
   *
   * @param body - Cannon-es body to remove
   * @param id - Optional identifier to remove from internal tracking
   * @throws Will throw error if world is not initialized
   * @public
   */
  removeBody(body: CANNON.Body, id?: string): void {
    if (!this.world) {
      throw new ComponentError(
        'PhysicsEngineService',
        'removeBody',
        'Physics world not initialized. Call initializeWorld() before removing bodies.',
        { isInitialized: this.isInitialized, bodyId: id }
      );
    }

    this.world.removeBody(body);

    if (id) {
      this.bodies.delete(id);
    }
  }

  /**
   * Retrieves a physics body by its identifier.
   *
   * @param id - Body identifier set during addBody()
   * @returns The body if found, undefined otherwise
   * @public
   */
  getBody(id: string): CANNON.Body | undefined {
    return this.bodies.get(id);
  }

  /**
   * Steps the physics simulation forward in time.
   *
   * Uses a fixed timestep with substeps for stability. Automatically clamps
   * delta time to prevent the "spiral of death" in slow frames.
   *
   * @param deltaTime - Time elapsed since last step in seconds (will be clamped to 0.1s max)
   * @throws Will throw error if world is not initialized
   * @public
   */
  stepSimulation(deltaTime: number): void {
    if (!this.world) {
      throw new Error('PhysicsEngineService: World not initialized');
    }

    // Clamp delta time to prevent spiral of death
    const clampedDelta = Math.min(deltaTime, 0.1);

    this.world.step(this.timeStep, clampedDelta, this.maxSubSteps);
  }

  /**
   * Synchronizes Three.js object transform with physics body state.
   *
   * Copies position and quaternion rotation from the physics body to the
   * Three.js object for accurate visual representation.
   *
   * @param threeObject - Three.js object (mesh, group, etc.) to update
   * @param body - Cannon-es body to sync from
   * @public
   */
  syncWithThreeJS(threeObject: THREE.Object3D, body: CANNON.Body): void {
    // Copy position and rotation using type-safe adapters
    TypeAdapters.syncBodyToObject(body, threeObject);
  }

  /**
   * Applies a continuous force to a physics body.
   *
   * Force is applied over time and affects the body's velocity gradually.
   *
   * @param body - Body to apply force to
   * @param force - Force vector in Newtons
   * @param worldPoint - Point in world space where force is applied (defaults to body center)
   * @public
   */
  applyForce(body: CANNON.Body, force: CANNON.Vec3, worldPoint?: CANNON.Vec3): void {
    if (worldPoint) {
      body.applyForce(force, worldPoint);
    } else {
      body.applyForce(force, body.position);
    }
  }

  /**
   * Applies an instantaneous impulse to a physics body.
   *
   * Impulse immediately affects the body's velocity. Useful for dice throws
   * and instant impacts.
   *
   * @param body - Body to apply impulse to
   * @param impulse - Impulse vector in Newton-seconds
   * @param worldPoint - Point in world space where impulse is applied (defaults to body center)
   * @public
   */
  applyImpulse(body: CANNON.Body, impulse: CANNON.Vec3, worldPoint?: CANNON.Vec3): void {
    if (worldPoint) {
      body.applyImpulse(impulse, worldPoint);
    } else {
      body.applyImpulse(impulse, body.position);
    }
  }

  /**
   * Applies rotational force (torque) to a physics body.
   *
   * Causes the body to spin around its center of mass.
   *
   * @param body - Body to apply torque to
   * @param torque - Torque vector in Newton-meters
   * @public
   */
  applyTorque(body: CANNON.Body, torque: CANNON.Vec3): void {
    body.applyTorque(torque);
  }

  /**
   * Sets the linear velocity of a physics body.
   *
   * @param body - Body to set velocity for
   * @param velocity - Velocity vector in meters per second
   * @public
   */
  setVelocity(body: CANNON.Body, velocity: CANNON.Vec3): void {
    body.velocity.copy(velocity);
  }

  /**
   * Sets the angular (rotational) velocity of a physics body.
   *
   * @param body - Body to set angular velocity for
   * @param angularVelocity - Angular velocity vector in radians per second
   * @public
   */
  setAngularVelocity(body: CANNON.Body, angularVelocity: CANNON.Vec3): void {
    body.angularVelocity.copy(angularVelocity);
  }

  /**
   * Creates a box-shaped physics body.
   *
   * @param size - Half extents (half-width, half-height, half-depth) of the box
   * @param mass - Mass in kilograms (0 for static, immovable bodies)
   * @param position - Initial position in world space
   * @returns A configured box physics body
   * @public
   */
  createBoxBody(
    size: CANNON.Vec3,
    mass: number = 1,
    position: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0)
  ): CANNON.Body {
    const shape = new CANNON.Box(size);
    const body = new CANNON.Body({ mass, shape });
    body.position.copy(position);
    return body;
  }

  /**
   * Creates a sphere-shaped physics body.
   *
   * @param radius - Radius of the sphere in meters
   * @param mass - Mass in kilograms (0 for static, immovable bodies)
   * @param position - Initial position in world space
   * @returns A configured sphere physics body
   * @public
   */
  createSphereBody(
    radius: number,
    mass: number = 1,
    position: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0)
  ): CANNON.Body {
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({ mass, shape });
    body.position.copy(position);
    return body;
  }

  /**
   * Creates an infinite plane physics body.
   *
   * Typically used for ground surfaces. Planes extend infinitely in two dimensions.
   *
   * @param position - Initial position in world space
   * @param rotation - Rotation quaternion (defaults to horizontal plane)
   * @returns A configured plane physics body (mass = 0, static)
   * @public
   */
  createPlaneBody(
    position: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0),
    rotation?: CANNON.Quaternion
  ): CANNON.Body {
    const shape = new CANNON.Plane();
    const body = new CANNON.Body({ mass: 0, shape }); // Static body
    body.position.copy(position);

    if (rotation) {
      body.quaternion.copy(rotation);
    } else {
      // Default rotation for horizontal plane
      body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    }

    return body;
  }

  /**
   * Creates a cylinder-shaped physics body.
   *
   * Can create cylinders or cones by varying top and bottom radii.
   *
   * @param radiusTop - Radius at the top in meters
   * @param radiusBottom - Radius at the bottom in meters
   * @param height - Height of the cylinder in meters
   * @param numSegments - Number of segments for collision approximation (default: 8)
   * @param mass - Mass in kilograms (0 for static, immovable bodies)
   * @param position - Initial position in world space
   * @returns A configured cylinder physics body
   * @public
   */
  createCylinderBody(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    numSegments: number = 8,
    mass: number = 1,
    position: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0)
  ): CANNON.Body {
    const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
    const body = new CANNON.Body({ mass, shape });
    body.position.copy(position);
    return body;
  }

  /**
   * Resets the physics world by removing all bodies.
   *
   * Useful for starting a new simulation without recreating the world.
   *
   * @public
   */
  reset(): void {
    if (!this.world) {
      return;
    }

    // Remove all bodies
    const bodiesToRemove = [...this.world.bodies];
    bodiesToRemove.forEach((body) => this.world!.removeBody(body));

    this.bodies.clear();
  }

  /**
   * Gets the Cannon-es physics world instance.
   *
   * @returns The world instance or undefined if not initialized
   * @public
   */
  getWorld(): CANNON.World | undefined {
    return this.world;
  }

  /**
   * Checks if the physics engine has been initialized.
   *
   * @returns true if initializeWorld() has been called successfully
   * @public
   */
  isEngineInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Sets the gravity vector for the physics world.
   *
   * Affects all dynamic bodies in the simulation.
   *
   * @param gravity - New gravity vector in m/s²
   * @throws Will throw error if world is not initialized
   * @public
   */
  setGravity(gravity: CANNON.Vec3): void {
    if (!this.world) {
      throw new Error('PhysicsEngineService: World not initialized');
    }
    this.world.gravity.copy(gravity);
  }

  /**
   * Wakes up all bodies in the physics world.
   *
   * Useful after significant scene changes (like boundary updates) to ensure
   * all bodies recalculate their physics interactions. Sleeping bodies are
   * awakened to respond to new collision boundaries.
   *
   * @public
   * @since 2.2.0
   */
  wakeAllBodies(): void {
    if (!this.world) {
      return;
    }

    this.world.bodies.forEach((body) => {
      if (body.type !== CANNON.Body.STATIC) {
        body.wakeUp();
      }
    });
  }

  /**
   * Disposes of all resources and performs cleanup.
   *
   * Removes all bodies, clears references, and resets initialization state.
   *
   * @public
   */
  dispose(): void {
    this.reset();
    this.world = undefined;
    this.isInitialized = false;
  }
}
