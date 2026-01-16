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

If you encounter a merge conflict:
1. Read both versions carefully
2. Understand the intent of both changes
3. Merge intelligently (don't just pick one side)
4. Test after resolving
5. Document the resolution in commit message

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
