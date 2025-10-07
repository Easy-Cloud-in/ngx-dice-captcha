# Contributing to NGX Dice CAPTCHA

Thank you for your interest in contributing to NGX Dice CAPTCHA! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. **Fork the Repository**: Click the "Fork" button at the top right of the repository page
2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ngx-dice-captcha.git
   cd ngx-dice-captcha
   ```
3. **Add Upstream Remote**:
   ```bash
   git remote add upstream https://github.com/Easy-Cloud-in/ngx-dice-captcha.git
   ```

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0 or pnpm (recommended)
- Git

### Installation

1. Install dependencies:

   ```bash
   npm install
   # or
   pnpm install
   ```

2. Build the library:

   ```bash
   npm run build:lib
   ```

3. Start the demo application:

   ```bash
   npm start
   ```

4. Run tests:
   ```bash
   npm run test:lib
   ```

### Project Structure

```
ngx-dice-captcha-workspace/
├── projects/
│   ├── ngx-dice-captcha/    # Main library source
│   │   ├── src/lib/          # Library components, services, etc.
│   │   ├── README.md         # Library documentation
│   │   └── package.json      # Library package configuration
│   └── demo/                 # Demo application
├── .github/                  # GitHub Actions workflows
├── docs/                     # Documentation (API, Contributing, Security, etc.)
└── README.md                 # Main documentation
```

## Making Changes

### Creating a Branch

Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Use descriptive branch names:

- `feature/` - For new features
- `fix/` - For bug fixes
- `docs/` - For documentation updates
- `refactor/` - For code refactoring
- `test/` - For test additions or improvements

### Keeping Your Fork Updated

Regularly sync your fork with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide type annotations for all public APIs
- Avoid `any` type unless absolutely necessary
- Use interfaces for object shapes
- Follow Angular style guide

### Angular

- Use standalone components
- Prefer signals over traditional change detection when possible
- Follow Angular's reactive patterns with RxJS
- Implement OnPush change detection strategy
- Use dependency injection properly

### Code Style

We use Prettier for code formatting. Before committing:

```bash
npm run format
```

Configuration is in [`package.json`](../package.json):

- Print width: 100 characters
- Single quotes for strings
- Angular HTML parser

### Naming Conventions

- **Components**: PascalCase with `.component.ts` suffix (e.g., `DiceCanvas.component.ts`)
- **Services**: PascalCase with `.service.ts` suffix (e.g., `ThreeRenderer.service.ts`)
- **Interfaces**: PascalCase (e.g., `CaptchaConfig`)
- **Constants**: UPPER_SNAKE_CASE
- **Variables**: camelCase
- **Files**: kebab-case

### Documentation

- Add JSDoc comments for all public APIs
- Include examples in JSDoc comments
- Update README.md if adding new features
- Add inline comments for complex logic

Example JSDoc:

````typescript
/**
 * Generates a new dice challenge based on the specified difficulty level.
 *
 * @param difficulty - The difficulty level (EASY, MEDIUM, HARD)
 * @returns A Challenge object with the generated parameters
 *
 * @example
 * ```typescript
 * const challenge = generateChallenge(Difficulty.MEDIUM);
 * console.log(challenge.description); // "Roll the dice and sum all values"
 * ```
 */
export function generateChallenge(difficulty: Difficulty): Challenge {
  // Implementation
}
````

## Testing

### Running Tests

```bash
# Run all tests
npm run test:lib

# Run tests in watch mode
npm run test:lib -- --watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode (single run, no watch)
npm run test:ci
```

### Writing Tests

- Write unit tests for all new features
- Aim for at least 80% code coverage
- Test edge cases and error conditions
- Use descriptive test names

Example test structure:

```typescript
describe('ChallengeGeneratorService', () => {
  let service: ChallengeGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChallengeGeneratorService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should generate EASY challenge with 2 dice', () => {
    const challenge = service.generateChallenge(Difficulty.EASY);
    expect(challenge.diceCount).toBe(2);
    expect(challenge.difficulty).toBe(Difficulty.EASY);
  });

  it('should throw error for invalid difficulty', () => {
    expect(() => service.generateChallenge('INVALID' as any)).toThrowError(
      'Invalid difficulty level'
    );
  });
});
```

### Test Coverage Requirements

- New features must include tests
- Bug fixes should include regression tests
- Maintain or improve overall coverage percentage

## Submitting Changes

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(dice-canvas): add support for D10 dice type

Implemented D10 dice rendering with proper geometry
and physics calculations. Updated dice factory to handle
the new dice type.

Closes #123
```

```
fix(validator): correct sum calculation for edge case

Fixed an issue where dice sum validation failed when
all dice showed the same value.

Fixes #456
```

### Pull Request Process

1. **Update Documentation**: Ensure all documentation is updated
2. **Add Tests**: Include tests for your changes
3. **Run Tests**: Ensure all tests pass (`npm run test:lib`)
4. **Build Library**: Verify the library builds (`npm run build:lib`)
5. **Update CHANGELOG**: Add your changes to [`CHANGELOG.md`](../CHANGELOG.md)
6. **Create Pull Request**:
   - Use a descriptive title
   - Reference related issues
   - Describe your changes in detail
   - Include screenshots for UI changes

### Pull Request Template

```markdown
## Description

[Describe what this PR does]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues

Closes #[issue number]

## Testing

- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No console errors

## Screenshots (if applicable)

[Add screenshots here]

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] CHANGELOG.md updated
```

## Reporting Bugs

### Before Submitting

1. Check existing issues to avoid duplicates
2. Try the latest version
3. Collect relevant information

### Bug Report Template

Use the GitHub issue template or include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Numbered steps to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**:
  - Angular version
  - Browser and version
  - OS
  - Library version
- **Code Example**: Minimal reproducible example
- **Screenshots**: If applicable

## Suggesting Enhancements

### Enhancement Suggestions

We welcome feature requests! Include:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other solutions considered
- **Additional Context**: Any other relevant information

## Development Tips

### Local Development

```bash
# Watch mode for library development
npm run build:lib:watch

# In another terminal, run the demo
npm start
```

### Debugging

- Use Angular DevTools extension
- Enable source maps in development
- Use browser developer tools
- Check console for errors

### Performance Testing

- Test with different dice counts
- Monitor frame rates during animations
- Check memory usage
- Test on low-end devices

## Questions?

If you have questions:

- Check the [documentation](../projects/ngx-dice-captcha/README.md)
- Search [existing issues](https://github.com/Easy-Cloud-in/ngx-dice-captcha/issues)
- Ask in [GitHub Discussions](https://github.com/Easy-Cloud-in/ngx-dice-captcha/discussions)
- Contact: contact@easy-cloud.in

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to NGX Dice CAPTCHA! 🎲
