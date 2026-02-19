#!/bin/bash
# claude-merge-check.sh - Pre-merge validation for a specific PR
#
# Usage: ./scripts/claude-merge-check.sh <pr-number>
#
# This script performs all checks before merging:
# 1. Verifies CI has passed
# 2. Checks for merge conflicts
# 3. Looks for overlapping changes with other PRs
# 4. Provides merge command if all checks pass

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PR_NUMBER="${1:-}"

if [[ -z "$PR_NUMBER" ]]; then
    echo -e "${RED}Usage: $0 <pr-number>${NC}"
    echo ""
    echo "Example:"
    echo "  $0 123"
    exit 1
fi

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          Pre-Merge Check for PR #${PR_NUMBER}                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Track overall status
ALL_CHECKS_PASS=true

# Function to print check result
print_check() {
    local status=$1
    local message=$2
    if [[ "$status" == "PASS" ]]; then
        echo -e "  ${GREEN}✓${NC} $message"
    elif [[ "$status" == "FAIL" ]]; then
        echo -e "  ${RED}✗${NC} $message"
        ALL_CHECKS_PASS=false
    elif [[ "$status" == "WARN" ]]; then
        echo -e "  ${YELLOW}⚠${NC} $message"
    else
        echo -e "  ${BLUE}ℹ${NC} $message"
    fi
}

# Get PR details
echo -e "${BLUE}Fetching PR details...${NC}"
PR_DATA=$(gh pr view "$PR_NUMBER" --json title,state,mergeable,headRefName,baseRefName,labels,author,files,additions,deletions,isDraft 2>/dev/null)

if [[ -z "$PR_DATA" ]]; then
    echo -e "${RED}Error: Could not fetch PR #${PR_NUMBER}. Does it exist?${NC}"
    exit 1
fi

TITLE=$(echo "$PR_DATA" | jq -r '.title')
STATE=$(echo "$PR_DATA" | jq -r '.state')
MERGEABLE=$(echo "$PR_DATA" | jq -r '.mergeable')
BRANCH=$(echo "$PR_DATA" | jq -r '.headRefName')
IS_DRAFT=$(echo "$PR_DATA" | jq -r '.isDraft')
ADDITIONS=$(echo "$PR_DATA" | jq -r '.additions')
DELETIONS=$(echo "$PR_DATA" | jq -r '.deletions')
FILES=$(echo "$PR_DATA" | jq -r '.files[].path' 2>/dev/null)
LABELS=$(echo "$PR_DATA" | jq -r '.labels[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')

echo ""
echo -e "${CYAN}PR #${PR_NUMBER}: ${TITLE}${NC}"
echo -e "Branch: ${BRANCH}"
echo -e "Changes: +${ADDITIONS} / -${DELETIONS}"
echo -e "Labels: ${LABELS:-none}"
echo ""

echo -e "${BLUE}Running checks...${NC}"
echo ""

# Check 1: PR is open
if [[ "$STATE" != "OPEN" ]]; then
    print_check "FAIL" "PR is not open (state: $STATE)"
else
    print_check "PASS" "PR is open"
fi

# Check 2: Not a draft
if [[ "$IS_DRAFT" == "true" ]]; then
    print_check "FAIL" "PR is a draft - convert to ready for review first"
else
    print_check "PASS" "PR is not a draft"
fi

# Check 3: No merge conflicts
if [[ "$MERGEABLE" == "CONFLICTING" ]]; then
    print_check "FAIL" "PR has merge conflicts - needs rebase"
elif [[ "$MERGEABLE" == "MERGEABLE" ]]; then
    print_check "PASS" "No merge conflicts"
else
    print_check "WARN" "Merge status unknown: $MERGEABLE"
fi

# Check 4: CI status
echo ""
echo -e "${BLUE}Checking CI status...${NC}"
CI_STATUS=$(gh pr checks "$PR_NUMBER" 2>/dev/null || echo "")

if [[ -z "$CI_STATUS" ]]; then
    print_check "WARN" "No CI checks found"
