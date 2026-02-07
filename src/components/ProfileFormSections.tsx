'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, Shield, CheckCircle, ChevronDown } from 'lucide-react'
import { HEIGHT_OPTIONS, heightToInches, PREF_AGE_MIN_MAX, PREF_INCOME_OPTIONS, PREF_LOCATION_OPTIONS, QUALIFICATION_OPTIONS, PREF_EDUCATION_OPTIONS, OCCUPATION_OPTIONS, HOBBIES_OPTIONS, FITNESS_OPTIONS, INTERESTS_OPTIONS, US_UNIVERSITIES, US_VISA_STATUS_OPTIONS, COUNTRIES_LIST, RAASI_OPTIONS, NAKSHATRA_OPTIONS, DOSHAS_OPTIONS, PREF_SMOKING_OPTIONS, PREF_DRINKING_OPTIONS, PREF_MARITAL_STATUS_OPTIONS, PREF_RELOCATION_OPTIONS, PREF_MOTHER_TONGUE_OPTIONS, PREF_PETS_OPTIONS, PREF_COMMUNITY_OPTIONS, GOTRA_OPTIONS, RELOCATION_OPTIONS, DISABILITY_OPTIONS, FAMILY_LOCATION_COUNTRIES } from '@/lib/constants'
import { RELIGIONS, getCommunities, getSubCommunities, getAllCommunities } from '@/config/communities'

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'Washington DC'
]

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Punjabi', 'Bengali', 'Tulu', 'Urdu']

// Country codes for phone number with expected digit lengths
const PHONE_COUNTRY_CODES = [
  { code: '+1', country: 'USA', flag: '🇺🇸', digits: 10 },
  { code: '+1', country: 'Canada', flag: '🇨🇦', digits: 10 },
  { code: '+91', country: 'India', flag: '🇮🇳', digits: 10 },
  { code: '+44', country: 'UK', flag: '🇬🇧', digits: 10 },
  { code: '+61', country: 'Australia', flag: '🇦🇺', digits: 9 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', digits: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', digits: 8 },
  { code: '+49', country: 'Germany', flag: '🇩🇪', digits: 10 },
  { code: '+33', country: 'France', flag: '🇫🇷', digits: 9 },
  { code: '+81', country: 'Japan', flag: '🇯🇵', digits: 10 },
  { code: 'other', country: 'Other', flag: '🌍', digits: 0 }, // For countries not in list
]

// Validate phone number based on country
const validatePhoneNumber = (phone: string, country: typeof PHONE_COUNTRY_CODES[0], customCode?: string): { valid: boolean; message: string } => {
  const digitsOnly = phone.replace(/\D/g, '')

  if (!digitsOnly) {
    return { valid: false, message: 'Please enter your phone number' }
  }

  // For "Other" country, validate custom code and phone length
  if (country.code === 'other') {
    if (!customCode || !customCode.startsWith('+') || customCode.length < 2) {
      return { valid: false, message: 'Please enter a valid country code (e.g., +52)' }
    }
    if (digitsOnly.length < 6 || digitsOnly.length > 15) {
      return { valid: false, message: 'Phone number must be 6-15 digits' }
    }
    return { valid: true, message: '' }
  }

  if (digitsOnly.length !== country.digits) {
    return { valid: false, message: `${country.country} phone numbers must be ${country.digits} digits` }
  }

  return { valid: true, message: '' }
}

// Normalize marital status values - handles legacy data where 'Single' was used instead of 'never_married'
const normalizeMaritalStatus = (status: string | null | undefined): string => {
  if (!status) return 'never_married'
  const s = status.toLowerCase().trim()
  if (s === 'single' || s === 'unmarried' || s === 'bachelor' || s === 'spinster') {
    return 'never_married'
  }
  return status
}

// Check if marital status represents "never married" (handles legacy 'Single' values)
const isNeverMarried = (status: string | null | undefined): boolean => {
  if (!status) return true
  const s = status.toLowerCase().trim()
  return s === 'never_married' || s === 'single' || s === 'unmarried' || s === 'bachelor' || s === 'spinster'
}

// Helper to check if a value exists in dropdown options
const isValueInOptions = (value: string | null | undefined, options: Array<{ value: string; label: string }>): boolean => {
  if (!value) return true // Empty is always valid
  return options.some(opt => opt.value === value)
}

// Helper to get display label for a value (handles legacy values)
const getOptionLabel = (value: string | null | undefined, options: Array<{ value: string; label: string }>): string => {
  if (!value) return ''
  const option = options.find(opt => opt.value === value)
  return option ? option.label : value // Return raw value if not found
}

interface SectionProps {
  formData: Record<string, unknown>
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  hideNameFields?: boolean // Hide firstName/lastName when already collected in account step
  hidePhoneField?: boolean // Hide phone section when already collected in account step
}

