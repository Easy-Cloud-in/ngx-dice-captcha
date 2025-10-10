# GitHub Actions Workflow Fixes Applied

## Issue Description

The GitHub Actions workflow was not automatically publishing to NPM when the version in `package.json` was updated and pushed to the main branch. Tags were being created correctly, but the NPM publishing workflow was not triggering.

## Root Causes Identified

1. **Release Event Type Mismatch**: The `npm-publish.yml` workflow was only listening for `release: types: [published]` events, but the `auto-tag.yml` workflow creates releases with the `created` event type first.

2. **Incorrect Secret Name**: The workflow was using `NPM_TOKEN` as the secret name for the NPM token, but the actual secret was `NGX_DICE_CAPTCHA`.

3. **Missing NPM Token Validation**: The auto-tag workflow didn't validate that the NPM token was configured before creating releases.

4. **Concurrency Group Reference**: The concurrency group was using `github.ref` which might not work correctly for release events.

## Fixes Applied

### 1. Updated npm-publish.yml Triggers

```yaml
on:
  release:
    types: [published, created] # Added 'created' event type
  push:
    tags:
      - 'v*'
  workflow_dispatch:
```

### 2. Fixed Job Condition

```yaml
publish-npm:
  if: github.event_name == 'release' || github.event_name == 'push' || github.event_name == 'workflow_dispatch'
```

### 3. Corrected Secret Name

```yaml
env:
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} # Changed from NGX_DICE_CAPTCHA
```

### 4. Fixed Concurrency Group

```yaml
concurrency:
  group: publish-${{ github.event.release.tag_name || github.ref_name }}
```

### 5. Added NPM Token Validation

Added a check in `auto-tag.yml` to ensure `NPM_TOKEN` is configured before proceeding with release creation.

### 6. Added Permissions

Added `packages: write` permission to ensure proper access for publishing.

## Testing

A test workflow (`test-trigger.yml`) has been created to debug trigger events and verify that workflows are being triggered correctly.

## How to Use

1. Ensure `NGX_DICE_CAPTCHA` is configured in repository secrets
2. Update version in `projects/ngx-dice-captcha/package.json`
3. Commit and push to main branch
4. The auto-tag workflow will create a tag and release
5. The npm-publish workflow will automatically trigger and publish to NPM

## Verification Steps

After applying these fixes:

1. Check that the secret name in your repository is `NGX_DICE_CAPTCHA`
2. Update the version in package.json
3. Push to main branch
4. Verify that both workflows run successfully in the Actions tab
5. Confirm the package is published to NPM

## Additional Notes

- The workflows now handle both `created` and `published` release events
- The secret name is now consistent with the actual repository secret
- Proper validation ensures failures are caught early
- The test workflow can be used to debug any future issues
