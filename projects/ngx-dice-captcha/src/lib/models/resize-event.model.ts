/**
 * Resize event data passed to callbacks when canvas dimensions change
 *
 * @public
 * @since 1.0.0
 */
export interface ResizeEventData {
  /** Canvas width in pixels */
  width: number;

  /** Canvas height in pixels */
  height: number;

  /** Aspect ratio (width/height) */
  aspectRatio: number;

  /** Device pixel ratio for high-DPI displays */
  pixelRatio: number;

  /** Timestamp of resize event */
  timestamp: number;

  /**
   * Previous dimensions for comparison
   * @since 2.2.0
   */
  previous?: {
    width: number;
    height: number;
  };

  /**
   * Whether this resize requires a full scene update
   * True for major resizes (exceeding threshold), false for minor adjustments
   * @since 2.2.0
   */
  requiresSceneUpdate?: boolean;

  /**
   * Delta between current and previous dimensions
   * @since 2.2.0
   */
  delta?: {
    width: number;
    height: number;
  };
}
