# NGX Dice CAPTCHA

[![Angular](https://img.shields.io/badge/Angular-20-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/ngx-dice-captcha.svg)](https://www.npmjs.com/package/ngx-dice-captcha)

A modern Angular workspace containing an interactive 3D dice-based CAPTCHA library with realistic physics simulation using Three.js and Cannon-es.

---

## ⚠️ SECURITY WARNING - READ BEFORE USE

> **This library is currently NOT SECURE for production use in security-critical applications.**

### Current Limitations (v2.x)

- ❌ **Client-side only validation** - All verification happens in the browser
- ❌ **No backend integration** - Tokens can be easily forged
- ❌ **Easily bypassed by bots** - 100% bypass rate with simple scripts
- ❌ **No replay attack prevention** - Tokens can be reused indefinitely

**Security Rating: 2/10** ⚠️ | **Bot Resistance: 0%** - Bots can bypass this in under 1 second.

### ✅ Appropriate Use Cases

- 📚 Educational demonstrations and learning projects
- 🎨 UX prototypes and design mockups
- 📝 Non-security-critical forms (surveys, feedback)
- 🧪 Development and testing environments

### ❌ DO NOT USE FOR

- 🔐 Login or registration forms
- 💳 Payment or financial transactions
- 🛡️ Any security-critical applications
- 🚫 Spam prevention or bot protection

### 🔒 For Production Use

Consider these production-ready alternatives:

- [reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3) - Google's invisible CAPTCHA
- [hCaptcha](https://www.hcaptcha.com/) - Privacy-focused alternative
- [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) - Privacy-first CAPTCHA

Or wait for **v3.0.0** (planned) which will include backend validation and production-ready security.

**📚 Detailed Security Analysis:**

- [Security Analysis Report](./docs/SECURITY_ANALYSIS.md) - Complete vulnerability assessment
- [Security Improvement Roadmap](./docs/SECURITY_IMPROVEMENT_ROADMAP.md) - Path to v3.0.0
- [Security Summary](./docs/SECURITY_SUMMARY.md) - Executive summary

---

## 📦 What's Included

This workspace contains:

- **`ngx-dice-captcha`** - The main Angular library providing 3D dice CAPTCHA functionality
- **`demo`** - A demonstration application showcasing the library's features

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0 or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Easy-Cloud-in/ngx-dice-captcha.git
cd ngx-dice-captcha

# Install dependencies
npm install

# Start the demo application
npm start
```

The demo application will be available at `http://localhost:4200`.

## 🛠️ Development

### Building the Library

```bash
# Build the library for production
npm run build:lib

# Build and watch for changes during development
npm run build:lib:watch

# Run tests
npm run test:lib
```

### Running Tests

```bash
# Run unit tests
npm run test:lib

# Run tests in CI mode
npm run test:ci

# Run tests with coverage
npm run test:coverage
```

### Publishing to NPM

```bash
# Prepare the library for publishing
npm run prepare:publish

# The package will be available in dist/ngx-dice-captcha/
```

## 📁 Project Structure

```
ngx-dice-captcha-workspace/
├── projects/
│   ├── ngx-dice-captcha/          # Main library
│   │   ├── src/lib/               # Library source code
│   │   ├── README.md              # NPM package documentation
│   │   └── package.json           # Library package configuration
│   └── demo/                      # Demo application
│       ├── src/
│       └── public/
├── docs/                          # Documentation files
│   ├── API.md                     # API reference
│   ├── CONTRIBUTING.md            # Contributing guidelines
│   ├── SECURITY.md                # Security policy
│   ├── MIGRATION.md               # Migration guide
│   └── CODE_OF_CONDUCT.md         # Code of conduct
├── dist/                          # Build output
├── README.md                      # This file
└── angular.json                   # Angular workspace configuration
```

## 🎯 Library Features

The `ngx-dice-captcha` library provides:

- 🎲 **Realistic 3D Dice** - Physics-based dice rolling using Three.js and Cannon-es
- ✨ **Overlay CAPTCHA** - Beautiful glassmorphism overlay with individual dice verification
- 📐 **Dynamic Canvas Resizing** - Automatic canvas adaptation to container size changes
- 🎨 **Customizable Themes** - Full control over colors, materials, and visual effects
- ♿ **Accessible** - WCAG 2.1 compliant with screen reader support and keyboard navigation
- ⚡ **High Performance** - Built with Angular 20 signals and zoneless architecture
- 🌍 **Internationalization** - Multi-language support with custom i18n tokens
- 🔒 **Security** - Rate limiting, session tracking, and verification tokens
- 📱 **Responsive** - Automatic vertical/horizontal layout switching for mobile
- 🎯 **Multiple Verification Modes** - Individual dice, calculation, or both

## 📖 Documentation

- [Library Documentation](projects/ngx-dice-captcha/README.md) - Complete API reference and usage examples
- [Developer Manual](projects/ngx-dice-captcha/ngx-dice-captcha-developer-manual.md) - In-depth technical documentation
- [API Reference](docs/API.md) - Complete API documentation
- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute to the project
- [Security Policy](docs/SECURITY.md) - Security guidelines and reporting
- [Migration Guide](docs/MIGRATION.md) - Version migration instructions
- [Code of Conduct](docs/CODE_OF_CONDUCT.md) - Community guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [Cannon-es](https://pmndrs.github.io/cannon-es/) - Physics engine
- [Angular](https://angular.io/) - Application framework

## 📞 Support

- 📚 [Documentation](projects/ngx-dice-captcha/README.md)
- 🐛 [Issues](https://github.com/Easy-Cloud-in/ngx-dice-captcha/issues)
- 💬 [Discussions](https://github.com/Easy-Cloud-in/ngx-dice-captcha/discussions)

---

Made with ❤️ for the Angular community
