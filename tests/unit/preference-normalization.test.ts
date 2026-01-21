import { describe, it, expect } from 'vitest'
import { normalizeSameAsMinePreferences } from '@/lib/preferenceNormalization'

describe('normalizeSameAsMinePreferences', () => {
  it('replaces single-value same_as_mine with profile values', () => {
    const input = {
      prefGrewUpIn: 'same_as_mine',
      grewUpIn: 'USA',
    }

    const normalized = normalizeSameAsMinePreferences(input)

    expect(normalized.prefGrewUpIn).toBe('USA')
  })

  it('uses fallback country when grew-up-in is missing', () => {
    const input = {
      prefGrewUpIn: 'same_as_mine',
      grewUpIn: '',
      country: 'India',
    }

    const normalized = normalizeSameAsMinePreferences(input)

    expect(normalized.prefGrewUpIn).toBe('India')
  })

  it('replaces same_as_mine in list fields', () => {
    const input = {
      prefMotherTongueList: 'same_as_mine, Hindi',
      motherTongue: 'Telugu',
    }

    const normalized = normalizeSameAsMinePreferences(input)

    expect(normalized.prefMotherTongueList).toBe('Hindi, Telugu')
  })

  it('clears same_as_mine when no source value exists', () => {
    const input = {
      prefHobbies: 'same_as_mine',
      hobbies: '',
    }

    const normalized = normalizeSameAsMinePreferences(input)

    expect(normalized.prefHobbies).toBe('')
  })
})
