/**
 * Configuration for responsive behavior of the dice CAPTCHA
 * 
 * @public
 * @since 2.2.0
 */
export interface ResponsiveConfig {
  /**
   * Enable automatic dice scaling based on canvas size
   * @default true
   */
  enableDiceScaling: boolean;

  /**
   * Minimum dice scale factor
   * @default 0.7
   */
  minDiceScale: number;

  /**
   * Maximum dice scale factor
   * @default 1.5
   */
  maxDiceScale: number;

  /**
   * Debounce time for resize events in milliseconds
   * @default 150
   */
  resizeDebounceTime: number;

  /**
   * Enable scene scaling (ground plane, boundary walls)
   * @default true
   */
  enableSceneScaling: boolean;

  /**
   * Preferred results display position
   * @default 'bottom-right'
   */
  resultsPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  /**
   * Enable orientation change handling for mobile devices
   * @default true
   */
  handleOrientationChange: boolean;

  /**
   * Enable smart overlay positioning to avoid overlaps
   * @default true
   */
  smartOverlayPosition: boolean;
}

/**
 * Default responsive configuration
 * @internal
 */
export const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  enableDiceScaling: true,
  minDiceScale: 0.7,
  maxDiceScale: 1.5,
  resizeDebounceTime: 150,
  enableSceneScaling: true,
  resultsPosition: 'bottom-right',
  handleOrientationChange: true,
  smartOverlayPosition: true,
};
