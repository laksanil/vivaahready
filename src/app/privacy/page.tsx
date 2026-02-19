'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>

          {/* Effective Date */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-sm text-gray-600">
            <p><strong>Effective Date:</strong> January 17, 2026</p>
            <p><strong>Last Updated:</strong> February 9, 2026</p>
          </div>

          <p className="text-gray-600 mb-8">
            At VivaahReady, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform ("Service"). Please read this policy carefully. By using VivaahReady, you consent to the practices described in this Privacy Policy.
          </p>

          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">1.1 Personal Information You Provide</h3>
              <p className="text-gray-600 mb-3">When you register and use VivaahReady, we collect personal information that you voluntarily provide, including:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, password;</li>
                <li><strong>Profile Information:</strong> Age, gender, date of birth, height, weight, photos;</li>
                <li><strong>Background Details:</strong> Education, occupation, employer, income range;</li>
                <li><strong>Cultural Information:</strong> Religion, caste, community, mother tongue, languages spoken;</li>
                <li><strong>Family Information:</strong> Family background, marital status, number of siblings;</li>
                <li><strong>Location Information:</strong> Current city, state, country, hometown;</li>
                <li><strong>Preferences:</strong> Partner preferences including age range, location, education, religion, and other matching criteria;</li>
                <li><strong>Verification Documents:</strong> Government-issued ID, educational certificates, or other documents you submit for verification;</li>
                <li><strong>Communications:</strong> Messages you send to other users or to our support team.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">1.2 Automatically Collected Information</h3>
              <p className="text-gray-600 mb-3">We may also collect certain information automatically when you use our platform:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Device Information:</strong> Device type, operating system, browser type, unique device identifiers;</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform, click patterns;</li>
                <li><strong>Log Data:</strong> IP address, access times, referring URLs, error logs;</li>
                <li><strong>Cookies and Tracking:</strong> Information collected through cookies, pixels, and similar technologies.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">1.3 Information from Third Parties</h3>
              <p className="text-gray-600">
                If you sign in using a third-party service (such as Google), we may receive information from that service, such as your name, email address, and profile picture, as permitted by your settings with that service.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-600 mb-3">We use the information we collect for the following purposes:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Provide Our Service:</strong> Create and manage your account, display your profile to potential matches, facilitate connections;</li>
                <li><strong>Personalize Your Experience:</strong> Show you relevant matches based on your preferences and criteria;</li>
                <li><strong>Communication:</strong> Send you notifications about new matches, interest expressions, messages, and account updates;</li>
                <li><strong>Verification:</strong> Verify your identity and profile information to maintain a genuine community;</li>
                <li><strong>Customer Support:</strong> Respond to your inquiries and provide assistance;</li>
                <li><strong>Safety and Security:</strong> Detect and prevent fraud, abuse, and other harmful activities;</li>
                <li><strong>Improve Our Service:</strong> Analyze usage patterns, conduct research, and develop new features;</li>
                <li><strong>Legal Compliance:</strong> Comply with applicable laws, regulations, and legal processes;</li>
                <li><strong>Marketing:</strong> Send you promotional communications (with your consent where required).</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">2.1 SMS/Text Message Communications</h3>
              <p className="text-gray-600 mb-3">
                If you opt in to SMS communications during registration, we may use your phone number to send you account notifications, match alerts, and service updates via SMS. For full details on our SMS program, including opt-in, opt-out procedures, message frequency, data rates, and your rights, please see <strong>Section 12: SMS and Text Message Communications</strong> below.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Share Your Information</h2>
              <p className="text-gray-600 mb-3">We do not sell your personal information to third parties. We may share your information in the following circumstances:</p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">3.1 With Other Users</h3>
              <p className="text-gray-600 mb-3">
                Your profile information is visible to other registered users based on matching criteria. This includes your photos, profile details, and preferences. Contact information is only shared after mutual interest is established and applicable fees are paid.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">3.2 With Service Providers</h3>
              <p className="text-gray-600 mb-3">
                We share information with third-party vendors who perform services on our behalf, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Cloud hosting and storage providers;</li>
                <li>Payment processors;</li>
                <li>Email and communication services;</li>
                <li>Analytics providers;</li>
                <li>Customer support tools.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                These providers are contractually obligated to use your information only for the purposes of providing services to us.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">3.3 For Legal Reasons</h3>
              <p className="text-gray-600 mb-3">We may disclose your information if required to do so by law or in response to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Subpoenas, court orders, or other legal processes;</li>
                <li>Requests from law enforcement or government agencies;</li>
                <li>To protect our rights, privacy, safety, or property, or that of our users or others;</li>
                <li>To enforce our Terms of Use;</li>
                <li>To investigate potential violations or fraudulent activity.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">3.4 Business Transfers</h3>
              <p className="text-gray-600">
                If VivaahReady is involved in a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any change in ownership or use of your information.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600 mb-3">
                We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest;</li>
                <li>Secure servers and infrastructure;</li>
                <li>Access controls and authentication;</li>
                <li>Regular security assessments and monitoring.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
              <p className="text-gray-600 mb-3">
                We retain your personal information for as long as your account is active or as needed to provide our services. We may also retain information as necessary to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Comply with legal obligations;</li>
                <li>Resolve disputes;</li>
                <li>Enforce our agreements;</li>
                <li>Protect our legitimate business interests.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                When you delete your account, we will remove your profile information from public view. Some data may be retained in backups or for legal compliance for a limited period.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-600 mb-3">Depending on your location, you may have certain rights regarding your personal information:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you;</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information;</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal requirements;</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a structured, commonly used format;</li>
                <li><strong>Opt-Out:</strong> Opt out of marketing communications at any time;</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@vivaahready.com" className="text-primary-600 hover:text-primary-700">privacy@vivaahready.com</a>.
                We may require verification of your identity before processing requests.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 mb-3">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage, and remember your preferences. Types of cookies we use include:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Necessary for the website to function properly;</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform;</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences;</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (if applicable).</li>
              </ul>
              <p className="text-gray-600 mt-3">
                You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect the functionality of our Service.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Third-Party Links and Services</h2>
              <p className="text-gray-600">
                Our platform may contain links to third-party websites or services that are not operated by us. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-600">
                VivaahReady is intended for users who are 18 years of age or older. We do not knowingly collect personal information from children under 18. If we become aware that we have collected data from a minor, we will take steps to delete that information promptly. If you believe we have collected information from a minor, please contact us immediately.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-600">
                Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws. By using our Service, you consent to the transfer of your information to the United States and other jurisdictions where we operate. We take appropriate measures to ensure your information is protected in accordance with this Privacy Policy.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. California Privacy Rights (CCPA)</h2>
              <p className="text-gray-600 mb-3">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Right to know what personal information we collect, use, and disclose;</li>
                <li>Right to request deletion of your personal information;</li>
                <li>Right to opt-out of the sale of personal information (we do not sell your data);</li>
                <li>Right to non-discrimination for exercising your privacy rights.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@vivaahready.com" className="text-primary-600 hover:text-primary-700">privacy@vivaahready.com</a>.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. SMS and Text Message Communications</h2>
              <p className="text-gray-600 mb-3">
                VivaahReady (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) offers an SMS messaging program for account notifications, match alerts, and service updates. This section describes how we collect, use, and protect your phone number and SMS consent data.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">12.1 How We Collect SMS Consent</h3>
              <p className="text-gray-600 mb-3">
                During account registration on vivaahready.com, you are presented with an optional SMS consent checkbox. By checking this box, you provide your express written consent to receive automated SMS and WhatsApp messages from VivaahReady at the phone number you provide. The consent checkbox clearly discloses the types of messages, message frequency, data rates, opt-out instructions, and support contact information.
              </p>
              <p className="text-gray-600 mt-3">
                <strong>Consent is not a condition of registration or purchase.</strong> You may create an account and use VivaahReady without opting in to SMS communications.
              </p>
              <p className="text-gray-600 mt-3">
                We maintain records of your SMS opt-in consent, including the date, time, source, and method of consent, as required by applicable regulations.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">12.2 Types of SMS Messages</h3>
              <p className="text-gray-600 mb-3">If you opt in, we may send the following types of SMS messages:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Account verification and one-time password (OTP) codes;</li>
                <li>Profile approval and status notifications;</li>
                <li>New interest and match alerts;</li>
                <li>Connection and mutual interest updates;</li>
                <li>Account security alerts;</li>
                <li>Important service updates and announcements.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">12.3 Message Frequency</h3>
              <p className="text-gray-600">
                Message frequency varies based on your account activity and notification preferences. You may receive between 1-10 messages per month on average.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">12.4 Message and Data Rates</h3>
              <p className="text-gray-600">
                Message and data rates may apply. Standard messaging rates from your wireless carrier will apply. VivaahReady is not responsible for any fees or charges imposed by your mobile carrier.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">12.5 Opting Out</h3>
              <p className="text-gray-600 mb-3">
                You can opt out of SMS communications at any time using any of the following methods:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Reply <strong>STOP</strong>, <strong>CANCEL</strong>, <strong>END</strong>, <strong>QUIT</strong>, or <strong>UNSUBSCRIBE</strong> to any SMS message from VivaahReady;</li>
                <li>Email <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a> to request removal;</li>
                <li>Update your notification preferences in your account settings.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                After opting out, you will receive one final confirmation message. No further messages will be sent after the confirmation.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">12.6 Help and Support</h3>
              <p className="text-gray-600">
                For help with SMS messages, reply <strong>HELP</strong> to any message or email <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a>.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">12.7 How We Protect Your Phone Number</h3>
              <p className="text-gray-600 mb-3">
                We take the privacy of your phone number seriously:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>We will <strong>never sell, trade, or share</strong> your phone number with third parties for marketing purposes;</li>
                <li>Your phone number is shared only with our SMS service provider (Amazon Web Services) for the sole purpose of delivering messages;</li>
                <li>Your opt-in/opt-out preferences are stored securely and can be updated at any time;</li>
                <li>We do not use your phone number for any purpose other than delivering the communications described in this section.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-3">12.8 Compliance</h3>
              <p className="text-gray-600">
                Our SMS program complies with the Telephone Consumer Protection Act (TCPA), the CAN-SPAM Act, and all applicable federal and state regulations, as well as wireless carrier requirements and CTIA guidelines. We obtain express written consent before sending any SMS messages and promptly honor all opt-out requests.
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our platform with a new effective date. For significant changes, we may also send you an email notification. Your continued use of VivaahReady after such changes constitutes your acceptance of the revised policy.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Contact Us</h2>
              <p className="text-gray-600 mb-3">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
                <p><strong>VivaahReady</strong></p>
                <p>United States</p>
                <p>Email: <a href="mailto:privacy@vivaahready.com" className="text-primary-600 hover:text-primary-700">privacy@vivaahready.com</a></p>
                <p>General Support: <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a></p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: February 9, 2026
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Also see our{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-700">Terms of Use</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
