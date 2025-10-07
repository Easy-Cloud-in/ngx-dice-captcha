import * as THREE from 'three';

/**
 * Configuration for dice material and visual appearance.
 *
 * Defines how dice look including colors, textures, physical properties
 * (metalness, roughness), and special effects (emissive glow, transparency).
 *
 * @public
 * @since 1.0.0
 */
export interface DiceMaterialConfig {
  /** Type of material to use for the dice */
  type: MaterialType;

  /** Base color of the dice */
  color: string | number;

  /** Color of dots/numbers on dice faces */
  dotColor: string | number;

  /** Metalness property (0-1) for physical materials */
  metalness?: number;

  /** Roughness property (0-1) for physical materials */
  roughness?: number;

  /** Optional texture for dice faces */
  texture?: THREE.Texture;

  /** Optional normal map for surface detail */
  normalMap?: THREE.Texture;

  /** Opacity (0-1) for transparent dice */
  opacity?: number;

  /** Whether the material is transparent */
  transparent?: boolean;

  /** Emissive color for glowing effect */
  emissive?: string | number;

  /** Emissive intensity */
  emissiveIntensity?: number;
}

/**
 * Types of Three.js materials that can be used for dice rendering.
 *
 * Different materials provide various lighting and shading effects,
 * from simple unlit surfaces to physically-based rendering.
 *
 * @public
 * @since 1.0.0
 */
export enum MaterialType {
  /** Basic material without lighting */
  Basic = 'basic',

  /** Standard physically-based material */
  Standard = 'standard',

  /** Phong shading material */
  Phong = 'phong',

  /** Lambert shading material */
  Lambert = 'lambert',

  /** Physically-based rendering material */
  Physical = 'physical',
}
