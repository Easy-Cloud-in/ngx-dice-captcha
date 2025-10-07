import { Injectable } from '@angular/core';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Dice, DiceType } from '../models/dice.model';

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
}

/**
 * Service responsible for creating dice with 3D geometry and physics properties.
 *
 * Factory service that creates complete dice objects with both Three.js meshes
 * for rendering and Cannon-es bodies for physics simulation. Supports multiple
 * dice types (D6, D8, D12, D20) with configurable materials and properties.
 *
 * @example
 * ```typescript
 * const config: DiceConfig = {
 *   type: DiceType.D6,
 *   size: 1,
 *   material: { color: 0xff0000, roughness: 0.5 },
 *   position: new THREE.Vector3(0, 5, 0),
 *   castShadow: true
 * };
 *
 * const dice = diceFactory.createDice(config);
 * scene.add(dice.mesh);
 * physicsWorld.addBody(dice.body);
 * ```
 *
 * @public
 * @since 1.0.0
 */
@Injectable()
export class DiceFactoryService {
  private readonly defaultMaterialConfig: MaterialConfig = {
    color: 0xe8e8e8, // Light gray instead of very light gray for better contrast
    opacity: 1,
    metalness: 0.1, // Lower metalness for more matte appearance
    roughness: 0.7, // Higher roughness for less glossy, more realistic look
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
    const material = this.createDiceMaterial(config.material || this.defaultMaterialConfig);

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
        if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
          textures.push(mat.map);
        }
      });
    } else if (material instanceof THREE.MeshStandardMaterial && material.map) {
      textures.push(material.map);
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
   * Creates geometry for a 6-sided dice (cube).
   *
   * @param size - Size of the cube
   * @returns Box geometry
   * @private
   */
  private createD6Geometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.BoxGeometry(size, size, size);
    return geometry;
  }

  /**
   * Creates geometry for an 8-sided dice (octahedron).
   *
   * @param size - Size of the octahedron
   * @returns Octahedron geometry
   * @private
   */
  private createD8Geometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.OctahedronGeometry(size * 0.5);
    return geometry;
  }

  /**
   * Creates geometry for a 12-sided dice (dodecahedron).
   *
   * @param size - Size of the dodecahedron
   * @returns Dodecahedron geometry
   * @private
   */
  private createD12Geometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.DodecahedronGeometry(size * 0.5);
    return geometry;
  }

  /**
   * Creates geometry for a 20-sided dice (icosahedron).
   *
   * @param size - Size of the icosahedron
   * @returns Icosahedron geometry
   * @private
   */
  private createD20Geometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.IcosahedronGeometry(size * 0.5);
    return geometry;
  }

  /**
   * Creates a Three.js material for dice rendering with dot textures for D6.
   *
   * @param config - Material configuration (color, opacity, metalness, roughness)
   * @returns MeshStandardMaterial or array of materials configured for PBR rendering
   * @public
   */
  createDiceMaterial(config: MaterialConfig): THREE.Material | THREE.Material[] {
    // Three.js BoxGeometry applies materials in order: [right, left, top, bottom, front, back]
    // We'll map standard D6 faces (opposite sides sum to 7) to these positions:
    // Right: 4, Left: 3, Top: 6, Bottom: 1, Front: 5, Back: 2
    const faceOrder = [4, 3, 6, 1, 5, 2];
    const materials: THREE.Material[] = [];

    faceOrder.forEach((faceNumber) => {
      // Generate texture with dots for this face
      const texture = this.generateDiceDotsTexture(faceNumber);

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: config.metalness || this.defaultMaterialConfig.metalness,
        roughness: config.roughness || this.defaultMaterialConfig.roughness,
        transparent: false,
        side: THREE.FrontSide,
      });

      materials.push(material);
    });

    return materials;
  }

  /**
   * Generates a canvas-based texture for a D6 face with dots.
   * Configured with mipmapping and anisotropic filtering for quality preservation at all scales.
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

    // White/cream dice face background for better visibility on paper white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size, size);

    // Add visible border for depth and definition
    context.strokeStyle = '#b8b8b8';
    context.lineWidth = 3;
    context.strokeRect(2, 2, size - 4, size - 4);

    // Set up shadow for dots before drawing
    context.shadowColor = 'rgba(0, 0, 0, 0.4)';
    context.shadowBlur = 3;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    // Draw dots with improved size and color for maximum contrast
    context.fillStyle = '#000000'; // Pure black for maximum contrast on white
    const dotRadius = size * 0.08; // Properly sized dots for realistic appearance
    const positions = this.getDotPositions(faceNumber, size);

    positions.forEach((pos) => {
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
    // This is especially important for dice that are viewed at various angles
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
   * Configured with mipmapping and anisotropic filtering for quality preservation at all scales.
   *
   * Creates a texture with white background, border, and centered number.
   * Useful for adding face numbers to dice.
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

    // White/cream dice face background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size, size);

    // Border with better contrast
    context.strokeStyle = '#b8b8b8';
    context.lineWidth = 3;
    context.strokeRect(2, 2, size - 4, size - 4);

    // Set up shadow for text
    context.shadowColor = 'rgba(0, 0, 0, 0.4)';
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

    return new THREE.MeshStandardMaterial({
      color: faceColor,
      metalness: config.metalness || this.defaultMaterialConfig.metalness,
      roughness: config.roughness || this.defaultMaterialConfig.roughness,
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
      // Light cream background for better contrast
      context.fillStyle = '#f0f0f0'; // Lighter but still contrasting
      context.fillRect(0, 0, size, size);

      // Add border for definition
      context.strokeStyle = '#999999';
      context.lineWidth = Math.max(2, size / 64);
      context.strokeRect(2, 2, size - 4, size - 4);

      // Draw dots
      context.fillStyle = '#333333'; // Dark but not pure black
      const dotRadius = size * 0.12; // Larger dots for visibility
      const positions = this.getDotPositions(faceNumber, size);

      positions.forEach((pos) => {
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

    // Light cream background for better contrast
    context.fillStyle = '#faf8f0';
    context.fillRect(0, 0, size, size);

    // Add subtle border for definition
    context.strokeStyle = '#e0ddd0';
    context.lineWidth = 2;
    context.strokeRect(1, 1, size - 2, size - 2);

    // Draw dots with better contrast
    context.fillStyle = '#1a1a1a';
    const dotRadius = size * 0.1; // Slightly larger for better visibility
    const positions = this.getDotPositions(faceNumber, size);

    positions.forEach((pos) => {
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
   * Should be called when the service is no longer needed.
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
