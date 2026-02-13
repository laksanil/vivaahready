'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Loader2 } from 'lucide-react'
import {
  BasicsSection,
  LocationSection,
  EducationSection,
  ReligionSection,
  FamilySection,
  LifestyleSection,
  AboutMeSection,
  PreferencesPage1Section,
  PreferencesPage2Section,
  ContactSection,
} from './ProfileFormSections'
import {
  validateLocationEducationStep,
  validatePartnerPreferencesMustHaves,
} from '@/lib/profileFlowValidation'

// Placeholder phrases that shouldn't be accepted
const INVALID_ABOUTME_PHRASES = [
  'will fill in later',
  'will fill later',
  'fill in later',
  'fill later',
  'tbd',
  'to be done',
  'coming soon',
  'will update',
  'will add later',
  'n/a',
  'na',
  'none',
  'nothing',
  'test',
  'testing',
  'asdf',
  'abc',
  '...',
  '---',
]

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  section: string
  profile: Record<string, unknown>
  onSave: () => void
  apiEndpoint?: string  // Optional: use admin API endpoint
  httpMethod?: 'PUT' | 'PATCH'  // Optional: HTTP method to use
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  section,
  profile,
  onSave,
  apiEndpoint = '/api/profile',
  httpMethod = 'PUT'
}: ProfileEditModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({ ...profile })
      setError('')
    }
  }, [isOpen, profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Validation for each section
  const validationErrors = useMemo(() => {
    const errors: string[] = []

    if (section === 'aboutme') {
      const aboutMe = (formData.aboutMe as string || '').trim().toLowerCase()
      const linkedinProfile = formData.linkedinProfile as string || ''
      const referralSource = formData.referralSource as string || ''

      // Check aboutMe
      if (!aboutMe) {
        errors.push('About Me is required')
      } else if (aboutMe.length < 50) {
        errors.push('About Me must be at least 50 characters')
      } else if (INVALID_ABOUTME_PHRASES.some(phrase => aboutMe === phrase || aboutMe.includes(phrase))) {
        errors.push('Please write a meaningful description about yourself')
      }

      // Check LinkedIn
      if (!linkedinProfile) {
        errors.push('LinkedIn profile is required')
      } else if (linkedinProfile !== 'no_linkedin') {
        const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/
        if (!linkedinRegex.test(linkedinProfile)) {
          errors.push('Please enter a valid LinkedIn profile URL or select "I don\'t have LinkedIn"')
        }
      }

      // Check referral source
      if (!referralSource) {
        errors.push('Referral source is required')
      }
    }

    if (section === 'preferences_1') {
      const preferenceValidation = validatePartnerPreferencesMustHaves(formData)
      errors.push(...preferenceValidation.errors)
    }

    if (section === 'location_education') {
      const locationEducationValidation = validateLocationEducationStep(formData)
      errors.push(...locationEducationValidation.errors)
    }

    return errors
  }, [section, formData])

  const isValid = validationErrors.length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      setError(validationErrors.join('. '))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(apiEndpoint, {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          _editSection: section,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Section titles matching the create profile flow (9 slides)
  const sectionTitles: Record<string, string> = {
    basics: 'Basic Info',
    contact: 'Contact Details',
    location_education: 'Education & Career',
    religion: 'Religion & Astro',
    family: 'Family Details',
    lifestyle: 'Lifestyle',
    aboutme: 'About Me',
    preferences_1: 'Partner Preferences',
    preferences_2: 'More Preferences',
  }

  const sectionProps = { formData, handleChange, setFormData }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Edit {sectionTitles[section] || section}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Sections matching the create profile flow */}
          {section === 'basics' && <BasicsSection {...sectionProps} />}
          {section === 'contact' && <ContactSection {...sectionProps} />}
          {section === 'location_education' && (
            <>
              <LocationSection {...sectionProps} />
              <div className="border-t pt-4 mt-4">
                <EducationSection {...sectionProps} />
              </div>
            </>
          )}
          {section === 'religion' && <ReligionSection {...sectionProps} />}
          {section === 'family' && <FamilySection {...sectionProps} />}
          {section === 'lifestyle' && <LifestyleSection {...sectionProps} />}
          {section === 'aboutme' && <AboutMeSection {...sectionProps} />}
          {section === 'preferences_1' && <PreferencesPage1Section {...sectionProps} />}
          {section === 'preferences_2' && <PreferencesPage2Section {...sectionProps} />}

          {/* Validation errors */}
          {!isValid && validationErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Please fix the following:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isValid && !loading
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
