# NPM Publishing Setup Guide

This guide explains how to set up NPM publishing for the ngx-dice-captcha library.

## Prerequisites

1. NPM Account with publishing rights
2. GitHub repository admin access
3. Two-factor authentication enabled on NPM

## Step 1: Create NPM Access Token

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Click on your profile icon → "Access Tokens"
3. Click "Generate New Token" → "Classic Token"
4. Select token type:
   - **Automation**: For CI/CD pipelines (recommended)
   - Expiration: Choose "No expiration" or set a reminder
5. Copy the token immediately (you won't see it again)

## Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:
   - **Name**: `NPM_TOKEN`
   - **Value**: Paste your NPM token
5. Click **Add secret**

## Step 3: Verify Workflow Configuration

The workflow file is already created at `.github/workflows/npm-publish.yml`

Key features:

- ✅ Runs tests before publishing
- ✅ Checks if version already exists
- ✅ Publishes to both NPM and GitHub Packages
- ✅ Supports manual and release-triggered publishing
- ✅ Provides provenance for package authenticity

## Step 4: Publishing Methods

### Method 1: Automated Release (Recommended) ⚡

**NEW**: Automatic tagging and release creation on version changes!

The repository now includes an automated workflow that:

- ✅ Automatically detects version changes in `package.json`
- ✅ Creates Git tags automatically
- ✅ Creates GitHub releases with changelog notes
- ✅ Triggers NPM publishing workflow
- ✅ Checks NPM token configuration before proceeding
- ✅ Skips if version already exists

**Publishing Workflow:**

1. **Update version** in `projects/ngx-dice-captcha/package.json`:

   ```bash
   cd projects/ngx-dice-captcha
   npm version patch  # or minor, or major
   ```

2. **Update CHANGELOG.md** (optional but recommended):

   - Document changes for this version
   - Follow [Keep a Changelog](https://keepachangelog.com/) format

3. **Commit and push**:

   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.1"
   git push origin main
   ```

4. **That's it!** The workflow automatically:
   - Checks if NPM_TOKEN is configured (exits gracefully if not)
   - Reads the version from package.json
   - Checks if tag already exists (skips if yes)
   - Creates tag `v1.0.1`
   - Creates GitHub release with changelog notes
   - Triggers NPM publish workflow
   - Publishes to NPM after tests pass

**How it works:**

- Workflow: [`.github/workflows/auto-tag.yml`](.github/workflows/auto-tag.yml)
- Triggers on: Push to `main` branch with changes to `projects/ngx-dice-captcha/package.json`
- Safety: Will not create duplicate tags or trigger publishing for existing versions
- Requirement: NPM_TOKEN must be configured in repository secrets

### Method 2: Manual GitHub Release

If you prefer manual control:

1. Update version in `projects/ngx-dice-captcha/package.json`
2. Commit and push changes
3. Create tag manually:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. Go to GitHub → Releases → Create release from tag
5. Workflow automatically publishes to NPM

### Method 3: Manual Workflow Trigger

1. Go to **Actions** tab on GitHub
2. Select **"Publish to NPM"** workflow
3. Click **"Run workflow"**
4. Optionally specify version
5. Click **"Run workflow"** button

### Method 3: Local Publishing (Not Recommended)

```bash
# Build the library
npm run build:lib

# Navigate to dist folder
cd dist/ngx-dice-captcha

# Login to NPM (if not already)
npm login

# Publish
npm publish --access public
```

## Step 5: Verify Publication

After publishing:

1. Check [npmjs.com/package/ngx-dice-captcha](https://www.npmjs.com/package/ngx-dice-captcha)
2. Verify package details and version
3. Test installation:
   ```bash
   npm install ngx-dice-captcha@latest
   ```

## Version Management

With **automated publishing** (Method 1), the release process is simplified:

1. **Update Version**:

   ```bash
   cd projects/ngx-dice-captcha
   npm version patch  # 1.0.0 -> 1.0.1
   # or
   npm version minor  # 1.0.0 -> 1.1.0
   # or
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. **Update CHANGELOG.md** (optional but recommended):

   - Document all changes
   - Follow [Keep a Changelog](https://keepachangelog.com/) format

3. **Commit and Push**:

   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.1"
   git push origin main
   ```

4. **Automated Process**:
   - Auto-tag workflow creates Git tag automatically
   - GitHub release is created with changelog notes
   - NPM publish workflow is triggered
   - Package is published after tests pass

**Note**: Manual tag creation is no longer required with Method 1!

## Workflows Overview

### 1. Auto-Tag Workflow (`.github/workflows/auto-tag.yml`)

Automatically creates tags and releases when version changes:

- **Triggers**: Push to `main` with changes to `projects/ngx-dice-captcha/package.json`
- **Pre-requisite Check**: Verifies NPM_TOKEN is configured (exits gracefully if not)
- **Safety Features**:
  - Checks if tag exists locally and remotely
  - Skips if version already tagged
  - Prevents duplicate releases
- **Actions**:
  - Reads package.json version
  - Creates Git tag (e.g., `v1.0.1`)
  - Extracts changelog notes
  - Creates GitHub release
  - Triggers NPM publish workflow

### 2. NPM Publish Workflow (`.github/workflows/npm-publish.yml`)

Publishes package to NPM and GitHub Packages:

- **Triggers**: GitHub release creation, manual workflow dispatch
- **Test Suite**:
  - Runs on Node 18.x and 20.x
  - Executes linter
  - Runs library tests
  - Builds library
- **Safety Checks**:
  - Verifies version doesn't exist on NPM
  - Dry-run if version exists
  - Only publishes new versions
- **Actions**:
  - Publishes to NPM with provenance
  - Publishes to GitHub Packages
  - Creates release assets
  - Provides summary reports

### 3. CI Workflow (`.github/workflows/ci.yml`)

Continuous integration on every push and PR:

- **Triggers**: Push/PR to `main` or `develop`
- **Actions**:
  - Linting
  - Testing on Node 18.x and 20.x
  - Building library
  - Building demo application
  - Code coverage reporting

## Troubleshooting

### Issue: "NPM not configured" in auto-tag workflow

**Solution**: The auto-tag workflow requires NPM_TOKEN to be configured. Add it in repository secrets (see Step 2 above).

### Issue: "You must be logged in to publish packages"

**Solution**: Check that `NPM_TOKEN` secret is correctly set in GitHub

### Issue: "Version already exists"

**Solution**: The workflow will skip publishing if version exists. Update version in package.json

### Issue: "403 Forbidden"

**Solution**:

- Verify NPM token has publish permissions
- Check that you have maintainer rights for the package
- Ensure package name is available (for first publish)

### Issue: Workflow fails on tests

**Solution**:

- Run tests locally: `npm run test:ci`
- Fix any failing tests before releasing
- Ensure all dependencies are installed

## Security Best Practices

1. **Never commit NPM tokens** to the repository
2. **Rotate tokens regularly** (every 6-12 months)
3. **Use automation tokens** for CI/CD
4. **Enable 2FA** on your NPM account
5. **Review workflow logs** after each publish
6. **Monitor package downloads** for suspicious activity

## Package Scope

The package is published as:

- **NPM**: `ngx-dice-captcha` (public)
- **GitHub Packages**: `@easy-cloud-in/ngx-dice-captcha` (optional)

### Issue: Auto-tag workflow doesn't trigger

**Solution**:

- Ensure changes are in `projects/ngx-dice-captcha/package.json`
- Push to `main` branch (not other branches)
- Check if tag already exists for that version
- Review GitHub Actions logs for details

## Rollback Procedure

If you need to unpublish or deprecate a version:

```bash
# Deprecate a version (recommended)
npm deprecate ngx-dice-captcha@1.0.0 "Please upgrade to 1.0.1"

# Unpublish (only within 72 hours, not recommended)
npm unpublish ngx-dice-captcha@1.0.0
```

## Additional Resources

- [NPM Publishing Documentation](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

## Support

For publishing issues:

- Check GitHub Actions logs
- Review NPM audit logs
- Contact: contact@easy-cloud.in

---

Last Updated: 2025-10-07
