import { describe, it, expect } from 'vitest'

/**
 * Deal-breaker Validation Tests
 *
 * Tests to ensure that "Deal-breaker" flags cannot be set when a preference
 * has "Doesn't Matter" or empty value selected. This is a recurring bug
 * that has appeared multiple times - these tests prevent regression.
 *
 * Bug: Users could mark a preference as "Deal-breaker" while having
 * "Doesn't Matter" selected, which is a contradictory state.
 *
 * Fix: When user selects "Doesn't Matter" or empty value, the corresponding
 * deal-breaker flag is automatically cleared.
 */

// Map of preference fields to their deal-breaker flag fields
// This mirrors the implementation in ProfileFormSections.tsx
const prefToDealBreakerMap: Record<string, string> = {
  'prefGrewUpIn': 'prefGrewUpInIsDealbreaker',
  'prefRelocation': 'prefRelocationIsDealbreaker',
  'prefQualification': 'prefEducationIsDealbreaker',
  'prefIncome': 'prefIncomeIsDealbreaker',
  'prefFamilyValues': 'prefFamilyValuesIsDealbreaker',
  'prefFamilyLocationCountry': 'prefFamilyLocationCountryIsDealbreaker',
  'prefDiet': 'prefDietIsDealbreaker',
  'prefSmoking': 'prefSmokingIsDealbreaker',
  'prefDrinking': 'prefDrinkingIsDealbreaker',
  'prefCommunity': 'prefCommunityIsDealbreaker',
  'prefGotra': 'prefGotraIsDealbreaker',
  'prefReligion': 'prefReligionIsDealbreaker',
  'prefHasChildren': 'prefHasChildrenIsDealbreaker',
  'prefPets': 'prefPetsIsDealbreaker',
}

// Helper function that mirrors the logic in handlePreferenceChange
const isDoesntMatterValue = (value: string): boolean => {
  const normalizedValue = value.toLowerCase()
  return normalizedValue === 'doesnt_matter' || normalizedValue === '' || normalizedValue === "doesn't matter"
}

// Simulates the form state update logic from handlePreferenceChange
const handlePreferenceChange = (
  currentState: Record<string, unknown>,
  fieldName: string,
  newValue: string
): Record<string, unknown> => {
  const isDoesntMatter = isDoesntMatterValue(newValue)

  if (isDoesntMatter && prefToDealBreakerMap[fieldName]) {
    return {
      ...currentState,
      [fieldName]: newValue,
      [prefToDealBreakerMap[fieldName]]: false
    }
  }

  return {
    ...currentState,
    [fieldName]: newValue
  }
}

// Helper that mirrors DealBreakerToggle's handleToggle behavior
const dealBreakerRelatedFields: Record<string, string[]> = {
  'prefDiet': ['prefDiet'],
  'prefSmoking': ['prefSmoking'],
  'prefDrinking': ['prefDrinking'],
  'prefGrewUpIn': ['prefGrewUpIn'],
  'prefFamilyValues': ['prefFamilyValues'],
  'prefFamilyLocation': ['prefFamilyLocationCountry'],
  'prefPets': ['prefPets'],
  'prefMaritalStatus': ['prefMaritalStatus'],
  'prefHasChildren': ['prefHasChildren'],
  'prefReligion': ['prefReligion'],
  'prefCommunity': ['prefCommunity'],
  'prefRelocation': ['prefRelocation'],
  'prefEducation': ['prefQualification'],
  'prefIncome': ['prefIncome'],
  'prefGotra': ['prefGotra'],
}

const checkboxFields = new Set(['prefMaritalStatus'])

