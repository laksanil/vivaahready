import { describe, expect, it } from 'vitest'

import { formatDisabilityDisplay } from '@/lib/profileDisplay'

describe('formatDisabilityDisplay', () => {
  it('returns the full label for known disability values', () => {
    expect(formatDisabilityDisplay('mobility')).toBe('Mobility/Physical disability')
    expect(formatDisabilityDisplay('chronic_illness')).toBe('Chronic illness')
  })

  it('normalizes none and empty values', () => {
    expect(formatDisabilityDisplay('none')).toBe('None')
    expect(formatDisabilityDisplay('')).toBeNull()
    expect(formatDisabilityDisplay(null)).toBeNull()
    expect(formatDisabilityDisplay(undefined)).toBeNull()
  })

  it('falls back to underscore replacement for unknown values', () => {
    expect(formatDisabilityDisplay('custom_value')).toBe('custom value')
  })
})
