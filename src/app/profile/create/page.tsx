'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronRight, ChevronLeft, CheckCircle, Clock } from 'lucide-react'
import { Suspense } from 'react'

const STEPS = [
  'Basic Info',
  'Location & Background',
  'Education & Career',
  'Family',
  'Lifestyle',
  'Partner Preferences',
]

function CreateProfileForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  const [formData, setFormData] = useState({
    // Basic Info
    gender: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    maritalStatus: '',

    // Location
    city: '',
    state: '',
    country: 'USA',
    nativePlace: '',

    // Religion & Community
    religion: '',
    caste: '',
    subCaste: '',
    motherTongue: '',
    gothra: '',

    // Education & Career
    education: '',
    educationDetail: '',
    occupation: '',
    company: '',
    income: '',

    // Family
    fatherOccupation: '',
    motherOccupation: '',
    siblings: '',
    familyType: '',
    familyValues: '',

    // Lifestyle
    diet: '',
    smoking: '',
    drinking: '',
    aboutMe: '',

    // Partner Preferences
    preferredAgeMin: '',
    preferredAgeMax: '',
    preferredHeightMin: '',
    preferredHeightMax: '',
    preferredReligion: '',
    preferredCaste: '',
    preferredEducation: '',
    preferredLocation: '',
    partnerPreferences: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create profile')
        return
      }

      // Redirect to dashboard with pending status
      router.push('/dashboard?status=pending')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStep
                      ? 'bg-primary-600 text-white'
                      : index === currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block w-12 h-1 mx-2 ${
                      index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <select name="height" value={formData.height} onChange={handleChange} className="input-field">
                    <option value="">Select Height</option>
                    {Array.from({ length: 61 }, (_, i) => 140 + i).map((h) => (
                      <option key={h} value={h}>
                        {h} cm ({Math.floor(h / 30.48)}'{Math.round((h % 30.48) / 2.54)}")
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 65"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status *</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="never_married">Never Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="annulled">Annulled</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Location & Background */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Location & Background</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., San Francisco"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., California"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Native Place in India</label>
                <input
                  type="text"
                  name="nativePlace"
                  value={formData.nativePlace}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Mumbai, Maharashtra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                <select name="religion" value={formData.religion} onChange={handleChange} className="input-field">
                  <option value="">Select Religion</option>
                  <option value="hindu">Hindu</option>
                  <option value="muslim">Muslim</option>
                  <option value="christian">Christian</option>
                  <option value="sikh">Sikh</option>
                  <option value="jain">Jain</option>
                  <option value="buddhist">Buddhist</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caste</label>
                  <input
                    type="text"
                    name="caste"
                    value={formData.caste}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Brahmin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Caste</label>
                  <input
                    type="text"
                    name="subCaste"
                    value={formData.subCaste}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mother Tongue</label>
                  <select name="motherTongue" value={formData.motherTongue} onChange={handleChange} className="input-field">
                    <option value="">Select Language</option>
                    <option value="hindi">Hindi</option>
                    <option value="tamil">Tamil</option>
                    <option value="telugu">Telugu</option>
                    <option value="kannada">Kannada</option>
                    <option value="malayalam">Malayalam</option>
                    <option value="marathi">Marathi</option>
                    <option value="gujarati">Gujarati</option>
                    <option value="punjabi">Punjabi</option>
                    <option value="bengali">Bengali</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gothra</label>
                  <input
                    type="text"
                    name="gothra"
                    value={formData.gothra}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Education & Career */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Education & Career</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highest Education *</label>
                <select name="education" value={formData.education} onChange={handleChange} className="input-field" required>
                  <option value="">Select Education</option>
                  <option value="high_school">High School</option>
                  <option value="bachelors">Bachelor's Degree</option>
                  <option value="masters">Master's Degree</option>
                  <option value="phd">Ph.D / Doctorate</option>
                  <option value="professional">Professional Degree (MD, JD, etc.)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education Details</label>
                <input
                  type="text"
                  name="educationDetail"
                  value={formData.educationDetail}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., MS Computer Science from Stanford"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Occupation *</label>
                <select name="occupation" value={formData.occupation} onChange={handleChange} className="input-field" required>
                  <option value="">Select Occupation</option>
                  <option value="software_engineer">Software Engineer</option>
                  <option value="doctor">Doctor</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="consultant">Consultant</option>
                  <option value="finance">Finance Professional</option>
                  <option value="business">Business Owner</option>
                  <option value="teacher">Teacher/Professor</option>
                  <option value="researcher">Researcher</option>
                  <option value="healthcare">Healthcare Professional</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company/Organization</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Google, Microsoft, Self-employed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income (USD)</label>
                <select name="income" value={formData.income} onChange={handleChange} className="input-field">
                  <option value="">Select Range</option>
                  <option value="0-50k">Below $50,000</option>
                  <option value="50k-75k">$50,000 - $75,000</option>
                  <option value="75k-100k">$75,000 - $100,000</option>
                  <option value="100k-150k">$100,000 - $150,000</option>
                  <option value="150k-200k">$150,000 - $200,000</option>
                  <option value="200k-300k">$200,000 - $300,000</option>
                  <option value="300k+">$300,000+</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Family */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Family Background</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Father's Occupation</label>
                <input
                  type="text"
                  name="fatherOccupation"
                  value={formData.fatherOccupation}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Retired Government Employee"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Occupation</label>
                <input
                  type="text"
                  name="motherOccupation"
                  value={formData.motherOccupation}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Homemaker, Teacher"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Siblings</label>
                <select name="siblings" value={formData.siblings} onChange={handleChange} className="input-field">
                  <option value="">Select</option>
                  <option value="0">None</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4+">4 or more</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Family Type</label>
                <select name="familyType" value={formData.familyType} onChange={handleChange} className="input-field">
                  <option value="">Select</option>
                  <option value="nuclear">Nuclear Family</option>
                  <option value="joint">Joint Family</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Family Values</label>
                <select name="familyValues" value={formData.familyValues} onChange={handleChange} className="input-field">
                  <option value="">Select</option>
                  <option value="traditional">Traditional</option>
                  <option value="moderate">Moderate</option>
                  <option value="liberal">Liberal</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 5: Lifestyle */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Lifestyle & About Me</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diet</label>
                <select name="diet" value={formData.diet} onChange={handleChange} className="input-field">
                  <option value="">Select</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non_vegetarian">Non-Vegetarian</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Smoking</label>
                  <select name="smoking" value={formData.smoking} onChange={handleChange} className="input-field">
                    <option value="">Select</option>
                    <option value="no">No</option>
                    <option value="occasionally">Occasionally</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Drinking</label>
                  <select name="drinking" value={formData.drinking} onChange={handleChange} className="input-field">
                    <option value="">Select</option>
                    <option value="no">No</option>
                    <option value="occasionally">Occasionally</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Me *</label>
                <textarea
                  name="aboutMe"
                  value={formData.aboutMe}
                  onChange={handleChange}
                  className="input-field min-h-[150px]"
                  placeholder="Tell us about yourself - your personality, interests, hobbies, values, and what makes you unique..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Minimum 100 characters recommended</p>
              </div>
            </div>
          )}

          {/* Step 6: Partner Preferences */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Partner Preferences</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Age (Min)</label>
                  <input
                    type="number"
                    name="preferredAgeMin"
                    value={formData.preferredAgeMin}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 25"
                    min="18"
                    max="70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Age (Max)</label>
                  <input
                    type="number"
                    name="preferredAgeMax"
                    value={formData.preferredAgeMax}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 35"
                    min="18"
                    max="70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Height (cm)</label>
                  <select name="preferredHeightMin" value={formData.preferredHeightMin} onChange={handleChange} className="input-field">
                    <option value="">Any</option>
                    {Array.from({ length: 61 }, (_, i) => 140 + i).map((h) => (
                      <option key={h} value={h}>
                        {h} cm ({Math.floor(h / 30.48)}'{Math.round((h % 30.48) / 2.54)}")
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Height (cm)</label>
                  <select name="preferredHeightMax" value={formData.preferredHeightMax} onChange={handleChange} className="input-field">
                    <option value="">Any</option>
                    {Array.from({ length: 61 }, (_, i) => 140 + i).map((h) => (
                      <option key={h} value={h}>
                        {h} cm ({Math.floor(h / 30.48)}'{Math.round((h % 30.48) / 2.54)}")
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Religion</label>
                <select name="preferredReligion" value={formData.preferredReligion} onChange={handleChange} className="input-field">
                  <option value="">Any / Open to all</option>
                  <option value="hindu">Hindu</option>
                  <option value="muslim">Muslim</option>
                  <option value="christian">Christian</option>
                  <option value="sikh">Sikh</option>
                  <option value="jain">Jain</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Education</label>
                <select name="preferredEducation" value={formData.preferredEducation} onChange={handleChange} className="input-field">
                  <option value="">Any</option>
                  <option value="bachelors">Bachelor's or higher</option>
                  <option value="masters">Master's or higher</option>
                  <option value="phd">Ph.D / Doctorate</option>
                  <option value="professional">Professional Degree</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Location</label>
                <input
                  type="text"
                  name="preferredLocation"
                  value={formData.preferredLocation}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., California, USA or Any"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Partner Preferences</label>
                <textarea
                  name="partnerPreferences"
                  value={formData.partnerPreferences}
                  onChange={handleChange}
                  className="input-field min-h-[120px]"
                  placeholder="Describe what you're looking for in a life partner - values, personality traits, lifestyle preferences..."
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button type="button" onClick={handleNext} className="btn-primary flex items-center">
                Next
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Submit Profile
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <CreateProfileForm />
    </Suspense>
  )
}
