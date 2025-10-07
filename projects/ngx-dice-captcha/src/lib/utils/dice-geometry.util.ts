import * as THREE from 'three';
import { DiceType } from '../models/dice.model';

/**
 * Configuration for rounded box geometry generation
 */
export interface RoundedBoxConfig {
  size: number;
  radius: number;
  segments: number;
}

/**
 * Face position data for a specific dice face
 */
export interface FacePosition {
  value: number;
  position: THREE.Vector3;
  normal: THREE.Vector3;
}

/**
 * Creates a rounded box geometry for realistic dice appearance.
 * The geometry has smooth, rounded corners and edges.
 *
 * @param size - The size of the dice (width/height/depth)
 * @param radius - The corner radius (0-0.5 of size)
 * @param segments - Number of segments for the rounded corners (higher = smoother)
 * @returns A Three.js BufferGeometry representing the rounded box
 *
 * @example
 * ```typescript
 * const geometry = createRoundedBoxGeometry(50, 5, 8);
 * const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
 * const mesh = new THREE.Mesh(geometry, material);
 * ```
 */
export function createRoundedBoxGeometry(
  size: number,
  radius: number,
  segments: number = 8
): THREE.BufferGeometry {
  // Validate inputs
  if (size <= 0) {
    throw new Error('Size must be positive');
  }
  if (radius < 0 || radius > size / 2) {
    throw new Error('Radius must be between 0 and half the size');
  }
  if (segments < 1) {
    throw new Error('Segments must be at least 1');
  }

  // Clamp radius to valid range
  const clampedRadius = Math.min(radius, size / 2);

  // Use Three.js BoxGeometry as base
  // For production, this could be enhanced with custom geometry generation
  const geometry = new THREE.BoxGeometry(size, size, size, segments, segments, segments);

  // Apply corner rounding through vertex manipulation
  const positions = geometry.attributes['position'];
  const halfSize = size / 2;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Calculate distance from corner
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const absZ = Math.abs(z);

    // Apply rounding to vertices near corners
    if (
      absX > halfSize - clampedRadius &&
      absY > halfSize - clampedRadius &&
      absZ > halfSize - clampedRadius
    ) {
      const signX = Math.sign(x);
      const signY = Math.sign(y);
      const signZ = Math.sign(z);

      const cornerX = signX * (halfSize - clampedRadius);
      const cornerY = signY * (halfSize - clampedRadius);
      const cornerZ = signZ * (halfSize - clampedRadius);

      const dx = x - cornerX;
      const dy = y - cornerY;
      const dz = z - cornerZ;

      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance > 0) {
        const factor = clampedRadius / distance;
        positions.setXYZ(i, cornerX + dx * factor, cornerY + dy * factor, cornerZ + dz * factor);
      }
    }
  }

  // Update geometry after modifications
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Calculates the 3D positions of face centers for a given dice type.
 * These positions represent where each numbered face is located on the dice.
 *
 * @param diceType - The type of dice (D6, D8, D12, D20)
 * @param size - The size of the dice
 * @returns Array of face positions with their values, positions, and normals
 *
 * @example
 * ```typescript
 * const faces = calculateFacePositions(DiceType.D6, 50);
 * // Returns positions for faces 1-6
 * ```
 */
export function calculateFacePositions(diceType: DiceType, size: number = 50): FacePosition[] {
  const halfSize = size / 2;

  switch (diceType) {
    case DiceType.D6:
      return [
        {
          value: 1,
          position: new THREE.Vector3(0, -halfSize, 0),
          normal: new THREE.Vector3(0, -1, 0),
        },
        {
          value: 2,
          position: new THREE.Vector3(halfSize, 0, 0),
          normal: new THREE.Vector3(1, 0, 0),
        },
        {
          value: 3,
          position: new THREE.Vector3(0, 0, halfSize),
          normal: new THREE.Vector3(0, 0, 1),
        },
        {
          value: 4,
          position: new THREE.Vector3(0, 0, -halfSize),
          normal: new THREE.Vector3(0, 0, -1),
        },
        {
          value: 5,
          position: new THREE.Vector3(-halfSize, 0, 0),
          normal: new THREE.Vector3(-1, 0, 0),
        },
        {
          value: 6,
          position: new THREE.Vector3(0, halfSize, 0),
          normal: new THREE.Vector3(0, 1, 0),
        },
      ];

    case DiceType.D8:
      // Octahedron - 8 triangular faces
      return calculateOctahedronFaces(size);

    case DiceType.D12:
      // Dodecahedron - 12 pentagonal faces
      return calculateDodecahedronFaces(size);

    case DiceType.D20:
      // Icosahedron - 20 triangular faces
      return calculateIcosahedronFaces(size);

    default:
      throw new Error(`Unsupported dice type: ${diceType}`);
  }
}

/**
 * Calculates face positions for an octahedron (D8)
 */
