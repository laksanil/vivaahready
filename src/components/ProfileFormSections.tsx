'use client'

import { HEIGHT_OPTIONS, PREF_AGE_OPTIONS, PREF_INCOME_OPTIONS, PREF_LOCATION_OPTIONS, QUALIFICATION_OPTIONS, PREF_EDUCATION_OPTIONS, OCCUPATION_OPTIONS } from '@/lib/constants'

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


  return (
    <div className="space-y-5">
      <div>
        <label className="form-label">Profile Created By <span className="text-red-500">*</span></label>
        <select name="createdBy" value={formData.createdBy as string || ''} onChange={handleChange} className="input-field">
          <option value="">Choose who is creating this profile</option>
          <option value="self">Self</option>
          <option value="parent">Parent</option>
          <option value="sibling">Sibling</option>
          <option value="relative">Relative</option>
          <option value="friend">Friend</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">First Name <span className="text-red-500">*</span></label>
          <input type="text" name="firstName" value={formData.firstName as string || ''} onChange={handleChange} className="input-field" placeholder="Enter first name" />
        </div>
        <div>
          <label className="form-label">Last Name <span className="text-red-500">*</span></label>
          <input type="text" name="lastName" value={formData.lastName as string || ''} onChange={handleChange} className="input-field" placeholder="Enter last name" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Gender <span className="text-red-500">*</span></label>
          <select name="gender" value={formData.gender as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Height <span className="text-red-500">*</span></label>
          <select
            name="height"
            value={formData.height as string || ''}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Select height</option>
            {HEIGHT_OPTIONS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Weight (lbs)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight as string || ''}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter weight"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Marital Status <span className="text-red-500">*</span></label>
          <select name="maritalStatus" value={formData.maritalStatus as string || 'never_married'} onChange={handleChange} className="input-field">
            <option value="never_married">Never Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
            <option value="awaiting_divorce">Awaiting Divorce</option>
          </select>
        </div>
        <div>
          <label className="form-label">Blood Group</label>
          <select name="bloodGroup" value={formData.bloodGroup as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select blood group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Health Information</label>
          <select name="healthInfo" value={formData.healthInfo as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="no_health_issues">No Health Issues</option>
            <option value="diabetes">Diabetes</option>
            <option value="heart_condition">Heart Condition</option>
            <option value="other">Other</option>
          </select>
          {(formData.healthInfo as string) === 'other' && (
            <input type="text" name="healthInfoOther" value={formData.healthInfoOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Please specify health condition" />
          )}
        </div>
        <div>
          <label className="form-label">Any Disability</label>
          <select name="anyDisability" value={formData.anyDisability as string || 'none'} onChange={handleChange} className="input-field">
            <option value="none">None</option>
            <option value="physical">Physically Challenged</option>
            <option value="visually_impaired">Visually Impaired</option>
            <option value="hearing_impaired">Hearing Impaired</option>
            <option value="speech_impaired">Speech Impaired</option>
            <option value="other">Other</option>
          </select>
          {(formData.anyDisability as string) && (formData.anyDisability as string) !== 'none' && (
            <input type="text" name="disabilityDetails" value={formData.disabilityDetails as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Please specify details" />
          )}
        </div>
      </div>
    </div>
  )
}

export function LocationSection({ formData, handleChange, setFormData }: SectionProps) {
  const handleLanguageCheckbox = (language: string, checked: boolean) => {
    const current = (formData.languagesKnown as string || '').split(', ').filter(l => l)
    if (checked) {
      setFormData(prev => ({ ...prev, languagesKnown: [...current, language].join(', ') }))
    } else {
      setFormData(prev => ({ ...prev, languagesKnown: current.filter(l => l !== language).join(', ') }))
    }
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Country</label>
          <select name="country" value={formData.country as string || 'USA'} onChange={handleChange} className="input-field">
            <option value="USA">USA</option>
            <option value="India">India</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Other">Other</option>
          </select>
          {(formData.country as string) === 'Other' && (
            <input type="text" name="countryOther" value={formData.countryOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify country" />
          )}
        </div>
        <div>
          <label className="form-label">State</label>
          {(formData.country as string) === 'USA' ? (
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
        <div>
          <label className="form-label">City</label>
          <input type="text" placeholder="City" value={(formData.currentLocation as string || '').split(', ')[0] || ''} onChange={(e) => {
            const state = (formData.currentLocation as string || '').split(', ')[1] || ''
            setFormData(prev => ({ ...prev, currentLocation: state ? `${e.target.value}, ${state}` : e.target.value }))
          }} className="input-field" />
        </div>
        <div>
          <label className="form-label">Zip Code <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode as string || ''}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., 94102"
            maxLength={5}
            pattern="\d{5}"
            required
          />
          <p className="text-xs text-gray-500 mt-1">US zip code for distance matching</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Citizenship</label>
          <select name="citizenship" value={formData.citizenship as string || ''} onChange={handleChange} className="input-field">
            <option value="USA">USA</option>
            <option value="India">India</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Other">Other</option>
          </select>
          {(formData.citizenship as string) === 'Other' && (
            <input type="text" name="citizenshipOther" value={formData.citizenshipOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify citizenship" />
          )}
        </div>
        <div>
          <label className="form-label">Grew Up In</label>
          <select name="grewUpIn" value={formData.grewUpIn as string || ''} onChange={handleChange} className="input-field">
            <option value="USA">USA</option>
            <option value="India">India</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Other">Other</option>
          </select>
          {(formData.grewUpIn as string) === 'Other' && (
            <input type="text" name="grewUpInOther" value={formData.grewUpInOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify location" />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Mother Tongue</label>
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
          <div className="p-2 border rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
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
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">LinkedIn</label>
          <input type="url" name="linkedinProfile" value={formData.linkedinProfile as string || ''} onChange={handleChange} className="input-field" placeholder="linkedin.com/in/..." />
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
    </>
  )
}

export function EducationSection({ formData, handleChange }: SectionProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Highest Qualification *</label>
          <select name="qualification" value={formData.qualification as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            {QUALIFICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(formData.qualification as string) === 'other' && (
            <input type="text" name="qualificationOther" value={formData.qualificationOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify qualification" />
          )}
        </div>
        <div>
          <label className="form-label">College/University</label>
          <input type="text" name="university" value={formData.university as string || ''} onChange={handleChange} className="input-field" placeholder="University name" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Occupation *</label>
          <select name="occupation" value={formData.occupation as string || ''} onChange={handleChange} className="input-field">
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
    </>
  )
}

export function FamilySection({ formData, handleChange }: SectionProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Father's Name</label>
          <input type="text" name="fatherName" value={formData.fatherName as string || ''} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="form-label">Father's Occupation</label>
          <input type="text" name="fatherOccupation" value={formData.fatherOccupation as string || ''} onChange={handleChange} className="input-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Mother's Name</label>
          <input type="text" name="motherName" value={formData.motherName as string || ''} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="form-label">Mother's Occupation</label>
          <input type="text" name="motherOccupation" value={formData.motherOccupation as string || ''} onChange={handleChange} className="input-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Number of Brothers</label>
          <input type="number" name="numberOfBrothers" value={formData.numberOfBrothers as string || ''} onChange={handleChange} className="input-field" min="0" />
        </div>
        <div>
          <label className="form-label">Number of Sisters</label>
          <input type="number" name="numberOfSisters" value={formData.numberOfSisters as string || ''} onChange={handleChange} className="input-field" min="0" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
    </>
  )
}

export function LifestyleSection({ formData, handleChange }: SectionProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Diet</label>
          <select name="dietaryPreference" value={formData.dietaryPreference as string || ''} onChange={handleChange} className="input-field">
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
          <label className="form-label">Smoking</label>
          <select name="smoking" value={formData.smoking as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="no">No</option>
            <option value="occasionally">Occasionally</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className="form-label">Drinking</label>
          <select name="drinking" value={formData.drinking as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="no">No</option>
            <option value="social">Social Drinker</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Hobbies</label>
        <input type="text" name="hobbies" value={formData.hobbies as string || ''} onChange={handleChange} className="input-field" placeholder="e.g., Reading, Traveling, Cooking" />
      </div>
      <div>
        <label className="form-label">Interests</label>
        <input type="text" name="interests" value={formData.interests as string || ''} onChange={handleChange} className="input-field" placeholder="e.g., Music, Sports, Technology" />
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
      <div>
        <label className="form-label">Allergies or Medical Conditions</label>
        <textarea name="allergiesOrMedical" value={formData.allergiesOrMedical as string || ''} onChange={handleChange} className="input-field min-h-[60px]" placeholder="e.g., None, Peanut allergy" />
      </div>
      <div>
        <label className="form-label">About Me</label>
        <textarea name="aboutMe" value={formData.aboutMe as string || ''} onChange={handleChange} className="input-field min-h-[100px]" placeholder="Tell us about yourself..." />
      </div>
    </>
  )
}

export function ReligionSection({ formData, handleChange }: SectionProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Religion</label>
          <select name="religion" value={formData.religion as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="Hindu">Hindu</option>
            <option value="Muslim">Muslim</option>
            <option value="Christian">Christian</option>
            <option value="Sikh">Sikh</option>
            <option value="Jain">Jain</option>
            <option value="Buddhist">Buddhist</option>
            <option value="Other">Other</option>
          </select>
          {(formData.religion as string) === 'Other' && (
            <input type="text" name="religionOther" value={formData.religionOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify religion" />
          )}
        </div>
        <div>
          <label className="form-label">Caste/Community</label>
          <input type="text" name="caste" value={formData.caste as string || ''} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="form-label">Gothra</label>
          <input type="text" name="gotra" value={formData.gotra as string || ''} onChange={handleChange} className="input-field" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Birth Country</label>
          <select name="placeOfBirthCountry" value={formData.placeOfBirthCountry as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="USA">USA</option>
            <option value="India">India</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
            <option value="Other">Other</option>
          </select>
          {(formData.placeOfBirthCountry as string) === 'Other' && (
            <input type="text" name="placeOfBirthCountryOther" value={formData.placeOfBirthCountryOther as string || ''} onChange={handleChange} className="input-field mt-2" placeholder="Specify country" />
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
      <div className="grid grid-cols-2 gap-4">
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
            <option value="dont_know">Don't Know</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Raasi</label>
          <input type="text" name="raasi" value={formData.raasi as string || ''} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="form-label">Nakshatra</label>
          <input type="text" name="nakshatra" value={formData.nakshatra as string || ''} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="form-label">Doshas</label>
          <input type="text" name="doshas" value={formData.doshas as string || ''} onChange={handleChange} className="input-field" />
        </div>
      </div>
    </>
  )
}

export function PreferencesSection({ formData, handleChange }: SectionProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Preferred Age Range</label>
          <select name="prefAgeDiff" value={formData.prefAgeDiff as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            {PREF_AGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Preferred Height Range</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              name="prefHeightMin"
              value={formData.prefHeightMin as string || ''}
              onChange={handleChange}
              className="input-field text-sm"
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
            >
              <option value="">Max</option>
              {HEIGHT_OPTIONS.map((h) => (
                <option key={h.value} value={h.value}>{h.value}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Preferred Location</label>
          <select name="prefLocation" value={formData.prefLocation as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            {PREF_LOCATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Preferred Country</label>
          <select name="prefCountry" value={formData.prefCountry as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="any">Any</option>
            <option value="USA">USA</option>
            <option value="India">India</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Preferred Income (Minimum)</label>
          <select name="prefIncome" value={formData.prefIncome as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            {PREF_INCOME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Preferred Education</label>
          <select name="prefQualification" value={formData.prefQualification as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            {PREF_EDUCATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Preferred Diet</label>
          <select name="prefDiet" value={formData.prefDiet as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="any">Any</option>
            <option value="veg">Vegetarian</option>
            <option value="non_veg">Non-Vegetarian</option>
          </select>
        </div>
        <div>
          <label className="form-label">Preferred Caste</label>
          <input type="text" name="prefCaste" value={formData.prefCaste as string || ''} onChange={handleChange} className="input-field" placeholder="Any or specific" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Preferred Gothra</label>
          <select name="prefGotra" value={formData.prefGotra as string || ''} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="different">Different Gothra</option>
            <option value="doesnt_matter">Doesn't Matter</option>
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Ideal Partner Description</label>
        <textarea name="idealPartnerDesc" value={formData.idealPartnerDesc as string || ''} onChange={handleChange} className="input-field min-h-[100px]" placeholder="Describe your ideal partner..." />
      </div>
    </>
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
