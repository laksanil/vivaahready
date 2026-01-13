import { describe, it, expect } from 'vitest'

/**
 * Utility Function Tests
 * Tests for common utility patterns used throughout the app
 */

describe('Age Calculation', () => {
  const calculateAge = (dateOfBirth: string): number => {
    // Parse MM/DD/YYYY format
    const parts = dateOfBirth.split('/')
    if (parts.length !== 3) return 0

    const birthDate = new Date(
      parseInt(parts[2]), // year
      parseInt(parts[0]) - 1, // month (0-indexed)
      parseInt(parts[1]) // day
    )

    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  it('calculates age correctly', () => {
    const today = new Date()
    const year = today.getFullYear() - 30
    const age = calculateAge(`01/01/${year}`)
    expect(age).toBeGreaterThanOrEqual(29)
    expect(age).toBeLessThanOrEqual(30)
  })

  it('handles invalid date format', () => {
    expect(calculateAge('invalid')).toBe(0)
    expect(calculateAge('')).toBe(0)
  })
})

describe('Height Parsing', () => {
  const parseHeightToInches = (height: string): number => {
    const match = height.match(/(\d)'(\d{1,2})"?/)
    if (!match) return 0
    return parseInt(match[1]) * 12 + parseInt(match[2] || '0')
  }

  const formatHeight = (inches: number): string => {
    const feet = Math.floor(inches / 12)
    const remainingInches = inches % 12
    return `${feet}'${remainingInches}"`
  }

  it('parses height correctly', () => {
    expect(parseHeightToInches("5'8\"")).toBe(68)
    expect(parseHeightToInches("6'0\"")).toBe(72)
    expect(parseHeightToInches("5'11\"")).toBe(71)
  })

  it('formats height correctly', () => {
    expect(formatHeight(68)).toBe("5'8\"")
    expect(formatHeight(72)).toBe("6'0\"")
  })

  it('handles invalid height', () => {
    expect(parseHeightToInches('invalid')).toBe(0)
    expect(parseHeightToInches('')).toBe(0)
  })
})

describe('Name Formatting', () => {
  const formatName = (firstName: string, lastName: string): string => {
    const format = (name: string) =>
      name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase()

    return `${format(firstName)} ${format(lastName)}`
  }

  it('formats names correctly', () => {
    expect(formatName('john', 'DOE')).toBe('John Doe')
    expect(formatName('JANE', 'smith')).toBe('Jane Smith')
  })

  it('handles single names', () => {
    expect(formatName('alice', '')).toBe('Alice ')
  })
})

describe('Phone Number Formatting', () => {
  const formatPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    return phone
  }

  it('formats 10-digit phone numbers', () => {
    expect(formatPhone('1234567890')).toBe('(123) 456-7890')
  })

  it('formats 11-digit phone numbers with country code', () => {
    expect(formatPhone('11234567890')).toBe('+1 (123) 456-7890')
  })

  it('leaves invalid numbers unchanged', () => {
    expect(formatPhone('123')).toBe('123')
  })
})

describe('Comma Separated List Handling', () => {
  const parseCommaSeparated = (str: string): string[] => {
    return str.split(',').map(s => s.trim()).filter(s => s.length > 0)
  }

  const toCommaSeparated = (arr: string[]): string => {
    return arr.join(', ')
  }

  it('parses comma separated list', () => {
    expect(parseCommaSeparated('a, b, c')).toEqual(['a', 'b', 'c'])
    expect(parseCommaSeparated('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('handles empty values', () => {
    expect(parseCommaSeparated('')).toEqual([])
    expect(parseCommaSeparated('a,, b')).toEqual(['a', 'b'])
  })

  it('converts array to comma separated', () => {
    expect(toCommaSeparated(['a', 'b', 'c'])).toBe('a, b, c')
  })
})

describe('Status Formatting', () => {
  const formatStatus = (status: string): string => {
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  it('formats status correctly', () => {
    expect(formatStatus('never_married')).toBe('Never Married')
    expect(formatStatus('awaiting_divorce')).toBe('Awaiting Divorce')
    expect(formatStatus('approved')).toBe('Approved')
  })
})

describe('Match Percentage Calculation', () => {
  const calculateMatchPercentage = (score: number, maxScore: number): number => {
    if (maxScore === 0) return 0
    return Math.round((score / maxScore) * 100)
  }

  it('calculates percentage correctly', () => {
    expect(calculateMatchPercentage(80, 100)).toBe(80)
    expect(calculateMatchPercentage(45, 50)).toBe(90)
    expect(calculateMatchPercentage(0, 100)).toBe(0)
  })

  it('handles edge cases', () => {
    expect(calculateMatchPercentage(0, 0)).toBe(0)
    expect(calculateMatchPercentage(100, 100)).toBe(100)
  })
})

describe('Date Formatting', () => {
  const formatDateForDisplay = (dateStr: string): string => {
    try {
      // Handle MM/DD/YYYY format
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  it('formats MM/DD/YYYY to readable format', () => {
    const formatted = formatDateForDisplay('01/15/1990')
    expect(formatted).toContain('1990')
    expect(formatted).toContain('January')
  })

  it('returns original on invalid format', () => {
    expect(formatDateForDisplay('invalid')).toBe('invalid')
  })
})
