import { Injectable } from '@angular/core';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Dice, DiceType } from '../models/dice.model';
import { createRoundedBoxGeometry } from '../utils/dice-geometry.util';

// Re-export model types for backward compatibility
export type { Dice } from '../models/dice.model';
export { DiceType } from '../models/dice.model';

/**
 * Configuration for dice material
 */
export interface MaterialConfig {
  color?: number;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  envMapIntensity?: number;
  reflectivity?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

/**
 * Configuration for dice creation
 */
export interface DiceConfig {
  type: DiceType;
  size?: number;
  material?: MaterialConfig;
  position?: THREE.Vector3;
  castShadow?: boolean;
  receiveShadow?: boolean;
  envMap?: THREE.Texture;
}

@Injectable()
export class DiceFactoryService {
  private readonly defaultMaterialConfig: MaterialConfig = {
    color: 0xf8f8f8, // Slightly off-white for more realistic appearance
    opacity: 1,
    metalness: 0.05, // Very low metalness for plastic
    roughness: 0.25, // Slightly higher roughness for more realistic plastic
    clearcoat: 0.6, // Reduced clearcoat for less extreme shine
    clearcoatRoughness: 0.2, // Slightly rougher clearcoat
    envMapIntensity: 0.8, // Reduced environment intensity
    reflectivity: 0.3, // Much lower reflectivity
    emissive: 0x222222, // Very subtle emissive color for depth
    emissiveIntensity: 0.05, // Very low emissive intensity
  };

  // Texture atlas for dice faces
  private textureAtlas?: THREE.Texture;
  private readonly atlasSize = 512; // 512x512 texture atlas
  private readonly faceSize = 128; // Each face is 128x128 pixels
  private readonly facesPerRow = this.atlasSize / this.faceSize; // 4 faces per row

  /**
   * Creates a complete dice object with Three.js mesh and Cannon-es physics body.
   *
   * @param config - Configuration for dice creation (type, size, material, position, shadows)
   * @returns Dice object containing mesh, body, type, and face count
   * @public
   */
  createDice(config: DiceConfig): Dice {
    const size = config.size || 1;
    const geometry = this.createDiceGeometry(config.type, size);
    const material = this.createDiceMaterial(
      config.material || this.defaultMaterialConfig,
      config.envMap
    );

    // Create Three.js mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = config.castShadow !== false;
    mesh.receiveShadow = config.receiveShadow !== false;

    if (config.position) {
      mesh.position.copy(config.position);
    }

    // Create physics body
    const body = this.createPhysicsBody(config.type, size);

    if (config.position) {
      body.position.set(config.position.x, config.position.y, config.position.z);
    }

    const faceCount = this.getFaceCount(config.type);

    // Extract and track textures for proper disposal
    const textures: THREE.Texture[] = [];
    if (Array.isArray(material)) {
      material.forEach((mat) => {
        if (mat instanceof THREE.MeshPhysicalMaterial && mat.map) {
          textures.push(mat.map);
        }
        if (mat instanceof THREE.MeshPhysicalMaterial && mat.envMap) {
          textures.push(mat.envMap);
        }
      });
    } else if (material instanceof THREE.MeshPhysicalMaterial) {
      if (material.map) textures.push(material.map);
      if (material.envMap) textures.push(material.envMap);
    }

    return {
      mesh,
      body,
      type: config.type,
      faceCount,
      textures: textures.length > 0 ? textures : undefined,
    };
  }

  /**
   * Creates Three.js geometry for the specified dice type.
   *
   * @param type - Type of dice (D6, D8, D12, D20)
   * @param size - Size multiplier for the dice (default: 1)
   * @returns BufferGeometry for the dice shape
   * @throws Will throw error for unsupported dice types
   * @public
   */
  createDiceGeometry(type: DiceType, size: number = 1): THREE.BufferGeometry {
    switch (type) {
      case DiceType.D6:
        return this.createD6Geometry(size);
      case DiceType.D8:
        return this.createD8Geometry(size);
      case DiceType.D12:
        return this.createD12Geometry(size);
      case DiceType.D20:
        return this.createD20Geometry(size);
      default:
        throw new Error(`Unsupported dice type: ${type}`);
    }
  }