function calculateOctahedronFaces(size: number): FacePosition[] {
  const positions: FacePosition[] = [];
  const distance = size / 2;

  // 8 triangular faces of octahedron
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

  faceNormals.forEach((normal, index) => {
    positions.push({
      value: index + 1,
      position: normal.clone().multiplyScalar(distance),
      normal: normal.clone(),
    });
  });

  return positions;
}

/**
 * Calculates face positions for a dodecahedron (D12)
 */
function calculateDodecahedronFaces(size: number): FacePosition[] {
  const positions: FacePosition[] = [];
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
  const distance = size / 2;

  // 12 pentagonal faces - approximate positions
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

  faceNormals.forEach((normal, index) => {
    positions.push({
      value: index + 1,
      position: normal.clone().multiplyScalar(distance),
      normal: normal.clone(),
    });
  });

  return positions;
}

/**
 * Calculates face positions for an icosahedron (D20)
 */
function calculateIcosahedronFaces(size: number): FacePosition[] {
  const positions: FacePosition[] = [];
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
  const distance = size / 2;

  // Vertices of icosahedron
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

  // 20 triangular faces - calculated from vertex positions
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

  faces.forEach((face, index) => {
    const v1 = vertices[face[0]];
    const v2 = vertices[face[1]];
    const v3 = vertices[face[2]];

    // Calculate face center
    const center = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);

    const normal = center.clone().normalize();

    positions.push({
      value: index + 1,
      position: normal.clone().multiplyScalar(distance),
      normal: normal,
    });
  });

  return positions;
}

/**
 * Applies UV mapping to a dice geometry for texture placement.
 * Maps textures correctly to each face of the dice.
 *
 * @param geometry - The geometry to apply UV mapping to
 * @param diceType - The type of dice
 *
 * @example
 * ```typescript
 * const geometry = createRoundedBoxGeometry(50, 5, 8);
 * applyUVMapping(geometry, DiceType.D6);
 * ```
 */
export function applyUVMapping(geometry: THREE.BufferGeometry, diceType: DiceType): void {
  if (!geometry.attributes['position']) {
    throw new Error('Geometry must have position attribute');
  }

  const positions = geometry.attributes['position'];
  const uvs = new Float32Array(positions.count * 2);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Determine which face this vertex belongs to
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const absZ = Math.abs(z);

    let u = 0,
      v = 0;

    // Map UV coordinates based on dominant axis
    if (absX >= absY && absX >= absZ) {
      // X-face
      u = (z / absX + 1) / 2;
      v = (y / absX + 1) / 2;
    } else if (absY >= absX && absY >= absZ) {
      // Y-face
      u = (x / absY + 1) / 2;
      v = (z / absY + 1) / 2;
    } else {
      // Z-face
      u = (x / absZ + 1) / 2;
      v = (y / absZ + 1) / 2;
    }

    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/**
 * Calculates and updates normal vectors for proper lighting.
 * This ensures smooth shading and realistic appearance.
 *
 * @param geometry - The geometry to calculate normals for
 * @param smoothAngle - Angle threshold for smooth shading (in radians)
 *
 * @example
 * ```typescript
 * const geometry = createRoundedBoxGeometry(50, 5, 8);
 * calculateFaceNormals(geometry);
 * ```
 */
export function calculateFaceNormals(
  geometry: THREE.BufferGeometry,
  smoothAngle: number = Math.PI / 3
): void {
  // Compute normals
  geometry.computeVertexNormals();

  // For smooth shading, the built-in method is sufficient
  // For custom smooth angles, we could implement additional logic here

  // Ensure normals are normalized
  const normals = geometry.attributes['normal'];
  if (normals) {
    for (let i = 0; i < normals.count; i++) {
      const x = normals.getX(i);
      const y = normals.getY(i);
      const z = normals.getZ(i);

      const length = Math.sqrt(x * x + y * y + z * z);
      if (length > 0) {
        normals.setXYZ(i, x / length, y / length, z / length);
      }
    }
  }
}

/**
 * Gets the size of a dice based on its type.
 * Different dice types may have different default sizes.
 *
 * @param diceType - The type of dice
 * @returns The recommended size for the dice
 */
export function getDiceSizeForType(diceType: DiceType): number {
  switch (diceType) {
    case DiceType.D6:
      return 50;
    case DiceType.D8:
      return 45;
    case DiceType.D12:
      return 48;
    case DiceType.D20:
      return 52;
    default:
      return 50;
  }
}

/**
 * Gets the corner radius for a dice based on its type.
 * Different dice types may have different rounding characteristics.
 *
 * @param diceType - The type of dice
 * @returns The recommended corner radius
 */
export function getCornerRadiusForType(diceType: DiceType): number {
  const size = getDiceSizeForType(diceType);
  return size * 0.1; // 10% of size
}
