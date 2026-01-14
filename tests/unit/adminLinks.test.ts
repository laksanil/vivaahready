import { describe, it, expect } from 'vitest'
import { adminViewLink, adminLinks } from '@/lib/adminLinks'

describe('adminViewLink', () => {
  it('should add viewAsUser parameter to simple path', () => {
    const result = adminViewLink('/feed', 'user123')
    expect(result).toBe('/feed?viewAsUser=user123')
  })

  it('should append viewAsUser parameter if path already has query params', () => {
    const result = adminViewLink('/feed?tab=matches', 'user123')
    expect(result).toBe('/feed?tab=matches&viewAsUser=user123')
  })

  it('should handle empty path', () => {
    const result = adminViewLink('', 'user123')
    expect(result).toBe('?viewAsUser=user123')
  })

  it('should handle path with special characters in userId', () => {
    const result = adminViewLink('/profile/abc', 'user-123-456')
    expect(result).toBe('/profile/abc?viewAsUser=user-123-456')
  })
})

describe('adminLinks', () => {
  describe('profile', () => {
    it('should generate correct profile link with viewAsUser', () => {
      const result = adminLinks.profile('profile123', 'user456')
      expect(result).toBe('/profile/profile123?viewAsUser=user456')
    })
  })

  describe('dashboard', () => {
    it('should generate correct dashboard link with viewAsUser', () => {
      const result = adminLinks.dashboard('user123')
      expect(result).toBe('/dashboard?viewAsUser=user123')
    })
  })

  describe('feed', () => {
    it('should generate correct feed link with viewAsUser', () => {
      const result = adminLinks.feed('user123')
      expect(result).toBe('/feed?viewAsUser=user123')
    })
  })

  describe('connections', () => {
    it('should generate correct connections link with viewAsUser', () => {
      const result = adminLinks.connections('user123')
      expect(result).toBe('/connections?viewAsUser=user123')
    })
  })

  describe('messages', () => {
    it('should generate correct messages link with viewAsUser', () => {
      const result = adminLinks.messages('user123')
      expect(result).toBe('/messages?viewAsUser=user123')
    })
  })

  describe('reconsider', () => {
    it('should generate correct reconsider link with viewAsUser', () => {
      const result = adminLinks.reconsider('user123')
      expect(result).toBe('/reconsider?viewAsUser=user123')
    })
  })
})

describe('admin impersonation integration', () => {
  it('all admin links should include viewAsUser parameter', () => {
    const userId = 'test-user-id'

    // All links must contain the viewAsUser parameter
    expect(adminLinks.profile('p1', userId)).toContain(`viewAsUser=${userId}`)
    expect(adminLinks.dashboard(userId)).toContain(`viewAsUser=${userId}`)
    expect(adminLinks.feed(userId)).toContain(`viewAsUser=${userId}`)
    expect(adminLinks.connections(userId)).toContain(`viewAsUser=${userId}`)
    expect(adminLinks.messages(userId)).toContain(`viewAsUser=${userId}`)
    expect(adminLinks.reconsider(userId)).toContain(`viewAsUser=${userId}`)
  })

  it('links should be valid URL paths', () => {
    const userId = 'user123'

    // All links should start with /
    expect(adminLinks.profile('p1', userId)).toMatch(/^\/profile\//)
    expect(adminLinks.dashboard(userId)).toMatch(/^\/dashboard/)
    expect(adminLinks.feed(userId)).toMatch(/^\/feed/)
    expect(adminLinks.connections(userId)).toMatch(/^\/connections/)
    expect(adminLinks.messages(userId)).toMatch(/^\/messages/)
    expect(adminLinks.reconsider(userId)).toMatch(/^\/reconsider/)
  })
})
