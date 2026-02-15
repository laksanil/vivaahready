import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = process.cwd()
const adminApiRoot = path.join(repoRoot, 'src/app/api/admin')
const adminPageRoot = path.join(repoRoot, 'src/app/admin')

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

describe('admin route/page guard coverage', () => {
  it('all API routes under /api/admin (except login/logout) include an admin gate', () => {
    const routeFiles = walkFiles(adminApiRoot).filter((file) => file.endsWith('/route.ts'))
    const ungated: string[] = []

    for (const file of routeFiles) {
      const rel = path.relative(adminApiRoot, file).replace(/\\/g, '/')
      if (rel === 'login/route.ts' || rel === 'logout/route.ts') {
        continue
      }

      const source = fs.readFileSync(file, 'utf8')
      const hasCookieGate = source.includes('isAdminAuthenticated')
      const hasSessionAdminGate =
        source.includes("session?.user?.email !== 'admin@vivaahready.com'") ||
        source.includes('session?.user?.email !== \"admin@vivaahready.com\"') ||
        source.includes('await isAdmin(session)')

      if (!hasCookieGate && !hasSessionAdminGate) {
        ungated.push(rel)
      }
    }

    expect(ungated).toEqual([])
  })

  it('admin pages are protected by the shared admin layout auth check', () => {
    const layoutPath = path.join(adminPageRoot, 'layout.tsx')
    const layoutSource = fs.readFileSync(layoutPath, 'utf8')

    expect(layoutSource).toContain("fetch('/api/admin/check')")
    expect(layoutSource).toContain("router.push('/admin/login')")

    const pageFiles = walkFiles(adminPageRoot)
      .filter((file) => file.endsWith('/page.tsx'))
      .map((file) => path.relative(adminPageRoot, file).replace(/\\/g, '/'))

    // Confirm route surface is non-trivial and covered by one layout.
    expect(pageFiles.length).toBeGreaterThan(3)
    expect(fs.existsSync(layoutPath)).toBe(true)
  })
})
