import { describe, expect, it } from 'vitest'
import { getPhoneLast4, maskPhone, normalizePhoneE164 } from '@/lib/phone'

describe('phone helpers', () => {
  it('normalizes US phone values to E.164', () => {
    expect(normalizePhoneE164('+1 (408) 555-1234')).toBe('+14085551234')
    expect(normalizePhoneE164('408-555-1234')).toBe('+14085551234')
    expect(normalizePhoneE164('14085551234')).toBe('+14085551234')
  })

  it('returns null for invalid values', () => {
    expect(normalizePhoneE164('12345')).toBeNull()
    expect(normalizePhoneE164('')).toBeNull()
    expect(normalizePhoneE164(null)).toBeNull()
  })

  it('masks phone numbers for admin table display', () => {
    expect(maskPhone('+14085551234')).toBe('+1******1234')
    expect(maskPhone('4085551234')).toBe('+1******1234')
  })

  it('extracts last4 correctly', () => {
    expect(getPhoneLast4('+14085551234')).toBe('1234')
    expect(getPhoneLast4('(408) 555-9876')).toBe('9876')
    expect(getPhoneLast4('123')).toBe('')
  })
})
