/**
 * Represents the 3D scene dimensions in Three.js units
 * 
 * @public
 * @since 2.2.0
 */
export interface SceneScale {
  /**
   * Scene width in Three.js units
   */
  width: number;

  /**
   * Scene depth in Three.js units
   */
  depth: number;

  /**
   * Scene height in Three.js units
   */
  height: number;

  /**
   * Camera distance from origin
   */
  cameraDistance: number;

  /**
   * Field of view in degrees
   */
  fov: number;
}
