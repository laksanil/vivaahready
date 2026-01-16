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

### 4. Branching Strategy

**For small changes (< 3 files):**
- Work directly on `main`
- Sync frequently (pull before commit, push after commit)

**For larger features:**
- Create a feature branch: `git checkout -b feature/[name]-[dev_id]`
- Example: `feature/profile-filters-dev_a`
- Merge via PR or direct merge after completion

### 5. Commit Protocol

**Before committing:**
```bash
git pull origin main --rebase
```

**Commit message format:**
```
[DEV_A/DEV_B] type: brief description

- Detail 1
- Detail 2

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

**After committing:**
```bash
git push origin main
```

### 6. Update Work Log on Completion

Update your entry in `.claude/worklog.md`:
```markdown
**Status:** COMPLETED
**Commit:** [commit hash]
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
npm run test             # Run tests
npm run lint             # Run linter

# Git workflow
git pull origin main     # Sync before work
git add .
git commit -m "message"
git push origin main     # Push after commit
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
- [ ] `git pull origin main`
- [ ] Read `.claude/worklog.md`
- [ ] Check for any TODO/FIXME comments from other dev
- [ ] Claim your task in worklog
- [ ] Start working

When ending a session:
- [ ] Commit all changes
- [ ] Push to origin
- [ ] Update worklog status to COMPLETED
- [ ] Add any notes for the other dev
