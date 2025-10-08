import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceType } from '../models/dice.model';
import { PhysicsConfig } from '../models/captcha-config.model';

/**
 * Default physics configuration for dice
 */
export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: -9.82,
  restitution: 0.3,
  friction: 0.8,
  linearDamping: 0.1,
  angularDamping: 0.1,
  collisionIterations: 10,
};

/**
 * Threshold for determining if a dice has settled (stopped moving)
 * Lower thresholds ensure dice are truly settled before reading values
 * Optimized for fast settling with high damping values
 */
export const SETTLEMENT_THRESHOLD = {
  velocity: 0.05, // Initial detection threshold
  angularVelocity: 0.05, // Initial detection threshold
  confirmationVelocity: 0.02, // Final confirmation threshold
  confirmationAngularVelocity: 0.02, // Final confirmation threshold
  checkDuration: 250, // milliseconds - reduced for faster response
};

/**
 * Converts a Three.js Vector3 to a Cannon-es Vec3.
 * Used for translating positions between rendering and physics systems.
 *
 * @param position - Three.js Vector3 position
 * @returns Cannon-es Vec3 position
 *
 * @example
 * ```typescript
 * const threePos = new THREE.Vector3(1, 2, 3);
 * const cannonPos = threeToCannonPosition(threePos);
 * ```
 */
export function threeToCannonPosition(position: THREE.Vector3): CANNON.Vec3 {
  return new CANNON.Vec3(position.x, position.y, position.z);
}

/**
 * Converts a Cannon-es Vec3 to a Three.js Vector3.
 * Used for translating positions from physics to rendering.
 *
 * @param position - Cannon-es Vec3 position
 * @returns Three.js Vector3 position
 *
 * @example
 * ```typescript
 * const cannonPos = new CANNON.Vec3(1, 2, 3);
 * const threePos = cannonToThreePosition(cannonPos);
 * ```
 */
export function cannonToThreePosition(position: CANNON.Vec3): THREE.Vector3 {
  return new THREE.Vector3(position.x, position.y, position.z);
}

/**
 * Converts a Three.js Quaternion to a Cannon-es Quaternion.
 * Used for translating rotations between rendering and physics systems.
 *
 * @param quaternion - Three.js Quaternion
 * @returns Cannon-es Quaternion
 *
 * @example
 * ```typescript
 * const threeQuat = new THREE.Quaternion();
 * const cannonQuat = threeToCannonQuaternion(threeQuat);
 * ```
 */
export function threeToCannonQuaternion(quaternion: THREE.Quaternion): CANNON.Quaternion {
  return new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
}

/**
 * Converts a Cannon-es Quaternion to a Three.js Quaternion.
 * Used for translating rotations from physics to rendering.
 *
 * @param quaternion - Cannon-es Quaternion
 * @returns Three.js Quaternion
 *
 * @example
 * ```typescript
 * const cannonQuat = new CANNON.Quaternion();
 * const threeQuat = cannonToThreeQuaternion(cannonQuat);
 * ```
 */
export function cannonToThreeQuaternion(quaternion: CANNON.Quaternion): THREE.Quaternion {
  return new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
}

/**
 * Synchronizes a Three.js mesh with a Cannon-es body.
 * Copies position and rotation from physics body to mesh.
 *
 * @param mesh - Three.js mesh to update
 * @param body - Cannon-es body to copy from
 *
 * @example
 * ```typescript
 * // In animation loop
 * syncMeshWithBody(diceMesh, diceBody);
 * ```
 */
export function syncMeshWithBody(mesh: THREE.Mesh, body: CANNON.Body): void {
  mesh.position.copy(cannonToThreePosition(body.position));
  mesh.quaternion.copy(cannonToThreeQuaternion(body.quaternion));
}