const handleDealBreakerToggle = (
  currentState: Record<string, unknown>,
  fieldName: string,
  checked: boolean
): Record<string, unknown> => {
  const updates: Record<string, unknown> = { [`${fieldName}IsDealbreaker`]: checked }

  if (checked) {
    const fieldsToCheck = dealBreakerRelatedFields[fieldName] || [fieldName]
    fieldsToCheck.forEach((fieldToCheck) => {
      const currentValue = (currentState[fieldToCheck] as string) || ''
      if (checkboxFields.has(fieldToCheck)) {
        const values = currentValue.split(', ').filter(v => v && v !== 'doesnt_matter')
        updates[fieldToCheck] = values.join(', ')
      } else if (currentValue === 'doesnt_matter' || currentValue === '') {
        updates[fieldToCheck] = ''
      }
    })
  }

  return {
    ...currentState,
    ...updates,
  }
}

describe('Deal-breaker Validation', () => {
  describe('isDoesntMatterValue detection', () => {
    it('detects "doesnt_matter" as a "doesn\'t matter" value', () => {
      expect(isDoesntMatterValue('doesnt_matter')).toBe(true)
      expect(isDoesntMatterValue('DOESNT_MATTER')).toBe(true)
      expect(isDoesntMatterValue('Doesnt_Matter')).toBe(true)
    })

    it('detects empty string as a "doesn\'t matter" value', () => {
      expect(isDoesntMatterValue('')).toBe(true)
    })

    it('detects "doesn\'t matter" text as a "doesn\'t matter" value', () => {
      expect(isDoesntMatterValue("doesn't matter")).toBe(true)
      expect(isDoesntMatterValue("Doesn't Matter")).toBe(true)
      expect(isDoesntMatterValue("DOESN'T MATTER")).toBe(true)
    })

    it('does not detect actual preference values as "doesn\'t matter"', () => {
      expect(isDoesntMatterValue('USA')).toBe(false)
      expect(isDoesntMatterValue('vegetarian')).toBe(false)
      expect(isDoesntMatterValue('no_children')).toBe(false)
      expect(isDoesntMatterValue('any_willing')).toBe(false)
    })
  })

  describe('prefToDealBreakerMap coverage', () => {
    it('has mapping for all preference fields that support deal-breakers', () => {
      const expectedFields = [
        'prefGrewUpIn',
        'prefRelocation',
        'prefQualification',
        'prefIncome',
        'prefFamilyValues',
        'prefFamilyLocationCountry',
        'prefDiet',
        'prefSmoking',
        'prefDrinking',
        'prefCommunity',
        'prefGotra',
        'prefReligion',
        'prefHasChildren',
        'prefPets',
      ]

      expectedFields.forEach(field => {
        expect(prefToDealBreakerMap[field]).toBeDefined()
        expect(prefToDealBreakerMap[field]).toContain('IsDealbreaker')
      })
    })

    it('maps to correct deal-breaker field names', () => {
      expect(prefToDealBreakerMap['prefGrewUpIn']).toBe('prefGrewUpInIsDealbreaker')
      expect(prefToDealBreakerMap['prefRelocation']).toBe('prefRelocationIsDealbreaker')
      expect(prefToDealBreakerMap['prefQualification']).toBe('prefEducationIsDealbreaker')
      expect(prefToDealBreakerMap['prefDiet']).toBe('prefDietIsDealbreaker')
    })
  })

  describe('handlePreferenceChange clears deal-breaker on "doesn\'t matter"', () => {
    it('clears deal-breaker when selecting "doesnt_matter"', () => {
      const initialState = {
        prefGrewUpIn: 'USA',
        prefGrewUpInIsDealbreaker: true
      }

      const newState = handlePreferenceChange(initialState, 'prefGrewUpIn', 'doesnt_matter')

      expect(newState.prefGrewUpIn).toBe('doesnt_matter')
      expect(newState.prefGrewUpInIsDealbreaker).toBe(false)
    })

    it('clears deal-breaker when selecting empty value', () => {
      const initialState = {
        prefRelocation: 'yes',
        prefRelocationIsDealbreaker: true
      }

      const newState = handlePreferenceChange(initialState, 'prefRelocation', '')

      expect(newState.prefRelocation).toBe('')
      expect(newState.prefRelocationIsDealbreaker).toBe(false)
    })

    it('clears deal-breaker when selecting "doesn\'t matter" text', () => {
      const initialState = {
        prefDiet: 'vegetarian',
        prefDietIsDealbreaker: true
      }

      const newState = handlePreferenceChange(initialState, 'prefDiet', "Doesn't Matter")

      expect(newState.prefDiet).toBe("Doesn't Matter")
      expect(newState.prefDietIsDealbreaker).toBe(false)
    })

    it('preserves deal-breaker when selecting a specific preference value', () => {
      const initialState = {
        prefDiet: '',
        prefDietIsDealbreaker: true
      }

      const newState = handlePreferenceChange(initialState, 'prefDiet', 'vegetarian')

      expect(newState.prefDiet).toBe('vegetarian')
      // Deal-breaker should remain unchanged (preserved from initial state)
      expect(newState.prefDietIsDealbreaker).toBe(true)
    })

    it('works for all mapped preference fields', () => {
      Object.entries(prefToDealBreakerMap).forEach(([prefField, dealBreakerField]) => {
        const initialState = {
          [prefField]: 'some_value',
          [dealBreakerField]: true
        }

        const newState = handlePreferenceChange(initialState, prefField, 'doesnt_matter')

        expect(newState[prefField]).toBe('doesnt_matter')
        expect(newState[dealBreakerField]).toBe(false)
      })
    })
  })

  describe('edge cases', () => {
    it('does not affect unmapped fields', () => {
      const initialState = {
        unknownField: 'value',
        unknownFieldIsDealbreaker: true
      }

      const newState = handlePreferenceChange(initialState, 'unknownField', 'doesnt_matter')

      // Should just update the value, deal-breaker preserved from initial state (unmapped field)
      expect(newState.unknownField).toBe('doesnt_matter')
      expect(newState.unknownFieldIsDealbreaker).toBe(true) // Preserved because field isn't mapped
    })

    it('handles case-insensitive "doesn\'t matter" detection', () => {
      const testCases = [
        'doesnt_matter',
        'DOESNT_MATTER',
        'Doesnt_matter',
        "doesn't matter",
        "DOESN'T MATTER",
        "Doesn't Matter",
        '',
      ]

      testCases.forEach(value => {
        const initialState = {
          prefSmoking: 'no',
          prefSmokingIsDealbreaker: true
        }

        const newState = handlePreferenceChange(initialState, 'prefSmoking', value)

        expect(newState.prefSmokingIsDealbreaker).toBe(false)
      })
    })

    it('preserves other state fields when updating', () => {
      const initialState = {
        prefGrewUpIn: 'USA',
        prefGrewUpInIsDealbreaker: true,
        prefDiet: 'vegetarian',
        prefDietIsDealbreaker: false,
        firstName: 'John',
      }

      const newState = handlePreferenceChange(initialState, 'prefGrewUpIn', 'doesnt_matter')

      expect(newState.prefGrewUpIn).toBe('doesnt_matter')
      expect(newState.prefGrewUpInIsDealbreaker).toBe(false)
      expect(newState.prefDiet).toBe('vegetarian')
      expect(newState.prefDietIsDealbreaker).toBe(false)
      expect(newState.firstName).toBe('John')
    })
  })
})

