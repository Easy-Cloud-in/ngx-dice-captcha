import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Represents a complete 3D dice object with both rendering and physics components.
 *
 * Combines Three.js mesh for visual representation and Cannon-es body for
 * physics simulation, allowing realistic dice rolling with accurate rendering.
 *
 * @public
 * @since 1.0.0
 */
export interface Dice {
  /** Three.js mesh object for rendering */
  mesh: THREE.Mesh;

  /** Cannon-es physics body for simulation */
  body: CANNON.Body;

  /** Type of dice (number of sides) */
  type: DiceType;

  /** Number of faces on this dice */
  faceCount: number;

  /** Textures used by this dice (for proper disposal) */
  textures?: THREE.Texture[];
}

/**
 * Enum representing different types of dice by their number of faces.
 *
 * Supports standard polyhedral dice used in tabletop gaming and CAPTCHA challenges.
 *
 * @public
 * @since 1.0.0
 */
export enum DiceType {
  /** Standard 6-sided dice */
  D6 = 'D6',

  /** 8-sided dice */
  D8 = 'D8',

  /** 12-sided dice */
  D12 = 'D12',

  /** 20-sided dice */
  D20 = 'D20',
}
