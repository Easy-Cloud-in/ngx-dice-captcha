#!/bin/bash

# =============================================================================
# Force Clean Remote Repository Script
# =============================================================================
# This script will completely wipe the remote repository and push a clean history
# Use this if the reset script didn't fully clean the remote
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "This is not a Git repository. Please run this script from within a Git repository."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check remote URL
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE_URL" ]; then
    print_error "No remote 'origin' found. Please set up a remote first."
    exit 1
fi

print_status "Remote URL: $REMOTE_URL"

echo ""
print_warning "============================================================================"
print_warning "WARNING: This will FORCE DELETE everything on the remote repository:"
print_warning "- ALL commits"
print_warning "- ALL branches"
print_warning "- ALL tags"
print_warning "- ALL releases"
print_warning ""
print_warning "This is more aggressive than the reset script!"
print_warning "============================================================================"
echo ""

read -p "Are you absolutely sure you want to continue? (type 'yes' to confirm): " confirm
if [ "$confirm" != "yes" ]; then
    print_status "Operation cancelled by user."
    exit 0
fi

# =============================================================================
# STEP 1: DELETE ALL REMOTE TAGS
# =============================================================================
print_status "Step 1: Deleting ALL remote tags..."

# Get all remote tags and delete them
REMOTE_TAGS=$(git ls-remote --tags origin | awk '{print $2}' | sed 's/refs\/tags\///' | sed 's/\^{}//')
if [ -n "$REMOTE_TAGS" ]; then
    echo "$REMOTE_TAGS" | while read -r tag; do
        if [ -n "$tag" ]; then
            print_status "Deleting remote tag: $tag"
            git push origin :refs/tags/"$tag" 2>/dev/null || print_warning "Failed to delete tag: $tag"
        fi
    done
else
    print_status "No remote tags found"
fi

# =============================================================================
# STEP 2: DELETE ALL REMOTE BRANCHES (except main)
# =============================================================================
print_status "Step 2: Deleting all remote branches except main..."

# Get all remote branches except main and HEAD
REMOTE_BRANCHES=$(git branch -r | grep -v "origin/HEAD" | grep -v "origin/$CURRENT_BRANCH" | sed 's/origin\///' | grep -v "")
if [ -n "$REMOTE_BRANCHES" ]; then
    echo "$REMOTE_BRANCHES" | while read -r branch; do
        if [ -n "$branch" ]; then
            print_status "Deleting remote branch: $branch"
            git push origin :"$branch" 2>/dev/null || print_warning "Failed to delete branch: $branch"
        fi
    done
else
    print_status "No remote branches to delete"
fi

# =============================================================================
# STEP 3: CREATE A NEW ORPHAN BRANCH (if not already clean)
# =============================================================================
print_status "Step 3: Ensuring clean local repository..."

# Check if we already have a clean repo
if [ "$(git rev-list --count HEAD)" -eq 1 ] && git log -1 --pretty=%B | grep -q "Initial commit - Repository reset"; then
    print_status "Local repository is already clean"
else
    print_status "Creating clean local repository..."
    
    # Create new orphan branch
    git checkout --orphan clean-main
    
    # Remove everything
    git reset --hard
    
    # Re-add all files
    git add -A
    
    # Create initial commit
    git commit -m "Initial commit - Repository reset on $(date)"
    
    # Delete old branch and rename
    git branch -D "$CURRENT_BRANCH"
    git branch -m "$CURRENT_BRANCH"
fi

# =============================================================================
# STEP 4: FORCE PUSH TO OVERWRITE REMOTE
# =============================================================================
print_status "Step 4: Force pushing to overwrite remote main..."

# Force push to overwrite remote
git push -f origin "$CURRENT_BRANCH"

# =============================================================================
# STEP 5: VERIFY CLEAN STATE
# =============================================================================
print_status "Step 5: Verifying remote is clean..."

# Fetch latest remote state
git fetch origin

# Check remote tags
REMOTE_TAGS_AFTER=$(git ls-remote --tags origin | wc -l)
print_status "Remote tags count: $REMOTE_TAGS_AFTER"

# Check remote branches
REMOTE_BRANCHES_AFTER=$(git branch -r | wc -l)
print_status "Remote branches count: $REMOTE_BRANCHES_AFTER"

# Check commits on remote main
REMOTE_COMMITS=$(git rev-list --count origin/$CURRENT_BRANCH)
print_status "Remote commits count: $REMOTE_COMMITS"

echo ""
print_success "Remote repository has been forcefully cleaned!"
echo ""
echo "Remote status:"
echo "=============="
echo "Branches: $REMOTE_BRANCHES_AFTER"
echo "Tags: $REMOTE_TAGS_AFTER"
echo "Commits on main: $REMOTE_COMMITS"
echo ""

if [ "$REMOTE_COMMITS" -eq 1 ] && [ "$REMOTE_TAGS_AFTER" -eq 0 ]; then
    print_success "Remote is perfectly clean with only one initial commit!"
else
    print_warning "Remote might still have some remnants. Check manually."
fi

echo ""
print_status "Your remote repository is now clean and ready for fresh pushes!"