  /**
   * Creates geometry for a 6-sided dice (cube) with subtly rounded edges.
   * Uses gentle curves (8% radius) for a realistic plastic dice appearance.
   *
   * @param size - Size of the cube
   * @returns Rounded box geometry with subtle, smooth edges
   * @private
   */
  private createD6Geometry(size: number): THREE.BufferGeometry {
    const radius = size * 0.08; // 8% radius for subtle curves (not too rounded)
    const segments = 16; // Increased segments for smoother curves
    const geometry = createRoundedBoxGeometry(size, radius, segments);
    return geometry;
  }

  /**
   * Creates geometry for an 8-sided dice (octahedron) with rounded edges.
   *
   * @param size - Size of the octahedron
   * @returns Octahedron geometry with rounded edges
   * @private
   */
  private createD8Geometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.OctahedronGeometry(size * 0.5, 1); // Add detail level
    return this.roundGeometryEdges(geometry, size * 0.05);
  }

  /**
   * Creates geometry for a 12-sided dice (dodecahedron) with rounded edges.
   *
   * @param size - Size of the dodecahedron
   * @returns Dodecahedron geometry with rounded edges
   * @private
   */
  private createD12Geometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.DodecahedronGeometry(size * 0.5, 0); // Add detail level
    return this.roundGeometryEdges(geometry, size * 0.05);
  }

  /**
   * Creates geometry for a 20-sided dice (icosahedron) with rounded edges.
   *
   * @param size - Size of the icosahedron
   * @returns Icosahedron geometry with rounded edges
   * @private
   */
  private createD20Geometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.IcosahedronGeometry(size * 0.5, 1); // Add detail level
    return this.roundGeometryEdges(geometry, size * 0.05);
  }

  /**
   * Rounds the edges of a geometry for a more realistic appearance.
   *
   * @param geometry - The geometry to round
   * @param radius - The radius of the rounding
   * @returns Geometry with rounded edges
   * @private
   */
  private roundGeometryEdges(geometry: THREE.BufferGeometry, radius: number): THREE.BufferGeometry {
    // This is a simplified approach - in a real implementation you might want
    // to use a more sophisticated edge rounding algorithm
    // For now, we'll just return the original geometry
    // In a production app, you might use a library like three-subdivide or three-bvh
    return geometry;
  }

  /**
   * Creates a Three.js material for dice rendering with dot textures for D6.
   *
   * @param config - Material configuration (color, opacity, metalness, roughness)
   * @param envMap - Environment map for reflections
   * @returns MeshPhysicalMaterial or array of materials configured for PBR rendering
   * @public
   */
  createDiceMaterial(
    config: MaterialConfig,
    envMap?: THREE.Texture
  ): THREE.Material | THREE.Material[] {
    // Three.js BoxGeometry applies materials in order: [right, left, top, bottom, front, back]
    // We'll map standard D6 faces (opposite sides sum to 7) to these positions:
    // Right: 4, Left: 3, Top: 6, Bottom: 1, Front: 5, Back: 2
    const faceOrder = [4, 3, 6, 1, 5, 2];
    const materials: THREE.Material[] = [];

    faceOrder.forEach((faceNumber) => {
      // Generate texture with dots for this face
      const texture = this.generateDiceDotsTexture(faceNumber);

      const material = new THREE.MeshPhysicalMaterial({
        map: texture,
        color: config.color || this.defaultMaterialConfig.color,
        metalness: config.metalness || this.defaultMaterialConfig.metalness,
        roughness: config.roughness || this.defaultMaterialConfig.roughness,
        clearcoat: config.clearcoat || this.defaultMaterialConfig.clearcoat,
        clearcoatRoughness:
          config.clearcoatRoughness || this.defaultMaterialConfig.clearcoatRoughness,
        envMap: envMap,
        envMapIntensity: config.envMapIntensity || this.defaultMaterialConfig.envMapIntensity,
        reflectivity: config.reflectivity || this.defaultMaterialConfig.reflectivity,
        emissive: config.emissive || this.defaultMaterialConfig.emissive,
        emissiveIntensity: config.emissiveIntensity || this.defaultMaterialConfig.emissiveIntensity,
        transparent: false,
        side: THREE.FrontSide,
      });

      materials.push(material);
    });

    return materials;
  }

  /**
   * Generates a canvas-based texture for a D6 face with dots.
   * Enhanced with more realistic appearance including subtle gradients and shadows.
   *
   * @param faceNumber - Number to display (1-6)
   * @param size - Texture resolution in pixels (default: 128)
   * @returns CanvasTexture with dice dots pattern, optimized for scaling
   */
  private generateDiceDotsTexture(faceNumber: number, size: number = 128): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas 2D context');
    }

    // Create a subtle gradient background for more realistic appearance
    // Using a slightly off-white color instead of pure white
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, '#f8f8f8');
    gradient.addColorStop(0.7, '#f2f2f2');
    gradient.addColorStop(1, '#e8e8e8');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    // Add subtle inner border for depth
    context.strokeStyle = '#d0d0d0';
    context.lineWidth = 2;
    context.strokeRect(4, 4, size - 8, size - 8);

    // Add outer border for definition
    context.strokeStyle = '#b8b8b8';
    context.lineWidth = 3;
    context.strokeRect(2, 2, size - 4, size - 4);

    // Set up shadow for dots before drawing
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    // Draw dots with improved appearance
    const dotRadius = size * 0.08; // Properly sized dots for realistic appearance
    const positions = this.getDotPositions(faceNumber, size);

    positions.forEach((pos) => {
      // Create gradient for dots for more realistic appearance
      const dotGradient = context.createRadialGradient(
        pos.x - dotRadius / 3,
        pos.y - dotRadius / 3,
        0,
        pos.x,
        pos.y,
        dotRadius
      );
      dotGradient.addColorStop(0, '#333333');
      dotGradient.addColorStop(0.7, '#000000');
      dotGradient.addColorStop(1, '#111111');

      context.fillStyle = dotGradient;
      context.beginPath();
      context.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
      context.fill();
    });

    // Reset shadow for subsequent draws
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    const texture = new THREE.CanvasTexture(canvas);

    // Enable mipmapping for smooth scaling at different distances
    texture.generateMipmaps = true;

    // Use trilinear filtering for best quality when scaling
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Enable anisotropic filtering for sharper textures at oblique angles
    texture.anisotropy = 16; // Maximum anisotropy (will be clamped by renderer capabilities)

    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Get dot positions for a dice face number
   */
  private getDotPositions(faceNumber: number, size: number): { x: number; y: number }[] {
    const center = size / 2;
    const offset = size * 0.25;

    switch (faceNumber) {
      case 1:
        return [{ x: center, y: center }];
      case 2:
        return [
          { x: center - offset, y: center - offset },
          { x: center + offset, y: center + offset },
        ];
      case 3:
        return [
          { x: center - offset, y: center - offset },
          { x: center, y: center },
          { x: center + offset, y: center + offset },
        ];
      case 4:
        return [
          { x: center - offset, y: center - offset },
          { x: center + offset, y: center - offset },
          { x: center - offset, y: center + offset },
          { x: center + offset, y: center + offset },
        ];
      case 5:
        return [
          { x: center - offset, y: center - offset },
          { x: center + offset, y: center - offset },
          { x: center, y: center },
          { x: center - offset, y: center + offset },
          { x: center + offset, y: center + offset },
        ];
      case 6:
        return [
          { x: center - offset, y: center - offset },
          { x: center + offset, y: center - offset },
          { x: center - offset, y: center },
          { x: center + offset, y: center },
          { x: center - offset, y: center + offset },
          { x: center + offset, y: center + offset },
        ];
      default:
        return [{ x: center, y: center }];
    }
  }

  /**
   * Creates a Cannon-es physics body for the specified dice type.
   *
   * Uses box shape for D6 and sphere approximation for other types.
   * Configured with appropriate mass and damping for realistic rolling.
   *
   * @param type - Type of dice
   * @param size - Size of the physics body
   * @returns Physics body with shape, mass, and damping configured
   * @throws Will throw error for unsupported dice types
   * @public
   */
  createPhysicsBody(type: DiceType, size: number = 1): CANNON.Body {
    let shape: CANNON.Shape;
    const mass = 1;

    switch (type) {
      case DiceType.D6:
        // Box shape for D6
        shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
        break;

      case DiceType.D8:
      case DiceType.D12:
      case DiceType.D20:
        // Use sphere approximation for other dice types
        // More accurate convex hull can be added later
        shape = new CANNON.Sphere(size * 0.5);
        break;

      default:
        throw new Error(`Unsupported dice type: ${type}`);
    }

    const body = new CANNON.Body({
      mass,
      shape,
      linearDamping: 0.3,
      angularDamping: 0.3,
    });

    return body;
  }

  /**
   * Generates a canvas-based texture for a dice face with a number.
   * Enhanced with more realistic appearance including subtle gradients and shadows.
   *
   * @param faceNumber - Number to display (1-20 depending on dice type)
   * @param size - Texture resolution in pixels (default: 128)
   * @returns CanvasTexture ready for use on dice faces, optimized for scaling
   * @throws Will throw error if canvas context cannot be obtained
   * @public
   */
  generateFaceTexture(faceNumber: number, size: number = 128): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas 2D context');
    }

    // Create a subtle gradient background for more realistic appearance
    // Using a slightly off-white color instead of pure white
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, '#f8f8f8');
    gradient.addColorStop(0.7, '#f2f2f2');
    gradient.addColorStop(1, '#e8e8e8');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    // Add subtle inner border for depth
    context.strokeStyle = '#d0d0d0';
    context.lineWidth = 2;
    context.strokeRect(4, 4, size - 8, size - 8);

    // Add outer border for definition
    context.strokeStyle = '#b8b8b8';
    context.lineWidth = 3;
    context.strokeRect(2, 2, size - 4, size - 4);

    // Set up shadow for text
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    // Draw number with maximum contrast
    context.fillStyle = '#000000'; // Pure black for maximum readability
    context.font = `bold ${size * 0.65}px Arial`; // Slightly larger for better readability
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(faceNumber.toString(), size / 2, size / 2);

    // Reset shadow
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    const texture = new THREE.CanvasTexture(canvas);

    // Enable mipmapping for smooth scaling at different distances
    texture.generateMipmaps = true;

    // Use trilinear filtering for best quality when scaling
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Enable anisotropic filtering for sharper textures at oblique angles
    texture.anisotropy = 16; // Maximum anisotropy (will be clamped by renderer capabilities)

    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Get the number of faces for a dice type
   */
  private getFaceCount(type: DiceType): number {
    switch (type) {
      case DiceType.D6:
        return 6;
      case DiceType.D8:
        return 8;
      case DiceType.D12:
        return 12;
      case DiceType.D20:
        return 20;
      default:
        return 6;
    }
  }

  /**
   * Creates multiple dice at once with automatic position offsetting.
   *
   * @param count - Number of dice to create
   * @param config - Base configuration for all dice
   * @returns Array of dice objects
   * @public
   */
  createMultipleDice(count: number, config: DiceConfig): Dice[] {
    const dice: Dice[] = [];

    for (let i = 0; i < count; i++) {
      // Offset position for each dice
      const offsetConfig = { ...config };
      if (config.position) {
        offsetConfig.position = new THREE.Vector3(
          config.position.x + i * 2,
          config.position.y,
          config.position.z
        );
      }

      dice.push(this.createDice(offsetConfig));
    }

    return dice;
  }

  /**
   * Disposes of dice resources to prevent memory leaks.
   *
   * Releases geometry and material resources.
   *
   * @param dice - Dice object to dispose
   * @public
   */
  disposeDice(dice: Dice): void {
    // Dispose geometry
    dice.mesh.geometry.dispose();

    // Dispose textures first (before materials)
    if (dice.textures) {
      dice.textures.forEach((texture) => {
        texture.dispose();
      });
    }

    // Dispose materials
    if (Array.isArray(dice.mesh.material)) {
      dice.mesh.material.forEach((material) => material.dispose());
    } else {
      dice.mesh.material.dispose();
    }
  }

  /**
   * Disposes of all resources used by the factory.
   *
   * Should be called when the factory is no longer needed.
   *
   * @public
   */
  dispose(): void {
    this.disposeTextureAtlas();
  }

  /**
   * Generates a random rotation quaternion for dice.
   *
   * Useful for initial dice placement or randomizing starting orientation.
   *
   * @returns Random quaternion rotation
   * @public
   */
  getRandomRotation(): CANNON.Quaternion {
    const euler = new CANNON.Vec3(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    const quaternion = new CANNON.Quaternion();
    quaternion.setFromEuler(euler.x, euler.y, euler.z);

    return quaternion;
  }

  /**
   * Generates a random position within specified bounds.
   *
   * Useful for spawning dice at random locations.
   *
   * @param minX - Minimum X coordinate (default: -5)
   * @param maxX - Maximum X coordinate (default: 5)
   * @param minZ - Minimum Z coordinate (default: -5)
   * @param maxZ - Maximum Z coordinate (default: 5)
   * @param y - Y coordinate/height (default: 5)
   * @returns Random position vector within bounds
   * @public
   */
  getRandomPosition(
    minX: number = -5,
    maxX: number = 5,
    minZ: number = -5,
    maxZ: number = 5,
    y: number = 5
  ): THREE.Vector3 {
    return new THREE.Vector3(
      minX + Math.random() * (maxX - minX),
      y,
      minZ + Math.random() * (maxZ - minZ)
    );
  }

  /**
   * Creates a fallback material with colored face and number when texture creation fails.
   *
   * @param faceNumber - Face number (1-6)
   * @param config - Material configuration
   * @returns Simple colored material with face identification
   * @private
   */
  private createFallbackMaterial(faceNumber: number, config: MaterialConfig): THREE.Material {
    // Create a simple colored material with slight color variation per face
    const baseColor = config.color || 0xe8e8e8;
    const colorVariation = faceNumber * 0x101010; // Slight variation per face
    const faceColor = Math.min(baseColor + colorVariation, 0xffffff);

    return new THREE.MeshPhysicalMaterial({
      color: faceColor,
      metalness: config.metalness || this.defaultMaterialConfig.metalness,
      roughness: config.roughness || this.defaultMaterialConfig.roughness,
      clearcoat: config.clearcoat || this.defaultMaterialConfig.clearcoat,
      clearcoatRoughness:
        config.clearcoatRoughness || this.defaultMaterialConfig.clearcoatRoughness,
    });
  }

  /**
   * Creates individual texture for a dice face with improved visibility.
   *
   * @param faceNumber - Face number (1-6)
   * @param size - Texture size in pixels
   * @returns Individual face texture
   * @private
   */
  private createDiceFaceTexture(faceNumber: number, size: number = 256): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas 2D context for dice face texture');
    }

    // Clear canvas first
    context.clearRect(0, 0, size, size);

    try {
      // Create a subtle gradient background for more realistic appearance
      // Using a slightly off-white color instead of pure white
      const gradient = context.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      gradient.addColorStop(0, '#f8f8f8');
      gradient.addColorStop(0.7, '#f2f2f2');
      gradient.addColorStop(1, '#e8e8e8');
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);

      // Add subtle inner border for depth
      context.strokeStyle = '#d0d0d0';
      context.lineWidth = 2;
      context.strokeRect(4, 4, size - 8, size - 8);

      // Add outer border for definition
      context.strokeStyle = '#b8b8b8';
      context.lineWidth = 3;
      context.strokeRect(2, 2, size - 4, size - 4);

      // Draw dots with improved appearance
      context.fillStyle = '#333333'; // Dark but not pure black
      const dotRadius = size * 0.12; // Larger dots for visibility
      const positions = this.getDotPositions(faceNumber, size);

      positions.forEach((pos) => {
        // Create gradient for dots for more realistic appearance
        const dotGradient = context.createRadialGradient(
          pos.x - dotRadius / 3,
          pos.y - dotRadius / 3,
          0,
          pos.x,
          pos.y,
          dotRadius
        );
        dotGradient.addColorStop(0, '#333333');
        dotGradient.addColorStop(0.7, '#000000');
        dotGradient.addColorStop(1, '#111111');

        context.fillStyle = dotGradient;
        context.beginPath();
        context.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
        context.fill();

        // Add white outline to dots for better contrast
        context.strokeStyle = '#ffffff';
        context.lineWidth = 1;
        context.stroke();
      });
    } catch (error) {
      // Fallback to solid color
      context.fillStyle = faceNumber % 2 === 0 ? '#e0e0e0' : '#d0d0d0';
      context.fillRect(0, 0, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);

    // Force immediate texture update
    texture.needsUpdate = true;

    // Use simpler filtering to avoid potential issues
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // Ensure texture is marked for upload
    texture.flipY = false;

    return texture;
  }

  /**
   * Generates a canvas for a single dice face with dots.
   *
   * @param faceNumber - Number to display (1-6)
   * @param size - Size of the face canvas
   * @returns Canvas element with the dice face
   * @private
   */
  private generateDiceFaceCanvas(faceNumber: number, size: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas 2D context');
    }

    // Create a subtle gradient background for more realistic appearance
    // Using a slightly off-white color instead of pure white
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, '#f8f8f8');
    gradient.addColorStop(0.7, '#f2f2f2');
    gradient.addColorStop(1, '#e8e8e8');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    // Add subtle inner border for depth
    context.strokeStyle = '#d0d0d0';
    context.lineWidth = 2;
    context.strokeRect(4, 4, size - 8, size - 8);

    // Add outer border for definition
    context.strokeStyle = '#b8b8b8';
    context.lineWidth = 3;
    context.strokeRect(2, 2, size - 4, size - 4);

    // Draw dots with better contrast
    const dotRadius = size * 0.1; // Slightly larger for better visibility
    const positions = this.getDotPositions(faceNumber, size);

    positions.forEach((pos) => {
      // Create gradient for dots for more realistic appearance
      const dotGradient = context.createRadialGradient(
        pos.x - dotRadius / 3,
        pos.y - dotRadius / 3,
        0,
        pos.x,
        pos.y,
        dotRadius
      );
      dotGradient.addColorStop(0, '#333333');
      dotGradient.addColorStop(0.7, '#000000');
      dotGradient.addColorStop(1, '#111111');

      context.fillStyle = dotGradient;
      context.beginPath();
      context.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
      context.fill();
    });

    return canvas;
  }

  /**
   * Gets UV coordinates for a specific face in the texture atlas.
   * This method is kept for backward compatibility but not used with individual textures.
   *
   * @param faceNumber - Face number (1-6)
   * @returns UV coordinates for the face in the atlas
   * @private
   */
  private getAtlasUVCoordinates(faceNumber: number): {
    uOffset: number;
    vOffset: number;
    uScale: number;
    vScale: number;
  } {
    const index = faceNumber - 1; // Convert to 0-based index
    const uOffset = (index % this.facesPerRow) / this.facesPerRow;
    const vOffset = Math.floor(index / this.facesPerRow) / this.facesPerRow;
    const uScale = 1 / this.facesPerRow;
    const vScale = 1 / this.facesPerRow;

    return { uOffset, vOffset, uScale, vScale };
  }

  /**
   * Updates geometry UV coordinates to use the texture atlas.
   * Not needed when using individual face textures.
   *
   * @param faceOrder - Order of faces in the BoxGeometry
   * @private
   */
  private updateGeometryUVCoordinates(faceOrder: number[]): void {
    // Not needed when using individual face textures
    // BoxGeometry already provides appropriate UV coordinates for each face
  }

  /**
   * Disposes of the texture atlas.
   *
   * Should be called when the factory is no longer needed.
   *
   * @private
   */
  private disposeTextureAtlas(): void {
    if (this.textureAtlas) {
      this.textureAtlas.dispose();
      this.textureAtlas = undefined;
    }
  }
}
