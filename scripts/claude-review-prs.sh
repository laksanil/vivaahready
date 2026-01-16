#!/bin/bash
# claude-review-prs.sh - Review all open PRs and display their status
#
# Usage: ./scripts/claude-review-prs.sh [--ready-only]
#
# This script shows:
# - All open PRs with their status
# - Which PRs are ready for merge (tests passing)
# - Which PRs need attention (conflicts, failing tests)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

READY_ONLY=false

if [[ "$1" == "--ready-only" ]]; then
    READY_ONLY=true
fi

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              PR Review Dashboard                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get all open PRs
PRS=$(gh pr list --state open --json number,title,author,labels,createdAt,headRefName,mergeable,isDraft --jq '.[] | @json')

if [[ -z "$PRS" ]]; then
    echo -e "${YELLOW}No open PRs found.${NC}"
    exit 0
fi

# Counters
READY_COUNT=0
NEEDS_ATTENTION_COUNT=0
DRAFT_COUNT=0

echo -e "${BLUE}Open Pull Requests:${NC}"
echo ""

while IFS= read -r pr; do
    NUMBER=$(echo "$pr" | jq -r '.number')
    TITLE=$(echo "$pr" | jq -r '.title')
    AUTHOR=$(echo "$pr" | jq -r '.author.login')
    BRANCH=$(echo "$pr" | jq -r '.headRefName')
    MERGEABLE=$(echo "$pr" | jq -r '.mergeable')
    IS_DRAFT=$(echo "$pr" | jq -r '.isDraft')
    LABELS=$(echo "$pr" | jq -r '.labels[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')

    # Check if tests are passing
    HAS_TESTS_PASSING=false
    if echo "$LABELS" | grep -q "tests-passing"; then
        HAS_TESTS_PASSING=true
    fi

    # Determine status
    if [[ "$IS_DRAFT" == "true" ]]; then
        STATUS="${YELLOW}[DRAFT]${NC}"
        ((DRAFT_COUNT++))
        if $READY_ONLY; then
            continue
        fi
    elif [[ "$MERGEABLE" == "CONFLICTING" ]]; then
        STATUS="${RED}[CONFLICTS]${NC}"
        ((NEEDS_ATTENTION_COUNT++))
        if $READY_ONLY; then
            continue
        fi
    elif [[ "$HAS_TESTS_PASSING" == true && "$MERGEABLE" == "MERGEABLE" ]]; then
        STATUS="${GREEN}[READY TO MERGE]${NC}"
        ((READY_COUNT++))
    elif [[ "$HAS_TESTS_PASSING" == false ]]; then
        STATUS="${YELLOW}[AWAITING CI]${NC}"
        ((NEEDS_ATTENTION_COUNT++))
        if $READY_ONLY; then
            continue
        fi
    else
        STATUS="${YELLOW}[PENDING]${NC}"
        ((NEEDS_ATTENTION_COUNT++))
        if $READY_ONLY; then
            continue
        fi
    fi

    echo -e "  ${STATUS} #${NUMBER}: ${TITLE}"
    echo -e "     Branch: ${CYAN}${BRANCH}${NC}"
    if [[ -n "$LABELS" ]]; then
        echo -e "     Labels: ${LABELS}"
    fi
    echo ""

done <<< "$PRS"

echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "Summary:"
echo -e "  ${GREEN}Ready to merge:${NC} $READY_COUNT"
echo -e "  ${YELLOW}Needs attention:${NC} $NEEDS_ATTENTION_COUNT"
echo -e "  ${YELLOW}Drafts:${NC} $DRAFT_COUNT"
echo ""

if [[ $READY_COUNT -gt 0 ]]; then
    echo -e "${GREEN}PRs ready for merge - use these commands to review and merge:${NC}"
    echo ""

    while IFS= read -r pr; do
        NUMBER=$(echo "$pr" | jq -r '.number')
        LABELS=$(echo "$pr" | jq -r '.labels[].name' 2>/dev/null | tr '\n' ',' | sed 's/,$//')
        MERGEABLE=$(echo "$pr" | jq -r '.mergeable')
        IS_DRAFT=$(echo "$pr" | jq -r '.isDraft')

        if echo "$LABELS" | grep -q "tests-passing" && [[ "$MERGEABLE" == "MERGEABLE" ]] && [[ "$IS_DRAFT" != "true" ]]; then
            echo "  # Review PR #${NUMBER}"
            echo "  gh pr diff ${NUMBER}"
            echo "  gh pr checks ${NUMBER}"
            echo "  # If approved, merge with:"
            echo "  gh pr merge ${NUMBER} --squash --delete-branch"
            echo ""
        fi
    done <<< "$PRS"
fi

echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
echo ""
echo "Quick commands:"
echo "  gh pr list --state open           # List all open PRs"
echo "  gh pr diff <number>               # View PR diff (ALWAYS do this before merging)"
echo "  gh pr checks <number>             # Check CI status"
echo "  gh pr view <number>               # View PR details"
echo "  gh pr merge <number> --squash     # Merge PR (after reviewing diff)"
