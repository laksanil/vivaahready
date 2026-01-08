'use client'

import { useState } from 'react'
import { Heart, MessageCircle, CheckCircle, Loader2, Phone, Mail, Linkedin, Instagram } from 'lucide-react'

interface InterestActionsProps {
  profileId: string
  initialStatus: {
    sentByMe: boolean
    receivedFromThem: boolean
    mutual: boolean
  }
  contactInfo?: {
    name: string
    email: string | null
    phone: string | null
    linkedinProfile: string | null
    facebookInstagram: string | null
  }
}

export default function InterestActions({
  profileId,
  initialStatus,
  contactInfo,
}: InterestActionsProps) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [showContact, setShowContact] = useState(initialStatus.mutual)

  const handleExpressInterest = async () => {
    if (status.sentByMe) return

    setLoading(true)
    try {
      const response = await fetch('/api/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({
          sentByMe: true,
          receivedFromThem: status.receivedFromThem || data.mutual,
          mutual: data.mutual,
        })

        if (data.mutual) {
          setShowContact(true)
        }
      }
    } catch (error) {
      console.error('Error expressing interest:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3">
        {status.mutual ? (
          <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-100 text-green-700 rounded-lg font-medium">
            <CheckCircle className="h-5 w-5" />
            Mutual Match!
          </div>
        ) : status.sentByMe ? (
          <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
            <Heart className="h-5 w-5 fill-current" />
            Interest Sent
          </div>
        ) : (
          <button
            onClick={handleExpressInterest}
            disabled={loading}
            className="flex-1 btn-primary flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Heart className="h-5 w-5 mr-2" />
                Express Interest
              </>
            )}
          </button>
        )}
      </div>

      {/* Interest Received Badge */}
      {status.receivedFromThem && !status.mutual && (
        <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
          <p className="text-pink-700 font-medium flex items-center justify-center gap-2">
            <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
            This person is interested in you!
          </p>
          <p className="text-sm text-pink-600 mt-1">
            Express interest to reveal contact details
          </p>
        </div>
      )}

      {/* Contact Info (shown on mutual interest) */}
      {showContact && contactInfo && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Contact Information
          </h3>
          <div className="space-y-2">
            {contactInfo.email && (
              <a
                href={`mailto:${contactInfo.email}`}
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
              >
                <Mail className="h-4 w-4 text-gray-500" />
                {contactInfo.email}
              </a>
            )}
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone}`}
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
              >
                <Phone className="h-4 w-4 text-gray-500" />
                {contactInfo.phone}
              </a>
            )}
            {contactInfo.linkedinProfile && contactInfo.linkedinProfile !== 'NO' && (
              <a
                href={contactInfo.linkedinProfile.startsWith('http') ? contactInfo.linkedinProfile : `https://${contactInfo.linkedinProfile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn Profile
              </a>
            )}
            {contactInfo.facebookInstagram && (
              <a
                href={`https://instagram.com/${contactInfo.facebookInstagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
              >
                <Instagram className="h-4 w-4" />
                {contactInfo.facebookInstagram}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