export function BasicsSection({ formData, handleChange, setFormData, hideNameFields = false, hidePhoneField = false }: SectionProps) {
  const [dobError, setDobError] = useState('')
  const [ageError, setAgeError] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(PHONE_COUNTRY_CODES[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customCountryCode, setCustomCountryCode] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Parse existing phone number from formData on mount
  useEffect(() => {
    const existingPhone = formData.phone as string
    if (existingPhone) {
      // Try to match known country code (skip "other")
      const matched = PHONE_COUNTRY_CODES.find(c => c.code !== 'other' && existingPhone.startsWith(c.code))
      if (matched) {
        setSelectedCountry(matched)
        setPhoneNumber(existingPhone.substring(matched.code.length))
      } else if (existingPhone.startsWith('+')) {
        // Unknown country code - use "Other" option
        const otherCountry = PHONE_COUNTRY_CODES.find(c => c.code === 'other')!
        setSelectedCountry(otherCountry)
        // Extract country code (digits after + until we hit the phone number)
        const match = existingPhone.match(/^(\+\d{1,4})(\d+)$/)
        if (match) {
          setCustomCountryCode(match[1])
          setPhoneNumber(match[2])
        } else {
          setPhoneNumber(existingPhone)
        }
      } else {
        setPhoneNumber(existingPhone)
      }
    }
  }, []) // Only run once on mount

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get the effective country code (custom or from selected country)
  const getEffectiveCode = () => {
    return selectedCountry.code === 'other' ? customCountryCode : selectedCountry.code
  }

  // Update formData when phone changes
  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    setPhoneNumber(digitsOnly)
    setPhoneError('')

    // Store full phone number with country code in formData
    const code = getEffectiveCode()
    const fullPhone = digitsOnly && code ? `${code}${digitsOnly}` : ''
    setFormData(prev => ({ ...prev, phone: fullPhone }))
  }

  // Handle custom country code change
  const handleCustomCodeChange = (value: string) => {
    // Ensure it starts with + and only contains digits after
    let formatted = value
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted.replace(/[^0-9]/g, '')
    } else {
      formatted = '+' + formatted.substring(1).replace(/[^0-9]/g, '')
    }
    // Limit to 5 characters (+1234)
    formatted = formatted.substring(0, 5)
    setCustomCountryCode(formatted)
    setPhoneError('')

    // Update formData with new country code
    if (phoneNumber && formatted.length >= 2) {
      setFormData(prev => ({ ...prev, phone: `${formatted}${phoneNumber}` }))
    }
  }

  const handleCountrySelect = (country: typeof PHONE_COUNTRY_CODES[0]) => {
    setSelectedCountry(country)
    setShowCountryDropdown(false)
    setPhoneError('')

    // Update formData with new country code
    if (phoneNumber && country.code !== 'other') {
      setFormData(prev => ({ ...prev, phone: `${country.code}${phoneNumber}` }))
    } else if (phoneNumber && country.code === 'other' && customCountryCode) {
      setFormData(prev => ({ ...prev, phone: `${customCountryCode}${phoneNumber}` }))
    }
  }

  const handleLanguageCheckbox = (language: string, checked: boolean) => {
    const current = (formData.languagesKnown as string || '').split(', ').filter(l => l)
    if (checked) {
      setFormData(prev => ({ ...prev, languagesKnown: [...current, language].join(', ') }))
    } else {
      setFormData(prev => ({ ...prev, languagesKnown: current.filter(l => l !== language).join(', ') }))
    }
  }

  // Calculate age from date of birth
  const calculateAge = (dob: string): number | null => {
    if (dob.length !== 10) return null
    const [month, day, year] = dob.split('/').map(Number)
    if (!month || !day || !year) return null

    const birthDate = new Date(year, month - 1, day)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')

    // Format with slashes
    let formatted = ''
    if (digits.length > 0) {
      formatted = digits.substring(0, 2)
    }
    if (digits.length > 2) {
      formatted += '/' + digits.substring(2, 4)
    }
    if (digits.length > 4) {
      formatted += '/' + digits.substring(4, 8)
    }

    // Validate when complete date is entered
    if (formatted.length === 10) {
      const age = calculateAge(formatted)
      if (age === null) {
        setDobError('Invalid date')
      } else if (age < 18) {
        setDobError('Must be at least 18 years old')
      } else if (age > 99) {
        setDobError('Please enter a valid date of birth')
      } else {
        setDobError('')
        // Auto-fill age field
        setFormData(prev => ({ ...prev, dateOfBirth: formatted, age: age.toString() }))
        return
      }
    } else {
      setDobError('')
    }

    setFormData(prev => ({ ...prev, dateOfBirth: formatted }))
  }

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const age = parseInt(value, 10)

    if (value === '') {
      setAgeError('')
      setFormData(prev => ({ ...prev, age: '', dateOfBirth: '' }))
      return
    }

    if (isNaN(age)) {
      setAgeError('Please enter a valid number')
    } else if (age < 18) {
      setAgeError('Must be at least 18')
    } else if (age > 99) {
      setAgeError('Must be 99 or less')
    } else {
      setAgeError('')
    }

    // Clear DOB when age is entered manually
    setFormData(prev => ({ ...prev, age: value, dateOfBirth: '' }))
  }

  // Determine which field is "active" (has a value)
  const hasValidDob = (formData.dateOfBirth as string || '').length === 10
  const hasManualAge = !!(formData.age as string) && !(formData.dateOfBirth as string)

  return (
    <div className="space-y-6">
      {/* Profile & Personal Identity */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Personal Identity</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Created By <span className="text-red-500">*</span></label>
            <select name="createdBy" value={formData.createdBy as string || ''} onChange={handleChange} className="input-field" required>
              <option value="">Select</option>
              <option value="self">Self</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="relative">Relative</option>
              <option value="friend">Friend</option>
            </select>
          </div>
          <div>
            <label className="form-label">Gender <span className="text-red-500">*</span></label>
            <select name="gender" value={formData.gender as string || ''} onChange={handleChange} className="input-field" required>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          {!hideNameFields && (
            <div>
              <label className="form-label">First Name <span className="text-red-500">*</span></label>
              <input type="text" name="firstName" value={formData.firstName as string || ''} onChange={handleChange} className="input-field" placeholder="First name" required />
            </div>
          )}
          {!hideNameFields && (
            <div>
              <label className="form-label">Last Name <span className="text-red-500">*</span></label>
              <input type="text" name="lastName" value={formData.lastName as string || ''} onChange={handleChange} className="input-field" placeholder="Last name" required />
            </div>
          )}
        </div>
      </div>

      {/* Contact Number - hidden when phone already collected in account step */}
      {!hidePhoneField && (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Phone className="h-4 w-4 text-primary-500" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Contact Number <span className="text-red-500">*</span></h4>
            <p className="text-xs text-gray-500">Required for profile verification</p>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Your Number is Safe</p>
              <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  Never shared publicly — Only visible to matches you connect with
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  Used for verification only — We never spam or share with third parties
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Phone Input */}
        <div className="flex gap-2">
          {/* Country Code Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="h-10 px-3 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors min-w-[100px]"
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm text-gray-700">
                {selectedCountry.code === 'other' ? (customCountryCode || 'Code') : selectedCountry.code}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {showCountryDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {PHONE_COUNTRY_CODES.map((country, index) => (
                  <button
                    key={`${country.code}-${country.country}-${index}`}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 text-left ${country.code === 'other' ? 'border-t border-gray-100' : ''}`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm text-gray-700">{country.country}</span>
                    {country.code !== 'other' && (
                      <span className="text-sm text-gray-400 ml-auto">{country.code}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Country Code Input (when "Other" is selected) */}
          {selectedCountry.code === 'other' && (
            <input
              type="text"
              value={customCountryCode}
              onChange={(e) => handleCustomCodeChange(e.target.value)}
              placeholder="+XX"
              className="w-20 h-10 px-2 border border-gray-300 rounded-lg text-center text-sm"
              maxLength={5}
            />
          )}

          {/* Phone Number Input */}
          <div className="flex-1">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={selectedCountry.code === 'other' ? 'Phone number (6-15 digits)' : `${selectedCountry.digits}-digit number`}
              className={`input-field ${phoneError ? 'border-red-500' : ''}`}
              maxLength={selectedCountry.code === 'other' ? 15 : selectedCountry.digits + 2}
            />
          </div>
        </div>
        {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
        {selectedCountry.code === 'other' && (
          <p className="text-xs text-gray-500">Enter your country code (e.g., +52 for Mexico) and phone number</p>
        )}
      </div>
      )}

      {/* Age & Physical Attributes */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Age & Physical Details</h4>
        <p className="text-xs text-gray-500 -mt-2">Enter either Date of Birth OR Age (not both)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">
              Date of Birth {!hasManualAge && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="dateOfBirth"
              value={formData.dateOfBirth as string || ''}
              onChange={handleDateOfBirthChange}
              className={`input-field ${dobError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${hasManualAge ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="MM/DD/YYYY"
              maxLength={10}
              disabled={hasManualAge}
              required={!hasManualAge}
            />
            {dobError && <p className="text-red-500 text-xs mt-1">{dobError}</p>}
          </div>
          <div>
            <label className="form-label">
              Age {hasManualAge && <span className="text-red-500">*</span>}
              {!hasManualAge && !hasValidDob && <span className="text-gray-400 text-xs ml-1">(or enter age)</span>}
            </label>
            <input
              type="number"
              name="age"
              value={formData.age as string || ''}
              onChange={handleAgeChange}
              className={`input-field ${ageError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${hasValidDob ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder={hasValidDob ? 'Calculated from DOB' : 'Enter age'}
              min={18}
              max={99}
              disabled={hasValidDob}
            />
            {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
          </div>
          <div>
            <label className="form-label">Height <span className="text-red-500">*</span></label>
            <select name="height" value={formData.height as string || ''} onChange={handleChange} className="input-field" required>
              <option value="">Select</option>
              {/* Show legacy value as first option if it doesn't match standard options */}
              {(formData.height as string) && !isValueInOptions(formData.height as string, HEIGHT_OPTIONS) && (
                <option value={formData.height as string}>
                  {formData.height as string} (Current)
                </option>
              )}
              {HEIGHT_OPTIONS.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Marital Status */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Marital Status</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Marital Status <span className="text-red-500">*</span></label>
            <select name="maritalStatus" value={normalizeMaritalStatus(formData.maritalStatus as string)} onChange={handleChange} className="input-field">
              <option value="never_married">Never Married</option>
              <option value="divorced">Divorced</option>
              <option value="separated">Separated</option>
              <option value="widowed">Widowed</option>
              <option value="awaiting_divorce">Awaiting Divorce</option>
            </select>
          </div>
          {/* Show children question only if not never_married (handles legacy 'Single' values) */}
          {!isNeverMarried(formData.maritalStatus as string) && (
            <div>
              <label className="form-label">Do you have children? <span className="text-red-500">*</span></label>
              <select name="hasChildren" value={formData.hasChildren as string || ''} onChange={handleChange} className="input-field" required>
                <option value="">Select</option>
                <option value="no">No</option>
                <option value="yes_living_together">Yes, living with me</option>
                <option value="yes_not_living_together">Yes, not living with me</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Language</h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="form-label">Mother Tongue <span className="text-red-500">*</span></label>
            <select name="motherTongue" value={formData.motherTongue as string || ''} onChange={handleChange} className="input-field" required>
              <option value="">Select</option>
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              <option value="Other">Other</option>
            </select>
            {(formData.motherTongue as string) === 'Other' && (
              <input type="text" name="motherTongueOther" value={formData.motherTongueOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify language" />
            )}
          </div>
          <div>
            <label className="form-label">Languages Known</label>
            <div className="p-2 border bg-gray-50 max-h-40 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGES.map(lang => (
                  <label key={lang} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5 transition-colors">
                    <input type="checkbox" checked={(formData.languagesKnown as string || '').includes(lang)} onChange={(e) => handleLanguageCheckbox(lang, e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 flex-shrink-0" />
                    <span className="text-gray-700">{lang}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5 transition-colors">
                  <input type="checkbox" checked={(formData.languagesKnown as string || '').includes('Other')} onChange={(e) => handleLanguageCheckbox('Other', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Other</span>
                </label>
              </div>
            </div>
            {(formData.languagesKnown as string || '').includes('Other') && (
              <input type="text" name="languagesKnownOther" value={formData.languagesKnownOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify other languages" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LocationSection({ formData, handleChange, setFormData }: SectionProps) {
  const [zipLookupLoading, setZipLookupLoading] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [grewUpInSearch, setGrewUpInSearch] = useState('')
  const [showGrewUpInDropdown, setShowGrewUpInDropdown] = useState(false)
  const [citizenshipSearch, setCitizenshipSearch] = useState('')
  const [showCitizenshipDropdown, setShowCitizenshipDropdown] = useState(false)

  // Filter countries based on search
  const filteredCountries = COUNTRIES_LIST.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  )
  const filteredGrewUpIn = COUNTRIES_LIST.filter(country =>
    country.toLowerCase().includes(grewUpInSearch.toLowerCase())
  )
  const filteredCitizenship = COUNTRIES_LIST.filter(country =>
    country.toLowerCase().includes(citizenshipSearch.toLowerCase())
  )

  const handleCountrySelect = (country: string) => {
    const oldCountry = formData.country as string
    setFormData(prev => ({ ...prev, country }))
    setCountrySearch('')
    setShowCountryDropdown(false)
    // If grewUpIn is not set or was same as old country, update it
    if (!formData.grewUpIn || formData.grewUpIn === oldCountry) {
      setFormData(prev => ({ ...prev, grewUpIn: country }))
    }
  }

  const handleGrewUpInSelect = (country: string) => {
    setFormData(prev => ({ ...prev, grewUpIn: country }))
    setGrewUpInSearch('')
    setShowGrewUpInDropdown(false)
  }

  const handleCitizenshipSelect = (country: string) => {
    setFormData(prev => ({ ...prev, citizenship: country }))
    setCitizenshipSearch('')
    setShowCitizenshipDropdown(false)
  }

  // Lookup city and state from zipcode
  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = e.target.value.replace(/\D/g, '').slice(0, 5)
    setFormData(prev => ({ ...prev, zipCode }))

    // Only lookup if we have a 5-digit zipcode and country is USA
    if (zipCode.length === 5 && (formData.country as string || 'USA') === 'USA') {
      setZipLookupLoading(true)
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`)
        if (response.ok) {
          const data = await response.json()
          if (data.places && data.places.length > 0) {
            const place = data.places[0]
            const city = place['place name']
            const state = place['state']
            setFormData(prev => ({
              ...prev,
              currentLocation: `${city}, ${state}`,
              country: 'USA'
            }))
          }
        }
      } catch (error) {
        // Silently fail - user can still manually enter
        console.error('Zip lookup failed:', error)
      } finally {
        setZipLookupLoading(false)
      }
    }
  }

  const isUSA = (formData.country as string || 'USA') === 'USA'
  const citizenshipValue = formData.citizenship as string || ''
  const showVisaStatus = isUSA && citizenshipValue && citizenshipValue !== 'USA' && citizenshipValue !== ''

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Country - Searchable Dropdown */}
        <div className="relative">
          <label className="form-label">Country <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={countrySearch || (formData.country as string) || 'USA'}
            onChange={(e) => {
              setCountrySearch(e.target.value)
              setShowCountryDropdown(true)
            }}
            onFocus={() => {
              setCountrySearch('')
              setShowCountryDropdown(true)
            }}
            className="input-field"
            placeholder="Type to search..."
          />
          {showCountryDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${
                    country === (formData.country as string) ? 'bg-primary-50 text-primary-700 font-medium' : ''
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
          )}
          {showCountryDropdown && (
            <div className="fixed inset-0 z-40" onClick={() => setShowCountryDropdown(false)} />
          )}
        </div>
        {isUSA && (
          <div>
            <label className="form-label">Zip Code <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode as string || ''}
                onChange={handleZipCodeChange}
                className="input-field"
                placeholder="e.g., 94102"
                maxLength={5}
              />
              {zipLookupLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent  animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-fills city & state</p>
          </div>
        )}
        <div>
          <label className="form-label">City</label>
          <input type="text" placeholder="City" value={(formData.currentLocation as string || '').split(', ')[0] || ''} onChange={(e) => {
            const state = (formData.currentLocation as string || '').split(', ')[1] || ''
            setFormData(prev => ({ ...prev, currentLocation: state ? `${e.target.value}, ${state}` : e.target.value }))
          }} className="input-field" />
        </div>
        <div>
          <label className="form-label">State</label>
          {isUSA ? (
            <select name="state" value={(formData.currentLocation as string || '').split(', ')[1] || ''} onChange={(e) => {
              const city = (formData.currentLocation as string || '').split(', ')[0] || ''
              setFormData(prev => ({ ...prev, currentLocation: city ? `${city}, ${e.target.value}` : e.target.value }))
            }} className="input-field">
              <option value="">Select State</option>
              {US_STATES.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
          ) : (
            <input type="text" placeholder="State/Province" value={(formData.currentLocation as string || '').split(', ')[1] || ''} onChange={(e) => {
              const city = (formData.currentLocation as string || '').split(', ')[0] || ''
              setFormData(prev => ({ ...prev, currentLocation: city ? `${city}, ${e.target.value}` : e.target.value }))
            }} className="input-field" />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Citizenship - Searchable Dropdown (Required, only accepts values from list) */}
        <div className="relative">
          <label className="form-label">Citizenship <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={citizenshipSearch || (formData.citizenship as string) || ''}
            onChange={(e) => {
              setCitizenshipSearch(e.target.value)
              setShowCitizenshipDropdown(true)
            }}
            onFocus={() => {
              setCitizenshipSearch('')
              setShowCitizenshipDropdown(true)
            }}
            onBlur={() => {
              // If user typed something not in the list, revert to previous valid value or clear
              setTimeout(() => {
                if (citizenshipSearch && !COUNTRIES_LIST.includes(citizenshipSearch)) {
                  setCitizenshipSearch('')
                }
              }, 200)
            }}
            className="input-field"
            placeholder="Type to search..."
          />
          {showCitizenshipDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
              {filteredCitizenship.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleCitizenshipSelect(country)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${
                    country === (formData.citizenship as string) ? 'bg-primary-50 text-primary-700 font-medium' : ''
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
          )}
          {showCitizenshipDropdown && (
            <div className="fixed inset-0 z-40" onClick={() => setShowCitizenshipDropdown(false)} />
          )}
        </div>
        {/* Grew Up In - Searchable Dropdown */}
        <div className="relative">
          <label className="form-label">Grew Up In <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={grewUpInSearch || (formData.grewUpIn as string) || (formData.country as string) || 'USA'}
            onChange={(e) => {
              setGrewUpInSearch(e.target.value)
              setShowGrewUpInDropdown(true)
            }}
            onFocus={() => {
              setGrewUpInSearch('')
              setShowGrewUpInDropdown(true)
            }}
            className="input-field"
            placeholder="Type to search..."
          />
          {showGrewUpInDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
              {filteredGrewUpIn.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleGrewUpInSelect(country)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${
                    country === (formData.grewUpIn as string) ? 'bg-primary-50 text-primary-700 font-medium' : ''
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
          )}
          {showGrewUpInDropdown && (
            <div className="fixed inset-0 z-40" onClick={() => setShowGrewUpInDropdown(false)} />
          )}
        </div>
      </div>

      {/* Visa Status - Shows when country is USA and citizenship is not USA */}
      {showVisaStatus && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">US Visa Status <span className="text-red-500">*</span></label>
            <select name="residencyStatus" value={formData.residencyStatus as string || ''} onChange={handleChange} className="input-field" required>
              <option value="">Select Visa Status</option>
              {US_VISA_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {(formData.residencyStatus as string) === 'other' && (
              <input type="text" name="residencyStatusOther" value={formData.residencyStatusOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify visa type" />
            )}
          </div>
          <div>
            {/* Empty div for alignment */}
          </div>
        </div>
      )}

      {/* Relocation */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Open to Relocation <span className="text-red-500">*</span></label>
          <select name="openToRelocation" value={formData.openToRelocation as string || ''} onChange={handleChange} className="input-field" required>
            <option value="">Select</option>
            {/* Show legacy value as first option if it doesn't match standard options */}
            {(formData.openToRelocation as string) && !isValueInOptions(formData.openToRelocation as string, RELOCATION_OPTIONS) && (
              <option value={formData.openToRelocation as string}>
                {formData.openToRelocation as string} (Current)
              </option>
            )}
            {RELOCATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}

export function EducationSection({ formData, handleChange, setFormData }: SectionProps) {
  const [universitySearch, setUniversitySearch] = useState('')
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false)

  // Filter universities based on search
  const filteredUniversities = US_UNIVERSITIES.filter(uni =>
    uni.toLowerCase().includes(universitySearch.toLowerCase())
  )

  const handleUniversitySelect = (university: string) => {
    if (university === "Other (specify below)") {
      setFormData(prev => ({ ...prev, university: 'other' }))
    } else {
      setFormData(prev => ({ ...prev, university }))
    }
    setUniversitySearch('')
    setShowUniversityDropdown(false)
  }

  const isOtherUniversity = (formData.university as string) === 'other' ||
    ((formData.university as string) && !US_UNIVERSITIES.includes(formData.university as string) && (formData.university as string) !== '')

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Highest Qualification <span className="text-red-500">*</span></label>
          <select name="qualification" value={formData.qualification as string || ''} onChange={handleChange} className="input-field" required>
            <option value="">Select</option>
            {/* Show legacy value as first option if it doesn't match standard options */}
            {(formData.qualification as string) && !isValueInOptions(formData.qualification as string, QUALIFICATION_OPTIONS) && (
              <option value={formData.qualification as string}>
                {formData.qualification as string} (Current)
              </option>
            )}
            {QUALIFICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(formData.qualification as string) === 'other' && (
            <input type="text" name="qualificationOther" value={formData.qualificationOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify qualification" />
          )}
        </div>
        <div className="relative">
          <label className="form-label">College/University</label>
          <input
            type="text"
            value={universitySearch || (formData.university as string === 'other' ? '' : formData.university as string) || ''}
            onChange={(e) => {
              setUniversitySearch(e.target.value)
              setShowUniversityDropdown(true)
            }}
            onFocus={() => setShowUniversityDropdown(true)}
            className="input-field"
            placeholder="Type to search universities..."
          />
          {showUniversityDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
              {filteredUniversities.length > 0 ? (
                filteredUniversities.map((uni) => (
                  <button
                    key={uni}
                    type="button"
                    onClick={() => handleUniversitySelect(uni)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${
                      uni === "Other (specify below)" ? 'font-medium text-primary-600 border-b border-gray-200' : ''
                    }`}
                  >
                    {uni}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No matches found. Select &quot;Other&quot; to enter manually.
                </div>
              )}
            </div>
          )}
          {/* Click outside to close */}
          {showUniversityDropdown && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUniversityDropdown(false)}
            />
          )}
          {isOtherUniversity && (formData.university as string) !== 'other' && (
            <p className="text-xs text-gray-500 mt-1">Custom entry: {formData.university as string}</p>
          )}
        </div>
      </div>
      {/* Other university text input */}
      {(formData.university as string) === 'other' && (
        <div>
          <label className="form-label">Specify University/College</label>
          <input
            type="text"
            name="universityOther"
            value={formData.universityOther as string || ''}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter your university or college name"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Occupation <span className="text-red-500">*</span></label>
          <select name="occupation" value={formData.occupation as string || ''} onChange={handleChange} className="input-field" required>
            <option value="">Select</option>
            {/* Show legacy value as first option if it doesn't match standard options */}
            {(formData.occupation as string) && !isValueInOptions(formData.occupation as string, OCCUPATION_OPTIONS) && (
              <option value={formData.occupation as string}>
                {formData.occupation as string} (Current)
              </option>
            )}
            {OCCUPATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(formData.occupation as string) === 'other' && (
            <input type="text" name="occupationOther" value={formData.occupationOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify occupation" />
          )}
        </div>
        <div>
          <label className="form-label">Company/Organization</label>
          <input type="text" name="employerName" value={formData.employerName as string || ''} onChange={handleChange} className="input-field" placeholder="Company name" />
        </div>
      </div>
      <div>
        <label className="form-label">Annual Income (USD) <span className="text-red-500">*</span></label>
        {(() => {
          const incomeOptions = ['student', 'homemaker', '<50k', '50k-75k', '75k-100k', '100k-150k', '150k-200k', '>200k']
          const currentIncome = formData.annualIncome as string
          const isLegacyValue = currentIncome && !incomeOptions.includes(currentIncome)
          return (
            <select name="annualIncome" value={currentIncome || ''} onChange={handleChange} className="input-field" required>
              <option value="">Select</option>
              {isLegacyValue && (
                <option value={currentIncome}>{currentIncome} (Current)</option>
              )}
              <option value="student">Student / No Income</option>
              <option value="homemaker">Homemaker / Not Working</option>
              <option value="<50k">Less than $50k</option>
              <option value="50k-75k">$50k - $75k</option>
              <option value="75k-100k">$75k - $100k</option>
              <option value="100k-150k">$100k - $150k</option>
              <option value="150k-200k">$150k - $200k</option>
              <option value=">200k">More than $200k</option>
            </select>
          )
        })()}
      </div>
      <div>
        <label className="form-label">Education & Career Details</label>
        <textarea
          name="educationCareerDetails"
          value={formData.educationCareerDetails as string || ''}
          onChange={handleChange}
          className="input-field"
          rows={3}
          placeholder="Add any additional details about your education, certifications, work experience, or career achievements..."
        />
        <p className="text-xs text-gray-500 mt-1">Optional: Share more about your educational background or career journey</p>
      </div>
    </>
  )
}

export function FamilySection({ formData, handleChange }: SectionProps) {
  return (
    <>
      {/* Family Location & Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="form-label">Lives with Family?</label>
          <select name="livesWithFamily" value={formData.livesWithFamily as string || ''} onChange={handleChange} className="input-field">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className="form-label">Family Location <span className="text-red-500">*</span></label>
          <select name="familyLocation" value={formData.familyLocation as string || ''} onChange={handleChange} className="input-field" required>
            <option value="">Select Country</option>
            {FAMILY_LOCATION_COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          {(formData.familyLocation as string) === 'Other' && (
            <input type="text" name="familyLocationOther" value={formData.familyLocationOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify country" />
          )}
        </div>
        <div>
          <label className="form-label">Family Values <span className="text-red-500">*</span></label>
          {(() => {
            const familyValuesOptions = ['traditional', 'moderate', 'liberal']
            const currentValue = formData.familyValues as string
            const isLegacyValue = currentValue && !familyValuesOptions.includes(currentValue.toLowerCase())
            return (
              <select name="familyValues" value={currentValue || ''} onChange={handleChange} className="input-field" required>
                <option value="">Select</option>
                {isLegacyValue && (
                  <option value={currentValue}>{currentValue} (Current)</option>
                )}
                <option value="traditional">Traditional</option>
                <option value="moderate">Moderate</option>
                <option value="liberal">Liberal</option>
              </select>
            )
          })()}
        </div>
      </div>

      {/* Parents - All in one row */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="form-label">Father&apos;s Name</label>
          <input type="text" name="fatherName" value={formData.fatherName as string || ''} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="form-label">Father&apos;s Occupation</label>
          <input type="text" name="fatherOccupation" value={formData.fatherOccupation as string || ''} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="form-label">Mother&apos;s Name</label>
          <input type="text" name="motherName" value={formData.motherName as string || ''} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="form-label">Mother&apos;s Occupation</label>
          <input type="text" name="motherOccupation" value={formData.motherOccupation as string || ''} onChange={handleChange} className="input-field" />
        </div>
      </div>

      {/* Siblings */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="form-label">Brothers</label>
          <input type="number" name="numberOfBrothers" value={formData.numberOfBrothers as string || ''} onChange={handleChange} className="input-field" min="0" placeholder="0" />
        </div>
        <div>
          <label className="form-label">Sisters</label>
          <input type="number" name="numberOfSisters" value={formData.numberOfSisters as string || ''} onChange={handleChange} className="input-field" min="0" placeholder="0" />
        </div>
        <div className="col-span-2">
          <label className="form-label">Family Details (Optional)</label>
          <input type="text" name="familyDetails" value={formData.familyDetails as string || ''} onChange={handleChange} className="input-field" placeholder="Any additional family details..." />
        </div>
      </div>
    </>
  )
}

export function LifestyleSection({ formData, handleChange, setFormData }: SectionProps) {
  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const current = (formData[field] as string || '').split(', ').filter(v => v)
    if (checked) {
      setFormData(prev => ({ ...prev, [field]: [...current, value].join(', ') }))
    } else {
      setFormData(prev => ({ ...prev, [field]: current.filter(v => v !== value).join(', ') }))
    }
  }

  const isChecked = (field: string, value: string) => {
    return (formData[field] as string || '').split(', ').includes(value)
  }

  // Normalize diet value for dropdown matching
  const normalizeDiet = (val: string | null | undefined): string => {
    if (!val) return ''
    const lower = val.toLowerCase().trim()
    if (lower.includes('non') && lower.includes('veg')) return 'Non-Vegetarian'
    if (lower.includes('egg') || lower === 'eggetarian') return 'Eggetarian'
    if (lower.includes('vegan')) return 'Vegan'
    if (lower.includes('jain')) return 'Jain'
    if (lower.includes('occasionally')) return 'Occasionally Non-Veg'
    if (lower.includes('veg')) return 'Vegetarian'
    return val
  }

  // Normalize smoking/drinking values
  const normalizeYesNo = (val: string | null | undefined): string => {
    if (!val) return ''
    const lower = val.toLowerCase().trim()
    if (lower === 'no' || lower === 'never') return 'No'
    if (lower === 'yes' || lower === 'regularly') return 'Yes'
    if (lower === 'occasionally' || lower === 'social') return 'Occasionally'
    return val
  }

  const dietValue = normalizeDiet(formData.dietaryPreference as string)
  const smokingValue = normalizeYesNo(formData.smoking as string)
  const drinkingValue = normalizeYesNo(formData.drinking as string)

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Diet <span className="text-red-500">*</span></label>
          <select
            name="dietaryPreference"
            value={dietValue}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Non-Vegetarian">Non-Vegetarian</option>
            <option value="Occasionally Non-Veg">Occasionally Non-Veg</option>
            <option value="Eggetarian">Eggetarian</option>
            <option value="Vegan">Vegan</option>
            <option value="Jain">Jain</option>
          </select>
        </div>
        <div>
          <label className="form-label">Smoking <span className="text-red-500">*</span></label>
          <select
            name="smoking"
            value={smokingValue}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select</option>
            <option value="No">No</option>
            <option value="Occasionally">Occasionally</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <div>
          <label className="form-label">Drinking <span className="text-red-500">*</span></label>
          <select
            name="drinking"
            value={drinkingValue}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select</option>
            <option value="No">No</option>
            <option value="Occasionally">Occasionally / Social</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
      </div>

      {/* Hobbies Section */}
      <div>
        <label className="form-label">Hobbies</label>
        <div className="p-3 border  bg-gray-50 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {HOBBIES_OPTIONS.map(hobby => (
              <label key={hobby} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5  transition-colors">
                <input
                  type="checkbox"
                  checked={isChecked('hobbies', hobby)}
                  onChange={(e) => handleCheckboxChange('hobbies', hobby, e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{hobby}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5  transition-colors">
              <input
                type="checkbox"
                checked={isChecked('hobbies', 'Other')}
                onChange={(e) => handleCheckboxChange('hobbies', 'Other', e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700 font-medium">Other</span>
            </label>
          </div>
        </div>
        {isChecked('hobbies', 'Other') && (
          <input
            type="text"
            name="hobbiesOther"
            value={formData.hobbiesOther as string || ''}
            onChange={handleChange}
            className="input-field mt-2"
            placeholder="Enter your other hobbies (comma separated)"
          />
        )}
      </div>

      {/* Fitness & Sports Section */}
      <div>
        <label className="form-label">Fitness & Sports</label>
        <div className="p-3 border  bg-gray-50 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FITNESS_OPTIONS.map(fitness => (
              <label key={fitness} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5  transition-colors">
                <input
                  type="checkbox"
                  checked={isChecked('fitness', fitness)}
                  onChange={(e) => handleCheckboxChange('fitness', fitness, e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{fitness}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5  transition-colors">
              <input
                type="checkbox"
                checked={isChecked('fitness', 'Other')}
                onChange={(e) => handleCheckboxChange('fitness', 'Other', e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700 font-medium">Other</span>
            </label>
          </div>
        </div>
        {isChecked('fitness', 'Other') && (
          <input
            type="text"
            name="fitnessOther"
            value={formData.fitnessOther as string || ''}
            onChange={handleChange}
            className="input-field mt-2"
            placeholder="Enter your other fitness activities (comma separated)"
          />
        )}
      </div>

      {/* Interests Section */}
      <div>
        <label className="form-label">Interests</label>
        <div className="p-3 border  bg-gray-50 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INTERESTS_OPTIONS.map(interest => (
              <label key={interest} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5  transition-colors">
                <input
                  type="checkbox"
                  checked={isChecked('interests', interest)}
                  onChange={(e) => handleCheckboxChange('interests', interest, e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{interest}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5  transition-colors">
              <input
                type="checkbox"
                checked={isChecked('interests', 'Other')}
                onChange={(e) => handleCheckboxChange('interests', 'Other', e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700 font-medium">Other</span>
            </label>
          </div>
        </div>
        {isChecked('interests', 'Other') && (
          <input
            type="text"
            name="interestsOther"
            value={formData.interestsOther as string || ''}
            onChange={handleChange}
            className="input-field mt-2"
            placeholder="Enter your other interests (comma separated)"
          />
        )}
      </div>

      <div>
        <label className="form-label">Pets <span className="text-red-500">*</span></label>
        <select name="pets" value={formData.pets as string || ''} onChange={handleChange} className="input-field" required>
          <option value="">Select</option>
          <option value="have_love">Have pets and love them</option>
          <option value="no_but_love">Don't have, but love pets</option>
          <option value="no_but_open">Don't have, but open to having</option>
          <option value="prefer_not">Prefer not to have pets</option>
          <option value="allergic">Allergic to pets</option>
        </select>
      </div>
    </>
  )
}

// Helper function to generate About Me content from religion, family, hobbies, fitness, interests
function generateAboutMe(formData: Record<string, unknown>): string {
  const parts: string[] = []

  // Religion and community
  const religion = formData.religion as string || ''
  const community = formData.community as string || ''
  const subCommunity = formData.subCommunity as string || ''
  if (religion || community) {
    if (religion && community && subCommunity) {
      parts.push(`I come from a ${religion} ${community} (${subCommunity}) family.`)
    } else if (religion && community) {
      parts.push(`I come from a ${religion} ${community} family.`)
    } else if (religion) {
      parts.push(`I come from a ${religion} family.`)
    }
  }

  // Family type and values
  const familyType = formData.familyType as string || ''
  const familyValues = formData.familyValues as string || ''
  if (familyType || familyValues) {
    const typeMap: Record<string, string> = { nuclear: 'nuclear', joint: 'joint', extended: 'extended' }
    const valuesMap: Record<string, string> = { traditional: 'traditional', moderate: 'moderate', liberal: 'liberal' }
    const typeStr = typeMap[familyType] || ''
    const valuesStr = valuesMap[familyValues] || ''
    if (typeStr && valuesStr) {
      parts.push(`We are a ${valuesStr} ${typeStr} family.`)
    } else if (typeStr) {
      parts.push(`We are a ${typeStr} family.`)
    } else if (valuesStr) {
      parts.push(`We have ${valuesStr} family values.`)
    }
  }

  // Hobbies
  const hobbies = [...(formData.hobbies as string || '').split(', ').filter(h => h)]
  if (hobbies.length > 0) {
    if (hobbies.length === 1) {
      parts.push(`I enjoy ${hobbies[0].toLowerCase()}.`)
    } else if (hobbies.length === 2) {
      parts.push(`I enjoy ${hobbies[0].toLowerCase()} and ${hobbies[1].toLowerCase()}.`)
    } else {
      const lastHobby = hobbies.pop()
      parts.push(`I enjoy ${hobbies.map(h => h.toLowerCase()).join(', ')}, and ${lastHobby?.toLowerCase()}.`)
    }
  }

  // Fitness
  const fitness = [...(formData.fitness as string || '').split(', ').filter(f => f)]
  if (fitness.length > 0) {
    if (fitness.length === 1) {
      parts.push(`I stay active with ${fitness[0].toLowerCase()}.`)
    } else if (fitness.length === 2) {
      parts.push(`I stay active with ${fitness[0].toLowerCase()} and ${fitness[1].toLowerCase()}.`)
    } else {
      const lastFit = fitness.pop()
      parts.push(`I stay active with ${fitness.map(f => f.toLowerCase()).join(', ')}, and ${lastFit?.toLowerCase()}.`)
    }
  }

  // Interests
  const interests = [...(formData.interests as string || '').split(', ').filter(i => i)]
  if (interests.length > 0) {
    if (interests.length === 1) {
      parts.push(`I'm passionate about ${interests[0].toLowerCase()}.`)
    } else if (interests.length === 2) {
      parts.push(`I'm passionate about ${interests[0].toLowerCase()} and ${interests[1].toLowerCase()}.`)
    } else {
      const lastInterest = interests.pop()
      parts.push(`I'm passionate about ${interests.map(i => i.toLowerCase()).join(', ')}, and ${lastInterest?.toLowerCase()}.`)
    }
  }

  return parts.join(' ')
}

export function AboutMeSection({ formData, handleChange, setFormData }: SectionProps) {
  const [showGenerated, setShowGenerated] = useState(false)
  const generatedContent = generateAboutMe(formData)
  const hasInfoToGenerate = (formData.religion as string || '').trim() ||
    (formData.familyType as string || '').trim() ||
    (formData.familyValues as string || '').trim() ||
    (formData.hobbies as string || '').trim() ||
    (formData.fitness as string || '').trim() ||
    (formData.interests as string || '').trim()

  const handleUseGenerated = () => {
    const current = formData.aboutMe as string || ''
    const newContent = current ? `${current} ${generatedContent}` : generatedContent
    setFormData(prev => ({ ...prev, aboutMe: newContent }))
    setShowGenerated(false)
  }

  return (
    <div className="space-y-4">
      {/* Health & Wellness Section - Condensed layout */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Health & Wellness</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Blood Group</label>
            <select name="bloodGroup" value={formData.bloodGroup as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="unknown">Don't Know</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="form-label">Any Disability</label>
            <select name="anyDisability" value={formData.anyDisability as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              {DISABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        {(formData.anyDisability as string) && (formData.anyDisability as string) !== 'none' && (formData.anyDisability as string) !== '' && (
          <div>
            <label className="form-label">Please specify details</label>
            <input type="text" name="disabilityDetails" value={formData.disabilityDetails as string || ''} onChange={handleChange} className="input-field" placeholder="Enter details about your condition" />
          </div>
        )}
        <div>
          <label className="form-label">Allergies or Medical Conditions</label>
          <input type="text" name="allergiesOrMedical" value={formData.allergiesOrMedical as string || ''} onChange={handleChange} className="input-field" placeholder="e.g., None, Peanut allergy" />
        </div>
      </div>

      {/* About Me Text */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">About Me <span className="text-red-500">*</span></label>
          {hasInfoToGenerate && (
            <button
              type="button"
              onClick={() => setShowGenerated(!showGenerated)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showGenerated ? 'Hide Suggestion' : '✨ Generate for Me'}
            </button>
          )}
        </div>

        {showGenerated && generatedContent && (
          <div className="mb-3 p-3 bg-primary-50 border border-primary-200 rounded-none">
            <p className="text-sm text-gray-700 mb-2">{generatedContent}</p>
            <button
              type="button"
              onClick={handleUseGenerated}
              className="text-sm bg-primary-600 text-white px-3 py-1 rounded-none hover:bg-primary-700 transition-colors"
            >
              Use This
            </button>
          </div>
        )}

        <textarea
          name="aboutMe"
          value={formData.aboutMe as string || ''}
          onChange={handleChange}
          className="input-field min-h-[120px]"
          placeholder="Tell us about yourself, your values, interests, and what you're looking for in a partner..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Tip: Fill in religion, family details, hobbies, fitness, and interests to get a personalized suggestion
        </p>
      </div>

      {/* Social Media Profiles */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Social Profiles</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">LinkedIn <span className="text-red-500">*</span></label>
            <select
              value={formData.linkedinProfile === 'no_linkedin' ? 'no_linkedin' : 'has_linkedin'}
              onChange={(e) => {
                if (e.target.value === 'no_linkedin') {
                  setFormData(prev => ({ ...prev, linkedinProfile: 'no_linkedin', linkedinError: '' }))
                } else {
                  setFormData(prev => ({ ...prev, linkedinProfile: '', linkedinError: '' }))
                }
              }}
              className="input-field mb-2"
            >
              <option value="has_linkedin">I have LinkedIn</option>
              <option value="no_linkedin">I don&apos;t have LinkedIn</option>
            </select>
            {(formData.linkedinProfile !== 'no_linkedin') && (
              <>
                <div className="relative">
                  <input
                    type="url"
                    name="linkedinProfile"
                    value={formData.linkedinProfile as string || ''}
                    onChange={(e) => {
                      handleChange(e)
                      if (formData.linkedinError) {
                        setFormData(prev => ({ ...prev, linkedinError: '' }))
                      }
                    }}
                    onBlur={(e) => {
                      const url = e.target.value.trim()
                      if (!url) {
                        setFormData(prev => ({ ...prev, linkedinError: 'LinkedIn profile URL is required' }))
                        return
                      }

                      const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/
                      const isValidFormat = linkedinRegex.test(url) ||
                        /^linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(url) ||
                        /^\/in\/[a-zA-Z0-9_-]+\/?$/.test(url) ||
                        /^in\/[a-zA-Z0-9_-]+\/?$/.test(url)

                      if (!isValidFormat) {
                        if (url.includes('linkedin.com') && !url.includes('/in/')) {
                          setFormData(prev => ({ ...prev, linkedinError: 'Please use your profile URL (linkedin.com/in/username), not the company or other page' }))
                        } else if (!url.includes('linkedin')) {
                          setFormData(prev => ({ ...prev, linkedinError: 'Please enter a LinkedIn URL' }))
                        } else {
                          setFormData(prev => ({ ...prev, linkedinError: 'Invalid format. Example: linkedin.com/in/johndoe' }))
                        }
                        return
                      }

                      let normalizedUrl = url
                      if (!url.startsWith('http')) {
                        if (url.startsWith('linkedin.com')) {
                          normalizedUrl = 'https://www.' + url
                        } else if (url.startsWith('www.')) {
                          normalizedUrl = 'https://' + url
                        } else if (url.startsWith('/in/') || url.startsWith('in/')) {
                          normalizedUrl = 'https://www.linkedin.com' + (url.startsWith('/') ? url : '/' + url)
                        }
                      }

                      setFormData(prev => ({ ...prev, linkedinProfile: normalizedUrl, linkedinError: '' }))
                    }}
                    className={`input-field ${formData.linkedinError ? 'border-red-500' : ''}`}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                {formData.linkedinError && (
                  <p className="text-red-500 text-xs mt-1">{formData.linkedinError as string}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">Example: linkedin.com/in/johndoe</p>
              </>
            )}
          </div>
          <div>
            <label className="form-label">Instagram</label>
            <input type="text" name="instagram" value={formData.instagram as string || ''} onChange={handleChange} className="input-field" placeholder="@username" />
          </div>
          <div>
            <label className="form-label">Facebook</label>
            <input type="url" name="facebook" value={formData.facebook as string || ''} onChange={handleChange} className="input-field" placeholder="facebook.com/..." />
          </div>
        </div>
      </div>

      {/* Referral Source */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">How Did You Find Us?</h4>
        <div>
          <label className="form-label">Referral Source <span className="text-red-500">*</span></label>
          <select name="referralSource" value={formData.referralSource as string || ''} onChange={handleChange} className="input-field" required>
            <option value="">Select</option>
            <option value="friend">Friend</option>
            <option value="family">Family/Relative</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">WhatsApp Message</option>
            <option value="linkedin">LinkedIn</option>
            <option value="youtube">YouTube</option>
            <option value="google">Google Search</option>
            <option value="temple">Temple/Religious Organization</option>
            <option value="community_event">Community Event/Meetup</option>
            <option value="organization">Other Organization</option>
            <option value="advertisement">Advertisement</option>
            <option value="other">Other</option>
          </select>
          {(formData.referralSource as string) === 'other' && (
            <input
              type="text"
              name="referralSourceOther"
              value={formData.referralSourceOther as string || ''}
              onChange={handleChange}
              className="input-field mt-2"
              placeholder="Please specify how you heard about us"
            />
          )}
          {(formData.referralSource as string) === 'organization' && (
            <input
              type="text"
              name="referralOrganization"
              value={formData.referralOrganization as string || ''}
              onChange={handleChange}
              className="input-field mt-2"
              placeholder="Organization name"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function ReligionSection({ formData, handleChange, setFormData }: SectionProps) {
  const [birthCountrySearch, setBirthCountrySearch] = useState('')
  const [showBirthCountryDropdown, setShowBirthCountryDropdown] = useState(false)

  const filteredBirthCountries = COUNTRIES_LIST.filter(country =>
    country.toLowerCase().includes(birthCountrySearch.toLowerCase())
  )

  const handleBirthCountrySelect = (country: string) => {
    setFormData(prev => ({ ...prev, placeOfBirthCountry: country }))
    setBirthCountrySearch('')
    setShowBirthCountryDropdown(false)
  }

  // Get communities based on selected religion
  const selectedReligion = formData.religion as string || ''
  const availableCommunities = selectedReligion ? getCommunities(selectedReligion) : []

  // Get sub-communities based on selected community
  const selectedCommunity = formData.community as string || ''
  const availableSubCommunities = selectedReligion && selectedCommunity
    ? getSubCommunities(selectedReligion, selectedCommunity)
    : []

  // Handle religion change - reset community and sub-community
  const handleReligionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value, community: '', subCommunity: '' }))
  }

  // Handle community change - reset sub-community
  const handleCommunityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value, subCommunity: '' }))
  }

  return (
    <>
      {/* Basic Religion Info - shown for all */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Religion <span className="text-red-500">*</span></label>
          <select name="religion" value={formData.religion as string || ''} onChange={handleReligionChange} className="input-field">
            <option value="">Select</option>
            {RELIGIONS.map(religion => (
              <option key={religion} value={religion}>{religion}</option>
            ))}
          </select>
          {(formData.religion as string) === 'Other' && (
            <input type="text" name="religionOther" value={formData.religionOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify religion" />
          )}
        </div>
        <div>
          <label className="form-label">Community <span className="text-red-500">*</span></label>
          <select
            name="community"
            value={formData.community as string || ''}
            onChange={handleCommunityChange}
            className="input-field"
            disabled={!selectedReligion}
          >
            <option value="">Select Community</option>
            {availableCommunities.map(community => (
              <option key={community} value={community}>{community}</option>
            ))}
          </select>
          {!selectedReligion && (
            <p className="text-xs text-gray-500 mt-1">Select religion first</p>
          )}
        </div>
        <div>
          <label className="form-label">Sub-Community</label>
          <select
            name="subCommunity"
            value={formData.subCommunity as string || ''}
            onChange={handleChange}
            className="input-field"
            disabled={!selectedCommunity}
          >
            <option value="">Select Sub-Community</option>
            {availableSubCommunities.map(subCommunity => (
              <option key={subCommunity} value={subCommunity}>{subCommunity}</option>
            ))}
          </select>
          {!selectedCommunity && selectedReligion && (
            <p className="text-xs text-gray-500 mt-1">Select community first</p>
          )}
        </div>
      </div>

      {/* Hindu-specific fields: Gothra, Birth details, Astrology */}
      {selectedReligion === 'Hindu' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Gothra <span className="text-red-500">*</span></label>
              <select name="gotra" value={formData.gotra as string || ''} onChange={handleChange} className="input-field" required>
                <option value="">Select</option>
                {GOTRA_OPTIONS.map((gotra) => (
                  <option key={gotra} value={gotra}>{gotra}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Manglik</label>
              <select name="manglik" value={formData.manglik as string || ''} onChange={handleChange} className="input-field">
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="dont_know">Don&apos;t Know</option>
              </select>
            </div>
            <div>
              <label className="form-label">Raasi (Moon Sign)</label>
              <select name="raasi" value={formData.raasi as string || ''} onChange={handleChange} className="input-field">
                <option value="">Select</option>
                {RAASI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Nakshatra (Birth Star)</label>
              <select name="nakshatra" value={formData.nakshatra as string || ''} onChange={handleChange} className="input-field">
                <option value="">Select</option>
                {NAKSHATRA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Doshas</label>
              <select name="doshas" value={formData.doshas as string || ''} onChange={handleChange} className="input-field">
                <option value="">Select</option>
                {DOSHAS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {(formData.doshas as string) === 'other' && (
                <input type="text" name="doshasOther" value={formData.doshasOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify dosha" />
              )}
            </div>
          </div>
        </>
      )}

      {/* Jain-specific fields: Gothra (shared with Hindu tradition) */}
      {selectedReligion === 'Jain' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Gothra <span className="text-red-500">*</span></label>
            <select name="gotra" value={formData.gotra as string || ''} onChange={handleChange} className="input-field" required>
              <option value="">Select</option>
              {GOTRA_OPTIONS.map((gotra) => (
                <option key={gotra} value={gotra}>{gotra}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Muslim-specific fields */}
      {selectedReligion === 'Muslim' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Maslak (School of Thought)</label>
            <select name="maslak" value={formData.maslak as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              <option value="hanafi">Hanafi</option>
              <option value="shafi">Shafi</option>
              <option value="maliki">Maliki</option>
              <option value="hanbali">Hanbali</option>
              <option value="ahle_hadith">Ahle Hadith</option>
              <option value="deobandi">Deobandi</option>
              <option value="barelvi">Barelvi</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Namaz (Prayer)</label>
            <select name="namazPractice" value={formData.namazPractice as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              <option value="five_times">5 times daily</option>
              <option value="sometimes">Sometimes</option>
              <option value="friday_only">Friday only</option>
              <option value="occasionally">Occasionally</option>
              <option value="rarely">Rarely</option>
            </select>
          </div>
        </div>
      )}

      {/* Sikh-specific fields */}
      {selectedReligion === 'Sikh' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Amritdhari (Baptized)</label>
            <select name="amritdhari" value={formData.amritdhari as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="keshdhari">Keshdhari (Not baptized but keeps hair)</option>
            </select>
          </div>
          <div>
            <label className="form-label">Turban</label>
            <select name="turban" value={formData.turban as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              <option value="yes">Yes, wears turban</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      )}

      {/* Christian-specific fields */}
      {selectedReligion === 'Christian' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Church Attendance</label>
            <select name="churchAttendance" value={formData.churchAttendance as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              <option value="weekly">Weekly</option>
              <option value="occasionally">Occasionally</option>
              <option value="special_occasions">Special occasions only</option>
              <option value="rarely">Rarely</option>
            </select>
          </div>
          <div>
            <label className="form-label">Baptized</label>
            <select name="baptized" value={formData.baptized as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      )}

      {/* Birth Place - shown for all religions */}
      <div className="grid grid-cols-3 gap-4">
        {/* Birth Country - Searchable Dropdown */}
        <div className="relative">
          <label className="form-label">Birth Country</label>
          <input
            type="text"
            value={birthCountrySearch || (formData.placeOfBirthCountry as string) || ''}
            onChange={(e) => {
              setBirthCountrySearch(e.target.value)
              setShowBirthCountryDropdown(true)
            }}
            onFocus={() => {
              setBirthCountrySearch('')
              setShowBirthCountryDropdown(true)
            }}
            className="input-field"
            placeholder="Type to search..."
          />
          {showBirthCountryDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
              {filteredBirthCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleBirthCountrySelect(country)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${
                    country === (formData.placeOfBirthCountry as string) ? 'bg-primary-50 text-primary-700 font-medium' : ''
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
          )}
          {showBirthCountryDropdown && (
            <div className="fixed inset-0 z-40" onClick={() => setShowBirthCountryDropdown(false)} />
          )}
        </div>
        <div>
          <label className="form-label">Birth State</label>
          <input type="text" name="placeOfBirthState" value={formData.placeOfBirthState as string || ''} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="form-label">Birth City</label>
          <input type="text" name="placeOfBirthCity" value={formData.placeOfBirthCity as string || ''} onChange={handleChange} className="input-field" />
        </div>
      </div>
    </>
  )
}

// =============================================
// UNIFIED PREFERENCES SECTION WITH DEAL-BREAKER TOGGLES
// =============================================

// Deal-breaker toggle component
function DealBreakerToggle({
  field,
  formData,
  setFormData,
  label,
  relatedField
}: {
  field: string
  formData: Record<string, unknown>
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  label?: string
  relatedField?: string // The actual preference field name to clear "doesn't matter" from
}) {
  const fieldName = `${field}IsDealbreaker`
  const isChecked = formData[fieldName] === true || formData[fieldName] === 'true'

  // Map deal-breaker fields to their corresponding value fields
  const getRelatedFields = (dealBreakerField: string): string[] => {
    const fieldMappings: Record<string, string[]> = {
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
    return fieldMappings[dealBreakerField] || [dealBreakerField]
  }

  // Fields that use comma-separated checkbox values
  const isCheckboxField = (fieldName: string): boolean => {
    return ['prefMaritalStatus'].includes(fieldName)
  }

  const handleToggle = (checked: boolean) => {
    const updates: Record<string, unknown> = { [fieldName]: checked }

    // If turning on deal-breaker, clear any "doesn't matter" values to force real selection
    if (checked) {
      const fieldsToCheck = relatedField ? [relatedField] : getRelatedFields(field)
      fieldsToCheck.forEach(fieldToCheck => {
        const currentValue = formData[fieldToCheck] as string || ''

        // Handle checkbox-based fields (comma-separated values)
        if (isCheckboxField(fieldToCheck)) {
          const values = currentValue.split(', ').filter(v => v && v !== 'doesnt_matter')
          updates[fieldToCheck] = values.join(', ')
        } else {
          // Handle regular select fields
          if (currentValue === 'doesnt_matter' || currentValue === '') {
            updates[fieldToCheck] = '' // Clear the value to force user to make a real selection
          }
        }
      })
    }

    setFormData(prev => ({ ...prev, ...updates }))
  }

  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => handleToggle(e.target.checked)}
        className="rounded border-red-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5"
      />
      <span className={`text-xs ${isChecked ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
        {label || 'Deal-breaker'}
      </span>
    </label>
  )
}

// Helper to check if deal-breaker is enabled for a field
function isDealbreaker(formData: Record<string, unknown>, field: string): boolean {
  const fieldName = `${field}IsDealbreaker`
  return formData[fieldName] === true || formData[fieldName] === 'true'
}

// Multi-select pills component for religion preferences (mobile-friendly)
function ReligionPillSelector({
  selectedReligions,
  onSelectionChange,
  isDealbreaker,
  showDoesntMatter = true
}: {
  selectedReligions: string[]
  onSelectionChange: (religions: string[]) => void
  isDealbreaker: boolean
  showDoesntMatter?: boolean
}) {
  const isDoesntMatter = selectedReligions.length === 0

  const handlePillClick = (religion: string) => {
    if (selectedReligions.includes(religion)) {
      // Remove religion
      onSelectionChange(selectedReligions.filter(r => r !== religion))
    } else {
      // Add religion
      onSelectionChange([...selectedReligions, religion])
    }
  }

  const handleDoesntMatterClick = () => {
    // Clear all selections (empty array = doesn't matter)
    onSelectionChange([])
  }

  return (
    <div className="space-y-2">
      {/* Doesn't Matter toggle - shown unless deal-breaker is enabled */}
      {showDoesntMatter && !isDealbreaker && (
        <button
          type="button"
          onClick={handleDoesntMatterClick}
          className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
            isDoesntMatter
              ? 'bg-primary-100 border-primary-500 text-primary-700'
              : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          Doesn&apos;t Matter (Any Religion)
        </button>
      )}

      {/* Info text when doesn't matter is selected */}
      {isDoesntMatter && !isDealbreaker && (
        <p className="text-xs text-gray-500 text-center">
          Or select specific religions below
        </p>
      )}

      {/* Religion pills - responsive grid */}
      <div className="flex flex-wrap gap-2">
        {RELIGIONS.map((religion) => {
          const isSelected = selectedReligions.includes(religion)
          return (
            <button
              key={religion}
              type="button"
              onClick={() => handlePillClick(religion)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                isSelected
                  ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400 hover:text-primary-600'
              }`}
            >
              {religion}
              {isSelected && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-xs">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selection summary */}
      {selectedReligions.length > 0 && (
        <p className="text-xs text-gray-600 mt-1">
          {selectedReligions.length === 1
            ? `Selected: ${selectedReligions[0]}`
            : `Selected: ${selectedReligions.join(', ')}`}
        </p>
      )}

      {/* Validation message for deal-breaker */}
      {isDealbreaker && selectedReligions.length === 0 && (
        <p className="text-xs text-red-500 mt-1">
          Deal-breaker: Must select at least one religion
        </p>
      )}
    </div>
  )
}

// Section header with deal-breaker toggle
function PreferenceHeader({
  title,
  field,
  formData,
  setFormData,
  required = false
}: {
  title: string
  field: string
  formData: Record<string, unknown>
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  required?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold text-gray-800">
        {title} {required && <span className="text-red-500">*</span>}
      </h4>
      <DealBreakerToggle field={field} formData={formData} setFormData={setFormData} />
    </div>
  )
}

export function PreferencesMustHavesSection({ formData, handleChange, setFormData }: SectionProps) {
  // This is now just a wrapper that redirects to the unified section
  return <PreferencesUnifiedSection formData={formData} handleChange={handleChange} setFormData={setFormData} showOnlyRequired />
}

export function PreferencesNiceToHavesSection({ formData, handleChange, setFormData }: SectionProps) {
  // This is now just a wrapper that redirects to the unified section
  return <PreferencesUnifiedSection formData={formData} handleChange={handleChange} setFormData={setFormData} showOnlyOptional />
}

export function PreferencesUnifiedSection({ formData, handleChange, setFormData, showOnlyRequired, showOnlyOptional }: SectionProps & { showOnlyRequired?: boolean, showOnlyOptional?: boolean }) {
  const [prefCitizenshipSearch, setPrefCitizenshipSearch] = useState('')
  const [showPrefCitizenshipDropdown, setShowPrefCitizenshipDropdown] = useState(false)
  const [prefGrewUpInSearch, setPrefGrewUpInSearch] = useState('')
  const [showPrefGrewUpInDropdown, setShowPrefGrewUpInDropdown] = useState(false)

  const filteredPrefCitizenship = COUNTRIES_LIST.filter(country =>
    country.toLowerCase().includes(prefCitizenshipSearch.toLowerCase())
  )
  const filteredPrefGrewUpIn = COUNTRIES_LIST.filter(country =>
    country.toLowerCase().includes(prefGrewUpInSearch.toLowerCase())
  )

  // Map preference fields to their deal-breaker flag fields
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

  // Wrapper for handleChange that clears deal-breaker when "doesn't matter" is selected
  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const normalizedValue = value.toLowerCase()

    // Check if user selected a "doesn't matter" type value
    const isDoesntMatter = normalizedValue === 'doesnt_matter' || normalizedValue === '' || normalizedValue === "doesn't matter"

    // If selecting "doesn't matter" and this field has a deal-breaker toggle, clear the deal-breaker
    if (isDoesntMatter && prefToDealBreakerMap[name]) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        [prefToDealBreakerMap[name]]: false
      }))
    } else {
      // Just call the original handleChange
      handleChange(e)
    }
  }

  const handlePrefCitizenshipSelect = (country: string) => {
    setFormData(prev => ({ ...prev, prefCitizenship: country }))
    setPrefCitizenshipSearch('')
    setShowPrefCitizenshipDropdown(false)
  }

  const handlePrefGrewUpInSelect = (country: string) => {
    setFormData(prev => ({ ...prev, prefGrewUpIn: country }))
    setPrefGrewUpInSearch('')
    setShowPrefGrewUpInDropdown(false)
  }

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const current = (formData[field] as string || '').split(', ').filter(v => v)
    if (checked) {
      setFormData(prev => ({ ...prev, [field]: [...current, value].join(', ') }))
    } else {
      setFormData(prev => ({ ...prev, [field]: current.filter(v => v !== value).join(', ') }))
    }
  }

  const isChecked = (field: string, value: string) => {
    return (formData[field] as string || '').split(', ').includes(value)
  }

  // Gender-based age defaults
  const userAge = formData.age as string || ''
  const userGender = formData.gender as string || ''
  const userReligion = formData.religion as string || ''
  const isEditingProfile = Boolean(formData.id)

  // Sync fallback defaults into formData so saved values always match what's displayed.
  // Without this, selects can show a fallback value (e.g. user's own religion) while
  // formData remains null — causing the saved value to not match what the user sees.
  useEffect(() => {
    if (showOnlyOptional) return

    setFormData(prev => {
      const updates: Record<string, unknown> = {}

      // Age defaults: use user's own age as starting point
      if (!prev.prefAgeMin && userGender === 'female' && userAge) {
        updates.prefAgeMin = userAge
      }
      if (!prev.prefAgeMax && userGender === 'male' && userAge) {
        updates.prefAgeMax = userAge
      }

      // Religion default: use user's own religion (for both legacy and new field)
      // Initialize prefReligions array from prefReligion if not set
      const existingReligions = prev.prefReligions as string[] | undefined
      const existingReligion = prev.prefReligion as string | undefined
      if ((!existingReligions || existingReligions.length === 0) && !existingReligion && userReligion) {
        updates.prefReligions = [userReligion]
        updates.prefReligion = userReligion // Keep legacy field in sync
      }

      if (Object.keys(updates).length === 0) return prev
      return { ...prev, ...updates }
    })
  }, [showOnlyOptional, userAge, userGender, userReligion, setFormData])

  // Get selected religions from the new array field, falling back to legacy field
  const selectedReligions: string[] = (() => {
    const religions = formData.prefReligions as string[] | undefined
    if (religions && religions.length > 0) return religions
    // Fallback to legacy field
    const legacyReligion = formData.prefReligion as string | undefined
    if (legacyReligion && legacyReligion !== 'doesnt_matter') return [legacyReligion]
    return []
  })()

  // For backwards compatibility and community selection
  const prefReligion = selectedReligions.length === 1 ? selectedReligions[0] : ''
  const hasMultipleReligions = selectedReligions.length > 1
  const showGotra = !hasMultipleReligions && (selectedReligions.includes('Hindu') || selectedReligions.includes('Jain'))
  const communitiesForReligion = !hasMultipleReligions && selectedReligions.length === 1 ? getCommunities(selectedReligions[0]) : []

  // Handle religion selection changes
  const handleReligionSelectionChange = (religions: string[]) => {
    setFormData(prev => {
      const updates: Record<string, unknown> = {
        prefReligions: religions,
        // Keep legacy field in sync (single value or empty)
        prefReligion: religions.length === 1 ? religions[0] : (religions.length === 0 ? 'doesnt_matter' : '')
      }
      // If multiple religions selected, clear community and sub-community preferences
      if (religions.length > 1) {
        updates.prefCommunity = 'doesnt_matter'
        updates.prefSubCommunity = null
        updates.prefCommunityIsDealbreaker = false
        updates.prefGotra = ''
        updates.prefGotraIsDealbreaker = false
      }
      return { ...prev, ...updates }
    })
  }
  const prefCitizenshipIsDealbreaker = isDealbreaker(formData, 'prefCitizenship')
  const prefGrewUpInIsDealbreaker = isDealbreaker(formData, 'prefGrewUpIn')
  const prefRelocationIsDealbreaker = isDealbreaker(formData, 'prefRelocation')
  const prefEducationIsDealbreaker = isDealbreaker(formData, 'prefEducation')
  const prefIncomeIsDealbreaker = isDealbreaker(formData, 'prefIncome')
  const prefLocationIsDealbreaker = isDealbreaker(formData, 'prefLocation')
  const prefMotherTongueIsDealbreaker = isDealbreaker(formData, 'prefMotherTongue')
  const prefLocationCount = (formData.prefLocationList as string || '').split(', ').filter(v => v).length
  const prefMotherTongueCount = (formData.prefMotherTongueList as string || '').split(', ').filter(v => v).length

  // Count deal-breakers - all preference categories that can be deal-breakers
  // Each preference field counts as ONE deal-breaker
  // Note: SubCommunity, Pets, Hobbies, Fitness, and Interests do NOT have deal-breaker toggles
  const dealBreakerCount = [
    'prefAge',                    // Age Range
    'prefHeight',                 // Height Range
    'prefMaritalStatus',          // Marital Status
    'prefHasChildren',            // Partner's Children
    'prefReligion',               // Religion
    'prefCommunity',              // Community
    'prefGotra',                  // Gotra (Hindu/Jain only)
    'prefDiet',                   // Diet
    'prefSmoking',                // Smoking
    'prefDrinking',               // Drinking
    'prefLocation',               // Preferred Locations
    'prefCitizenship',            // Citizenship
    'prefGrewUpIn',               // Grew Up In
    'prefRelocation',             // Relocation
    'prefEducation',              // Minimum Education
    'prefIncome',                 // Minimum Income
    'prefFamilyValues',           // Family Values
    'prefFamilyLocationCountry',  // Family Location Country
    'prefMotherTongue',           // Mother Tongue
  ].filter(f => formData[`${f}IsDealbreaker`] === true || formData[`${f}IsDealbreaker`] === 'true').length

  return (
    <div className="space-y-5">
      {/* Info Banner - Only show for Must-Have section */}
      {!showOnlyOptional && (
        <div className="bg-gradient-to-r from-red-50 to-blue-50 p-3 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">
            <strong>How it works:</strong> Check <span className="text-red-600 font-medium">&quot;Deal-breaker&quot;</span> next to preferences that are <strong>must-haves</strong>.
            Profiles that don&apos;t match your deal-breakers won&apos;t be shown. Other preferences help rank your matches.
          </p>
          {dealBreakerCount > 0 && (
            <p className="text-xs text-red-600 mt-1.5">
              🚫 You have {dealBreakerCount} deal-breaker{dealBreakerCount > 1 ? 's' : ''} set
            </p>
          )}
        </div>
      )}

      {/* More Preferences Info Banner */}
      {showOnlyOptional && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">
            <strong>More Preferences:</strong> Set additional preferences for location, education, and family.
            Check <span className="text-red-600 font-medium">&quot;Deal-breaker&quot;</span> for must-haves, or leave unchecked to use as ranking factors.
          </p>
        </div>
      )}

      {/* Age & Height */}
      {!showOnlyOptional && (
        <div className="space-y-3 p-3 rounded-lg border bg-white">
          <h4 className="text-sm font-semibold text-gray-800">Age & Height <span className="text-red-500">*</span></h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Age Range <span className="text-red-500">*</span> {userAge && <span className="text-gray-400 text-xs">(You: {userAge})</span>}</label>
                <DealBreakerToggle field="prefAge" formData={formData} setFormData={setFormData} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="prefAgeMin" value={formData.prefAgeMin as string || ''} onChange={handleChange} className="input-field" required>
                  <option value="">Min Age</option>
                  {PREF_AGE_MIN_MAX.map((opt) => {
                    const maxAge = parseInt(formData.prefAgeMax as string) || 0
                    const isDisabled = maxAge > 0 && parseInt(opt.value) > maxAge
                    return (
                      <option key={opt.value} value={opt.value} disabled={isDisabled}>
                        {opt.label}
                      </option>
                    )
                  })}
                </select>
                <select name="prefAgeMax" value={formData.prefAgeMax as string || ''} onChange={handleChange} className="input-field" required>
                  <option value="">Max Age</option>
                  {PREF_AGE_MIN_MAX.map((opt) => {
                    const minAge = parseInt(formData.prefAgeMin as string) || 0
                    const isDisabled = minAge > 0 && parseInt(opt.value) < minAge
                    return (
                      <option key={opt.value} value={opt.value} disabled={isDisabled}>
                        {opt.label}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Height Range <span className="text-red-500">*</span></label>
                <DealBreakerToggle field="prefHeight" formData={formData} setFormData={setFormData} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="prefHeightMin" value={formData.prefHeightMin as string || ''} onChange={handleChange} className="input-field" required>
                  <option value="">Min Height</option>
                  {HEIGHT_OPTIONS.map((h) => {
                    const maxHeight = formData.prefHeightMax as string
                    const isDisabled = !!(maxHeight && heightToInches(h.value) > heightToInches(maxHeight))
                    return (
                      <option key={h.value} value={h.value} disabled={isDisabled}>
                        {h.label}
                      </option>
                    )
                  })}
                </select>
                <select name="prefHeightMax" value={formData.prefHeightMax as string || ''} onChange={handleChange} className="input-field" required>
                  <option value="">Max Height</option>
                  {HEIGHT_OPTIONS.map((h) => {
                    const minHeight = formData.prefHeightMin as string
                    const isDisabled = !!(minHeight && heightToInches(h.value) < heightToInches(minHeight))
                    return (
                      <option key={h.value} value={h.value} disabled={isDisabled}>
                        {h.label}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marital Status */}
      {!showOnlyOptional && (
        <div className="space-y-3 p-3 rounded-lg border bg-white">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">Marital Status <span className="text-red-500">*</span></h4>
            <DealBreakerToggle field="prefMaritalStatus" formData={formData} setFormData={setFormData} />
          </div>
          <div className="flex flex-wrap gap-3 p-3 border rounded bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isChecked('prefMaritalStatus', 'never_married')} onChange={(e) => handleCheckboxChange('prefMaritalStatus', 'never_married', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4" />
              <span className="text-sm">Never Married</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isChecked('prefMaritalStatus', 'divorced')} onChange={(e) => handleCheckboxChange('prefMaritalStatus', 'divorced', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4" />
              <span className="text-sm">Divorced</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isChecked('prefMaritalStatus', 'separated')} onChange={(e) => handleCheckboxChange('prefMaritalStatus', 'separated', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4" />
              <span className="text-sm">Separated</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isChecked('prefMaritalStatus', 'widowed')} onChange={(e) => handleCheckboxChange('prefMaritalStatus', 'widowed', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4" />
              <span className="text-sm">Widowed</span>
            </label>
            {!isDealbreaker(formData, 'prefMaritalStatus') && (
              <label className="flex items-center gap-2 cursor-pointer border-l pl-3">
                <input type="checkbox" checked={isChecked('prefMaritalStatus', 'doesnt_matter')} onChange={(e) => handleCheckboxChange('prefMaritalStatus', 'doesnt_matter', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4" />
                <span className="text-sm font-medium">Any</span>
              </label>
            )}
          </div>
          {isDealbreaker(formData, 'prefMaritalStatus') && (!(formData.prefMaritalStatus as string) || (formData.prefMaritalStatus as string).includes('doesnt_matter')) && !(formData.prefMaritalStatus as string || '').split(', ').filter(v => v && v !== 'doesnt_matter').length && <p className="text-xs text-red-500">Deal-breaker: Must select at least one specific status</p>}
        </div>
      )}

      {/* Partner's Children Preference - Only show if they accept non-never-married */}
      {!showOnlyOptional && (() => {
        const prefMaritalStatusValue = (formData.prefMaritalStatus as string) || ''
        const acceptsNonNeverMarried = prefMaritalStatusValue.includes('divorced') ||
                                        prefMaritalStatusValue.includes('separated') ||
                                        prefMaritalStatusValue.includes('widowed') ||
                                        prefMaritalStatusValue.includes('doesnt_matter')
        return acceptsNonNeverMarried ? (
          <div className="space-y-3 p-3 rounded-lg border bg-white">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Partner&apos;s Children</h4>
              <DealBreakerToggle field="prefHasChildren" formData={formData} setFormData={setFormData} />
            </div>
            <div>
              <select
                name="prefHasChildren"
                value={formData.prefHasChildren as string || (isDealbreaker(formData, 'prefHasChildren') ? '' : 'doesnt_matter')}
                onChange={handlePreferenceChange}
                className="input-field"
              >
                {isDealbreaker(formData, 'prefHasChildren') && <option value="">Select</option>}
                {!isDealbreaker(formData, 'prefHasChildren') && <option value="doesnt_matter">Doesn&apos;t Matter</option>}
                <option value="no_children">No Children (Must not have children)</option>
                <option value="ok_not_living">OK with Children (Not living with them)</option>
                <option value="ok_living">OK with Children (Living with them too)</option>
                <option value="ok_any">OK with Children (Any situation)</option>
              </select>
              {isDealbreaker(formData, 'prefHasChildren') && (!formData.prefHasChildren || formData.prefHasChildren === 'doesnt_matter') && (
                <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a specific preference</p>
              )}
            </div>
          </div>
        ) : null
      })()}

      {/* Religion & Community */}
      {!showOnlyOptional && (
        <div className="space-y-3 p-3 rounded-lg border bg-white">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-gray-800">Religion Preference <span className="text-red-500">*</span></h4>
            <DealBreakerToggle field="prefReligion" formData={formData} setFormData={setFormData} />
          </div>

          {/* Multi-select religion pills */}
          <ReligionPillSelector
            selectedReligions={selectedReligions}
            onSelectionChange={handleReligionSelectionChange}
            isDealbreaker={isDealbreaker(formData, 'prefReligion')}
            showDoesntMatter={!isDealbreaker(formData, 'prefReligion')}
          />

          {/* Community & Gotra - only shown when single religion selected */}
          {selectedReligions.length === 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Community Preferences</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                    <label className="form-label mb-0 text-sm">Community</label>
                    <DealBreakerToggle field="prefCommunity" formData={formData} setFormData={setFormData} />
                  </div>
                  <select name="prefCommunity" value={formData.prefCommunity as string || (isDealbreaker(formData, 'prefCommunity') ? '' : 'doesnt_matter')} onChange={handlePreferenceChange} className="input-field">
                    {!isDealbreaker(formData, 'prefCommunity') && <option value="doesnt_matter">Doesn&apos;t Matter</option>}
                    <option value="">Select</option>
                    {communitiesForReligion.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  {isDealbreaker(formData, 'prefCommunity') && (!formData.prefCommunity || formData.prefCommunity === 'doesnt_matter') && <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a specific community</p>}
                </div>
                {showGotra && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <label className="form-label mb-0 text-sm">Gothra</label>
                      <DealBreakerToggle field="prefGotra" formData={formData} setFormData={setFormData} />
                    </div>
                    <select name="prefGotra" value={formData.prefGotra as string || ''} onChange={handlePreferenceChange} className="input-field">
                      {!isDealbreaker(formData, 'prefGotra') && <option value="">Doesn&apos;t Matter</option>}
                      {isDealbreaker(formData, 'prefGotra') && <option value="">Select</option>}
                      <option value="different">Different Gothra Only</option>
                    </select>
                    {isDealbreaker(formData, 'prefGotra') && !formData.prefGotra && <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a specific preference</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info message when multiple religions selected */}
          {hasMultipleReligions && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Note:</span> Community preferences are not available when multiple religions are selected.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lifestyle - Diet, Smoking, Drinking */}
      {!showOnlyOptional && (
        <div className="space-y-3 p-3 rounded-lg border bg-white">
          <h4 className="text-sm font-semibold text-gray-800">Lifestyle <span className="text-red-500">*</span></h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Diet {isDealbreaker(formData, 'prefDiet') && <span className="text-red-500">*</span>}</label>
                <DealBreakerToggle field="prefDiet" formData={formData} setFormData={setFormData} relatedField="prefDiet" />
              </div>
              <select name="prefDiet" value={formData.prefDiet as string || ''} onChange={handlePreferenceChange} className="input-field" required={isDealbreaker(formData, 'prefDiet')}>
                {!isDealbreaker(formData, 'prefDiet') && <option value="">Doesn&apos;t Matter</option>}
                {isDealbreaker(formData, 'prefDiet') && <option value="">Select</option>}
                <option value="veg">Vegetarian Only</option>
                <option value="veg_eggetarian">Veg / Eggetarian</option>
                <option value="non_veg_ok">Non-Veg OK</option>
              </select>
              {isDealbreaker(formData, 'prefDiet') && !(formData.prefDiet as string) && <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a specific preference</p>}
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Smoking {isDealbreaker(formData, 'prefSmoking') && <span className="text-red-500">*</span>}</label>
                <DealBreakerToggle field="prefSmoking" formData={formData} setFormData={setFormData} relatedField="prefSmoking" />
              </div>
              <select name="prefSmoking" value={formData.prefSmoking as string || ''} onChange={handlePreferenceChange} className="input-field" required={isDealbreaker(formData, 'prefSmoking')}>
                {!isDealbreaker(formData, 'prefSmoking') && <option value="">Doesn&apos;t Matter</option>}
                {isDealbreaker(formData, 'prefSmoking') && <option value="">Select</option>}
                {PREF_SMOKING_OPTIONS.filter(opt => opt.value !== 'doesnt_matter').map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              {isDealbreaker(formData, 'prefSmoking') && !(formData.prefSmoking as string) && <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a specific preference</p>}
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Drinking {isDealbreaker(formData, 'prefDrinking') && <span className="text-red-500">*</span>}</label>
                <DealBreakerToggle field="prefDrinking" formData={formData} setFormData={setFormData} relatedField="prefDrinking" />
              </div>
              <select name="prefDrinking" value={formData.prefDrinking as string || ''} onChange={handlePreferenceChange} className="input-field" required={isDealbreaker(formData, 'prefDrinking')}>
                {!isDealbreaker(formData, 'prefDrinking') && <option value="">Doesn&apos;t Matter</option>}
                {isDealbreaker(formData, 'prefDrinking') && <option value="">Select</option>}
                {PREF_DRINKING_OPTIONS.filter(opt => opt.value !== 'doesnt_matter').map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              {isDealbreaker(formData, 'prefDrinking') && !(formData.prefDrinking as string) && <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a specific preference</p>}
            </div>
          </div>
        </div>
      )}

      {/* Location Preferences */}
      {!showOnlyRequired && (
        <div className="space-y-3 p-3 rounded-lg border bg-white">
          <h4 className="text-sm font-semibold text-gray-800">Location</h4>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
              <label className="form-label mb-0 text-sm">Preferred Locations (select all that apply)</label>
              <DealBreakerToggle field="prefLocation" formData={formData} setFormData={setFormData} />
            </div>
            <div className="p-3 border rounded bg-gray-50 max-h-36 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PREF_LOCATION_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white px-2 py-1 rounded">
                    <input type="checkbox" checked={isChecked('prefLocationList', opt.value)} onChange={(e) => handleCheckboxChange('prefLocationList', opt.value, e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4" />
                    <span className="truncate">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {prefLocationCount} selected{prefLocationIsDealbreaker ? '' : ' (leave empty for any location)'}
            </p>
            {prefLocationIsDealbreaker && prefLocationCount === 0 && (
              <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select at least one location</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Citizenship</label>
                <DealBreakerToggle field="prefCitizenship" formData={formData} setFormData={setFormData} />
              </div>
              <input
                type="text"
                value={prefCitizenshipSearch || (formData.prefCitizenship as string) || ''}
                onChange={(e) => { setPrefCitizenshipSearch(e.target.value); setShowPrefCitizenshipDropdown(true) }}
                onFocus={() => { setPrefCitizenshipSearch(''); setShowPrefCitizenshipDropdown(true) }}
                className="input-field"
                placeholder={prefCitizenshipIsDealbreaker ? 'Select citizenship' : 'Any citizenship'}
              />
              {showPrefCitizenshipDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-40 overflow-y-auto">
                  {!prefCitizenshipIsDealbreaker && (
                    <button
                      type="button"
                      onClick={() => { setFormData(prev => ({ ...prev, prefCitizenship: '', prefCitizenshipIsDealbreaker: false })); setPrefCitizenshipSearch(''); setShowPrefCitizenshipDropdown(false) }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm font-medium text-primary-600"
                    >
                      Any
                    </button>
                  )}
                  {filteredPrefCitizenship.map((country) => (<button key={country} type="button" onClick={() => handlePrefCitizenshipSelect(country)} className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${country === (formData.prefCitizenship as string) ? 'bg-primary-50 text-primary-700 font-medium' : ''}`}>{country}</button>))}
                </div>
              )}
              {showPrefCitizenshipDropdown && (<div className="fixed inset-0 z-40" onClick={() => setShowPrefCitizenshipDropdown(false)} />)}
              {prefCitizenshipIsDealbreaker && !(formData.prefCitizenship as string) && (
                <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a citizenship</p>
              )}
            </div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Grew Up In</label>
                <DealBreakerToggle field="prefGrewUpIn" formData={formData} setFormData={setFormData} />
              </div>
              <input
                type="text"
                value={prefGrewUpInSearch || (formData.prefGrewUpIn as string) || ''}
                onChange={(e) => { setPrefGrewUpInSearch(e.target.value); setShowPrefGrewUpInDropdown(true) }}
                onFocus={() => { setPrefGrewUpInSearch(''); setShowPrefGrewUpInDropdown(true) }}
                className="input-field"
                placeholder={prefGrewUpInIsDealbreaker ? "Type to search..." : "Doesn't Matter (type to search)"}
              />
              {showPrefGrewUpInDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {!prefGrewUpInIsDealbreaker && (
                    <button
                      type="button"
                      onClick={() => { setFormData(prev => ({ ...prev, prefGrewUpIn: '' })); setPrefGrewUpInSearch(''); setShowPrefGrewUpInDropdown(false) }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm font-medium text-primary-600"
                    >
                      Any
                    </button>
                  )}
                  {filteredPrefGrewUpIn.map((country) => (<button key={country} type="button" onClick={() => handlePrefGrewUpInSelect(country)} className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${country === (formData.prefGrewUpIn as string) ? 'bg-primary-50 text-primary-700 font-medium' : ''}`}>{country}</button>))}
                </div>
              )}
              {showPrefGrewUpInDropdown && (<div className="fixed inset-0 z-40" onClick={() => setShowPrefGrewUpInDropdown(false)} />)}
              {prefGrewUpInIsDealbreaker && (!formData.prefGrewUpIn || formData.prefGrewUpIn === 'doesnt_matter') && (
                <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select where they grew up</p>
              )}
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Open to relocation?</label>
                <DealBreakerToggle field="prefRelocation" formData={formData} setFormData={setFormData} />
              </div>
              <select name="prefRelocation" value={formData.prefRelocation as string || ''} onChange={handlePreferenceChange} className="input-field">
                {prefRelocationIsDealbreaker ? <option value="">Select</option> : <option value="">Doesn&apos;t Matter</option>}
                {PREF_RELOCATION_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              {prefRelocationIsDealbreaker && !(formData.prefRelocation as string) && (
                <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a relocation preference</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Education & Career */}
      {!showOnlyRequired && (
        <div className="space-y-3 p-3 rounded-lg border bg-white">
          <h4 className="text-sm font-semibold text-gray-800">Education & Career</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Minimum Education</label>
                <DealBreakerToggle field="prefEducation" formData={formData} setFormData={setFormData} />
              </div>
              <select name="prefQualification" value={formData.prefQualification as string || ''} onChange={handlePreferenceChange} className="input-field">
                {prefEducationIsDealbreaker ? <option value="">Select</option> : <option value="">Doesn&apos;t Matter</option>}
                {PREF_EDUCATION_OPTIONS.filter(opt => opt.value !== 'doesnt_matter').map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              {prefEducationIsDealbreaker && !(formData.prefQualification as string) && (
                <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a minimum education</p>
              )}
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Minimum Income</label>
                <DealBreakerToggle field="prefIncome" formData={formData} setFormData={setFormData} />
              </div>
              <select name="prefIncome" value={formData.prefIncome as string || ''} onChange={handlePreferenceChange} className="input-field">
                {prefIncomeIsDealbreaker ? <option value="">Select</option> : <option value="">Doesn&apos;t Matter</option>}
                {PREF_INCOME_OPTIONS.filter(opt => opt.value !== 'doesnt_matter').map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              {prefIncomeIsDealbreaker && !(formData.prefIncome as string) && (
                <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a minimum income</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Family Preferences */}
      {!showOnlyRequired && (
        <div className="space-y-3 p-3 rounded-lg border bg-white">
          <h4 className="text-sm font-semibold text-gray-800">Family Preferences</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Family Values</label>
                <DealBreakerToggle field="prefFamilyValues" formData={formData} setFormData={setFormData} />
              </div>
              <select name="prefFamilyValues" value={formData.prefFamilyValues as string || (isDealbreaker(formData, 'prefFamilyValues') ? '' : 'doesnt_matter')} onChange={handlePreferenceChange} className="input-field">
                {!isDealbreaker(formData, 'prefFamilyValues') && <option value="doesnt_matter">Doesn&apos;t Matter</option>}
                {isDealbreaker(formData, 'prefFamilyValues') && <option value="">Select</option>}
                <option value="traditional">Traditional</option>
                <option value="moderate">Moderate</option>
                <option value="liberal">Liberal</option>
              </select>
              {isDealbreaker(formData, 'prefFamilyValues') && !(formData.prefFamilyValues as string) && <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a specific preference</p>}
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <label className="form-label mb-0">Family Location Country</label>
                <DealBreakerToggle field="prefFamilyLocationCountry" formData={formData} setFormData={setFormData} />
              </div>
              <select name="prefFamilyLocationCountry" value={formData.prefFamilyLocationCountry as string || (isDealbreaker(formData, 'prefFamilyLocationCountry') ? '' : 'doesnt_matter')} onChange={handlePreferenceChange} className="input-field">
                {!isDealbreaker(formData, 'prefFamilyLocationCountry') && <option value="doesnt_matter">Doesn&apos;t Matter</option>}
                {isDealbreaker(formData, 'prefFamilyLocationCountry') && <option value="">Select</option>}
                {FAMILY_LOCATION_COUNTRIES.filter(c => c !== 'Other').map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {isDealbreaker(formData, 'prefFamilyLocationCountry') && !(formData.prefFamilyLocationCountry as string) && <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select a specific preference</p>}
            </div>
          </div>
        </div>
      )}

      {/* Mother Tongue & Sub-Community */}
      {!showOnlyRequired && (
        <div className="space-y-3 p-3 rounded-lg border bg-white">
          {/* Mother Tongue - Multi-select */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
              <label className="form-label mb-0">Mother Tongue (select all that apply)</label>
              <DealBreakerToggle field="prefMotherTongue" formData={formData} setFormData={setFormData} />
            </div>
            <div className="p-2 border rounded bg-gray-50 max-h-28 overflow-y-auto">
              <div className="grid grid-cols-4 gap-1">
                {PREF_MOTHER_TONGUE_OPTIONS.filter(opt => opt.value !== 'doesnt_matter').map((opt) => (
                  <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer hover:bg-white px-1.5 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={isChecked('prefMotherTongueList', opt.value)}
                      onChange={(e) => handleCheckboxChange('prefMotherTongueList', opt.value, e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                    />
                    <span className="truncate">{opt.label}</span>
                  </label>
                ))}
                {/* Other option */}
                <label className="flex items-center gap-1.5 text-sm cursor-pointer hover:bg-white px-1.5 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={isChecked('prefMotherTongueList', 'Other')}
                    onChange={(e) => handleCheckboxChange('prefMotherTongueList', 'Other', e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                  />
                  <span className="truncate">Other</span>
                </label>
              </div>
            </div>
            {/* Text box for specifying other language when "Other" is selected */}
            {isChecked('prefMotherTongueList', 'Other') && (
              <input
                type="text"
                name="prefMotherTongueOther"
                value={formData.prefMotherTongueOther as string || ''}
                onChange={handleChange}
                className="input-field mt-2"
                placeholder="Specify other language(s)"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              {prefMotherTongueCount} selected{prefMotherTongueIsDealbreaker ? '' : ' (leave empty for any)'}
            </p>
            {prefMotherTongueIsDealbreaker && prefMotherTongueCount === 0 && (
              <p className="text-xs text-red-500 mt-1">Deal-breaker: Must select at least one language</p>
            )}
          </div>
          {/* Sub-Community - Multi-select based on selected religion/community */}
          <div>
            <label className="form-label mb-1">Sub-Community (select all that apply)</label>
            <div className="p-2 border rounded bg-gray-50 max-h-28 overflow-y-auto">
              <div className="grid grid-cols-3 gap-1">
                {prefReligion && prefReligion !== 'doesnt_matter' && (formData.prefCommunity as string) && (formData.prefCommunity as string) !== 'doesnt_matter' && (
                  getSubCommunities(prefReligion, formData.prefCommunity as string).map((subCommunity) => (
                    <label key={subCommunity} className="flex items-center gap-1.5 text-sm cursor-pointer hover:bg-white px-1.5 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={isChecked('prefSubCommunityList', subCommunity)}
                        onChange={(e) => handleCheckboxChange('prefSubCommunityList', subCommunity, e.target.checked)}
                        className="rounded text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                      />
                      <span className="truncate">{subCommunity}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(formData.prefSubCommunityList as string || '').split(', ').filter(v => v).length || 0} selected
              {(!prefReligion || prefReligion === 'doesnt_matter' || !(formData.prefCommunity as string) || (formData.prefCommunity as string) === 'doesnt_matter') && ' (select a specific community in Religion section to see sub-communities)'}
            </p>
          </div>
          {/* Pets */}
          <div>
            <label className="form-label mb-1">Pets</label>
            <select name="prefPets" value={formData.prefPets as string || 'doesnt_matter'} onChange={handleChange} className="input-field">
              <option value="doesnt_matter">Doesn&apos;t Matter</option>
              {PREF_PETS_OPTIONS.filter(opt => opt.value !== 'doesnt_matter').map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          {/* Hobbies */}
          <div>
            <label className="form-label mb-1">Hobbies</label>
            <select name="prefHobbies" value={formData.prefHobbies as string || 'doesnt_matter'} onChange={handleChange} className="input-field">
              <option value="doesnt_matter">Doesn&apos;t Matter</option>
            </select>
          </div>
          {/* Fitness */}
          <div>
            <label className="form-label mb-1">Fitness & Sports</label>
            <select name="prefFitness" value={formData.prefFitness as string || 'doesnt_matter'} onChange={handleChange} className="input-field">
              <option value="doesnt_matter">Doesn&apos;t Matter</option>
            </select>
          </div>
          {/* Interests */}
          <div>
            <label className="form-label mb-1">Interests</label>
            <select name="prefInterests" value={formData.prefInterests as string || 'doesnt_matter'} onChange={handleChange} className="input-field">
              <option value="doesnt_matter">Doesn&apos;t Matter</option>
            </select>
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {!showOnlyRequired && (
        <div className="space-y-2 p-3 rounded-lg border bg-white">
          <h4 className="text-sm font-semibold text-gray-800">Additional Notes (Optional)</h4>
          <textarea
            name="idealPartnerDesc"
            value={formData.idealPartnerDesc as string || ''}
            onChange={handleChange}
            className="input-field min-h-[80px]"
            placeholder="Any other preferences or qualities you're looking for in a partner..."
          />
        </div>
      )}
    </div>
  )
}

// Keep old PreferencesSection for backwards compatibility (edit profile pages)
export function PreferencesSection({ formData, handleChange, setFormData }: SectionProps) {
  return (
    <div className="space-y-6">
      <PreferencesMustHavesSection formData={formData} handleChange={handleChange} setFormData={setFormData} />
      <hr className="border-gray-200" />
      <PreferencesNiceToHavesSection formData={formData} handleChange={handleChange} setFormData={setFormData} />
    </div>
  )
}

// Page 1: Core preferences (Age, Height, Marital Status, Religion, Lifestyle)
export function PreferencesPage1Section({ formData, handleChange, setFormData }: SectionProps) {
  return <PreferencesUnifiedSection formData={formData} handleChange={handleChange} setFormData={setFormData} showOnlyRequired />
}

// Page 2: Additional preferences (Location, Education, Family, Other, Notes)
export function PreferencesPage2Section({ formData, handleChange, setFormData }: SectionProps) {
  return <PreferencesUnifiedSection formData={formData} handleChange={handleChange} setFormData={setFormData} showOnlyOptional />
}

export function ReferralSection({ formData, handleChange }: SectionProps) {
  return (
    <>
      <div>
        <label className="form-label">How did you hear about us? <span className="text-red-500">*</span></label>
        <select name="referralSource" value={formData.referralSource as string || ''} onChange={handleChange} className="input-field" required>
          <option value="">Select</option>
          <option value="friend">Friend</option>
          <option value="family">Family/Relative</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="whatsapp">WhatsApp Message</option>
          <option value="linkedin">LinkedIn</option>
          <option value="youtube">YouTube</option>
          <option value="google">Google Search</option>
          <option value="temple">Temple/Religious Organization</option>
          <option value="community_event">Community Event/Meetup</option>
          <option value="organization">Other Organization</option>
          <option value="advertisement">Advertisement</option>
          <option value="other">Other</option>
        </select>
        {(formData.referralSource as string) === 'other' && (
          <input
            type="text"
            name="referralSourceOther"
            value={formData.referralSourceOther as string || ''}
            onChange={handleChange}
            className="input-field mt-2"
            placeholder="Please specify how you heard about us"
          />
        )}
        {(formData.referralSource as string) === 'organization' && (
          <input
            type="text"
            name="referralOrganization"
            value={formData.referralOrganization as string || ''}
            onChange={handleChange}
            className="input-field mt-2"
            placeholder="Organization name"
          />
        )}
      </div>
    </>
  )
}

// Contact Details Section - for editing email and social profiles
// Note: Phone is collected during signup only and cannot be edited here
export function ContactSection({ formData, handleChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          name="email"
          value={formData.email as string || ''}
          onChange={handleChange}
          className="input-field"
          placeholder="your@email.com"
          required
        />
        <p className="text-xs text-gray-500 mt-1">This will be used for account login and notifications</p>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Social Profiles (Optional)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">LinkedIn Profile</label>
            <input
              type="url"
              name="linkedinProfile"
              value={formData.linkedinProfile as string || ''}
              onChange={handleChange}
              className="input-field"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div>
            <label className="form-label">Instagram Handle</label>
            <input
              type="text"
              name="instagram"
              value={formData.instagram as string || ''}
              onChange={handleChange}
              className="input-field"
              placeholder="@yourhandle"
            />
          </div>
          <div>
            <label className="form-label">Facebook Profile</label>
            <input
              type="url"
              name="facebook"
              value={formData.facebook as string || ''}
              onChange={handleChange}
              className="input-field"
              placeholder="https://facebook.com/yourprofile"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
