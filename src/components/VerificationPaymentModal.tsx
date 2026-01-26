'use client'

import { X, Shield, CheckCircle, ArrowRight, Lock, UserCheck, Eye, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface VerificationPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentInitiated?: () => void
}

export default function VerificationPaymentModal({
  isOpen,
  onClose,
}: VerificationPaymentModalProps) {
  const router = useRouter()

  const handleGetVerified = () => {
    onClose()
    router.push('/get-verified')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Get Verified</h2>
              <p className="text-white/90 text-sm">Unlock full access to VivaahReady</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Intro */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Complete Your Verification
            </h3>
            <p className="text-gray-600">
              Get verified to unlock all features and start connecting with genuine, marriage-minded individuals.
            </p>
          </div>

          {/* Why Verification */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-600" />
              Why We Require Verification
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              VivaahReady is a <strong>serious matchmaking platform</strong> for individuals genuinely seeking meaningful, long-term relationships.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <UserCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Authentic profiles only</strong> — We manually verify each profile</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Serious intent</strong> — Connect with marriage-minded individuals</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Heart className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Quality over quantity</strong> — Curated, verified matches</span>
              </li>
            </ul>
          </div>

          {/* What You Get */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What You Unlock After Verification</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">View full profiles with names, photos & contact details</p>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Send and receive interests from matches</p>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Get verified badge on your profile</p>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <Eye className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Contact details revealed only on mutual match</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleGetVerified}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30"
          >
            Get Verified
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Skip for now */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            I&apos;ll do this later
          </button>
        </div>
      </div>
    </div>
  )
}
