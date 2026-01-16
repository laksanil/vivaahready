#!/bin/bash
# claude-create-pr.sh - Standardized PR creation for Claude Code instances
#
# Usage: ./scripts/claude-create-pr.sh <dev-id> <type> <description>
# Example: ./scripts/claude-create-pr.sh dev-a feat "add user authentication"
#
# This script:
# 1. Creates a properly named branch
# 2. Pushes the branch
# 3. Creates a PR with standardized formatting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
DEV_ID="${1:-}"
TYPE="${2:-}"
DESCRIPTION="${3:-}"

if [[ -z "$DEV_ID" || -z "$TYPE" || -z "$DESCRIPTION" ]]; then
    echo -e "${RED}Usage: $0 <dev-id> <type> <description>${NC}"
    echo ""
    echo "Arguments:"
    echo "  dev-id      : dev-a or dev-b"
    echo "  type        : feat, fix, refactor, style, docs, test, chore"
    echo "  description : Brief description (will be slugified for branch name)"
    echo ""
    echo "Example:"
    echo "  $0 dev-a feat 'add user authentication'"
    exit 1
fi

# Validate dev-id
if [[ "$DEV_ID" != "dev-a" && "$DEV_ID" != "dev-b" ]]; then
    echo -e "${RED}Error: dev-id must be 'dev-a' or 'dev-b'${NC}"
    exit 1
fi

# Validate type
VALID_TYPES="feat fix refactor style docs test chore"
if [[ ! " $VALID_TYPES " =~ " $TYPE " ]]; then
    echo -e "${RED}Error: type must be one of: $VALID_TYPES${NC}"
    exit 1
fi

# Slugify description for branch name
SLUG=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
BRANCH_NAME="work/${DEV_ID}-${SLUG}"

echo -e "${GREEN}Creating PR for: ${TYPE}: ${DESCRIPTION}${NC}"
echo ""

# Check if we're on main
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" == "main" ]]; then
    echo -e "${YELLOW}Currently on main, creating new branch...${NC}"

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
        exit 1
    fi

    # Pull latest main
    echo "Pulling latest main..."
    git pull origin main

    # Create and checkout new branch
    echo "Creating branch: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"
else
    echo -e "${YELLOW}Already on branch: $CURRENT_BRANCH${NC}"
    BRANCH_NAME="$CURRENT_BRANCH"
fi

# Push the branch
echo "Pushing branch to origin..."
git push -u origin "$BRANCH_NAME"

# Format the PR title
DEV_UPPER=$(echo "$DEV_ID" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
PR_TITLE="[${DEV_UPPER}] ${TYPE}: ${DESCRIPTION}"

# Get changed files for the body
CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null || echo "Unable to determine changed files")

# Create PR body
PR_BODY=$(cat <<EOF
## Summary
${DESCRIPTION}

## Changed Files
\`\`\`
${CHANGED_FILES}
\`\`\`

## Checklist
- [ ] Tests pass locally
- [ ] Code follows project conventions
- [ ] No console.log or debug code left behind

## Review Notes
<!-- Add any notes for the reviewer -->

---
*Created by Claude Code (${DEV_UPPER})*
EOF
)

# Create the PR
echo ""
echo -e "${GREEN}Creating PR...${NC}"
gh pr create \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --base main

echo ""
echo -e "${GREEN}PR created successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for CI to run (tests will be executed)"
echo "2. PR will be labeled automatically"
echo "3. Another Claude instance can review and merge"
