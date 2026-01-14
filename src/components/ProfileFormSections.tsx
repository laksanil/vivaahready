'use client'

import { useState } from 'react'
import { HEIGHT_OPTIONS, PREF_AGE_MIN_MAX, PREF_INCOME_OPTIONS, PREF_LOCATION_OPTIONS, QUALIFICATION_OPTIONS, PREF_EDUCATION_OPTIONS, OCCUPATION_OPTIONS, HOBBIES_OPTIONS, FITNESS_OPTIONS, INTERESTS_OPTIONS, US_UNIVERSITIES, US_VISA_STATUS_OPTIONS, COUNTRIES_LIST, RAASI_OPTIONS, NAKSHATRA_OPTIONS, DOSHAS_OPTIONS, PREF_SMOKING_OPTIONS, PREF_DRINKING_OPTIONS, PREF_WORK_AREA_OPTIONS, PREF_MARITAL_STATUS_OPTIONS, PREF_RELOCATION_OPTIONS, PREF_MOTHER_TONGUE_OPTIONS, PREF_PETS_OPTIONS, PREF_COMMUNITY_OPTIONS } from '@/lib/constants'
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

interface SectionProps {
  formData: Record<string, unknown>
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
}

export function BasicsSection({ formData, handleChange, setFormData }: SectionProps) {
  const [zipLookupLoading, setZipLookupLoading] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [grewUpInSearch, setGrewUpInSearch] = useState('')
  const [showGrewUpInDropdown, setShowGrewUpInDropdown] = useState(false)
  const [citizenshipSearch, setCitizenshipSearch] = useState('')
  const [showCitizenshipDropdown, setShowCitizenshipDropdown] = useState(false)

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

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

    setFormData(prev => ({ ...prev, dateOfBirth: formatted }))
  }

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
    <div className="space-y-6">
      {/* Profile & Personal Identity */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Personal Identity</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Created By <span className="text-red-500">*</span></label>
            <select name="createdBy" value={formData.createdBy as string || ''} onChange={handleChange} className="input-field">
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
            <select name="gender" value={formData.gender as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="form-label">First Name <span className="text-red-500">*</span></label>
            <input type="text" name="firstName" value={formData.firstName as string || ''} onChange={handleChange} className="input-field" placeholder="First name" />
          </div>
          <div>
            <label className="form-label">Last Name <span className="text-red-500">*</span></label>
            <input type="text" name="lastName" value={formData.lastName as string || ''} onChange={handleChange} className="input-field" placeholder="Last name" />
          </div>
        </div>
      </div>

      {/* Age & Physical Attributes */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Age & Physical Details</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Date of Birth <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="dateOfBirth"
              value={formData.dateOfBirth as string || ''}
              onChange={handleDateOfBirthChange}
              className="input-field"
              placeholder="MM/DD/YYYY"
              maxLength={10}
            />
          </div>
          <div>
            <label className="form-label">Age (optional)</label>
            <input
              type="number"
              name="age"
              value={formData.age as string || ''}
              onChange={handleChange}
              className="input-field"
              placeholder="Or enter age"
              min={18}
              max={99}
            />
          </div>
          <div>
            <label className="form-label">Height <span className="text-red-500">*</span></label>
            <select name="height" value={formData.height as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
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
            <select name="maritalStatus" value={formData.maritalStatus as string || 'never_married'} onChange={handleChange} className="input-field">
              <option value="never_married">Never Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="awaiting_divorce">Awaiting Divorce</option>
            </select>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Location</h4>
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
                    <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent animate-spin" />
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
          {/* Citizenship - Searchable Dropdown */}
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
          </div>
        )}
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

  const handleLanguageCheckbox = (language: string, checked: boolean) => {
    const current = (formData.languagesKnown as string || '').split(', ').filter(l => l)
    if (checked) {
      setFormData(prev => ({ ...prev, languagesKnown: [...current, language].join(', ') }))
    } else {
      setFormData(prev => ({ ...prev, languagesKnown: current.filter(l => l !== language).join(', ') }))
    }
  }

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
        <label className="form-label">Annual Income (USD)</label>
        <select name="annualIncome" value={formData.annualIncome as string || ''} onChange={handleChange} className="input-field">
          <option value="">Select</option>
          <option value="<50k">Less than $50k</option>
          <option value="50k-75k">$50k - $75k</option>
          <option value="75k-100k">$75k - $100k</option>
          <option value="100k-150k">$100k - $150k</option>
          <option value="150k-200k">$150k - $200k</option>
          <option value=">200k">More than $200k</option>
        </select>
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

      {/* Language & Background */}
      <div className="space-y-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Language & Background</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Mother Tongue <span className="text-red-500">*</span></label>
            <select name="motherTongue" value={formData.motherTongue as string || ''} onChange={handleChange} className="input-field">
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
            <div className="p-2 border bg-gray-50 max-h-32 overflow-y-auto">
              <div className="grid grid-cols-3 gap-1">
                {LANGUAGES.map(lang => (
                  <label key={lang} className="flex items-center text-sm">
                    <input type="checkbox" checked={(formData.languagesKnown as string || '').includes(lang)} onChange={(e) => handleLanguageCheckbox(lang, e.target.checked)} className="mr-1" />
                    {lang}
                  </label>
                ))}
                <label className="flex items-center text-sm">
                  <input type="checkbox" checked={(formData.languagesKnown as string || '').includes('Other')} onChange={(e) => handleLanguageCheckbox('Other', e.target.checked)} className="mr-1" />
                  Other
                </label>
              </div>
            </div>
            {(formData.languagesKnown as string || '').includes('Other') && (
              <input type="text" name="languagesKnownOther" value={formData.languagesKnownOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify other languages" />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export function FamilySection({ formData, handleChange }: SectionProps) {
  return (
    <>
      {/* Family Location & Type */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="form-label">Lives with Family?</label>
          <select name="livesWithFamily" value={formData.livesWithFamily as string || ''} onChange={handleChange} className="input-field">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className="form-label">Family Location</label>
          <input type="text" name="familyLocation" value={formData.familyLocation as string || ''} onChange={handleChange} className="input-field" placeholder="Bay Area, CA" />
        </div>
        <div>
          <label className="form-label">Family Type</label>
          <select name="familyType" value={formData.familyType as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="nuclear">Nuclear</option>
            <option value="joint">Joint</option>
            <option value="extended">Extended</option>
          </select>
        </div>
        <div>
          <label className="form-label">Family Values</label>
          <select name="familyValues" value={formData.familyValues as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="traditional">Traditional</option>
            <option value="moderate">Moderate</option>
            <option value="liberal">Liberal</option>
          </select>
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

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Diet <span className="text-red-500">*</span></label>
          <select name="dietaryPreference" value={formData.dietaryPreference as string || ''} onChange={handleChange} className="input-field" required>
            <option value="">Select</option>
            <option value="veg">Vegetarian</option>
            <option value="non_veg">Non-Vegetarian</option>
            <option value="occasionally_non_veg">Occasionally Non-Veg</option>
            <option value="eggetarian">Eggetarian</option>
            <option value="vegan">Vegan</option>
            <option value="jain">Jain</option>
          </select>
        </div>
        <div>
          <label className="form-label">Smoking <span className="text-red-500">*</span></label>
          <select name="smoking" value={formData.smoking as string || ''} onChange={handleChange} className="input-field" required>
            <option value="">Select</option>
            <option value="no">No</option>
            <option value="occasionally">Occasionally</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className="form-label">Drinking <span className="text-red-500">*</span></label>
          <select name="drinking" value={formData.drinking as string || ''} onChange={handleChange} className="input-field" required>
            <option value="">Select</option>
            <option value="no">No</option>
            <option value="social">Social Drinker</option>
            <option value="yes">Yes</option>
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
        <label className="form-label">Pets</label>
        <select name="pets" value={formData.pets as string || ''} onChange={handleChange} className="input-field">
          <option value="">Select</option>
          <option value="have_love">Have pets and love them</option>
          <option value="no_but_love">Don't have, but love pets</option>
          <option value="no_but_open">Don't have, but open to having</option>
          <option value="prefer_not">Prefer not to have pets</option>
          <option value="allergic">Allergic to pets</option>
        </select>
      </div>

      {/* Health & Wellness Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Health & Wellness</h4>
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="form-label">Health Information</label>
            <select name="healthInfo" value={formData.healthInfo as string || ''} onChange={handleChange} className="input-field">
              <option value="">Select</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="other">Other (please specify)</option>
            </select>
          </div>
        </div>
        {formData.healthInfo === 'other' && (
          <div>
            <label className="form-label">Please specify health details</label>
            <input type="text" name="healthInfoOther" value={formData.healthInfoOther as string || ''} onChange={handleChange} className="input-field" placeholder="Enter health details" />
          </div>
        )}
        <div>
          <label className="form-label">Any Disability</label>
          <select name="anyDisability" value={formData.anyDisability as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="none">None</option>
            <option value="physical">Physical</option>
            <option value="other">Other</option>
          </select>
        </div>
        {(formData.anyDisability === 'physical' || formData.anyDisability === 'other') && (
          <div>
            <label className="form-label">Please specify disability details</label>
            <input type="text" name="disabilityDetails" value={formData.disabilityDetails as string || ''} onChange={handleChange} className="input-field" placeholder="Enter details" />
          </div>
        )}
        <div>
          <label className="form-label">Allergies or Medical Conditions</label>
          <textarea name="allergiesOrMedical" value={formData.allergiesOrMedical as string || ''} onChange={handleChange} className="input-field min-h-[60px]" placeholder="e.g., None, Peanut allergy" />
        </div>
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
    handleChange(e)
    setFormData(prev => ({ ...prev, community: '', subCommunity: '' }))
  }

  // Handle community change - reset sub-community
  const handleCommunityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange(e)
    setFormData(prev => ({ ...prev, subCommunity: '' }))
  }

  return (
    <>
      {/* Basic Religion Info - shown for all */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Religion</label>
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
          <label className="form-label">Community</label>
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
              <label className="form-label">Gothra</label>
              <input type="text" name="gotra" value={formData.gotra as string || ''} onChange={handleChange} className="input-field" placeholder="e.g., Bharadwaj" />
            </div>
            <div>
              <label className="form-label">Time of Birth</label>
              <input type="text" name="timeOfBirth" value={formData.timeOfBirth as string || ''} onChange={handleChange} className="input-field" placeholder="HH:MM AM/PM" />
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
            <label className="form-label">Gothra</label>
            <input type="text" name="gotra" value={formData.gotra as string || ''} onChange={handleChange} className="input-field" placeholder="e.g., Kashyap" />
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

export function PreferencesSection({ formData, handleChange, setFormData }: SectionProps) {
  const [prefCitizenshipSearch, setPrefCitizenshipSearch] = useState('')
  const [showPrefCitizenshipDropdown, setShowPrefCitizenshipDropdown] = useState(false)

  const filteredPrefCitizenship = COUNTRIES_LIST.filter(country =>
    country.toLowerCase().includes(prefCitizenshipSearch.toLowerCase())
  )

  const handlePrefCitizenshipSelect = (country: string) => {
    setFormData(prev => ({ ...prev, prefCitizenship: country }))
    setPrefCitizenshipSearch('')
    setShowPrefCitizenshipDropdown(false)
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

  // Gender-based age defaults:
  // For male profiles: default max age = user's age (looking for same age or younger)
  // For female profiles: default min age = user's age (looking for same age or older)
  const userAge = formData.age as string || ''
  const userGender = formData.gender as string || ''

  const getDefaultAgeMin = () => {
    if (formData.prefAgeMin) return formData.prefAgeMin as string
    if (userGender === 'female' && userAge) return userAge
    return ''
  }

  const getDefaultAgeMax = () => {
    if (formData.prefAgeMax) return formData.prefAgeMax as string
    if (userGender === 'male' && userAge) return userAge
    return ''
  }

  return (
    <div className="space-y-6">
      {/* Basic Preferences Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Basic Preferences</h4>

        {/* Marital Status Preference */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Partner&apos;s Marital Status <span className="text-red-500">*</span></label>
            <select
              name="prefMaritalStatus"
              value={formData.prefMaritalStatus as string || 'never_married'}
              onChange={handleChange}
              className="input-field"
              required
            >
              {PREF_MARITAL_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Mother Tongue Preference</label>
            <select
              name="prefMotherTongue"
              value={formData.prefMotherTongue as string || 'doesnt_matter'}
              onChange={handleChange}
              className="input-field"
            >
              {PREF_MOTHER_TONGUE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Age Range - Min/Max with gender-based defaults */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Age Range <span className="text-red-500">*</span> {userAge && <span className="text-xs text-gray-500">(Your age: {userAge})</span>}</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                name="prefAgeMin"
                value={getDefaultAgeMin()}
                onChange={handleChange}
                className="input-field text-sm"
                required
              >
                <option value="">Min Age</option>
                {PREF_AGE_MIN_MAX.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                name="prefAgeMax"
                value={getDefaultAgeMax()}
                onChange={handleChange}
                className="input-field text-sm"
                required
              >
                <option value="">Max Age</option>
                {PREF_AGE_MIN_MAX.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {userGender && userAge && (
              <p className="text-xs text-gray-500 mt-1">
                {userGender === 'male'
                  ? 'Default: Max age set to your age (looking for same age or younger)'
                  : 'Default: Min age set to your age (looking for same age or older)'}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Height Range <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              <select
                name="prefHeightMin"
                value={formData.prefHeightMin as string || ''}
                onChange={handleChange}
                className="input-field text-sm"
                required
              >
                <option value="">Min</option>
                {HEIGHT_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>{h.value}</option>
                ))}
              </select>
              <select
                name="prefHeightMax"
                value={formData.prefHeightMax as string || ''}
                onChange={handleChange}
                className="input-field text-sm"
                required
              >
                <option value="">Max</option>
                {HEIGHT_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>{h.value}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Background Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Location & Background</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Preferred Location (US)</label>
            <select name="prefLocation" value={formData.prefLocation as string || ''} onChange={handleChange} className="input-field">
              <option value="">Doesn&apos;t Matter</option>
              {PREF_LOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Citizenship - Searchable Dropdown */}
          <div className="relative">
            <label className="form-label">Preferred Citizenship</label>
            <input
              type="text"
              value={prefCitizenshipSearch || (formData.prefCitizenship as string) || ''}
              onChange={(e) => {
                setPrefCitizenshipSearch(e.target.value)
                setShowPrefCitizenshipDropdown(true)
              }}
              onFocus={() => {
                setPrefCitizenshipSearch('')
                setShowPrefCitizenshipDropdown(true)
              }}
              className="input-field"
              placeholder="Any or type to search..."
            />
            {showPrefCitizenshipDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, prefCitizenship: '' }))
                    setPrefCitizenshipSearch('')
                    setShowPrefCitizenshipDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm font-medium text-primary-600"
                >
                  Doesn&apos;t Matter
                </button>
                {filteredPrefCitizenship.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handlePrefCitizenshipSelect(country)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${
                      country === (formData.prefCitizenship as string) ? 'bg-primary-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}
            {showPrefCitizenshipDropdown && (
              <div className="fixed inset-0 z-40" onClick={() => setShowPrefCitizenshipDropdown(false)} />
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Partner Grew Up In</label>
            <select name="prefGrewUpIn" value={formData.prefGrewUpIn as string || 'doesnt_matter'} onChange={handleChange} className="input-field">
              <option value="doesnt_matter">Doesn&apos;t Matter</option>
              <option value="same_as_mine">Same as Mine ({formData.grewUpIn as string || 'USA'})</option>
              <option value="USA">USA</option>
              <option value="India">India</option>
              <option value="UK">UK</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
            </select>
          </div>
          <div>
            <label className="form-label">Relocation Preference</label>
            <select name="prefRelocation" value={formData.prefRelocation as string || 'doesnt_matter'} onChange={handleChange} className="input-field">
              {PREF_RELOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Minimum Income</label>
            <select name="prefIncome" value={formData.prefIncome as string || ''} onChange={handleChange} className="input-field">
              <option value="">Doesn&apos;t Matter</option>
              {PREF_INCOME_OPTIONS.filter(opt => opt.value !== 'doesnt_matter').map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            {/* Empty for alignment */}
          </div>
        </div>
      </div>

      {/* Education & Career Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Education & Career</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Minimum Education</label>
            <select name="prefQualification" value={formData.prefQualification as string || ''} onChange={handleChange} className="input-field">
              <option value="">Doesn&apos;t Matter</option>
              {PREF_EDUCATION_OPTIONS.filter(opt => opt.value !== 'doesnt_matter').map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Work Area / Industry</label>
            <select name="prefWorkArea" value={formData.prefWorkArea as string || ''} onChange={handleChange} className="input-field">
              {PREF_WORK_AREA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Preferred Occupation</label>
            <select name="prefOccupation" value={formData.prefOccupation as string || ''} onChange={handleChange} className="input-field">
              <option value="">Doesn&apos;t Matter</option>
              {OCCUPATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            {/* Empty for alignment */}
          </div>
        </div>
      </div>

      {/* Lifestyle Preferences Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Lifestyle</h4>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="form-label">Diet Preference</label>
            <select name="prefDiet" value={formData.prefDiet as string || ''} onChange={handleChange} className="input-field">
              <option value="">Doesn&apos;t Matter</option>
              <option value="veg">Vegetarian Only</option>
              <option value="veg_eggetarian">Veg / Eggetarian</option>
              <option value="non_veg_ok">Non-Veg OK</option>
            </select>
          </div>
          <div>
            <label className="form-label">Smoking</label>
            <select name="prefSmoking" value={formData.prefSmoking as string || ''} onChange={handleChange} className="input-field">
              {PREF_SMOKING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Drinking</label>
            <select name="prefDrinking" value={formData.prefDrinking as string || ''} onChange={handleChange} className="input-field">
              {PREF_DRINKING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Pets Preference</label>
            <select name="prefPets" value={formData.prefPets as string || 'doesnt_matter'} onChange={handleChange} className="input-field">
              {PREF_PETS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Religion & Community Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Religion & Community</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Preferred Community</label>
            <select
              name="prefCommunity"
              value={formData.prefCommunity as string || 'same_as_mine'}
              onChange={handleChange}
              className="input-field"
            >
              {PREF_COMMUNITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Gothra Preference</label>
            <select name="prefGotra" value={formData.prefGotra as string || ''} onChange={handleChange} className="input-field">
              <option value="">Doesn&apos;t Matter</option>
              <option value="different">Different Gothra Only</option>
            </select>
          </div>
        </div>

        {/* Show community multi-select when "specific" is selected */}
        {(formData.prefCommunity as string) === 'specific' && (
          <div className="p-3 border  bg-gray-50">
            <label className="text-xs font-medium text-gray-600 mb-2 block">Select preferred communities:</label>
            <div className="max-h-48 overflow-y-auto">
              {/* Group by religion */}
              {Object.entries(
                getAllCommunities().reduce((acc, item) => {
                  if (!acc[item.religion]) acc[item.religion] = [];
                  acc[item.religion].push(item.community);
                  return acc;
                }, {} as Record<string, string[]>)
              ).map(([religion, communities]) => (
                <div key={religion} className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1 sticky top-0 bg-gray-50 py-1">{religion}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pl-2">
                    {communities.map(community => (
                      <label key={`${religion}-${community}`} className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-white p-1 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked('prefCommunityList', `${religion}:${community}`)}
                          onChange={(e) => handleCheckboxChange('prefCommunityList', `${religion}:${community}`, e.target.checked)}
                          className="rounded text-primary-600 focus:ring-primary-500 h-3 w-3"
                        />
                        <span className="text-gray-700 truncate">{community}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: {(formData.prefCommunityList as string || '').split(', ').filter(c => c).length} communities
            </p>
          </div>
        )}
      </div>

      {/* Interests & Activities Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Interests & Activities (Optional)</h4>

        <div className="grid grid-cols-3 gap-4">
          {/* Hobbies Preference */}
          <div>
            <label className="form-label text-xs">Partner&apos;s Hobbies</label>
            <select
              name="prefHobbies"
              value={formData.prefHobbies as string || 'doesnt_matter'}
              onChange={handleChange}
              className="input-field text-sm"
            >
              <option value="doesnt_matter">Doesn&apos;t Matter</option>
              <option value="same_as_mine">Same as Mine</option>
              <option value="specific">Specific</option>
            </select>
          </div>

          {/* Fitness Preference */}
          <div>
            <label className="form-label text-xs">Partner&apos;s Fitness</label>
            <select
              name="prefFitness"
              value={formData.prefFitness as string || 'doesnt_matter'}
              onChange={handleChange}
              className="input-field text-sm"
            >
              <option value="doesnt_matter">Doesn&apos;t Matter</option>
              <option value="same_as_mine">Same as Mine</option>
              <option value="specific">Specific</option>
            </select>
          </div>

          {/* Interests Preference */}
          <div>
            <label className="form-label text-xs">Partner&apos;s Interests</label>
            <select
              name="prefInterests"
              value={formData.prefInterests as string || 'doesnt_matter'}
              onChange={handleChange}
              className="input-field text-sm"
            >
              <option value="doesnt_matter">Doesn&apos;t Matter</option>
              <option value="same_as_mine">Same as Mine</option>
              <option value="specific">Specific</option>
            </select>
          </div>
        </div>

        {/* Expandable sections for specific selections */}
        {(formData.prefHobbies as string) === 'specific' && (
          <div className="p-3 border  bg-gray-50">
            <label className="text-xs font-medium text-gray-600 mb-2 block">Select preferred hobbies:</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
              {HOBBIES_OPTIONS.map(hobby => (
                <label key={hobby} className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-white p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={isChecked('prefHobbiesList', hobby)}
                    onChange={(e) => handleCheckboxChange('prefHobbiesList', hobby, e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 h-3 w-3"
                  />
                  <span className="text-gray-700 truncate">{hobby}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {(formData.prefFitness as string) === 'specific' && (
          <div className="p-3 border  bg-gray-50">
            <label className="text-xs font-medium text-gray-600 mb-2 block">Select preferred activities:</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
              {FITNESS_OPTIONS.map(fitness => (
                <label key={fitness} className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-white p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={isChecked('prefFitnessList', fitness)}
                    onChange={(e) => handleCheckboxChange('prefFitnessList', fitness, e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 h-3 w-3"
                  />
                  <span className="text-gray-700 truncate">{fitness}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {(formData.prefInterests as string) === 'specific' && (
          <div className="p-3 border  bg-gray-50">
            <label className="text-xs font-medium text-gray-600 mb-2 block">Select preferred interests:</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
              {INTERESTS_OPTIONS.map(interest => (
                <label key={interest} className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-white p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={isChecked('prefInterestsList', interest)}
                    onChange={(e) => handleCheckboxChange('prefInterestsList', interest, e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 h-3 w-3"
                  />
                  <span className="text-gray-700 truncate">{interest}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Notes Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Additional Notes</h4>
        <div>
          <label className="form-label">Describe Your Ideal Partner</label>
          <textarea
            name="idealPartnerDesc"
            value={formData.idealPartnerDesc as string || ''}
            onChange={handleChange}
            className="input-field min-h-[80px]"
            placeholder="Share any additional preferences or qualities you're looking for in a partner..."
          />
          <p className="text-xs text-gray-500 mt-1">Optional: Add any details not covered above</p>
        </div>
      </div>
    </div>
  )
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
