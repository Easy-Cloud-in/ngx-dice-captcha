# Manual Release Creation for v2.0.6

**Issue:** Tag v2.0.6 was created but GitHub Release wasn't created, so NPM publish didn't trigger.

---

## Quick Fix: Create Release Manually

### Option 1: Via GitHub Web UI (Easiest)

1. Go to: https://github.com/YOUR_USERNAME/ngx-dice-captcha/releases
2. Click "Draft a new release"
3. Click "Choose a tag" → Select **v2.0.6**
4. Release title: **Release v2.0.6**
5. Description: **Release version 2.0.6**
6. Click "Publish release"

This will immediately trigger the "Publish to NPM" workflow!

### Option 2: Via GitHub CLI

```bash
gh release create v2.0.6 \
  --title "Release v2.0.6" \
  --notes "Release version 2.0.6"
```

### Option 3: Manually Trigger NPM Publish

If you don't want to create a release:

1. Go to: https://github.com/YOUR_USERNAME/ngx-dice-captcha/actions
2. Click "Publish to NPM" workflow
3. Click "Run workflow"
4. Leave version empty (uses 2.0.6 from package.json)
5. Click "Run workflow"

---

## Why Did This Happen?

The auto-tag workflow created the tag but the release creation step might have failed due to:

1. **Permissions issue** - GitHub Actions might need additional permissions
2. **Action version issue** - The `softprops/action-gh-release@v1` might have failed
3. **Silent failure** - The step failed but didn't stop the workflow

---

## Permanent Fix

Let me update the workflow to be more robust and show errors clearly.

---

**Recommended:** Use Option 1 (manual release via web UI) - it's the fastest way to publish v2.0.6 right now!
