import * as THREE from 'three';

/**
 * Generic object pool for reusing objects and reducing garbage collection pressure
 *
 * This is particularly important for hot paths (60 FPS loops) where creating new
 * objects every frame causes severe GC pressure and frame drops.
 *
 * @example
 * ```typescript
 * const pool = new ObjectPool<THREE.Vector3>(
 *   () => new THREE.Vector3(),
 *   (v) => v.set(0, 0, 0),
 *   50
 * );
 *
 * // In hot path
 * const vec = pool.acquire();
 * // Use vec...
 * pool.release(vec); // Return to pool for reuse
 * ```
 */
export class ObjectPool<T> {
  private pool: T[] = [];

  /**
   * Create an object pool
   *
   * @param factory - Function to create new objects when pool is empty
   * @param reset - Function to reset objects before returning to pool
   * @param maxSize - Maximum pool size to prevent unbounded growth
   */
  constructor(
    private factory: () => T,
    private reset: (obj: T) => void,
    private readonly maxSize: number = 50
  ) {}

  /**
   * Get an object from the pool (or create new if pool is empty)
   *
   * @returns An object ready for use
   */
  acquire(): T {
    return this.pool.pop() || this.factory();
  }

  /**
   * Return an object to the pool for reuse
   *
   * @param obj - The object to return to the pool
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  /**
   * Clear the entire pool (useful for cleanup)
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * Get current pool size (for monitoring/debugging)
   */
  size(): number {
    return this.pool.length;
  }
}

/**
 * Specialized pool for THREE.Vector3 objects
 *
 * Optimized for use in animation loops and physics calculations
 * where Vector3 objects are frequently created and discarded.
 *
 * @example
 * ```typescript
 * const vectorPool = new Vector3Pool();
 *
 * // In animation loop
 * const tempVec = vectorPool.acquire();
 * tempVec.set(x, y, z);
 * // ... use tempVec ...
 * vectorPool.release(tempVec);
 * ```
 */
export class Vector3Pool extends ObjectPool<THREE.Vector3> {
  constructor(maxSize: number = 100) {
    super(
      () => new THREE.Vector3(),
      (v) => v.set(0, 0, 0),
      maxSize
    );
  }

  /**
   * Acquire a vector and immediately set its values
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   * @returns A Vector3 with the specified values
   */
  acquireSet(x: number, y: number, z: number): THREE.Vector3 {
    const vec = this.acquire();
    vec.set(x, y, z);
    return vec;
  }

  /**
   * Acquire a vector and copy values from another vector
   *
   * @param source - Vector to copy from
   * @returns A Vector3 with copied values
   */
  acquireCopy(source: THREE.Vector3): THREE.Vector3 {
    const vec = this.acquire();
    vec.copy(source);
    return vec;
  }
}

/**
 * Specialized pool for THREE.Quaternion objects
 *
 * Optimized for use in rotation calculations where Quaternion objects
 * are frequently created for temporary calculations.
 *
 * @example
 * ```typescript
 * const quatPool = new QuaternionPool();
 *
 * // In animation loop
 * const tempQuat = quatPool.acquire();
 * tempQuat.setFromEuler(euler);
 * // ... use tempQuat ...
 * quatPool.release(tempQuat);
 * ```
 */
export class QuaternionPool extends ObjectPool<THREE.Quaternion> {
  constructor(maxSize: number = 50) {
    super(
      () => new THREE.Quaternion(),
      (q) => q.set(0, 0, 0, 1), // Identity quaternion
      maxSize
    );
  }

  /**
   * Acquire a quaternion and immediately set its values
   *
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @param w - W component
   * @returns A Quaternion with the specified values
   */
  acquireSet(x: number, y: number, z: number, w: number): THREE.Quaternion {
    const quat = this.acquire();
    quat.set(x, y, z, w);
    return quat;
  }

  /**
   * Acquire a quaternion and copy values from another quaternion
   *
   * @param source - Quaternion to copy from
   * @returns A Quaternion with copied values
   */
  acquireCopy(source: THREE.Quaternion): THREE.Quaternion {
    const quat = this.acquire();
    quat.copy(source);
    return quat;
  }
}

/**
 * Global singleton pools for common use cases
 *
 * These are provided for convenience and can be used across the application
 * without needing to create and manage individual pool instances.
 */
export const globalVector3Pool = new Vector3Pool(100);
export const globalQuaternionPool = new QuaternionPool(50);
