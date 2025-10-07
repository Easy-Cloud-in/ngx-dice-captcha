/**
 * Information about dice scaling state
 * 
 * @public
 * @since 2.2.0
 */
export interface DiceScaleInfo {
  /**
   * Current scale factor applied to dice
   */
  scale: number;

  /**
   * Base dice size before scaling
   */
  baseSize: number;

  /**
   * Actual dice size after scaling (baseSize * scale)
   */
  actualSize: number;

  /**
   * Spacing between dice in Three.js units
   */
  spacing: number;

  /**
   * Whether dice are currently scaled from base size
   */
  isScaled: boolean;
}
