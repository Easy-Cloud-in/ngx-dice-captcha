# Publish v2.0.6 to NPM - Quick Guide

**Current Status:**

- ✅ Tag v2.0.6 created
- ❌ GitHub Release NOT created (this is why NPM publish didn't trigger)
- ❌ v2.0.6 NOT on NPM yet

---

## 🚀 Publish v2.0.6 Right Now (Choose One)

### Option 1: Create GitHub Release (Recommended - Triggers Auto-Publish)

**Via Web UI:**

1. Go to: https://github.com/YOUR_USERNAME/ngx-dice-captcha/releases/new
2. Choose tag: **v2.0.6** (from dropdown)
3. Release title: **Release v2.0.6**
4. Description: **Release version 2.0.6**
5. Click **"Publish release"**
6. Wait 2-3 minutes
7. Check: https://www.npmjs.com/package/ngx-dice-captcha

**Via Command Line (if you have GitHub CLI):**

```bash
gh release create v2.0.6 \
  --title "Release v2.0.6" \
  --notes "Release version 2.0.6"
```

### Option 2: Manual Workflow Trigger (Faster)

1. Go to: https://github.com/YOUR_USERNAME/ngx-dice-captcha/actions/workflows/npm-publish.yml
2. Click **"Run workflow"** button
3. Leave version empty
4. Click **"Run workflow"**
5. Wait 2-3 minutes
6. Check: https://www.npmjs.com/package/ngx-dice-captcha

---

## 🔧 Why This Happened

The auto-tag workflow successfully:

- ✅ Created tag v2.0.6
- ✅ Pushed tag to GitHub

But the GitHub Release creation step failed silently. Possible reasons:

1. The `softprops/action-gh-release@v1` action had an issue
2. Permissions problem (though unlikely)
3. Network/API issue with GitHub

---

## ✅ I've Fixed It For Next Time

Updated the auto-tag workflow:

- ✅ Upgraded to `softprops/action-gh-release@v2` (more stable)
- ✅ Added verification step to confirm release creation
- ✅ Better error messages

**Next version (2.0.7+) will work automatically!**

---

## 📋 After Publishing v2.0.6

Once you've published using Option 1 or 2 above:

### Verify Publication

```bash
# Check if v2.0.6 is on NPM
npm view ngx-dice-captcha@2.0.6

# View all versions
npm view ngx-dice-captcha versions

# Test installation
npm install ngx-dice-captcha@2.0.6
```

### Test Next Auto-Publish

```bash
# 1. Update version
# Edit projects/ngx-dice-captcha/package.json
# Change "version": "2.0.6" to "version": "2.0.7"

# 2. Commit and push
git add .github/workflows/auto-tag.yml projects/ngx-dice-captcha/package.json docs/
git commit -m "fix: improve auto-tag workflow and bump to v2.0.7"
git push origin main

# 3. This time it should work completely automatically!
```

---

## 🎯 Recommended Action

**Use Option 1** (Create GitHub Release via web UI):

- ✅ Creates proper release documentation
- ✅ Triggers NPM publish automatically
- ✅ Keeps everything in sync
- ✅ Takes only 30 seconds

Then test the improved workflow with v2.0.7!

---

**Last Updated:** October 10, 2025
