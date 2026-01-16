# CLAUDE.md - Collaborative Claude Code Workflow

This document establishes the workflow for multiple Claude Code instances working on the same codebase.

## Project Overview

**VivaahReady** - A matrimonial/matchmaking web application built with:
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Auth:** NextAuth.js with Google OAuth
- **Styling:** Tailwind CSS
- **Images:** Cloudinary
- **Deployment:** Vercel

## Directory Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React components
├── lib/           # Utility functions and shared logic
├── types/         # TypeScript type definitions
prisma/
├── schema.prisma  # Database schema
```

---

## Collaborative Workflow Protocol

### 1. ALWAYS Sync Before Starting Work

Before making ANY changes, run:
```bash
git pull origin main
```

If there are conflicts, resolve them before proceeding.

### 2. Check the Work Log

Read `.claude/worklog.md` to see what the other Claude is working on:
```bash
cat .claude/worklog.md
```

### 3. Claim Your Work

Before starting a task, append to `.claude/worklog.md`:
```markdown
## [TIMESTAMP] - [DEVELOPER_ID]
**Status:** IN_PROGRESS
**Task:** [Brief description]
**Files:** [List files you'll be modifying]
**Branch:** [Branch name if using feature branch]
```

Developer IDs:
- **DEV_A** - First Claude instance
- **DEV_B** - Second Claude instance

### 4. PR-Based Workflow (Required)

**CRITICAL: No direct pushes to main. All changes must go through PRs.**

```
DEV_A works on branch → Creates PR → GitHub Actions runs tests
                                            ↓
DEV_B works on branch → Creates PR →  Claude reviews PRs
                                            ↓
                                     Claude merges (squash)
                                            ↓
                                          main
                                            ↓
                                      Vercel deploys
```

**Branch Naming Convention:**
```
work/{dev-id}-{description}
```
Examples:
- `work/dev-a-add-user-auth`
- `work/dev-b-fix-profile-bug`

### 5. Creating a PR

**Option A: Use the helper script (recommended):**
```bash
./scripts/claude-create-pr.sh dev-a feat "add user authentication"
```

**Option B: Manual process:**
```bash
# 1. Create and switch to branch
git checkout -b work/dev-a-feature-name

# 2. Make changes and commit
git add .
git commit -m "[DEV_A] feat: description

Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. Push branch
git push -u origin work/dev-a-feature-name

# 4. Create PR
gh pr create --title "[DEV_A] feat: description" --body "$(cat <<'EOF'
## Summary
Brief description of changes

## Test plan
- [ ] Tests pass locally
- [ ] Verified functionality

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)" --base main
```

### 6. Reviewing and Merging PRs

**Either Claude can merge the other's PRs. Always review before merging.**

```bash
# 1. List PRs ready for review
gh pr list --label "tests-passing" --state open

# Or use the helper script:
./scripts/claude-review-prs.sh

# 2. ALWAYS review the diff before merging
gh pr diff 123

# 3. Check CI status
gh pr checks 123

# 4. Run pre-merge validation
./scripts/claude-merge-check.sh 123

# 5. If everything looks good, merge
gh pr merge 123 --squash --delete-branch
```

**IMPORTANT: Never use `--auto` merge. Always review diffs manually.**

### 7. Merge Decision Tree

```
1. gh pr list --label "tests-passing" --state open
   └─ Find PRs ready to review

2. gh pr diff 123
   └─ ALWAYS review the changes first

3. gh pr checks 123
   └─ All tests pass? → Continue
   └─ Tests failing? → WAIT (do not merge)

4. gh pr view 123 --json mergeable
   └─ No conflicts? → Continue
   └─ Has conflicts? → Help rebase, resolve conflicts

5. Review the changes:
   - Do the changes make sense?
   - Are there any bugs or issues?
   - Does this conflict with other open PRs?

6. Check for overlapping PRs
   └─ No overlap? → Safe to merge
   └─ Overlap detected? → Merge older PR first, rebase newer

7. Make merge decision
   └─ APPROVE: gh pr merge 123 --squash --delete-branch
   └─ REQUEST CHANGES: gh pr review 123 --request-changes --body "reason"
