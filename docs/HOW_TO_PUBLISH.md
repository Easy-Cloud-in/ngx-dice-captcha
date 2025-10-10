# How to Publish to NPM

**Current Version:** 2.0.2  
**Status:** Ready to publish (after NPM_TOKEN setup)

---

## Why Your Package Isn't on NPM Yet

The CI build passed ✅, but the package hasn't been published because:

1. **NPM_TOKEN not configured** - The auto-tag workflow checks for this and skips if missing
2. **No version change pushed** - The workflow only triggers when `projects/ngx-dice-captcha/package.json` changes

---

## Step-by-Step Publishing Guide

### Step 1: Configure NPM Token (One-time setup)

1. **Create NPM Automation Token:**

   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token"
   - Select "Automation" type
   - Copy the token (you won't see it again!)

2. **Add Token to GitHub:**
   - Go to your repository on GitHub
   - Click: Settings → Secrets and variables → Actions
   - Click: "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: [paste your token]
   - Click: "Add secret"

### Step 2: Trigger Publishing

You have two options:

#### Option A: Update Version and Push (Automatic)

```bash
# 1. Update version in projects/ngx-dice-captcha/package.json
# Change "version": "2.0.2" to "version": "2.0.3" (or any new version)

# 2. Commit and push
git add projects/ngx-dice-captcha/package.json
git commit -m "chore: release v2.0.3"
git push origin main

# 3. Workflows will automatically:
#    - Create tag v2.0.3
#    - Create GitHub release
#    - Build library
#    - Publish to NPM
#    - Publish to GitHub Packages
```

#### Option B: Manual Trigger (Using existing version)

```bash
# 1. Go to GitHub Actions
# 2. Click "Publish to NPM" workflow
# 3. Click "Run workflow"
# 4. Leave version empty (uses package.json version)
# 5. Click "Run workflow"
```

---

## What Happens During Publishing

### 1. Auto-Tag Workflow Triggers

```
Push to main (package.json changed)
  ↓
Check NPM_TOKEN configured ✅
  ↓
Read version from package.json (2.0.3)
  ↓
Check if tag v2.0.3 exists
  ├─ Exists → Skip (no duplicate)
  └─ New → Continue
  ↓
Create Git tag v2.0.3
  ↓
Create GitHub Release
```

### 2. NPM Publish Workflow Triggers

```
Release created
  ↓
Build Library
  ├─ Install dependencies
  ├─ Build ngx-dice-captcha
  └─ Validate output
  ↓
Check if version exists on NPM
  ├─ Exists → Dry-run only
  └─ New → Publish
  ↓
Publish to NPM (with provenance)
  ↓
Verify publication succeeded
  ↓
Publish to GitHub Packages
```

---

## Checking Publication Status

### Check GitHub Actions

1. Go to: https://github.com/YOUR_USERNAME/ngx-dice-captcha/actions
2. Look for:
   - "Auto Tag and Release" workflow
   - "Publish to NPM" workflow
3. Check if they completed successfully

### Check NPM

After workflow completes (usually 2-3 minutes):

```bash
# Check if package exists
npm view ngx-dice-captcha

# Check specific version
npm view ngx-dice-captcha@2.0.3

# View all versions
npm view ngx-dice-captcha versions
```

Or visit: https://www.npmjs.com/package/ngx-dice-captcha

---

## Troubleshooting

### Issue: "NPM_TOKEN is not configured"

**Solution:** Follow Step 1 above to add NPM_TOKEN to GitHub secrets

### Issue: "Tag already exists"

**Solution:** Update the version number in `projects/ngx-dice-captcha/package.json` to a new version

### Issue: "403 Forbidden" during publish

**Possible causes:**

1. NPM_TOKEN expired or invalid
2. Package name already taken by someone else
3. You don't have permission to publish

**Solution:**

```bash
# Test your token locally
npm whoami --registry https://registry.npmjs.org

# If it fails, regenerate token and update GitHub secret
```

### Issue: Package not appearing on NPM

**Wait time:** Usually 1-2 minutes after successful publish

**Check:**

1. Verify workflow completed successfully
2. Check workflow logs for errors
3. Try: `npm view ngx-dice-captcha@VERSION`

---

## Version Numbering Guide

Follow semantic versioning (semver):

- **Patch (2.0.2 → 2.0.3)** - Bug fixes, no breaking changes
- **Minor (2.0.3 → 2.1.0)** - New features, no breaking changes
- **Major (2.1.0 → 3.0.0)** - Breaking changes

### Examples:

```bash
# Bug fix release
"version": "2.0.2" → "2.0.3"
git commit -m "fix: resolve dice rendering issue"

# New feature release
"version": "2.0.3" → "2.1.0"
git commit -m "feat: add new overlay position options"

# Breaking change release
"version": "2.1.0" → "3.0.0"
git commit -m "feat!: redesign configuration API (BREAKING CHANGE)"
```

---

## Quick Publish Checklist

Before publishing, make sure:

- ✅ NPM_TOKEN configured in GitHub secrets
- ✅ Version updated in `projects/ngx-dice-captcha/package.json`
- ✅ Build works locally: `pnpm run build:lib`
- ✅ Changes committed and pushed to main
- ✅ CI build passes on GitHub

Then just wait for the workflows to complete!

---

## After Publishing

### Verify Installation

```bash
# Install in a test project
npm install ngx-dice-captcha@2.0.3

# Or with pnpm
pnpm add ngx-dice-captcha@2.0.3
```

### Update Documentation

1. Update README.md with new version
2. Update CHANGELOG.md with release notes
3. Announce on social media / forums

---

## Current Status

**Version in package.json:** 2.0.2  
**NPM Token:** ❓ Unknown (check GitHub secrets)  
**Last Build:** ✅ Passed  
**Published to NPM:** ❌ Not yet

### Next Action:

1. **If NPM_TOKEN not configured:** Add it to GitHub secrets (Step 1)
2. **If NPM_TOKEN configured:** Update version to 2.0.3 and push (Step 2)

---

**Last Updated:** October 10, 2025