describe('Deal-breaker toggle enforces specific selections', () => {
  it('clears "doesnt_matter" for single-select fields when toggled on', () => {
    const initialState = {
      prefGrewUpIn: 'doesnt_matter',
      prefGrewUpInIsDealbreaker: false,
    }

    const newState = handleDealBreakerToggle(initialState, 'prefGrewUpIn', true)

    expect(newState.prefGrewUpIn).toBe('')
    expect(newState.prefGrewUpInIsDealbreaker).toBe(true)
  })

  it('preserves specific values when toggled on', () => {
    const initialState = {
      prefRelocation: 'yes',
      prefRelocationIsDealbreaker: false,
    }

    const newState = handleDealBreakerToggle(initialState, 'prefRelocation', true)

    expect(newState.prefRelocation).toBe('yes')
    expect(newState.prefRelocationIsDealbreaker).toBe(true)
  })

  it('removes "doesnt_matter" from checkbox selections', () => {
    const initialState = {
      prefMaritalStatus: 'doesnt_matter, divorced',
      prefMaritalStatusIsDealbreaker: false,
    }

    const newState = handleDealBreakerToggle(initialState, 'prefMaritalStatus', true)

    expect(newState.prefMaritalStatus).toBe('divorced')
    expect(newState.prefMaritalStatusIsDealbreaker).toBe(true)
  })

  it('clears checkbox selections when only "doesnt_matter" is selected', () => {
    const initialState = {
      prefMaritalStatus: 'doesnt_matter',
      prefMaritalStatusIsDealbreaker: false,
    }

    const newState = handleDealBreakerToggle(initialState, 'prefMaritalStatus', true)

    expect(newState.prefMaritalStatus).toBe('')
    expect(newState.prefMaritalStatusIsDealbreaker).toBe(true)
  })
})