/**
 * Applies a rolling impulse to a dice body with randomized direction.
 * This creates realistic dice rolling behavior.
 *
 * @param body - Cannon-es body to apply impulse to
 * @param strength - Strength of the impulse (default: 5)
 *
 * @example
 * ```typescript
 * applyRollImpulse(diceBody, 8);
 * ```
 */
export function applyRollImpulse(body: CANNON.Body, strength: number = 5): void {
  // Random direction for linear impulse (mainly upward and forward)
  const impulse = new CANNON.Vec3(
    (Math.random() - 0.5) * strength * 0.5,
    strength * 0.8 + Math.random() * strength * 0.4,
    (Math.random() - 0.5) * strength * 0.5
  );

  // Random angular impulse for spinning
  const angularImpulse = new CANNON.Vec3(
    (Math.random() - 0.5) * strength * 2,
    (Math.random() - 0.5) * strength * 2,
    (Math.random() - 0.5) * strength * 2
  );

  // Apply impulses at the center of mass
  body.applyImpulse(impulse);
  body.angularVelocity.set(angularImpulse.x, angularImpulse.y, angularImpulse.z);
}

/**
 * Checks if a dice body has settled (stopped moving).
 * Uses velocity and angular velocity thresholds.
 *
 * @param body - Cannon-es body to check
 * @param threshold - Custom threshold (optional)
 * @returns True if the body has settled
 *
 * @example
 * ```typescript
 * if (isDiceSettled(diceBody)) {
 *   const value = calculateDiceFaceValue(diceMesh, DiceType.D6);
 * }
 * ```
 */
export function isDiceSettled(
  body: CANNON.Body,
  threshold: { velocity: number; angularVelocity: number } = SETTLEMENT_THRESHOLD
): boolean {
  const linearVelocity = body.velocity.length();
  const angularVelocity = body.angularVelocity.length();

  return linearVelocity < threshold.velocity && angularVelocity < threshold.angularVelocity;
}

/**
 * Calculates which face of a dice is pointing upward.
 * This determines the rolled value of the dice.
 *
 * @param mesh - Three.js mesh of the dice
 * @param diceType - Type of dice (D6, D8, D12, D20)
 * @returns The face value (1 to N where N is the number of faces)
 *
 * @example
 * ```typescript
 * const value = calculateDiceFaceValue(diceMesh, DiceType.D6);
 * console.log('Rolled:', value); // 1-6
 * ```
 */
export function calculateDiceFaceValue(mesh: THREE.Mesh, diceType: DiceType): number {
  const upVector = new THREE.Vector3(0, 1, 0);

  // Get the world rotation of the mesh
  const worldQuaternion = new THREE.Quaternion();
  mesh.getWorldQuaternion(worldQuaternion);

  // Calculate which face is pointing up
  return getUpwardFace(worldQuaternion, diceType);
}

/**
 * Determines which face is pointing upward based on rotation.
 * Uses face normals to find the face closest to the up vector.
 *
 * @param rotation - World quaternion rotation of the dice
 * @param diceType - Type of dice
 * @returns The face value pointing upward
 *
 * @example
 * ```typescript
 * const quaternion = mesh.quaternion;
 * const faceValue = getUpwardFace(quaternion, DiceType.D6);
 * ```
 */
export function getUpwardFace(rotation: THREE.Quaternion, diceType: DiceType): number {
  const upVector = new THREE.Vector3(0, 1, 0);

  switch (diceType) {
    case DiceType.D6:
      return getD6UpwardFace(rotation, upVector);
    case DiceType.D8:
      return getD8UpwardFace(rotation, upVector);
    case DiceType.D12:
      return getD12UpwardFace(rotation, upVector);
    case DiceType.D20:
      return getD20UpwardFace(rotation, upVector);
    default:
      return 1;
  }
}

/**
 * Gets the upward face for a D6 (cube)
 */
