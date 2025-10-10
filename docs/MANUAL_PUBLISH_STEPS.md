# Manual Publishing Steps

**Current Version:** 2.0.4  
**Issue:** Auto-tag workflow may not be detecting the token

---

## Quick Fix: Manual Workflow Trigger

Since the auto-tag workflow might not be working, let's manually trigger the publish:

### Step 1: Go to GitHub Actions

1. Go to: https://github.com/YOUR_USERNAME/ngx-dice-captcha/actions
2. Click on "Publish to NPM" workflow (left sidebar)
3. Click "Run workflow" button (top right)
4. Leave version empty (it will use 2.0.4 from package.json)
5. Click "Run workflow"

This will:

- Build the library
- Publish to NPM
- Publish to GitHub Packages

---

## Debugging: Check if Token is Accessible

The auto-tag workflow checks for the token but might not be finding it. Let's verify:

### Check Token Name in GitHub

1. Go to: Settings → Secrets and variables → Actions
2. Verify you see: `NGX_DICE_CAPTCHA`
3. Make sure it's under "Repository secrets" (not Environment secrets)

### Common Issues:

**Issue 1: Token in wrong place**

- Token must be in "Repository secrets"
- NOT in "Environment secrets"
- NOT in "Organization secrets" (unless you want that)

**Issue 2: Token name mismatch**

- Must be exactly: `NGX_DICE_CAPTCHA`
- Case sensitive!

**Issue 3: Token expired**

- NPM tokens can expire
- Check if token is still valid on npmjs.com

---

## Alternative: Create GitHub Release Manually

This will trigger the NPM publish workflow:

### Step 1: Create a Tag

```bash
git tag v2.0.4
git push origin v2.0.4
```

### Step 2: Create Release on GitHub

1. Go to: https://github.com/YOUR_USERNAME/ngx-dice-captcha/releases
2. Click "Draft a new release"
3. Choose tag: v2.0.4
4. Release title: Release v2.0.4
5. Description: (add release notes)
6. Click "Publish release"

This will automatically trigger the "Publish to NPM" workflow!

---

## Verify Token is Working

Let's test if the token works by manually publishing:

```bash
# 1. Build the library
pnpm run build:lib

# 2. Go to dist folder
cd dist/ngx-dice-captcha

# 3. Test with dry-run (doesn't actually publish)
npm publish --dry-run

# 4. If dry-run works, publish for real
npm publish --access public

# You'll need to login first:
npm login
```

---

## Check Workflow Runs

Go to: https://github.com/YOUR_USERNAME/ngx-dice-captcha/actions

Look for:

- "Auto Tag and Release" runs
- "Publish to NPM" runs

Click on a run to see the logs. Look for:

- ✅ "NGX_DICE_CAPTCHA token is configured"
- OR ❌ "NGX_DICE_CAPTCHA token is not configured"

---

## Quick Checklist

Before trying manual publish:

- [ ] Token named exactly `NGX_DICE_CAPTCHA` in Repository secrets
- [ ] Token is a valid NPM automation token
- [ ] You have permission to publish `ngx-dice-captcha` package
- [ ] Version 2.0.4 doesn't already exist on NPM

---

## Recommended: Manual Trigger Now

The fastest way to publish right now:

1. Go to Actions → "Publish to NPM"
2. Click "Run workflow"
3. Click "Run workflow" button
4. Wait 2-3 minutes
5. Check npmjs.com/package/ngx-dice-captcha

---

**Last Updated:** October 10, 2025
