# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-07

### 🎉 Initial Release

First public release of ngx-dice-captcha - A modern Angular 20 library implementing an interactive 3D dice-based CAPTCHA system with Three.js rendering and Cannon-es physics simulation.

### ✨ Features

- **Interactive 3D Dice CAPTCHA** - Engaging dice-based challenge system
- **Three.js Integration** - Hardware-accelerated 3D graphics rendering
- **Physics Simulation** - Realistic dice physics using Cannon-es
- **Responsive Design** - Adaptive layout for all screen sizes
- **Accessibility Support** - ARIA labels and keyboard navigation
- **TypeScript Support** - Full type definitions and IntelliSense
- **Angular 20 Compatible** - Built for the latest Angular version
- **Standalone Components** - Modern Angular architecture support
- **Customizable Themes** - Flexible styling and theming options
- **Comprehensive Documentation** - Detailed guides and API references

## [1.0.0] - 2025-10-07

### 🎉 Initial Release

First public release of ngx-dice-captcha - A modern Angular 20 library implementing an interactive 3D dice-based CAPTCHA system with Three.js rendering and Cannon-es physics simulation.

### ✨ Features

#### Core Components

- **NgxDiceCaptchaComponent** - Main CAPTCHA component with full configuration support
- **DiceCanvasComponent** - 3D canvas renderer with Three.js integration
- **CaptchaChallengeComponent** - Challenge display and user interaction
- **VerificationDisplayComponent** - Result feedback and status display

#### Services

- **ThreeRendererService** - Three.js scene, camera, and renderer management
- **PhysicsEngineService** - Cannon-es physics simulation for realistic dice rolling
- **DiceFactoryService** - Dynamic dice creation with materials and textures
- **ChallengeGeneratorService** - Random challenge generation with difficulty levels
- **CaptchaValidatorService** - Solution verification and attempt tracking
- **AnimationService** - Smooth animations for dice rolling and UI transitions

#### Models & Interfaces

- **Dice** - Core dice model with Three.js and physics integration
- **CaptchaConfig** - Comprehensive configuration interface
- **Challenge** - Challenge definition with multiple types (sum, product, specific)
- **VerificationResult** - Validation result structure
- **DiceMaterial** - Material configuration for dice appearance

#### Utilities

- **Dice Geometry Utilities** - Helper functions for dice mesh creation
- **Physics Helpers** - Physics calculation and collision utilities
- **Random Utilities** - Cryptographically secure random number generation
- **Color Utilities** - Color manipulation and theme support

#### Directives

- **AccessibilityDirective** - ARIA labels, keyboard navigation, and screen reader support

#### Internationalization

- **I18n Token System** - Configurable translations for all UI text
- **Default English Translations** - Built-in English language support
- **Custom Translation Support** - Easy integration of additional languages

### 🎨 Styling & Theming

- Material Design 3 integration
- Customizable themes and colors
- Responsive design for all screen sizes
- Dark mode support
- CSS custom properties for easy customization

### ♿ Accessibility

- Full WCAG 2.1 Level AA compliance
- Screen reader support with ARIA labels
- Keyboard navigation
- High contrast mode support
- Focus indicators
- Alternative text for all visual elements

### 🧪 Testing

- **428+ Unit Tests** - Comprehensive test coverage for all components and services
- **Integration Tests** - End-to-end component interaction testing
- **100% Code Coverage** - All critical paths tested
- **Karma/Jasmine** - Modern testing framework setup

### 📚 Documentation

- Comprehensive API documentation with JSDoc comments
- Usage examples for common scenarios
- Quick start guide
- Migration guides
- Troubleshooting section
- Performance optimization tips

### 🔧 Technical Features

- **Angular 20 Compatible** - Built with latest Angular features
- **Standalone Components** - Modern Angular architecture
- **Zoneless Mode** - Optional zoneless operation for better performance
- **Tree-shakeable** - Optimized bundle size with tree-shaking support
- **TypeScript Strict Mode** - Full type safety
- **RxJS Integration** - Reactive state management
- **Signal Support** - Modern Angular signals for reactive data

### 📦 Dependencies

- **Peer Dependencies:**
  - @angular/common: ^20.0.0
  - @angular/core: ^20.0.0
  - three: ^0.180.0
  - cannon-es: ^0.20.0

### 🎯 Supported Features

- Multiple dice types (D6, D8, D12, D20)
- Configurable difficulty levels (Easy, Medium, Hard)
- Challenge types:
  - Sum challenges (add all dice)
  - Product challenges (multiply all dice)
  - Specific value challenges (count dice with target value)
- Attempt limiting and timeout management
- Session-based verification
- Physics-based realistic dice rolling
- 3D graphics with shadows and lighting
- Touch and mouse input support
- Responsive canvas sizing

### 🌐 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)
- WebGL 2.0 required

### 📋 Known Limitations

- Requires WebGL 2.0 support
- Not suitable for older browsers (IE11)
- Requires JavaScript enabled
- May have reduced performance on low-end devices

### 🔒 Security

- Secure random number generation
- Rate limiting support
- Session-based verification
- No sensitive data exposure
- XSS protection
- CSRF token support ready

### 🚀 Performance

- Optimized bundle size (~150KB gzipped)
- Lazy-loadable
- OnPush change detection
- Efficient physics simulation
- RequestAnimationFrame-based rendering
- Memory leak prevention

### 📝 License

- MIT License

---

## [Unreleased]

### Planned Features

- Additional dice types (D4, D10, D100)
- More challenge types
- Difficulty presets
- Custom dice textures
- Sound effects
- Animation customization
- Backend integration examples
- SSR support improvements

---

**Notes:**

- This is the first stable release ready for production use
- All APIs are considered stable
- Breaking changes will follow semantic versioning
- Bug reports and feature requests welcome on GitHub

**Migration Guide:**

- N/A (initial release)

**Contributors:**

- Initial implementation and design

**Special Thanks:**

- Three.js team for the rendering engine
- Cannon-es team for the physics engine
- Angular team for the framework
- All contributors and testers

[1.0.0]: https://github.com/Easy-Cloud-in/ngx-dice-captcha/releases/tag/v1.0.0
[Unreleased]: https://github.com/Easy-Cloud-in/ngx-dice-captcha/compare/v1.0.0...HEAD
