'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsAndPrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/register"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Registration
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms and Privacy Policy</h1>

          <p className="text-gray-600 mb-8">
            By accessing or using VivaahReady (the "Platform"), you agree to the following Terms of Use ("Terms") and the Privacy Policy governing how we collect, use, and protect your personal data. Please read both carefully before using our platform.
          </p>

          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Eligibility to Use VivaahReady</h2>
              <p className="text-gray-600 mb-3">To participate in the services provided by VivaahReady, you must:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Be at least 18 years old;</li>
                <li>Be legally permitted to enter into a binding agreement;</li>
                <li>Not be restricted under any applicable laws from using the Platform.</li>
              </ul>
              <p className="text-gray-600 mt-3">By using VivaahReady, you confirm that you meet these criteria.</p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Account Registration and Security</h2>
              <p className="text-gray-600 mb-3">You are responsible for the confidentiality and security of your login credentials. By registering, you agree to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Provide accurate and up-to-date information;</li>
                <li>Keep your login details private and secure;</li>
                <li>Notify us immediately if you suspect unauthorized use of your account.</li>
              </ul>
              <p className="text-gray-600 mt-3">VivaahReady is not liable for any losses arising from failure to comply with these responsibilities.</p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Conduct and Community Standards</h2>
              <p className="text-gray-600 mb-3">We aim to maintain a respectful and safe community. By using the Platform, you agree NOT to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Use the service for unlawful, misleading, or exploitative purposes;</li>
                <li>Share or post content that is abusive, offensive, or inappropriate;</li>
                <li>Impersonate another person or misrepresent your identity;</li>
                <li>Engage in any behavior that disrupts or harms the community experience.</li>
              </ul>
              <p className="text-gray-600 mt-3">We reserve the right to suspend, disable, or delete accounts that violate these terms.</p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Content and Rights</h2>
              <p className="text-gray-600 mb-3">
                You retain ownership of any content (photos, profiles, text, etc.) you upload to the Platform, but by posting content, you grant VivaahReady a non-exclusive, royalty-free, worldwide license to use, display, and reproduce your content solely for the purpose of operating the Platform.
              </p>
              <p className="text-gray-600 mb-3">You agree not to upload content that:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Violates any third-party rights, including intellectual property rights;</li>
                <li>Contains personally identifiable information of others;</li>
                <li>Promotes discrimination, hate, or violence.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Subscription, Payments, and Refunds</h2>
              <p className="text-gray-600 mb-3">Some features of the Platform are available only through a paid subscription. You agree to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Pay all applicable fees for the services provided;</li>
                <li>Provide accurate and valid payment information;</li>
                <li>Cancel any recurring payments before renewal if you no longer wish to continue using paid features.</li>
              </ul>
              <p className="text-gray-600 mt-3">All payments are non-refundable unless explicitly stated otherwise.</p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Termination and Account Deactivation</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>VivaahReady reserves the right to suspend, disable, or permanently remove your account if you violate these Terms.</li>
                <li>You may deactivate your account at any time via your profile settings.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Privacy Policy – Data Collection and Use</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Personal Information We Collect</h3>
              <p className="text-gray-600 mb-3">When you use VivaahReady, we collect personal information to provide and improve our services. This may include:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Contact details (e.g., name, email, phone number);</li>
                <li>Profile information (e.g., age, gender, location, preferences);</li>
                <li>Usage data (e.g., interactions with the Platform).</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">How We Use Your Data</h3>
              <p className="text-gray-600 mb-3">We use your personal information for the following purposes:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>To provide personalized matchmaking services;</li>
                <li>To send notifications about new matches or updates;</li>
                <li>To improve the user experience and our services.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Data Security</h3>
              <p className="text-gray-600">
                We take reasonable measures to protect your personal information from unauthorized access, disclosure, or alteration. However, please note that no system is completely secure, and we cannot guarantee 100% protection.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Sharing Your Data</h3>
              <p className="text-gray-600 mb-3">We do not share your personal information with third parties, except as necessary for:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Providing services (e.g., payment processors);</li>
                <li>Complying with legal obligations (e.g., responding to subpoenas).</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Data Retention</h3>
              <p className="text-gray-600">
                We will retain your personal data for as long as your account is active or as needed to provide our services. You can request account deletion at any time.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">Your Rights</h3>
              <p className="text-gray-600">
                You have the right to access, update, or delete your personal information. To exercise these rights, please contact us at{' '}
                <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a>.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Disclaimers</h2>
              <p className="text-gray-600 mb-3">VivaahReady is provided "as-is." We do not guarantee:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>The accuracy or reliability of user content;</li>
                <li>That the matches you receive will be compatible or successful;</li>
                <li>That the Platform will be uninterrupted or error-free.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-600 mb-3">To the maximum extent permitted by law, VivaahReady shall not be liable for indirect, incidental, or consequential damages resulting from:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Your use or inability to use the Platform;</li>
                <li>Any user conduct or content;</li>
                <li>Unauthorized access to your account.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms and Privacy Policy</h2>
              <p className="text-gray-600">
                We reserve the right to modify these Terms and Privacy Policy at any time. If we make material changes, we will notify you by posting a notice on the Platform or by email. Continued use of the Platform after such updates constitutes your acceptance of the revised Terms and Privacy Policy.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions about these Terms or the Privacy Policy, please contact us at:{' '}
                <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