function getD6UpwardFace(rotation: THREE.Quaternion, upVector: THREE.Vector3): number {
  const faceNormals = [
    new THREE.Vector3(0, -1, 0), // Face 1 (bottom)
    new THREE.Vector3(1, 0, 0), // Face 2 (right)
    new THREE.Vector3(0, 0, 1), // Face 3 (front)
    new THREE.Vector3(0, 0, -1), // Face 4 (back)
    new THREE.Vector3(-1, 0, 0), // Face 5 (left)
    new THREE.Vector3(0, 1, 0), // Face 6 (top)
  ];

  let maxDot = -Infinity;
  let faceValue = 1;

  faceNormals.forEach((normal, index) => {
    const rotatedNormal = normal.clone().applyQuaternion(rotation);
    const dot = rotatedNormal.dot(upVector);

    if (dot > maxDot) {
      maxDot = dot;
      faceValue = index + 1;
    }
  });

  return faceValue;
}

/**
 * Gets the upward face for a D8 (octahedron)
 */
function getD8UpwardFace(rotation: THREE.Quaternion, upVector: THREE.Vector3): number {
  const faceNormals = [
    new THREE.Vector3(1, 1, 1).normalize(),
    new THREE.Vector3(-1, 1, 1).normalize(),
    new THREE.Vector3(-1, 1, -1).normalize(),
    new THREE.Vector3(1, 1, -1).normalize(),
    new THREE.Vector3(1, -1, 1).normalize(),
    new THREE.Vector3(-1, -1, 1).normalize(),
    new THREE.Vector3(-1, -1, -1).normalize(),
    new THREE.Vector3(1, -1, -1).normalize(),
  ];

  return findClosestFace(faceNormals, rotation, upVector);
}

/**
 * Gets the upward face for a D12 (dodecahedron)
 */
function getD12UpwardFace(rotation: THREE.Quaternion, upVector: THREE.Vector3): number {
  const phi = (1 + Math.sqrt(5)) / 2;
  const a = 1 / Math.sqrt(3);
  const b = a / phi;
  const c = a * phi;

  const faceNormals = [
    new THREE.Vector3(0, b, c),
    new THREE.Vector3(0, -b, c),
    new THREE.Vector3(0, b, -c),
    new THREE.Vector3(0, -b, -c),
    new THREE.Vector3(c, 0, b),
    new THREE.Vector3(-c, 0, b),
    new THREE.Vector3(c, 0, -b),
    new THREE.Vector3(-c, 0, -b),
    new THREE.Vector3(b, c, 0),
    new THREE.Vector3(-b, c, 0),
    new THREE.Vector3(b, -c, 0),
    new THREE.Vector3(-b, -c, 0),
  ].map((v) => v.normalize());

  return findClosestFace(faceNormals, rotation, upVector);
}

/**
 * Gets the upward face for a D20 (icosahedron)
 */
function getD20UpwardFace(rotation: THREE.Quaternion, upVector: THREE.Vector3): number {
  const phi = (1 + Math.sqrt(5)) / 2;
  const t = phi;

  const vertices = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ].map((v) => new THREE.Vector3(v[0], v[1], v[2]).normalize());

  const faces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];

  const faceNormals = faces.map((face) => {
    const v1 = vertices[face[0]];
    const v2 = vertices[face[1]];
    const v3 = vertices[face[2]];

    const center = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);

    return center.normalize();
  });

  return findClosestFace(faceNormals, rotation, upVector);
}

/**
 * Helper function to find which face is closest to the up vector
 */
function findClosestFace(
  faceNormals: THREE.Vector3[],
  rotation: THREE.Quaternion,
  upVector: THREE.Vector3
): number {
  let maxDot = -Infinity;
  let faceValue = 1;

  faceNormals.forEach((normal, index) => {
    const rotatedNormal = normal.clone().applyQuaternion(rotation);
    const dot = rotatedNormal.dot(upVector);

    if (dot > maxDot) {
      maxDot = dot;
      faceValue = index + 1;
    }
  });

  return faceValue;
}

