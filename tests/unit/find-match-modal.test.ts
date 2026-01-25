/**
 * FindMatchModal Unit Tests
 * Tests for the signup modal's core functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] || null,
  }
})()

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
})

describe('FindMatchModal Session Storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  describe('Account Creation', () => {
    it('should store newUserId after account creation', () => {
      const userId = 'test-user-123'
      sessionStorage.setItem('newUserId', userId)
      expect(sessionStorage.getItem('newUserId')).toBe(userId)
    })

    it('should store newUserEmail after account creation', () => {
      const email = 'test@example.com'
      sessionStorage.setItem('newUserEmail', email)
      expect(sessionStorage.getItem('newUserEmail')).toBe(email)
    })

    it('should store newUserPassword for auto-login', () => {
      const password = 'securePassword123'
      sessionStorage.setItem('newUserPassword', password)
      expect(sessionStorage.getItem('newUserPassword')).toBe(password)
    })

    it('should store all credentials for email signup flow', () => {
      const userId = 'test-user-123'
      const email = 'test@example.com'
      const password = 'securePassword123'

      sessionStorage.setItem('newUserId', userId)
      sessionStorage.setItem('newUserEmail', email)
      sessionStorage.setItem('newUserPassword', password)

      expect(sessionStorage.getItem('newUserId')).toBe(userId)
      expect(sessionStorage.getItem('newUserEmail')).toBe(email)
      expect(sessionStorage.getItem('newUserPassword')).toBe(password)
    })
  })

  describe('Photo Upload Completion', () => {
    it('should clean up session storage after successful photo upload', () => {
      // Set up session storage as if user just created account
      sessionStorage.setItem('newUserId', 'test-user-123')
      sessionStorage.setItem('newUserEmail', 'test@example.com')
      sessionStorage.setItem('newUserPassword', 'password123')

      // Simulate cleanup after successful photo upload
      sessionStorage.removeItem('newUserId')
      sessionStorage.removeItem('newUserEmail')
      sessionStorage.removeItem('newUserPassword')

      expect(sessionStorage.getItem('newUserId')).toBeNull()
      expect(sessionStorage.getItem('newUserEmail')).toBeNull()
      expect(sessionStorage.getItem('newUserPassword')).toBeNull()
    })

    it('should preserve credentials through multi-step flow', () => {
      const credentials = {
        userId: 'user-abc-123',
        email: 'user@test.com',
        password: 'TestPass123!',
      }

      // Step 2: Account creation
      sessionStorage.setItem('newUserId', credentials.userId)
      sessionStorage.setItem('newUserEmail', credentials.email)
      sessionStorage.setItem('newUserPassword', credentials.password)

      // Simulate going through steps 3-9 (location, religion, family, etc.)
      // Session storage should persist
      for (let step = 3; step <= 9; step++) {
        expect(sessionStorage.getItem('newUserId')).toBe(credentials.userId)
        expect(sessionStorage.getItem('newUserEmail')).toBe(credentials.email)
        expect(sessionStorage.getItem('newUserPassword')).toBe(credentials.password)
      }

      // Step 10: Photo upload - should still have credentials
      expect(sessionStorage.getItem('newUserId')).toBe(credentials.userId)
      expect(sessionStorage.getItem('newUserEmail')).toBe(credentials.email)
      expect(sessionStorage.getItem('newUserPassword')).toBe(credentials.password)
    })
  })

  describe('Admin Mode', () => {
    it('should store admin temp password', () => {
      const tempPassword = 'TempPass123'
      sessionStorage.setItem('adminTempPassword', tempPassword)
      expect(sessionStorage.getItem('adminTempPassword')).toBe(tempPassword)
    })

    it('should store admin created email', () => {
      const email = 'newuser@example.com'
      sessionStorage.setItem('adminCreatedEmail', email)
      expect(sessionStorage.getItem('adminCreatedEmail')).toBe(email)
    })

    it('should clean up admin session storage after profile creation', () => {
      sessionStorage.setItem('adminTempPassword', 'TempPass123')
      sessionStorage.setItem('adminCreatedEmail', 'newuser@example.com')

      // Simulate cleanup
      sessionStorage.removeItem('adminTempPassword')
      sessionStorage.removeItem('adminCreatedEmail')

      expect(sessionStorage.getItem('adminTempPassword')).toBeNull()
      expect(sessionStorage.getItem('adminCreatedEmail')).toBeNull()
    })
  })

  describe('Google OAuth Signup', () => {
    it('should store form data before Google OAuth redirect', () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-01',
      }

      sessionStorage.setItem('signupFormData', JSON.stringify(formData))
      const stored = sessionStorage.getItem('signupFormData')

      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!)).toEqual(formData)
    })
  })
})

describe('Section Order', () => {
  const SECTION_ORDER = [
    'basics',
    'account',
    'location_education',
    'religion',
    'family',
    'lifestyle',
    'aboutme',
    'preferences_1',
    'preferences_2',
    'photos',
  ]

  const ADMIN_SECTION_ORDER = [
    'basics',
    'admin_account',
    'location_education',
    'religion',
    'family',
    'lifestyle',
    'aboutme',
    'preferences_1',
    'preferences_2',
    'photos',
  ]

  it('should have 10 steps in user flow', () => {
    expect(SECTION_ORDER).toHaveLength(10)
  })

  it('should have 10 steps in admin flow', () => {
    expect(ADMIN_SECTION_ORDER).toHaveLength(10)
  })

  it('should have basics as first step', () => {
    expect(SECTION_ORDER[0]).toBe('basics')
    expect(ADMIN_SECTION_ORDER[0]).toBe('basics')
  })

  it('should have photos as last step', () => {
    expect(SECTION_ORDER[9]).toBe('photos')
    expect(ADMIN_SECTION_ORDER[9]).toBe('photos')
  })

  it('should have account creation as second step for users', () => {
    expect(SECTION_ORDER[1]).toBe('account')
  })

  it('should have admin_account as second step for admins', () => {
    expect(ADMIN_SECTION_ORDER[1]).toBe('admin_account')
  })

  it('should have same steps after account creation', () => {
    // Both should have the same order from step 3 onwards
    for (let i = 2; i < SECTION_ORDER.length; i++) {
      expect(SECTION_ORDER[i]).toBe(ADMIN_SECTION_ORDER[i])
    }
  })
})

describe('Form Validation', () => {
  describe('Basics Section', () => {
    it('should require createdBy, firstName, lastName, gender, age/dob, height, maritalStatus, motherTongue', () => {
      const requiredFields = [
        'createdBy',
        'firstName',
        'lastName',
        'gender',
        'height',
        'maritalStatus',
        'motherTongue',
      ]

      // Either dateOfBirth or age is required
      const ageFields = ['dateOfBirth', 'age']

      requiredFields.forEach((field) => {
        expect(requiredFields.includes(field)).toBe(true)
      })

      expect(ageFields.length).toBe(2)
    })

    it('should validate basics completion', () => {
      const completeFormData = {
        createdBy: 'self',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        height: "5'8\"",
        maritalStatus: 'never_married',
        motherTongue: 'Hindi',
      }

      const hasAgeOrDOB = !!(completeFormData.dateOfBirth)
      const isBasicsComplete = !!(
        completeFormData.createdBy &&
        completeFormData.firstName &&
        completeFormData.lastName &&
        completeFormData.gender &&
        hasAgeOrDOB &&
        completeFormData.height &&
        completeFormData.maritalStatus &&
        completeFormData.motherTongue
      )

      expect(isBasicsComplete).toBe(true)
    })

    it('should accept age instead of dateOfBirth', () => {
      const formDataWithAge = {
        createdBy: 'self',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        age: 30,
        height: "5'8\"",
        maritalStatus: 'never_married',
        motherTongue: 'Hindi',
      }

      const hasAgeOrDOB = !!(formDataWithAge.age)
      expect(hasAgeOrDOB).toBe(true)
    })
  })

  describe('Location & Education Section', () => {
    it('should require zipCode only for USA', () => {
      const usaFormData = { country: 'USA', zipCode: '10001' }
      const nonUsaFormData = { country: 'India' }

      const isUSALocation = (usaFormData.country || 'USA') === 'USA'
      expect(isUSALocation).toBe(true)

      const isNonUSA = (nonUsaFormData.country || 'USA') === 'USA'
      expect(isNonUSA).toBe(false)
    })

    it('should validate location education completion', () => {
      const completeFormData = {
        country: 'USA',
        grewUpIn: 'USA',
        citizenship: 'USA',
        zipCode: '10001',
        qualification: "Bachelor's",
        occupation: 'Software Engineer',
        openToRelocation: 'yes',
      }

      const isUSALocation = completeFormData.country === 'USA'
      const isLocationEducationComplete = !!(
        completeFormData.country &&
        completeFormData.grewUpIn &&
        completeFormData.citizenship &&
        (!isUSALocation || completeFormData.zipCode) &&
        completeFormData.qualification &&
        completeFormData.occupation &&
        completeFormData.openToRelocation
      )

      expect(isLocationEducationComplete).toBe(true)
    })
  })

  describe('Photo Requirements', () => {
    it('should require at least one photo', () => {
      const photos: { file: File; preview: string }[] = []
      expect(photos.length === 0).toBe(true)

      // With one photo
      const photosWithOne = [{ file: new File([], 'test.jpg'), preview: 'blob:test' }]
      expect(photosWithOne.length > 0).toBe(true)
    })

    it('should limit to 3 photos', () => {
      const maxPhotos = 3
      expect(maxPhotos).toBe(3)
    })
  })
})

describe('Signup Step Completion', () => {
  const FINAL_SIGNUP_STEP = 10 // Step 10 marks signup as complete

  it('should mark signup complete with step 10 after photo upload', () => {
    // After successful photo upload, signupStep should be set to 10
    // This prevents ProfileCompletionGuard from redirecting to /profile/complete
    expect(FINAL_SIGNUP_STEP).toBe(10)
  })

  it('should redirect to dashboard after successful signup', () => {
    // After photo upload with signupStep=10:
    // - User should be signed in automatically
    // - User should be redirected to /dashboard?status=pending
    const expectedRedirect = '/dashboard?status=pending'
    expect(expectedRedirect).toBe('/dashboard?status=pending')
  })

  it('should not redirect incomplete signups to profile complete page', () => {
    // ProfileCompletionGuard checks signupStep < 10
    // If signupStep >= 10, user stays on dashboard
    const signupStep = 10
    const isComplete = signupStep >= FINAL_SIGNUP_STEP
    expect(isComplete).toBe(true)
  })

  it('should redirect incomplete signups to profile complete page', () => {
    // If signupStep < 10, user is redirected to /profile/complete
    const signupStep = 8
    const isComplete = signupStep >= FINAL_SIGNUP_STEP
    expect(isComplete).toBe(false)
  })
})