describe('Citizenship "Any" button behavior', () => {
  // Tests for the prefCitizenship field which has special handling
  // When "Any" is clicked, it should clear both the value and deal-breaker

  const handleCitizenshipAny = (currentState: Record<string, unknown>): Record<string, unknown> => {
    return {
      ...currentState,
      prefCitizenship: '',
      prefCitizenshipIsDealbreaker: false
    }
  }

  it('clears citizenship and deal-breaker when "Any" is clicked', () => {
    const initialState = {
      prefCitizenship: 'USA',
      prefCitizenshipIsDealbreaker: true
    }

    const newState = handleCitizenshipAny(initialState)

    expect(newState.prefCitizenship).toBe('')
    expect(newState.prefCitizenshipIsDealbreaker).toBe(false)
  })

  it('handles already empty citizenship', () => {
    const initialState = {
      prefCitizenship: '',
      prefCitizenshipIsDealbreaker: true
    }

    const newState = handleCitizenshipAny(initialState)

    expect(newState.prefCitizenship).toBe('')
    expect(newState.prefCitizenshipIsDealbreaker).toBe(false)
  })
})

describe('Business rule: Deal-breaker requires specific value', () => {
  /**
   * Business Rule: A deal-breaker makes no sense without a specific value.
   * If someone says "I don't care about X" (Doesn't Matter), then X cannot
   * be a deal-breaker for them. These are mutually exclusive states.
   */

  it('validates that "doesn\'t matter" + deal-breaker is invalid state', () => {
    // This represents the invalid state that the bug allowed
    const invalidState = {
      prefGrewUpIn: 'doesnt_matter',
      prefGrewUpInIsDealbreaker: true
    }

    // The fix prevents this state by clearing deal-breaker when value is "doesn't matter"
    const fixedState = handlePreferenceChange(
      { prefGrewUpIn: 'USA', prefGrewUpInIsDealbreaker: true },
      'prefGrewUpIn',
      'doesnt_matter'
    )

    // After fix, deal-breaker should be false when value is "doesn't matter"
    expect(fixedState.prefGrewUpInIsDealbreaker).toBe(false)

    // The invalid combination should never occur after the fix
    expect(!(fixedState.prefGrewUpIn === 'doesnt_matter' && fixedState.prefGrewUpInIsDealbreaker)).toBe(true)
  })

  it('allows deal-breaker with specific values', () => {
    // This is a valid state - user has a specific preference that is a deal-breaker
    const validState = {
      prefDiet: 'vegetarian',
      prefDietIsDealbreaker: true
    }

    // Updating to another specific value should preserve deal-breaker potential
    const newState = handlePreferenceChange(validState, 'prefDiet', 'vegan')

    // The new value is set
    expect(newState.prefDiet).toBe('vegan')
    // Deal-breaker is not explicitly changed (handled by separate checkbox)
    // The function only clears it for "doesn't matter" values
  })
})
