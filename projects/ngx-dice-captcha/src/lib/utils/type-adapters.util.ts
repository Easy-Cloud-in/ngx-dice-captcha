import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Type-safe adapter utilities for converting between Cannon.js and Three.js types.
 *
 * These utilities provide type-safe conversions without using unsafe type casting,
 * ensuring runtime safety and better maintainability.
 *
 * @example
 * ```typescript
 * const cannonBody = new CANNON.Body();
 * const threeVector = TypeAdapters.cannonToThreeVector(cannonBody.position);
 * const threeQuat = TypeAdapters.cannonToThreeQuaternion(cannonBody.quaternion);
 * ```
 *
 * @public
 * @since 1.0.0
 */
export namespace TypeAdapters {
  /**
   * Converts a Cannon.js Vec3 to a Three.js Vector3.
   *
   * @param v - Cannon.js Vec3 to convert
   * @returns New Three.js Vector3 instance
   * @public
   */
  export function cannonToThreeVector(v: CANNON.Vec3): THREE.Vector3 {
    return new THREE.Vector3(v.x, v.y, v.z);
  }

  /**
   * Converts a Cannon.js Quaternion to a Three.js Quaternion.
   *
   * @param q - Cannon.js Quaternion to convert
   * @returns New Three.js Quaternion instance
   * @public
   */
  export function cannonToThreeQuaternion(q: CANNON.Quaternion): THREE.Quaternion {
    return new THREE.Quaternion(q.x, q.y, q.z, q.w);
  }

  /**
   * Converts a Three.js Vector3 to a Cannon.js Vec3.
   *
   * @param v - Three.js Vector3 to convert
   * @returns New Cannon.js Vec3 instance
   * @public
   */
  export function threeToCannonVector(v: THREE.Vector3): CANNON.Vec3 {
    return new CANNON.Vec3(v.x, v.y, v.z);
  }

  /**
   * Converts a Three.js Quaternion to a Cannon.js Quaternion.
   *
   * @param q - Three.js Quaternion to convert
   * @returns New Cannon.js Quaternion instance
   * @public
   */
  export function threeToCannonQuaternion(q: THREE.Quaternion): CANNON.Quaternion {
    return new CANNON.Quaternion(q.x, q.y, q.z, q.w);
  }

  /**
   * Copies position and rotation from a Cannon.js Body to a Three.js Object3D.
   *
   * This is a convenience method that combines vector and quaternion conversion
   * in a single operation, commonly used in render loops.
   *
   * @param body - Source Cannon.js Body
   * @param threeObject - Target Three.js Object3D
   * @public
   * @throws {Error} If body or threeObject is null/undefined
   */
  export function syncBodyToObject(body: CANNON.Body, threeObject: THREE.Object3D): void {
    if (!body || !threeObject) {
      return;
    }

    if (!body.position || !body.quaternion) {
      return;
    }

    threeObject.position.copy(cannonToThreeVector(body.position));
    threeObject.quaternion.copy(cannonToThreeQuaternion(body.quaternion));
  }

  /**
   * Copies position and rotation from a Three.js Object3D to a Cannon.js Body.
   *
   * @param threeObject - Source Three.js Object3D
   * @param body - Target Cannon.js Body
   * @public
   * @throws {Error} If threeObject or body is null/undefined
   */
  export function syncObjectToBody(threeObject: THREE.Object3D, body: CANNON.Body): void {
    if (!threeObject || !body) {
      return;
    }

    if (!threeObject.position || !threeObject.quaternion) {
      return;
    }

    if (!body.position || !body.quaternion) {
      return;
    }

    const pos = threeToCannonVector(threeObject.position);
    const quat = threeToCannonQuaternion(threeObject.quaternion);

    body.position.copy(pos);
    body.quaternion.copy(quat);
  }
}