/**
 * Creates a physics body for a dice based on its type.
 *
 * @param diceType - Type of dice
 * @param size - Size of the dice
 * @param config - Physics configuration
 * @returns Cannon-es body configured for the dice
 *
 * @example
 * ```typescript
 * const body = createDiceBody(DiceType.D6, 50, DEFAULT_PHYSICS_CONFIG);
 * world.addBody(body);
 * ```
 */
export function createDiceBody(
  diceType: DiceType,
  size: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): CANNON.Body {
  let shape: CANNON.Shape;

  // Create appropriate shape based on dice type
  // For now, using box shape for all types (can be enhanced)
  const halfSize = size / 2;
  shape = new CANNON.Box(new CANNON.Vec3(halfSize, halfSize, halfSize));

  const body = new CANNON.Body({
    mass: 1,
    shape: shape,
    material: new CANNON.Material({
      friction: config.friction,
      restitution: config.restitution,
    }),
  });

  body.linearDamping = config.linearDamping;
  body.angularDamping = config.angularDamping;

  return body;
}

/**
 * Resets a dice body to initial position and velocity.
 * Useful for re-rolling dice.
 *
 * @param body - Cannon-es body to reset
 * @param position - Initial position (optional)
 *
 * @example
 * ```typescript
 * resetDiceBody(diceBody, new CANNON.Vec3(0, 10, 0));
 * ```
 */
export function resetDiceBody(
  body: CANNON.Body,
  position: CANNON.Vec3 = new CANNON.Vec3(0, 5, 0)
): void {
  body.position.copy(position);
  body.velocity.setZero();
  body.angularVelocity.setZero();
  body.quaternion.set(0, 0, 0, 1);
}

/**
 * Creates a ground plane for dice to land on.
 *
 * @param config - Physics configuration
 * @returns Cannon-es body representing the ground
 *
 * @example
 * ```typescript
 * const ground = createGroundPlane(DEFAULT_PHYSICS_CONFIG);
 * world.addBody(ground);
 * ```
 */
export function createGroundPlane(config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG): CANNON.Body {
  const groundShape = new CANNON.Plane();
  const groundBody = new CANNON.Body({
    mass: 0, // Static body
    shape: groundShape,
    material: new CANNON.Material({
      friction: config.friction,
      restitution: config.restitution,
    }),
  });

  // Rotate to be horizontal
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

  return groundBody;
}

/**
 * Creates walls around the dice rolling area to contain them.
 *
 * @param width - Width of the area
 * @param height - Height of walls
 * @param depth - Depth of the area
 * @param config - Physics configuration
 * @returns Array of Cannon-es bodies representing walls
 *
 * @example
 * ```typescript
 * const walls = createContainmentWalls(10, 5, 10, DEFAULT_PHYSICS_CONFIG);
 * walls.forEach(wall => world.addBody(wall));
 * ```
 */
export function createContainmentWalls(
  width: number,
  height: number,
  depth: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): CANNON.Body[] {
  const material = new CANNON.Material({
    friction: config.friction,
    restitution: config.restitution,
  });

  const thickness = 0.5;
  const walls: CANNON.Body[] = [];

  // Front wall
  const frontWall = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, thickness / 2)),
    position: new CANNON.Vec3(0, height / 2, depth / 2),
    material,
  });
  walls.push(frontWall);

  // Back wall
  const backWall = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, thickness / 2)),
    position: new CANNON.Vec3(0, height / 2, -depth / 2),
    material,
  });
  walls.push(backWall);

  // Left wall
  const leftWall = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(thickness / 2, height / 2, depth / 2)),
    position: new CANNON.Vec3(-width / 2, height / 2, 0),
    material,
  });
  walls.push(leftWall);

  // Right wall
  const rightWall = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(thickness / 2, height / 2, depth / 2)),
    position: new CANNON.Vec3(width / 2, height / 2, 0),
    material,
  });
  walls.push(rightWall);

  return walls;
}
