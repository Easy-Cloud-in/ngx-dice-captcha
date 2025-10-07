# Migration Guide

This guide helps you migrate between major versions of ngx-dice-captcha.

## Table of Contents

- [Current Version](#current-version)
- [Future Migrations](#future-migrations)
- [Breaking Changes Policy](#breaking-changes-policy)
- [Migration Support](#migration-support)

## Current Version

**Current Version**: 1.0.0

This is the initial stable release of ngx-dice-captcha. No migrations are necessary as this is the first version.

## Future Migrations

When new major versions are released, migration guides will be added here.

### Version 2.0.0 (Planned)

Future breaking changes will be documented here before release.

**Potential Changes**:

- Additional dice types (D4, D10, D100)
- Enhanced verification modes
- Updated physics engine
- New theming system

Migration guides will be provided when version 2.0.0 is released.

## Breaking Changes Policy

We follow [Semantic Versioning](https://semver.org/) strictly:

- **Major versions** (e.g., 2.0.0): May include breaking changes
- **Minor versions** (e.g., 1.1.0): New features, backward compatible
- **Patch versions** (e.g., 1.0.1): Bug fixes, backward compatible

### What Constitutes a Breaking Change

Breaking changes include:

1. **API Changes**

   - Removing or renaming public methods
   - Changing method signatures
   - Removing or renaming public properties
   - Changing event emission behavior

2. **Configuration Changes**

   - Removing configuration options
   - Changing default values significantly
   - Changing configuration structure

3. **Behavior Changes**

   - Changing core functionality
   - Altering physics behavior significantly
   - Modifying verification logic

4. **Dependency Updates**
   - Major version updates of peer dependencies
   - Removing support for Angular versions

### Deprecation Process

Before removing features:

1. **Deprecation Notice**: Feature marked as deprecated in version N
2. **Documentation Update**: Deprecation documented in CHANGELOG
3. **Alternative Provided**: Replacement feature available
4. **Grace Period**: Feature remains functional in version N and N+1
5. **Removal**: Feature removed in version N+2

Example:

```typescript
/**
 * @deprecated since v1.5.0, use newMethod() instead
 * Will be removed in v3.0.0
 */
oldMethod() { }
```

## Migration Support

### Getting Help

If you encounter issues during migration:

1. **Check Documentation**

   - Review the [CHANGELOG](CHANGELOG.md)
   - Read the migration guide for your version
   - Check the [API Documentation](API.md)

2. **Search Issues**

   - Look for existing migration issues on [GitHub](https://github.com/Easy-Cloud-in/ngx-dice-captcha/issues)
   - Search for your specific error message

3. **Ask for Help**
   - Open a new issue with the `migration` label
   - Ask in [GitHub Discussions](https://github.com/Easy-Cloud-in/ngx-dice-captcha/discussions)
   - Email: contact@easy-cloud.in

### Automated Migration Tools

Future versions may include Angular schematics for automated migrations:

```bash
# When available
ng update ngx-dice-captcha
```

## Version-Specific Guides

### Upgrading to 1.x from Pre-release

If you were using a pre-release version:

#### Configuration Changes

The configuration structure has been finalized:

```typescript
// Before (pre-release)
const config = {
  numberOfDice: 3,
  diceStyle: 'D6',
};

// After (v1.0.0)
const config = {
  diceCount: 3,
  diceType: DiceType.D6,
};
```

#### Import Changes

All imports should now use the main package entry point:

```typescript
// Before
import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha/lib/components';

// After
import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha';
```

#### Event Changes

Events have been standardized:

```typescript
// Before
onVerified =
  'handleVerification($event)'(onFailed) =
  'handleFailure($event)'(
    // After
    verified
  ) =
  'handleVerification($event)'(failed) =
    'handleFailure($event)';
```

## Best Practices for Upgrading

### 1. Review CHANGELOG

Always read the CHANGELOG before upgrading:

```bash
# View changelog
cat node_modules/ngx-dice-captcha/CHANGELOG.md
```

### 2. Update in Stages

For major version updates:

1. Update to latest patch of current major version
2. Run tests and fix any issues
3. Update to new major version
4. Follow migration guide
5. Run tests and verify functionality

### 3. Use Version Ranges Wisely

In your `package.json`:

```json
{
  "dependencies": {
    "ngx-dice-captcha": "^1.0.0"
  }
}
```

- `^1.0.0` - Accept minor and patch updates (recommended)
- `~1.0.0` - Accept only patch updates (conservative)
- `1.0.0` - Lock to exact version (not recommended)

### 4. Test Thoroughly

After upgrading:

```bash
# Run your tests
npm test

# Test in development
npm start

# Build for production
npm run build
```

### 5. Check TypeScript Compatibility

Ensure your TypeScript version is compatible:

| ngx-dice-captcha | TypeScript |
| ---------------- | ---------- |
| 1.x              | >= 5.0     |

## Rollback Instructions

If you need to rollback after an upgrade:

```bash
# Rollback to previous version
npm install ngx-dice-captcha@1.0.0

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Common Migration Issues

### Issue: "Module not found"

**Cause**: Import paths changed

**Solution**: Update imports to use main entry point:

```typescript
import { NgxDiceCaptchaComponent } from 'ngx-dice-captcha';
```

### Issue: "Property does not exist"

**Cause**: API changes or deprecations

**Solution**:

1. Check the CHANGELOG for renamed properties
2. Refer to API documentation
3. Use TypeScript compiler errors to identify issues

### Issue: "Unexpected behavior"

**Cause**: Default configuration changes

**Solution**: Explicitly set configuration options:

```typescript
const config: CaptchaConfig = {
  diceCount: 3,
  diceType: DiceType.D6,
  difficulty: Difficulty.MEDIUM,
  // Explicitly set all options you rely on
};
```

## Angular Version Compatibility

| ngx-dice-captcha | Angular |
| ---------------- | ------- |
| 1.x              | 20.x    |

When Angular releases major versions, we will update compatibility:

```bash
# Update Angular and ngx-dice-captcha together
ng update @angular/core @angular/cli ngx-dice-captcha
```

## Peer Dependencies

Ensure peer dependencies are compatible:

```json
{
  "peerDependencies": {
    "@angular/common": "^20.0.0",
    "@angular/core": "^20.0.0",
    "three": "^0.180.0",
    "cannon-es": "^0.20.0"
  }
}
```

Update peer dependencies if needed:

```bash
npm install @angular/common@^20.0.0 @angular/core@^20.0.0
npm install three@^0.180.0 cannon-es@^0.20.0
```

## Staying Informed

Stay updated on new releases and migrations:

1. **Watch the Repository**

   - Click "Watch" on [GitHub](https://github.com/Easy-Cloud-in/ngx-dice-captcha)
   - Choose "Releases only"

2. **Subscribe to Releases**

   - Use GitHub's release notifications
   - Follow the release RSS feed

3. **Check Regularly**

   - Review [CHANGELOG.md](CHANGELOG.md) periodically
   - Check for security updates

4. **Community**
   - Join [GitHub Discussions](https://github.com/Easy-Cloud-in/ngx-dice-captcha/discussions)
   - Follow announcements

## Contributing Migration Guides

If you've successfully migrated and want to help others:

1. Document your migration process
2. Share common issues you encountered
3. Submit a PR to update this guide
4. Help answer migration questions in Issues

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## Questions?

For migration help:

- 📚 [API Documentation](API.md)
- 🐛 [Report Issues](https://github.com/Easy-Cloud-in/ngx-dice-captcha/issues)
- 💬 [Ask Questions](https://github.com/Easy-Cloud-in/ngx-dice-captcha/discussions)
- 📧 Email: contact@easy-cloud.in

---

Last Updated: 2025-10-07
Version: 1.0.0