else
    # Check the CI Gate job specifically (the single required status check)
    CI_GATE_STATUS=$(echo "$CI_STATUS" | grep "CI Gate" || echo "")
    if [[ -n "$CI_GATE_STATUS" ]]; then
        if echo "$CI_GATE_STATUS" | grep -q "pass"; then
            print_check "PASS" "CI Gate passed (all checks succeeded)"
        elif echo "$CI_GATE_STATUS" | grep -q "fail"; then
            print_check "FAIL" "CI Gate failed - one or more checks did not pass"
        else
            print_check "WARN" "CI Gate still running"
        fi
    else
        print_check "WARN" "CI Gate check not found - CI may still be starting"
    fi

    # Also show individual check details
    PASSING=$(echo "$CI_STATUS" | grep -c "pass" || true)
    FAILING=$(echo "$CI_STATUS" | grep -c "fail" || true)
    PENDING=$(echo "$CI_STATUS" | grep -c "pending\|running" || true)

    if [[ $FAILING -gt 0 ]]; then
        print_check "FAIL" "CI checks failing: $FAILING failed, $PASSING passed"
        echo ""
        echo "Failed checks:"
        echo "$CI_STATUS" | grep "fail" | head -5
    elif [[ $PENDING -gt 0 ]]; then
        print_check "WARN" "CI checks still running: $PENDING pending, $PASSING passed"
    else
        print_check "PASS" "All CI checks passed ($PASSING checks)"
    fi
fi

# Check 5: tests-passing label
if echo "$LABELS" | grep -q "tests-passing"; then
    print_check "PASS" "Has 'tests-passing' label"
else
    print_check "WARN" "Missing 'tests-passing' label - CI may still be running"
fi

# Check 6: High-conflict files
echo ""
echo -e "${BLUE}Checking for high-conflict files...${NC}"
HIGH_CONFLICT_FILES=""

while IFS= read -r file; do
    case "$file" in
        prisma/schema.prisma)
            HIGH_CONFLICT_FILES="${HIGH_CONFLICT_FILES}${file} (database schema)\n"
            ;;
        src/lib/auth.ts)
            HIGH_CONFLICT_FILES="${HIGH_CONFLICT_FILES}${file} (authentication)\n"
            ;;
        tailwind.config.ts)
            HIGH_CONFLICT_FILES="${HIGH_CONFLICT_FILES}${file} (styling config)\n"
            ;;
        package.json|package-lock.json)
            HIGH_CONFLICT_FILES="${HIGH_CONFLICT_FILES}${file} (dependencies)\n"
            ;;
        .env*)
            HIGH_CONFLICT_FILES="${HIGH_CONFLICT_FILES}${file} (environment)\n"
            ;;
    esac
done <<< "$FILES"

if [[ -n "$HIGH_CONFLICT_FILES" ]]; then
    print_check "WARN" "PR modifies high-conflict files:"
    echo -e "$HIGH_CONFLICT_FILES" | while read line; do
        [[ -n "$line" ]] && echo "       - $line"
    done
else
    print_check "PASS" "No high-conflict files modified"
fi

# Check 7: Look for overlapping PRs
echo ""
echo -e "${BLUE}Checking for overlapping PRs...${NC}"
OTHER_PRS=$(gh pr list --state open --json number,headRefName,files --jq ".[] | select(.number != $PR_NUMBER) | @json" 2>/dev/null)

OVERLAPPING=""
while IFS= read -r other_pr; do
    [[ -z "$other_pr" ]] && continue

    OTHER_NUMBER=$(echo "$other_pr" | jq -r '.number')
    OTHER_BRANCH=$(echo "$other_pr" | jq -r '.headRefName')
    OTHER_FILES=$(echo "$other_pr" | jq -r '.files[].path' 2>/dev/null)

    for file in $FILES; do
        if echo "$OTHER_FILES" | grep -q "^${file}$"; then
            OVERLAPPING="${OVERLAPPING}PR #${OTHER_NUMBER} (${OTHER_BRANCH}) also modifies: ${file}\n"
        fi
    done
done <<< "$OTHER_PRS"

if [[ -n "$OVERLAPPING" ]]; then
    print_check "WARN" "Found overlapping PRs:"
    echo -e "$OVERLAPPING" | while read line; do
        [[ -n "$line" ]] && echo "       $line"
    done
    echo ""
    echo -e "  ${YELLOW}Recommendation: Review the other PR(s) to determine merge order${NC}"
else
    print_check "PASS" "No overlapping PRs found"
fi

# Final verdict
echo ""
echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
echo ""

if $ALL_CHECKS_PASS; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Before merging, you MUST review the diff:${NC}"
    echo ""
    echo "  gh pr diff $PR_NUMBER"
    echo ""
    echo "After reviewing the changes, if everything looks good:"
    echo ""
    echo "  gh pr merge $PR_NUMBER --squash --delete-branch"
    echo ""
else
    echo -e "${RED}✗ Some checks failed - do not merge yet${NC}"
    echo ""
    echo "Fix the issues above before attempting to merge."
    echo ""
    echo "If there are merge conflicts, the author needs to rebase:"
    echo "  git fetch origin main"
    echo "  git rebase origin/main"
    echo "  git push --force-with-lease"
fi
