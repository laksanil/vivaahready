'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfUsePage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Use</h1>

          {/* Effective Date */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-sm text-gray-600">
            <p><strong>Effective Date:</strong> January 17, 2026</p>
            <p><strong>Last Updated:</strong> February 9, 2026</p>
          </div>

          <p className="text-gray-600 mb-8">
            Welcome to VivaahReady. By accessing or using our platform ("Platform," "Service," or "Site"), you agree to be bound by these Terms of Use ("Terms"). Please read them carefully before using VivaahReady. If you do not agree to these Terms, do not use our Service.
          </p>

          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-3">
                By creating an account, accessing, or using VivaahReady, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. These Terms constitute a legally binding agreement between you and VivaahReady.
              </p>
              <p className="text-gray-600">
                We reserve the right to modify these Terms at any time. Material changes will be communicated via email or a notice on the Platform. Your continued use of the Service after such changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
              <p className="text-gray-600 mb-3">To use VivaahReady, you must:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Be at least 18 years of age;</li>
                <li>Be legally permitted to enter into a binding contract under applicable law;</li>
                <li>Not be prohibited from using the Service under the laws of your jurisdiction;</li>
                <li>Not have been previously suspended or removed from VivaahReady;</li>
                <li>Create only one account for personal use (accounts created for others must be clearly designated as such, e.g., "Profile for my son/daughter").</li>
              </ul>
              <p className="text-gray-600 mt-3">
                By using our Service, you represent and warrant that you meet all eligibility requirements.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Accounts and Profile Information</h2>
              <p className="text-gray-600 mb-3">
                When you create an account on VivaahReady, you agree to provide accurate, current, and complete information as prompted by our registration forms and to maintain and promptly update such information.
              </p>
              <p className="text-gray-600 mb-3 font-medium bg-yellow-50 border-l-4 border-yellow-400 pl-4 py-2">
                You may not falsify or misrepresent your identity or any material information (including age, marital status, education, employment, location, or family details). Falsification and impersonation may constitute fraud and may be unlawful. VivaahReady may suspend or terminate accounts and may cooperate with law enforcement in appropriate circumstances.
              </p>
              <p className="text-gray-600 mb-3">You are responsible for:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Maintaining the confidentiality of your account credentials;</li>
                <li>All activities that occur under your account;</li>
                <li>Notifying us immediately of any unauthorized use of your account.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                VivaahReady is not liable for any loss or damage arising from your failure to comply with these security obligations.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Profile Verification and Approval</h2>
              <p className="text-gray-600 mb-3">
                VivaahReady employs a profile review and verification process to maintain a genuine, serious community. By submitting your profile, you consent to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Our review of your profile information and photos for authenticity and appropriateness;</li>
                <li>Verification of certain information through documents or other means we may request;</li>
                <li>Possible rejection or removal of your profile if it does not meet our standards.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                Profile approval is at our sole discretion. We do not guarantee approval of any profile.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. How the Service Works</h2>
              <p className="text-gray-600 mb-3">
                VivaahReady is a matchmaking platform that connects individuals seeking marriage or serious relationships. Our service includes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Profile Creation:</strong> You create a profile with personal details, preferences, and photos;</li>
                <li><strong>Matching:</strong> We show you profiles of other users who meet your stated preferences and vice versa;</li>
                <li><strong>Interest Expression:</strong> You may express interest in profiles you find suitable;</li>
                <li><strong>Mutual Connection:</strong> When both parties express interest, contact details may be revealed;</li>
                <li><strong>Privacy-First Design:</strong> You only see mutual matches—profiles are not publicly browsable.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                VivaahReady facilitates introductions but does not guarantee any specific outcome, including finding a partner, getting married, or any particular level of compatibility or success.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Fees and Payment</h2>
              <p className="text-gray-600 mb-3">
                VivaahReady offers certain features for free and may offer premium features for a fee. Current pricing includes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Free Tier:</strong> Create profile, set preferences, view mutual matches (photos/names blurred until verified);</li>
                <li><strong>Verified Registration Fee:</strong> One-time payment to unlock photos, names, and the ability to express interest;</li>
                <li><strong>Contact Reveal Fee:</strong> Per-match fee to reveal contact details upon mutual interest.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                All payments are processed through our payment processor. By making a payment, you agree to their terms of service. All fees are non-refundable unless otherwise stated or required by law. We reserve the right to change our pricing at any time with notice to existing users.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Member Conduct and Prohibited Activities</h2>
              <p className="text-gray-600 mb-3">You agree NOT to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Provide false information, impersonate another person, or submit forged or misleading documents during verification; such conduct may be unlawful and may be reported to relevant authorities;</li>
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws;</li>
                <li>Harass, abuse, stalk, threaten, or otherwise violate the rights of others;</li>
                <li>Post or transmit any content that is defamatory, obscene, pornographic, violent, or otherwise objectionable;</li>
                <li>Solicit money, financial information, or other valuables from other users;</li>
                <li>Use the Service for commercial purposes, advertising, or solicitation without our written consent;</li>
                <li>Attempt to gain unauthorized access to other accounts, computer systems, or networks;</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service;</li>
                <li>Use any automated means (bots, scrapers, etc.) to access or collect data from the Service;</li>
                <li>Create multiple accounts or create accounts on behalf of others without their consent;</li>
                <li>Post content that infringes any third-party intellectual property rights;</li>
                <li>Share personal contact information publicly before mutual interest is established;</li>
                <li>Engage in any activity that we determine, in our sole discretion, to be harmful to the community.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                Violation of these rules may result in immediate suspension or termination of your account without refund.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. User Content</h2>
              <p className="text-gray-600 mb-3">
                You retain ownership of any content (photos, text, information) you submit to VivaahReady ("User Content"). By submitting User Content, you grant VivaahReady a non-exclusive, worldwide, royalty-free, sublicensable license to use, reproduce, modify, display, and distribute your User Content solely for the purpose of operating and improving the Service.
              </p>
              <p className="text-gray-600 mb-3">You represent and warrant that:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>You own or have the necessary rights to your User Content;</li>
                <li>Your User Content does not infringe or violate any third-party rights;</li>
                <li>Your User Content complies with these Terms and all applicable laws.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                We reserve the right to remove any User Content that violates these Terms or that we find objectionable for any reason.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
              <p className="text-gray-600 mb-3">
                The Service, including all content, features, and functionality (excluding User Content), is owned by VivaahReady and is protected by copyright, trademark, and other intellectual property laws. You may not:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Copy, modify, or distribute any part of the Service without our written consent;</li>
                <li>Use our trademarks, logos, or branding without authorization;</li>
                <li>Reverse engineer or attempt to extract the source code of our software.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Privacy</h2>
              <p className="text-gray-600">
                Your privacy is important to us. Our collection and use of personal information is governed by our{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</Link>,
                which is incorporated into these Terms by reference. By using the Service, you consent to our collection and use of your information as described in the Privacy Policy.
              </p>
            </section>

            {/* Section 10.1 - SMS Communications */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10.1 SMS/Text Message Communications</h2>
              <p className="text-gray-600 mb-3">
                By providing your phone number during registration or in your account settings, you expressly consent to receive SMS text messages from VivaahReady. These messages may include:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>One-Time Passwords (OTP):</strong> Security codes for account verification and login;</li>
                <li><strong>Match Notifications:</strong> Alerts about new matches, interest expressions received, and mutual connections;</li>
                <li><strong>Account Alerts:</strong> Important updates about your profile status, subscription, or account security.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                <strong>Message Frequency:</strong> The number of messages you receive will vary based on your account activity and matching notifications. You may receive several messages per week.
              </p>
              <p className="text-gray-600 mt-3">
                <strong>Opting Out:</strong> You may opt out of promotional SMS messages at any time by replying <strong>STOP</strong> to any message. After opting out, you will receive a confirmation message. Note that you will continue to receive essential transactional messages (such as OTP codes) necessary for account security unless you disable SMS entirely in your account settings.
              </p>
              <p className="text-gray-600 mt-3">
                <strong>Help:</strong> For assistance with SMS messages, reply <strong>HELP</strong> to any message or contact us at{' '}
                <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a>.
              </p>
              <p className="text-gray-600 mt-3">
                <strong>Carrier Fees:</strong> Standard message and data rates may apply based on your mobile carrier and plan. VivaahReady is not responsible for any fees charged by your wireless provider.
              </p>
              <p className="text-gray-600 mt-3">
                <strong>Supported Carriers:</strong> SMS messages are supported on most major U.S. carriers. Carriers are not liable for delayed or undelivered messages.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-600 mb-3">
                You may terminate your account at any time through your account settings or by contacting us at{' '}
                <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a>.
              </p>
              <p className="text-gray-600 mb-3">
                We reserve the right to suspend or terminate your account at any time, with or without cause, with or without notice, including if we believe you have violated these Terms. Upon termination:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Your right to access and use the Service will immediately cease;</li>
                <li>You will not be entitled to any refund of fees paid;</li>
                <li>We may delete your account information and User Content.</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Disclaimers</h2>
              <p className="text-gray-600 mb-3">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, VIVAAHREADY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Implied warranties of merchantability, fitness for a particular purpose, and non-infringement;</li>
                <li>Any warranty that the Service will be uninterrupted, secure, or error-free;</li>
                <li>Any warranty regarding the accuracy, reliability, or completeness of any content or information provided by users;</li>
                <li>Any warranty regarding the conduct, compatibility, or character of other users.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                VIVAAHREADY DOES NOT CONDUCT CRIMINAL BACKGROUND CHECKS ON ITS USERS. YOU ARE SOLELY RESPONSIBLE FOR YOUR INTERACTIONS WITH OTHER USERS. USE CAUTION AND COMMON SENSE WHEN INTERACTING WITH OTHERS.
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Limitation of Liability</h2>
              <p className="text-gray-600 mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VIVAAHREADY AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Loss of profits, data, goodwill, or other intangible losses;</li>
                <li>Damages resulting from your access to or use of (or inability to access or use) the Service;</li>
                <li>Damages resulting from any conduct or content of any third party on the Service;</li>
                <li>Damages resulting from unauthorized access, use, or alteration of your content or information.</li>
              </ul>
              <p className="text-gray-600 mt-3">
                IN NO EVENT SHALL VIVAAHREADY'S TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU HAVE PAID TO VIVAAHREADY IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Indemnification</h2>
              <p className="text-gray-600">
                You agree to indemnify, defend, and hold harmless VivaahReady and its officers, directors, employees, agents, and successors from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Service, your User Content, your violation of these Terms, or your violation of any rights of another.
              </p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Dispute Resolution and Arbitration</h2>
              <p className="text-gray-600 mb-3">
                Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved through binding arbitration administered by a mutually agreed-upon arbitration service, except that you may bring claims in small claims court if your claims qualify.
              </p>
              <p className="text-gray-600 mb-3">
                YOU AND VIVAAHREADY AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.
              </p>
              <p className="text-gray-600">
                This arbitration agreement does not preclude you from bringing issues to the attention of federal, state, or local agencies. Such agencies may seek relief on your behalf if applicable law permits.
              </p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Governing Law and Jurisdiction</h2>
              <p className="text-gray-600">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any legal action or proceeding not subject to arbitration shall be brought exclusively in the state or federal courts located in Alameda County, California.
              </p>
            </section>

            {/* Section 17 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">17. General Provisions</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and VivaahReady regarding the Service.</li>
                <li><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</li>
                <li><strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</li>
                <li><strong>Assignment:</strong> You may not assign or transfer these Terms without our prior written consent. We may assign our rights and obligations without restriction.</li>
                <li><strong>Notices:</strong> We may provide notices to you via email, posting on the Service, or other reasonable means.</li>
              </ul>
            </section>

            {/* Section 18 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">18. Contact Us</h2>
              <p className="text-gray-600 mb-3">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
                <p><strong>VivaahReady</strong></p>
                <p>United States</p>
                <p>Email: <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:text-primary-700">support@vivaahready.com</a></p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: February 9, 2026
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Also see our{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
