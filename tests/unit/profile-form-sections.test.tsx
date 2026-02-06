import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useState } from 'react'
import {
  BasicsSection,
  LocationSection,
  EducationSection,
  LifestyleSection,
  AboutMeSection,
  PreferencesPage1Section,
  PreferencesPage2Section,
  ReferralSection,
  ContactSection,
} from '@/components/ProfileFormSections'

function renderSection(Section: any, initialData: Record<string, unknown> = {}) {
  function Wrapper() {
    const [formData, setFormData] = useState<Record<string, unknown>>(initialData)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    return (
      <Section
        formData={formData}
        handleChange={handleChange}
        setFormData={setFormData}
      />
    )
  }

  return render(<Wrapper />)
}

describe('Profile form sections', () => {
  it('renders basics section fields', () => {
    const { container } = renderSection(BasicsSection, {
      maritalStatus: 'never_married',
      anyDisability: 'none',
    })

    expect(container.querySelector('select[name="createdBy"]')).toBeTruthy()
    expect(container.querySelector('select[name="gender"]')).toBeTruthy()
    expect(container.querySelector('input[name="firstName"]')).toBeTruthy()
    expect(container.querySelector('input[name="lastName"]')).toBeTruthy()
    expect(container.querySelector('input[name="dateOfBirth"]')).toBeTruthy()
    expect(container.querySelector('select[name="height"]')).toBeTruthy()
    expect(container.querySelector('select[name="maritalStatus"]')).toBeTruthy()
    expect(container.querySelector('select[name="motherTongue"]')).toBeTruthy()
  })

  it('renders location and education fields', () => {
    let renderResult = renderSection(LocationSection, {
      country: 'USA',
      grewUpIn: 'USA',
      citizenship: 'USA',
    })
    expect(screen.getByText('Country')).toBeInTheDocument()
    expect(screen.getByText('Citizenship')).toBeInTheDocument()
    expect(screen.getByText('Grew Up In')).toBeInTheDocument()
    const locationSearchInputs = renderResult.container.querySelectorAll('input[placeholder="Type to search..."]')
    expect(locationSearchInputs.length).toBeGreaterThanOrEqual(3)
    expect(renderResult.container.querySelector('input[name="zipCode"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="state"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="openToRelocation"]')).toBeTruthy()
    cleanup()

    renderResult = renderSection(EducationSection, {})
    expect(renderResult.container.querySelector('select[name="qualification"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="occupation"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="annualIncome"]')).toBeTruthy()
    cleanup()
  })

  it('renders lifestyle fields and validates LinkedIn URL', () => {
    let renderResult = renderSection(LifestyleSection, {})
    expect(renderResult.container.querySelector('select[name="dietaryPreference"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="smoking"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="drinking"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="pets"]')).toBeTruthy()
    cleanup()

    renderResult = renderSection(AboutMeSection, {
      linkedinProfile: '',
    })
    const linkedinInput = renderResult.container.querySelector('input[name="linkedinProfile"]') as HTMLInputElement
    expect(linkedinInput).toBeTruthy()
    fireEvent.change(linkedinInput, { target: { name: 'linkedinProfile', value: 'linkedin.com/company/foo' } })
    fireEvent.blur(linkedinInput)
    expect(screen.getByText(/profile url/i)).toBeInTheDocument()
    cleanup()
  })

  it('renders referral and contact sections', () => {
    let renderResult = renderSection(ReferralSection, { referralSource: '' })
    const referralSelect = renderResult.container.querySelector('select[name="referralSource"]') as HTMLSelectElement
    expect(referralSelect).toBeTruthy()
    fireEvent.change(referralSelect, { target: { name: 'referralSource', value: 'other' } })
    expect(renderResult.container.querySelector('input[name="referralSourceOther"]')).toBeTruthy()
    cleanup()

    renderResult = renderSection(ContactSection, {})
    expect(renderResult.container.querySelector('input[name="email"]')).toBeTruthy()
    expect(renderResult.container.querySelector('input[name="phone"]')).toBeTruthy()
    cleanup()
  })

  it('renders preferences sections', () => {
    let renderResult = renderSection(PreferencesPage1Section, {})
    expect(renderResult.container.querySelector('select[name="prefAgeMin"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="prefAgeMax"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="prefHeightMin"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="prefHeightMax"]')).toBeTruthy()
    expect(screen.getByText('Marital Status')).toBeInTheDocument()
    expect(screen.getByText('Never Married')).toBeInTheDocument()
    cleanup()

    renderResult = renderSection(PreferencesPage2Section, {})
    expect(renderResult.container.querySelector('select[name="prefQualification"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="prefIncome"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="prefFamilyValues"]')).toBeTruthy()
    expect(renderResult.container.querySelector('select[name="prefFamilyLocationCountry"]')).toBeTruthy()
    // prefGrewUpIn is an input field with typeahead dropdown, not a select
    expect(screen.getByText('Grew Up In')).toBeInTheDocument()
    expect(renderResult.container.querySelector('select[name="prefRelocation"]')).toBeTruthy()
    expect(renderResult.container.querySelector('input[placeholder="Any citizenship"]')).toBeTruthy()
    expect(screen.getByText(/Mother Tongue/i)).toBeInTheDocument()
    cleanup()
  })
})
