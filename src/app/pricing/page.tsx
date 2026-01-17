'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Crown, Star, Sparkles } from 'lucide-react'

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '2 months',
    description: 'Perfect for getting started',
    features: [
      '10 profile views per day',
      '5 interests per day',
      'Basic search filters',
      'Email notifications',
      'Profile creation',
    ],
    limitations: [
      'Cannot see contact info',
      'Cannot send messages',
      'Limited profile visibility',
    ],
    priceId: null,
    popular: false,
  },
  {
    name: 'Premium',
    price: '$40',
    period: '/month',
    description: 'Most popular choice',
    features: [
      'Unlimited profile views',
      'Unlimited interests',
      'Advanced search filters',
      'See contact information',
      'Send direct messages',
      'Priority profile visibility',
      'Curated matches from our team',
      'Priority customer support',
    ],
    limitations: [],
    priceId: 'price_premium_monthly',
    popular: true,
  },
  {
    name: 'Premium Plus',
    price: '$99',
    period: '/3 months',
    description: 'Best value',
    features: [
      'Everything in Premium',
      'Dedicated matchmaking consultant',
      'Profile optimization assistance',
      'Background verification badge',
      'Featured profile placement',
      'Video call scheduling',
    ],
    limitations: [],
    priceId: 'price_premium_quarterly',
    popular: false,
  },
]

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) {
      // Free plan - redirect to register
      router.push('/register')
      return
    }

    if (!session) {
      router.push('/login?callbackUrl=/pricing')
      return
    }

    setLoading(priceId)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a free 2-month trial. Upgrade anytime to unlock all features
            and find your perfect match.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-primary-600 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary-600 text-white text-center text-sm font-medium py-1">
                  Most Popular
                </div>
              )}

              <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                {/* Plan Icon */}
                <div className="mb-4">
                  {plan.name === 'Free Trial' && (
                    <Star className="h-10 w-10 text-gray-400" />
                  )}
                  {plan.name === 'Premium' && (
                    <Crown className="h-10 w-10 text-primary-600" />
                  )}
                  {plan.name === 'Premium Plus' && (
                    <Sparkles className="h-10 w-10 text-yellow-500" />
                  )}
                </div>

                {/* Plan Name & Price */}
                <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                <p className="text-gray-600 mt-1">{plan.description}</p>

                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loading === plan.priceId}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {loading === plan.priceId ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : plan.priceId ? (
                    'Subscribe Now'
                  ) : (
                    'Start Free Trial'
                  )}
                </button>

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start text-gray-400">
                        <span className="mr-3">-</span>
                        <span className="text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ / Trust Section */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto grid gap-6 text-left">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You'll continue to have
                access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens after my free trial?
              </h3>
              <p className="text-gray-600">
                After your 2-month free trial, you'll be moved to a limited free tier.
                To continue enjoying full features, you can upgrade to Premium.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use Stripe for payment processing, which is PCI-DSS compliant.
                We never store your credit card information on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