```

### 8. Conflict Resolution in PRs

| Scenario | Action |
|----------|--------|
| Changes in different sections | Keep both |
| Both add new code (functions, imports) | Keep both |
| Same lines, same intent | Accept main, re-apply changes |
| Logical conflict | Request human review |
| Prisma schema conflict | Accept main, add changes, run `prisma format` |
| package.json conflict | Accept both deps, run `npm install` |

**To rebase a PR with conflicts:**
```bash
git fetch origin main
git rebase origin/main
# Resolve conflicts in each file
git add <resolved-file>
git rebase --continue
git push --force-with-lease
```

### 9. Update Work Log on Completion

Update your entry in `.claude/worklog.md`:
```markdown
**Status:** COMPLETED
**PR:** #123
**Merged:** [commit hash]
```

---

## Conflict Prevention Rules

### File Ownership (Soft Lock)

When actively editing a file, note it in the worklog. The other Claude should:
1. Check if the file is being edited
2. If yes, work on something else OR coordinate
3. If urgent, make minimal surgical changes only

### High-Conflict Zones

These files are frequently edited - extra caution required:
- `prisma/schema.prisma` - Database schema changes
- `src/app/api/*` - API routes
- `src/lib/auth.ts` - Authentication logic
- `tailwind.config.ts` - Styling configuration

**Protocol for high-conflict files:**
1. Always pull immediately before editing
2. Make atomic, focused changes
3. Commit and push immediately after
4. Note in worklog with **[HIGH-CONFLICT]** tag

### Merge Conflict Resolution

**CRITICAL: This is how conflicts are resolved when two Claudes push conflicting code.**

When `git push` is rejected:
```bash
git pull origin main --rebase
```

If conflicts occur during rebase/merge:

1. **Identify conflicting files:**
   ```bash
   git status
   ```

2. **For each conflicting file, read the full file and conflict markers:**
   ```
   <<<<<<< HEAD
   [Your changes]
   =======
   [Other Claude's changes]
   >>>>>>> origin/main
   ```

3. **Resolution strategy (in order of preference):**

   a. **Both changes are additive/independent** → Keep both
      - If changes are in different parts of the file, include all changes
      - Example: Both added different functions → keep all functions

   b. **Changes overlap but complement** → Merge intelligently
      - Combine the logic from both changes
      - Example: Both added different fields to same object → include all fields

   c. **Changes conflict logically** → Preserve the more complete version
      - Keep the version with more functionality
      - Add a TODO comment: `// TODO: Verify merge - kept [X], overwrote [Y]`
      - Log in worklog for human review

   d. **Cannot determine safely** → Keep incoming and re-apply yours
      ```bash
      git checkout --theirs <file>
      ```
      - Then manually re-add your specific changes
      - This is safest as it preserves the other Claude's complete work

4. **After resolving each file:**
   ```bash
   git add <resolved-file>
   ```

5. **Complete the rebase:**
   ```bash
   git rebase --continue
   ```

6. **Document in worklog:**
   ```markdown
   ## CONFLICT RESOLVED - [TIMESTAMP] - [DEV_ID]
   **Files:** [list of conflicted files]
   **Resolution:** [brief description of what was kept/merged]
   **Needs Human Review:** [yes/no - yes if logic was overwritten]
   ```

7. **Push immediately:**
   ```bash
   git push origin main
   ```

---

## File Locking System

To prevent conflicts on critical files, use explicit locks in the worklog:

```markdown
## LOCK - [TIMESTAMP] - [DEV_ID]
**File:** prisma/schema.prisma
**Reason:** Adding new model
**Expected Duration:** This session
```

**Rules:**
- Check for locks before editing any file
- If a file is locked, DO NOT edit it
- Release locks when done: change `LOCK` to `UNLOCKED`
- Locks expire after 2 hours if not released (assume stale)

---

## Code Standards

### TypeScript
- Use strict types, avoid `any`
- Define interfaces in `src/types/`

### Components
- Functional components with hooks
- Props interface defined above component
- Use Tailwind for styling

### API Routes
- Use Next.js App Router conventions (`route.ts`)
- Return proper HTTP status codes
- Handle errors gracefully

### Database
- Use Prisma for all database operations
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` to sync schema to database

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma studio        # Open database GUI

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run test:all         # Run all tests
npm run lint             # Run linter

# PR Workflow (Primary)
./scripts/claude-create-pr.sh dev-a feat "description"  # Create PR
./scripts/claude-review-prs.sh                          # Review all open PRs
./scripts/claude-merge-check.sh 123                     # Pre-merge validation

# PR Commands (gh CLI)
gh pr list --state open                    # List open PRs
gh pr diff 123                             # View PR diff (ALWAYS do before merge)
gh pr checks 123                           # Check CI status
gh pr view 123 --json mergeable            # Check for conflicts
gh pr merge 123 --squash --delete-branch   # Merge after review
gh pr review 123 --request-changes --body "reason"  # Request changes

# Git Workflow (for branches)
git checkout -b work/dev-a-feature         # Create feature branch
git push -u origin work/dev-a-feature      # Push branch
git fetch origin main && git rebase origin/main  # Rebase on main
```

---

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NEXTAUTH_URL` - App URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` - Auth encryption key
- `GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth
- `CLOUDINARY_*` - Image upload configuration

---

## Communication Protocol

Since both Claudes cannot directly communicate, use these methods:

### 1. Worklog Messages
Add messages in `.claude/worklog.md`:
```markdown
## MESSAGE for DEV_B
[Your message here]
```

### 2. Code Comments
For in-progress work that needs attention:
```typescript
// TODO(DEV_A): Explain what needs to be done
// FIXME(DEV_B): Describe the issue
// NOTE(DEV_A): Important context for other developer
```

### 3. Git Commit Messages
Use detailed commit messages to communicate changes.

---

## Quick Start Checklist

When starting a session:
- [ ] `git fetch origin && git checkout main && git pull`
- [ ] Read `.claude/worklog.md`
- [ ] Run `./scripts/claude-review-prs.sh` to check for PRs to review
- [ ] Check for any TODO/FIXME comments from other dev
- [ ] Claim your task in worklog
- [ ] Create feature branch: `git checkout -b work/dev-X-description`

When ending a session:
- [ ] Commit all changes to your feature branch
- [ ] Create PR: `./scripts/claude-create-pr.sh dev-X type "description"`
- [ ] Update worklog status and add PR number
- [ ] Check if any other PRs are ready to merge
- [ ] Add any notes for the other dev

Review workflow for other's PRs:
- [ ] Run `./scripts/claude-review-prs.sh --ready-only`
- [ ] For each ready PR: `gh pr diff <number>` - review the changes
- [ ] Run `./scripts/claude-merge-check.sh <number>`
- [ ] If approved: `gh pr merge <number> --squash --delete-branch`
