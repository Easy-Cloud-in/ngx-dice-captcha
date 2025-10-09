/*
 * Public API Surface of ngx-dice-captcha
 */

// Main Component
export * from './lib/ngx-dice-captcha.component';

// Sub-components
export * from './lib/components/dice-canvas/dice-canvas.component';
export * from './lib/components/captcha-challenge/captcha-challenge.component';
export * from './lib/components/verification-display/verification-display.component';
export * from './lib/components/control-overlay/control-overlay.component';

// Services
export * from './lib/services/three-renderer.service';
export * from './lib/services/physics-engine.service';
export * from './lib/services/dice-factory.service';
export * from './lib/services/challenge-generator.service';
export * from './lib/services/captcha-validator.service';
export * from './lib/services/animation.service';

// Models
export * from './lib/models/dice.model';
export * from './lib/models/captcha-config.model';
export * from './lib/models/challenge.model';
export * from './lib/models/verification-result.model';
export * from './lib/models/verification-mode.model';
export * from './lib/models/dice-material.model';
export * from './lib/models/resize-event.model';
export * from './lib/models/responsive-config.model';
export * from './lib/models/scene-scale.model';
export * from './lib/models/dice-scale-info.model';

// Utilities
export * from './lib/utils/dice-geometry.util';
export * from './lib/utils/physics-helpers.util';
export * from './lib/utils/random.util';
export * from './lib/utils/color.util';

// Directives
export * from './lib/directives/accessibility.directive';
export * from './lib/directives/form-focus-flow.directive';

// Tokens
export * from './lib/tokens/dice-captcha-i18n.token';
