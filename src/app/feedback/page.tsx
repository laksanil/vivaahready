'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Send, Loader2, CheckCircle, MessageSquare, ChevronRight, ArrowLeft, Camera, Phone } from 'lucide-react'
import Link from 'next/link'
import StarRating from '@/components/StarRating'

// ─── Constants ───────────────────────────────────────────

const PRIMARY_ISSUES = [
  { value: 'ease_of_use', label: 'Ease of use / navigation' },
  { value: 'match_quality', label: 'Match quality' },
  { value: 'profile_experience', label: 'Profile experience' },
  { value: 'communication', label: 'Communication / interests / notifications' },
  { value: 'technical', label: 'Technical issue / bug / slow' },
  { value: 'pricing', label: 'Pricing / verification clarity' },
  { value: 'trust_safety', label: 'Trust & safety' },
  { value: 'other', label: 'Other' },
] as const

const REFERRAL_SOURCES = [
  { value: 'whatsapp', label: 'WhatsApp group' },
  { value: 'friend', label: 'Friend / Family' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google search' },
  { value: 'other', label: 'Other' },
] as const

const MATCH_ISSUE_OPTIONS = [
  'Age mismatch',
  'Location mismatch',
  'Language mismatch',
  'Community/sub-community mismatch',
  'Lifestyle mismatch (diet/smoking/drinking)',
  'Too few matches',
  'Too many matches / not filtered',
  'Other',
]

const PROFILE_STUCK_OPTIONS = [
  'Sign up / verification',
  'Adding photos',
  'Filling details',
  'Saving edits',
  'Understanding visibility',
  "Didn't get stuck",
]

const COMMUNICATION_MODELS = [
  'Contact unlock only after mutual (current)',
  'In-app messaging after mutual',
  'Scheduled intro call (concierge)',
  'Parent-mediated intro option',
  'Other',
]

const TECH_ISSUE_TAGS = [
  'Slow loading',
  'Broken link / 404',
  'Payment issue',
  'Verification issue',
  'Photo upload issue',
  'Matches not loading',
  'Button not working',
  'Mobile layout issue',
  'Other',
]

const PRICING_VALUE_OPTIONS = [
  'More verified profiles',
  'Better matches',
  'Unlock contact on mutual',
  'Human verification badge',
  'Better filters',
  'Concierge intro help',
  'Other',
]

const TRUST_IMPROVE_OPTIONS = [
  'Clearer privacy explanation',
  'Human verification',
  'Stronger moderation',
  'Fewer fake profiles',
  'Better transparency on process',
  'Other',
]

// ─── Step B: Dynamic Question Renderers ──────────────────

function EaseOfUseQuestions({ data, onChange }: StepBProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block font-semibold text-gray-900 mb-2">How easy is the site to navigate?</label>
        <StarRating value={data.navigateRating || 0} onChange={(v) => onChange({ ...data, navigateRating: v })} />
      </div>
      <div>
        <label htmlFor="stuckWhere" className="block font-semibold text-gray-900 mb-1">Where did you feel stuck?</label>
        <input id="stuckWhere" type="text" maxLength={300} value={data.stuckWhere || ''} onChange={(e) => onChange({ ...data, stuckWhere: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Describe where you felt stuck..." />
      </div>
      <div>
        <label htmlFor="fixOneThing" className="block font-semibold text-gray-900 mb-1">If we fix one thing in 2 weeks, what should it be?</label>
        <input id="fixOneThing" type="text" maxLength={300} value={data.fixOneThing || ''} onChange={(e) => onChange({ ...data, fixOneThing: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="The #1 thing to fix..." />
      </div>
    </div>
  )
}

function MatchQualityQuestions({ data, onChange }: StepBProps) {
  const checkedItems: string[] = data.matchIssues || []
  const toggleItem = (item: string) => {
    const next = checkedItems.includes(item) ? checkedItems.filter((i) => i !== item) : [...checkedItems, item]
    onChange({ ...data, matchIssues: next })
  }
  return (
    <div className="space-y-5">
      <div>
        <label className="block font-semibold text-gray-900 mb-2">How relevant are your matches?</label>
        <StarRating value={data.relevanceRating || 0} onChange={(v) => onChange({ ...data, relevanceRating: v })} />
      </div>
      <div>
        <label className="block font-semibold text-gray-900 mb-2">What felt off? (select all that apply)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MATCH_ISSUE_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={checkedItems.includes(opt)} onChange={() => toggleItem(opt)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              {opt}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="mustHaveFilters" className="block font-semibold text-gray-900 mb-1">Top 3 must-have filters</label>
        <input id="mustHaveFilters" type="text" maxLength={300} value={data.mustHaveFilters || ''} onChange={(e) => onChange({ ...data, mustHaveFilters: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. Age, Location, Community..." />
      </div>
    </div>
  )
}

function ProfileExperienceQuestions({ data, onChange }: StepBProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block font-semibold text-gray-900 mb-2">How easy was it to create/edit your profile?</label>
        <StarRating value={data.profileEaseRating || 0} onChange={(v) => onChange({ ...data, profileEaseRating: v })} />
      </div>
      <div>
        <label htmlFor="profileStuck" className="block font-semibold text-gray-900 mb-1">Where did you get stuck?</label>
        <select id="profileStuck" value={data.profileStuck || ''} onChange={(e) => onChange({ ...data, profileStuck: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
          <option value="">Select...</option>
          {PROFILE_STUCK_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="profileInfoSuggestion" className="block font-semibold text-gray-900 mb-1">What info should we add/remove?</label>
        <textarea id="profileInfoSuggestion" rows={3} maxLength={2000} value={data.profileInfoSuggestion || ''} onChange={(e) => onChange({ ...data, profileInfoSuggestion: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="Suggestions for profile fields..." />
      </div>
    </div>
  )
}

function CommunicationQuestions({ data, onChange }: StepBProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block font-semibold text-gray-900 mb-2">How clear is the Express Interest / Accept flow?</label>
        <StarRating value={data.interestFlowRating || 0} onChange={(v) => onChange({ ...data, interestFlowRating: v })} />
      </div>
      <div>
        <label className="block font-semibold text-gray-900 mb-2">How satisfied are you with notifications?</label>
        <StarRating value={data.notificationRating || 0} onChange={(v) => onChange({ ...data, notificationRating: v })} />
      </div>
      <div>
        <label htmlFor="commModel" className="block font-semibold text-gray-900 mb-1">Preferred communication model</label>
        <select id="commModel" value={data.commModel || ''} onChange={(e) => onChange({ ...data, commModel: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
          <option value="">Select...</option>
          {COMMUNICATION_MODELS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function TechnicalQuestions({ data, onChange, onScreenshot }: StepBProps & { onScreenshot: (file: File | null) => void }) {
  const checkedTags: string[] = data.techTags || []
  const toggleTag = (tag: string) => {
    const next = checkedTags.includes(tag) ? checkedTags.filter((t) => t !== tag) : [...checkedTags, tag]
    onChange({ ...data, techTags: next })
  }
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="severity" className="block font-semibold text-gray-900 mb-1">How severe is the issue?</label>
        <select id="severity" value={data.severity || ''} onChange={(e) => onChange({ ...data, severity: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
          <option value="">Select...</option>
          <option value="minor">Minor - annoying but I can work around it</option>
          <option value="major">Major - blocks me from using the site</option>
        </select>
      </div>
      <div>
        <label className="block font-semibold text-gray-900 mb-2">What type of issue? (select all that apply)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TECH_ISSUE_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={checkedTags.includes(tag)} onChange={() => toggleTag(tag)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              {tag}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="tryingToDo" className="block font-semibold text-gray-900 mb-1">What were you trying to do?</label>
        <input id="tryingToDo" type="text" maxLength={300} value={data.tryingToDo || ''} onChange={(e) => onChange({ ...data, tryingToDo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="I was trying to..." />
      </div>
      <div>
        <label htmlFor="bugDescription" className="block font-semibold text-gray-900 mb-1">Describe what happened / error message</label>
        <textarea id="bugDescription" rows={3} maxLength={2000} value={data.bugDescription || ''} onChange={(e) => onChange({ ...data, bugDescription: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="What happened? Any error messages?" />
      </div>
      <div>
        <label className="block font-semibold text-gray-900 mb-1">Screenshot (optional)</label>
        <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
          <Camera className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">{data._screenshotName || 'Click to upload a screenshot'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0] || null
            onChange({ ...data, _screenshotName: file?.name || '' })
            onScreenshot(file)
          }} />
        </label>
      </div>
    </div>
  )
}

function PricingQuestions({ data, onChange }: StepBProps) {
  const checkedItems: string[] = data.pricingMotivators || []
  const toggleItem = (item: string) => {
    const next = checkedItems.includes(item) ? checkedItems.filter((i) => i !== item) : [...checkedItems, item]
    onChange({ ...data, pricingMotivators: next })
  }
  return (
    <div className="space-y-5">
      <div>
        <label className="block font-semibold text-gray-900 mb-2">How clear is pricing / verification?</label>
        <StarRating value={data.pricingClarityRating || 0} onChange={(v) => onChange({ ...data, pricingClarityRating: v })} />
      </div>
      <div>
        <label className="block font-semibold text-gray-900 mb-2">What would make you pay for verification today?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRICING_VALUE_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={checkedItems.includes(opt)} onChange={() => toggleItem(opt)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              {opt}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="pricingConfusion" className="block font-semibold text-gray-900 mb-1">What confused you?</label>
        <textarea id="pricingConfusion" rows={3} maxLength={2000} value={data.pricingConfusion || ''} onChange={(e) => onChange({ ...data, pricingConfusion: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="What was unclear about pricing or verification?" />
      </div>
    </div>
  )
}

function TrustSafetyQuestions({ data, onChange }: StepBProps) {
  const checkedItems: string[] = data.trustImprovers || []
  const toggleItem = (item: string) => {
    const next = checkedItems.includes(item) ? checkedItems.filter((i) => i !== item) : [...checkedItems, item]
    onChange({ ...data, trustImprovers: next })
  }
  return (
    <div className="space-y-5">
      <div>
        <label className="block font-semibold text-gray-900 mb-2">Do you feel safe sharing your details?</label>
        <StarRating value={data.safetyRating || 0} onChange={(v) => onChange({ ...data, safetyRating: v })} />
      </div>
      {(data.safetyRating || 0) > 0 && (data.safetyRating || 0) <= 3 && (
        <div>
          <label className="block font-semibold text-gray-900 mb-2">What would increase your trust?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TRUST_IMPROVE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={checkedItems.includes(opt)} onChange={() => toggleItem(opt)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                {opt}
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <label htmlFor="trustConcerns" className="block font-semibold text-gray-900 mb-1">Any trust concerns?</label>
        <textarea id="trustConcerns" rows={3} maxLength={2000} value={data.trustConcerns || ''} onChange={(e) => onChange({ ...data, trustConcerns: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="Share any concerns about trust or safety..." />
      </div>
    </div>
  )
}

function OtherQuestions({ data, onChange }: StepBProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="otherImprove" className="block font-semibold text-gray-900 mb-1">What should we improve?</label>
        <textarea id="otherImprove" rows={4} maxLength={2000} value={data.otherImprove || ''} onChange={(e) => onChange({ ...data, otherImprove: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="Tell us what you think..." />
      </div>
      <div>
        <label htmlFor="otherFixOneThing" className="block font-semibold text-gray-900 mb-1">If we fix one thing in 2 weeks, what should it be?</label>
        <input id="otherFixOneThing" type="text" maxLength={300} value={data.otherFixOneThing || ''} onChange={(e) => onChange({ ...data, otherFixOneThing: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="The #1 thing..." />
      </div>
    </div>
  )
}

// ─── Types ───────────────────────────────────────────────

type StepBProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

// ─── Auth + Phone Gate ────────────────────────────────────

function FeedbackAuthGate() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromUrl = searchParams.get('from') || ''
  const callbackUrl = `/feedback${fromUrl ? `?from=${encodeURIComponent(fromUrl)}` : ''}`

  const [phoneCheck, setPhoneCheck] = useState<'loading' | 'has_phone' | 'no_phone'>('loading')

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/feedback/check-phone')
      .then((r) => r.json())
      .then((data) => setPhoneCheck(data.hasPhone ? 'has_phone' : 'no_phone'))
      .catch(() => setPhoneCheck('no_phone'))
  }, [status])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }
  }, [status, router, callbackUrl])

  if (status === 'loading' || (status === 'authenticated' && phoneCheck === 'loading')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="h-14 w-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="h-7 w-7 text-primary-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Redirecting to sign in</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Taking you to login so your feedback can be linked to your account context.
          </p>
        </div>
      </div>
    )
  }

  if (phoneCheck === 'no_phone') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="h-14 w-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Add your WhatsApp number</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Please add your WhatsApp number to submit feedback. We use it to understand your experience and follow up if needed.
          </p>
          <Link
            href="/profile/complete"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Add WhatsApp Number
          </Link>
        </div>
      </div>
    )
  }

  return <FeedbackForm />
}

// ─── Main Form ───────────────────────────────────────────

function FeedbackForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromUrl = searchParams.get('from') || ''

  // Steps: 'a' | 'b' | 'closing' | 'done'
  const [step, setStep] = useState<'a' | 'b' | 'closing' | 'done'>('a')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step A
  const [overallStars, setOverallStars] = useState(0)
  const [primaryIssue, setPrimaryIssue] = useState('')
  const [summaryText, setSummaryText] = useState('')

  // Step B
  const [stepBData, setStepBData] = useState<Record<string, any>>({})
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)

  // Closing
  const [nps, setNps] = useState<number | null>(null)
  const [referralSource, setReferralSource] = useState('')
  const [wantsFollowup, setWantsFollowup] = useState(false)
  const [followupContact, setFollowupContact] = useState('')
  const [followupTimeWindow, setFollowupTimeWindow] = useState('')

  // Honeypot
  const [honeypot, setHoneypot] = useState('')

  const handleStepA = () => {
    if (!overallStars) { setError('Please give an overall star rating.'); return }
    if (!primaryIssue) { setError('Please select the main issue.'); return }
    setError('')
    setStep('b')
  }

  const handleStepB = () => {
    // For technical issues, require at least 1 tag or description
    if (primaryIssue === 'technical') {
      const tags = stepBData.techTags || []
      const desc = stepBData.bugDescription || ''
      if (tags.length === 0 && !desc.trim()) {
        setError('Please select at least one issue type or describe the problem.')
        return
      }
    }
    setError('')
    setStep('closing')
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      // Clean stepBData — remove internal fields prefixed with _
      const cleanStepB: Record<string, any> = {}
      for (const [k, v] of Object.entries(stepBData)) {
        if (!k.startsWith('_')) cleanStepB[k] = v
      }

      // Extract severity and issueTags from stepB for top-level storage
      const severity = primaryIssue === 'technical' ? (stepBData.severity || null) : null
      const issueTags = primaryIssue === 'technical' ? (stepBData.techTags || null) : null

      const payload: Record<string, any> = {
        fromUrl,
        submitUrl: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        overallStars,
        primaryIssue,
        summaryText: summaryText.trim() || null,
        stepBData: cleanStepB,
        nps,
        referralSource: referralSource || null,
        wantsFollowup,
        followupContact: wantsFollowup ? followupContact.trim() || null : null,
        followupTimeWindow: wantsFollowup ? followupTimeWindow.trim() || null : null,
        severity,
        issueTags,
        honeypot,
      }

      // Handle screenshot — convert to base64 data URL if present
      if (screenshotFile) {
        const base64 = await fileToBase64(screenshotFile)
        payload.screenshotUrl = base64
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setStep('done')
      } else {
        const data = await res.json()
        if (data.error === 'PHONE_REQUIRED') {
          setError('Please add your WhatsApp number to your profile before submitting feedback.')
        } else {
          setError(data.error || 'Failed to submit feedback.')
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Render: Done ──────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-9 w-9 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600 mb-6">
            This goes directly to the founder. Your input shapes what we build next.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {session && (
              <button onClick={() => router.push('/matches')} className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                Back to Matches
              </button>
            )}
            <button onClick={() => router.push('/')} className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderStepBQuestions = () => {
    const props: StepBProps = { data: stepBData, onChange: setStepBData }
    switch (primaryIssue) {
      case 'ease_of_use': return <EaseOfUseQuestions {...props} />
      case 'match_quality': return <MatchQualityQuestions {...props} />
      case 'profile_experience': return <ProfileExperienceQuestions {...props} />
      case 'communication': return <CommunicationQuestions {...props} />
      case 'technical': return <TechnicalQuestions {...props} onScreenshot={setScreenshotFile} />
      case 'pricing': return <PricingQuestions {...props} />
      case 'trust_safety': return <TrustSafetyQuestions {...props} />
      case 'other': return <OtherQuestions {...props} />
      default: return null
    }
  }

  const stepLabel = PRIMARY_ISSUES.find((i) => i.value === primaryIssue)?.label || ''

  return (
    <div className="min-h-[60vh] py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-7 w-7 text-primary-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Share Your Feedback</h1>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Help us improve VivaahReady. Your feedback goes directly to the founder.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {['Quick Rating', 'Details', 'Almost Done'].map((label, i) => {
            const stepMap = ['a', 'b', 'closing']
            const currentIdx = stepMap.indexOf(step)
            const isActive = i <= currentIdx
            return (
              <div key={label} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${isActive ? 'bg-primary-600' : 'bg-gray-200'}`} />
                <p className={`text-xs mt-1 ${isActive ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{label}</p>
              </div>
            )
          })}
        </div>

        {/* Honeypot (hidden) */}
        <div className="absolute left-[-9999px]" aria-hidden="true">
          <label htmlFor="website_url">Website</label>
          <input id="website_url" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        {/* ─── Step A ─── */}
        {step === 'a' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <label className="block font-semibold text-gray-900 mb-3">Overall, how would you rate VivaahReady? *</label>
              <StarRating value={overallStars} onChange={setOverallStars} size="lg" label="Overall rating" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <label className="block font-semibold text-gray-900 mb-3">What&apos;s the main issue? *</label>
              <div className="space-y-2">
                {PRIMARY_ISSUES.map((issue) => (
                  <label key={issue.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${primaryIssue === issue.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="primaryIssue" value={issue.value} checked={primaryIssue === issue.value} onChange={(e) => { setPrimaryIssue(e.target.value); setStepBData({}) }} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-gray-800">{issue.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <label htmlFor="summaryText" className="block font-semibold text-gray-900 mb-1">One sentence summary (optional)</label>
              <p className="text-sm text-gray-500 mb-2">{summaryText.length}/140 characters</p>
              <input id="summaryText" type="text" maxLength={140} value={summaryText} onChange={(e) => setSummaryText(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="In one sentence, what's on your mind?" />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <button onClick={handleStepA} className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
              Continue <ChevronRight className="h-5 w-5" />
            </button>

            <p className="text-center text-xs text-gray-500">
              Feedback is linked to your WhatsApp number so we can understand your experience and follow up if needed.
            </p>
          </div>
        )}

        {/* ─── Step B ─── */}
        {step === 'b' && (
          <div className="space-y-6">
            <button onClick={() => { setStep('a'); setError('') }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Tell us more about: {stepLabel}</h2>
              <p className="text-sm text-gray-500 mb-5">A few more questions to help us prioritize.</p>
              {renderStepBQuestions()}
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <button onClick={handleStepB} className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
              Continue <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* ─── Closing ─── */}
        {step === 'closing' && (
          <div className="space-y-6">
            <button onClick={() => { setStep('b'); setError('') }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {/* NPS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <label className="block font-semibold text-gray-900 mb-3">How likely are you to recommend VivaahReady? (0-10)</label>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                  <button key={n} type="button" onClick={() => setNps(n)} className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${nps === n ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>

            {/* Referral */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <label htmlFor="referralSource" className="block font-semibold text-gray-900 mb-1">Where did you hear about us?</label>
              <select id="referralSource" value={referralSource} onChange={(e) => setReferralSource(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select (optional)...</option>
                {REFERRAL_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Follow-up */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={wantsFollowup} onChange={(e) => setWantsFollowup(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="font-semibold text-gray-900">Open to a 5-minute call with the founder?</span>
              </label>
              {wantsFollowup && (
                <div className="mt-4 space-y-3 pl-7">
                  <div>
                    <label htmlFor="followupContact" className="block text-sm font-medium text-gray-700 mb-1">Phone or email</label>
                    <input id="followupContact" type="text" maxLength={200} value={followupContact} onChange={(e) => setFollowupContact(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Your phone or email..." />
                  </div>
                  <div>
                    <label htmlFor="followupTime" className="block text-sm font-medium text-gray-700 mb-1">Best time window</label>
                    <input id="followupTime" type="text" maxLength={200} value={followupTimeWindow} onChange={(e) => setFollowupTimeWindow(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. Weekday evenings EST" />
                  </div>
                </div>
              )}
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-5 w-5" /> Submit Feedback</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helper ──────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Page Export ──────────────────────────────────────────

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <FeedbackAuthGate />
    </Suspense>
  )
}
