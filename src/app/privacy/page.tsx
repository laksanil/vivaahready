'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-lavender-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

          <p className="text-gray-600 mb-8">
            At VivaahReady, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully.
          </p>

          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Personal Information</h3>
              <p className="text-gray-600 mb-3">When you register and use VivaahReady, we collect personal information that you voluntarily provide, including:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Contact details (name, email address, phone number);</li>
                <li>Profile information (age, gender, location, photos);</li>
                <li>Preferences and interests for matchmaking;</li>
                <li>Education, career, and family background details;</li>
                <li>Religious and cultural preferences.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Automatically Collected Information</h3>
              <p className="text-gray-600 mb-3">We may also collect certain information automatically when you use our platform:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Device information (browser type, operating system);</li>
                <li>Usage data (pages visited, time spent, interactions);</li>
                <li>IP address and general location information.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-600 mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Create and manage your account;</li>
                <li>Provide personalized matchmaking services;</li>
                <li>Display your profile to potential matches;</li>
                <li>Send notifications about new matches, interests, and updates;</li>
                <li>Improve our platform and user experience;</li>
                <li>Respond to your inquiries and provide customer support;</li>
                <li>Ensure the security and integrity of our platform.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <p className="text-gray-600 mb-3">We do not sell your personal information. We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>With other users:</strong> Your profile information is visible to other registered users based on matching criteria;</li>
                <li><strong>Service providers:</strong> Third parties who assist us in operating our platform (e.g., hosting, analytics);</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect our rights and safety;</li>
                <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600">
                We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. This includes encryption, secure servers, and access controls. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
              <p className="text-gray-600">
                We retain your personal information for as long as your account is active or as needed to provide our services. If you delete your account, we will remove your profile information, though some data may be retained for legal or legitimate business purposes.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-600 mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Access and review your personal information;</li>
                <li>Update or correct inaccurate information;</li>
                <li>Delete your account and personal data;</li>
                <li>Opt out of marketing communications;</li>
                <li>Request a copy of your data.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a>.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
              <p className="text-gray-600">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and remember your preferences. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Third-Party Links</h2>
              <p className="text-gray-600">
                Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-600">
                VivaahReady is intended for users who are 18 years of age or older. We do not knowingly collect personal information from children under 18. If we become aware that we have collected data from a minor, we will take steps to delete that information.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our platform with a new effective date. Your continued use of VivaahReady after such changes constitutes your acceptance of the revised policy.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:{' '}
                <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: January 2026
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Also see our{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-700">Terms of Service</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
