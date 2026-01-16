'use client'

import { useState, useEffect } from 'react'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(apiEndpoint, {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    preferences_1: 'Must-Have Preferences (Deal-breakers)',
    preferences_2: 'Nice-to-Have Preferences (Optional)',
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
