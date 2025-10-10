# Token Name Fixed

**Date:** October 10, 2025  
**Status:** ✅ Workflows Updated

---

## The Issue

You created a GitHub secret named `NGX_DICE_CAPTCHA`, but the workflows were looking for `NPM_TOKEN`.

## The Fix

Updated both workflows to use `NGX_DICE_CAPTCHA`:

### Files Changed:

1. **`.github/workflows/auto-tag.yml`**

   - Changed: `secrets.NPM_TOKEN` → `secrets.NGX_DICE_CAPTCHA`

2. **`.github/workflows/npm-publish.yml`**
   - Changed: `secrets.NPM_TOKEN` → `secrets.NGX_DICE_CAPTCHA`

---

## Now You Can Publish!

Since you already have the `NGX_DICE_CAPTCHA` token configured, you just need to trigger the workflow:

### Option 1: Update Version and Push (Recommended)

```bash
# 1. Edit projects/ngx-dice-captcha/package.json
# Change "version": "2.0.2" to "version": "2.0.3"

# 2. Commit and push
git add .github/workflows/ projects/ngx-dice-captcha/package.json docs/
git commit -m "fix: update workflows to use NGX_DICE_CAPTCHA token and bump version to 2.0.3"
git push origin main

# 3. Wait 3-4 minutes for automatic publishing
```

### Option 2: Push Workflow Fix First, Then Update Version

```bash
# 1. Push the workflow fixes
git add .github/workflows/ docs/
git commit -m "fix: update workflows to use NGX_DICE_CAPTCHA token"
git push origin main

# 2. Then update version
# Edit projects/ngx-dice-captcha/package.json
# Change "version": "2.0.2" to "version": "2.0.3"

git add projects/ngx-dice-captcha/package.json
git commit -m "chore: release v2.0.3"
git push origin main
```

---

## What Will Happen

```
Push version change to main
  ↓
Auto-tag workflow triggers
  ├─ Check NGX_DICE_CAPTCHA token ✅ (found!)
  ├─ Read version: 2.0.3
  ├─ Create tag: v2.0.3
  └─ Create GitHub release
  ↓
NPM publish workflow triggers
  ├─ Build library
  ├─ Check version on NPM
  ├─ Publish to NPM ✅
  └─ Verify publication
  ↓
Package live on npmjs.com! 🎉
```

---

## Verify After Publishing

```bash
# Check if published (wait 3-4 minutes after push)
npm view ngx-dice-captcha

# Check specific version
npm view ngx-dice-captcha@2.0.3

# Install in a test project
npm install ngx-dice-captcha@2.0.3
```

Or visit: https://www.npmjs.com/package/ngx-dice-captcha

---

## Summary

- ✅ Workflows updated to use `NGX_DICE_CAPTCHA`
- ✅ Token already configured in GitHub
- 🎯 Ready to publish - just update version and push!

---

**Last Updated:** October 10, 2025
