import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How Indian Matchmaking Actually Works in America in 2026 | VivaahReady',
  description:
    'A clear, honest guide to how Indian matchmaking works in the USA today. From family-led searches to AI-powered platforms, here is what the process actually looks like for Indian Americans in 2026.',
  keywords: [
    'Indian matchmaking USA',
    'how does Indian matchmaking work',
    'Indian matrimony process USA',
    'Indian matchmaking in America',
    'arranged marriage USA 2026',
    'Indian American matchmaking',
    'NRI matchmaking process',
    'Indian marriage USA',
    'Indian matchmaking steps',
    'Indian matchmaking for parents',
    'modern arranged marriage USA',
    'Indian matchmaking Bay Area',
    'Indian matchmaking New York',
  ],
  openGraph: {
    title: 'How Indian Matchmaking Actually Works in America in 2026',
    description:
      'A clear, honest guide to the matchmaking process for Indian Americans. From family networks to AI-powered platforms, here is what it actually looks like today.',
    url: 'https://vivaahready.com/blog/how-indian-matchmaking-works-in-america-2026',
    type: 'article',
    publishedTime: '2026-03-05T00:00:00Z',
  },
  alternates: {
    canonical: 'https://vivaahready.com/blog/how-indian-matchmaking-works-in-america-2026',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'How Indian Matchmaking Actually Works in America in 2026',
  description:
    'A clear, honest guide to how Indian matchmaking works in the USA today. From family-led searches to AI-powered platforms, here is what the process actually looks like for Indian Americans in 2026.',
  datePublished: '2026-03-05T00:00:00Z',
  author: {
    '@type': 'Person',
    name: 'Lakshmi',
    jobTitle: 'Founder',
    url: 'https://vivaahready.com/about',
  },
  publisher: {
    '@type': 'Organization',
    name: 'VivaahReady',
    url: 'https://vivaahready.com',
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://vivaahready.com/blog/how-indian-matchmaking-works-in-america-2026',
  },
}

const faqs = [
  {
    question: 'How long does Indian matchmaking typically take in the USA?',
    answer:
      'The timeline varies widely. Some families find a match within a few months, while others search for a year or longer. According to a 2025 Jeevansathi report, the median marriage age has moved from 27 to 29, reflecting longer search timelines across the board. The key factor is not speed but clarity of intent and quality of the platform or network being used.',
  },
  {
    question: 'Can parents be involved in Indian matchmaking without it being arranged marriage?',
    answer:
      'Yes. In fact, this is how most Indian American families approach it today. Parents may help identify potential matches, provide input, or use platforms alongside their children. The difference from traditional arranged marriage is that the individual makes the final decision. Platforms like VivaahReady are designed for exactly this kind of family-involved, individual-driven process.',
  },
  {
    question: 'How much does Indian matchmaking cost in the USA?',
    answer:
      'The cost ranges significantly. Large matrimony platforms like Shaadi.com and BharatMatrimony charge between $50 and $300 for premium memberships. Personalized matchmaking services run by individual matchmakers can cost $2,000 to $10,000 or more. Newer platforms like VivaahReady offer verified, curated matchmaking at a fraction of the cost of traditional matchmakers.',
  },
  {
    question: 'What is the difference between Indian matrimony sites and dating apps?',
    answer:
      'Matrimony sites are built around marriage intent. Every profile signals readiness for a committed relationship, and family involvement is expected and supported. Dating apps like Hinge or Bumble serve a broader spectrum, from casual dating to serious relationships. For Indian Americans who know they want marriage, matrimony platforms remove the guesswork about the other person\u2019s intentions.',
  },
  {
    question: 'Do Indian matchmaking platforms work for people living outside major metros?',
    answer:
      'Yes, though the experience varies by platform. Larger platforms have broader reach, but most Indian American users are concentrated in metros like the Bay Area, New York, Chicago, Dallas, Houston, and Atlanta. Smaller, curated platforms may have fewer total profiles but higher quality and relevance for users in specific regions.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function BlogPost() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <article className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Articles
            </Link>
          </div>
        </nav>

        {/* Hero Header */}
        <header className="bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 md:pt-16 md:pb-14">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-600 text-white">
                  Guide
                </span>
                <span className="text-sm text-gray-400">12 min read</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight">
                How Indian Matchmaking Actually Works in America in 2026
              </h1>

              <p className="mt-4 text-2xl md:text-3xl font-display text-gray-500 leading-snug">
                A Clear, Honest Guide to the Process
              </p>

              <p className="mt-6 text-xl text-gray-500 leading-relaxed">
                If you have ever wondered what Indian matchmaking in the USA actually looks like
                today &mdash; beyond what Netflix shows you &mdash; this is for you.
              </p>

              {/* Author */}
              <div className="mt-8 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-display text-lg font-bold">
                  L
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Lakshmi</p>
                  <p className="text-sm text-gray-500">
                    Founder, VivaahReady &middot;{' '}
                    <time dateTime="2026-03-05">March 5, 2026</time>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl py-10 md:py-14">
            <div className="prose prose-lg prose-gray max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-[1.8] prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary-400 prose-blockquote:text-gray-600 prose-blockquote:not-italic">
              {/* TL;DR Box */}
              <div className="not-prose mb-10 p-6 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  TL;DR
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Indian matchmaking in America has evolved far beyond traditional arranged marriage.
                  According to a 2025 Jeevansathi report, 77% of profiles on Indian matrimony
                  platforms are now self-managed, not family-controlled. The process today blends
                  family involvement, online platforms, and personal choice &mdash; and understanding
                  how it works can save you months of confusion.
                </p>
              </div>

              {/* Opening */}
              <p className="first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:text-primary-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none">
                There is no single version of Indian matchmaking in America. There is no rulebook,
                no standard process, no instruction manual that families pass around. And yet, millions
                of Indian Americans navigate some version of it every year.
              </p>

              <p>
                Some families do it the way their parents did &mdash; through networks, community
                connections, and word-of-mouth introductions. Others use matrimony platforms.
                Some hire matchmakers. And a growing number are finding a middle path that
                combines family values with personal autonomy.
              </p>

              <p>
                The problem is that nobody talks openly about how any of this actually works. The
                process stays behind closed doors, which means every family ends up figuring it out
                alone. So here is what Indian matchmaking in America actually looks like in 2026,
                step by step, with honesty about what works and what does not.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>How Has Indian Matchmaking Changed in America?</h2>

              <p>
                According to a 2025 Jeevansathi survey reported in Business Standard, arranged
                marriages in India declined from 68% in 2020 to 44% in 2023 &mdash; a 24% drop
                in just three years. Among Indian Americans, the shift has been even more pronounced.
                Matchmaking today is less about families choosing for their children and more about
                families supporting their children&rsquo;s choices.
              </p>

              <p>
                The same report found that 77% of matrimony profiles are now self-managed, meaning
                the individual &mdash; not a parent or relative &mdash; creates and controls their
                own profile. Caste preferences have dropped from 91% in 2016 to 54% in 2025, and
                in metropolitan areas, that number is even lower at 49%.
              </p>

              <p>
                What this means in practice: if you are an Indian American in your late twenties or
                thirties, the matchmaking process your parents experienced is not the one you will
                experience. The bones are similar &mdash; intentionality, family awareness, compatibility
                focus &mdash; but the execution has changed dramatically.
              </p>

              <h2>What Are the Main Approaches to Indian Matchmaking in the USA?</h2>

              <p>
                Indian Americans in 2026 generally follow one of five approaches, or some
                combination of them. Each has trade-offs worth understanding before you invest
                time and money.
              </p>

              <h3>1. Family and Community Networks</h3>

              <p>
                This is the oldest approach, and it still works &mdash; when the network is large
                enough. Parents ask friends, relatives, temple connections, and community members
                if they know anyone suitable. In India, this network is naturally wide. In America,
                it is often painfully narrow.
              </p>

              <p>
                A family in Plano, Texas has a different network than a family in Edison, New Jersey.
                A Telugu family in the Bay Area may know hundreds of other Telugu families. A Marathi
                family in Phoenix may know a handful. The effectiveness of this approach depends
                almost entirely on geography and community size.
              </p>

              <p>
                <strong>Best for:</strong> Families with strong, active community ties in metros
                with large Indian populations.
              </p>

              <h3>2. Large Matrimony Platforms</h3>

              <p>
                Platforms like Shaadi.com and BharatMatrimony are the largest Indian matchmaking
                platforms in the world, with over 50 million active users between them. They offer
                massive databases, advanced search filters, and community-specific sub-portals
                (TamilMatrimony, TeluguMatrimony, etc.).
              </p>

              <p>
                The trade-off is volume versus quality. These platforms were built primarily for
                users in India, and many Indian Americans report frustration with unverified profiles,
                outdated interfaces, and a flood of irrelevant matches from outside the US. Premium
                memberships typically cost $50 to $300 per year.
              </p>

              <p>
                <strong>Best for:</strong> Users who want the widest possible pool and are willing
                to spend time filtering.
              </p>

              <h3>3. Dating Apps with Indian Users</h3>

              <p>
                Apps like Dil Mil, Hinge, and Bumble have significant Indian American user bases.
                Dil Mil specifically targets the South Asian diaspora. These apps are familiar,
                mobile-first, and feel less formal than matrimony platforms.
              </p>

              <p>
                The limitation:{' '}
                <Link href="/blog/caught-between-dating-apps-and-arranged-marriage">
                  dating apps were not designed for marriage-intent connections
                </Link>
                . Intentions vary widely, from casual dating to serious relationships. For Indian
                Americans who know they want marriage, the ambiguity can be exhausting. There is
                no built-in family involvement, and the swipe-based format rewards appearance over
                compatibility.
              </p>

              <p>
                <strong>Best for:</strong> Younger professionals comfortable with app-based dating
                who want a casual entry point.
              </p>

              <h3>4. Professional Matchmakers</h3>

              <p>
                Professional Indian matchmakers &mdash; the kind featured on Netflix&rsquo;s
                Indian Matchmaking &mdash; offer a personalized, high-touch experience. They
                interview clients, understand family preferences, and hand-select potential matches.
              </p>

              <p>
                The cost is significant: $2,000 to $10,000 or more, depending on the matchmaker
                and service level. The results are inconsistent. Some matchmakers have excellent
                networks and track records. Others rely on the same databases available on free
                platforms, with a premium price tag for the curation.
              </p>

              <p>
                <strong>Best for:</strong> Families with budget flexibility who value a
                human-curated, high-touch experience.
              </p>

              <h3>5. Curated, Privacy-First Platforms</h3>

              <p>
                A newer category of platforms &mdash; including{' '}
                <Link href="/indian-matchmaking-usa">
                  VivaahReady
                </Link>{' '}
                &mdash; focuses on verified profiles, serious intent, and privacy. These platforms
                are smaller by design. Instead of millions of profiles, they offer a curated
                community where every member has been verified, profiles are not publicly visible,
                and the emphasis is on quality over quantity.
              </p>

              <p>
                This approach works for Indian Americans who are frustrated by the noise of large
                platforms and the cost of professional matchmakers but still want a structured,
                intentional process with family involvement.
              </p>

              <p>
                <strong>Best for:</strong> Professionals and families who value privacy,
                verification, and serious intent over volume.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>What Does the Matchmaking Process Look Like Step by Step?</h2>

              <p>
                Regardless of which approach you choose, the Indian matchmaking process in America
                generally follows a predictable arc. Understanding these stages can help you navigate
                them with less stress and more clarity.
              </p>

              <h3>Stage 1: The Decision to Start</h3>

              <p>
                This is often the hardest part. Many Indian Americans delay starting because of the
                stigma of{' '}
                <Link href="/blog/shame-of-looking-indian-american-matrimony">
                  actively looking for a partner
                </Link>
                . Others delay because they are not sure how to involve their parents, or because
                they feel caught between what their family expects and what they want.
              </p>

              <p>
                The most effective first step is an honest conversation &mdash; either with your
                family or with yourself &mdash; about what you actually want. Not what your parents
                want. Not what your friends are doing. What you want.
              </p>

              <h3>Stage 2: Creating a Profile or Engaging a Network</h3>

              <p>
                Once you decide to start, the next step is making yourself visible to potential
                matches. On platforms, this means creating a profile. Through networks, this means
                letting trusted people know you are open to introductions.
              </p>

              <p>
                A good profile is honest, specific, and written in your own voice. The biggest
                mistake people make is writing profiles that sound like resumes. Nobody falls in
                love with a job description. Share what matters to you, how you spend your time,
                and what kind of partnership you are looking for.
              </p>

              <h3>Stage 3: Filtering and Evaluating Matches</h3>

              <p>
                On large platforms, this stage can feel overwhelming. You might see hundreds of
                profiles. The key is knowing your non-negotiables versus your preferences. A
                non-negotiable is something you will not compromise on (location, values, life
                goals). A preference is something you care about but can be flexible on (height,
                specific profession, horoscope compatibility).
              </p>

              <p>
                On curated platforms, this stage is simpler because the platform has already done
                much of the filtering for you. You see fewer profiles, but each one is more likely
                to be relevant.
              </p>

              <h3>Stage 4: Initial Conversations</h3>

              <p>
                In Indian matchmaking, first conversations are typically more direct than in
                Western dating. Both sides know why they are there. Questions about family
                background, career plans, values, and life goals come up early &mdash; and that
                is a feature, not a bug.
              </p>

              <p>
                The best conversations happen when both people treat it as a genuine getting-to-know-you
                exchange rather than an interview. Share openly, ask thoughtfully, and remember that
                the other person is navigating the same uncertainty you are.
              </p>

              <h3>Stage 5: Family Introductions</h3>

              <p>
                In most Indian matchmaking processes, families meet relatively early &mdash; often
                after just a few conversations between the individuals. This is one of the biggest
                differences from Western dating, where meeting family can take months or years.
              </p>

              <p>
                The family meeting is not a formality. It is an important step where both families
                assess compatibility on a broader level: values alignment, family dynamics, cultural
                expectations. For many Indian Americans, this is the stage where{' '}
                <Link href="/blog/indian-families-america-marriage-gap">
                  the gap between generations becomes most visible
                </Link>
                , and honest communication matters most.
              </p>

              <h3>Stage 6: Moving Forward Together</h3>

              <p>
                If both the individuals and families feel good about the connection, the
                relationship moves into a deeper phase &mdash; spending more time together,
                discussing practical matters like where to live and how to merge two lives,
                and eventually deciding on engagement and marriage.
              </p>

              <p>
                There is no fixed timeline for this. Some couples move quickly, getting engaged
                within a few months of meeting. Others take a year or more. The right pace is
                whatever feels honest and comfortable for both people.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>What Are the Biggest Mistakes People Make?</h2>

              <p>
                After building VivaahReady and speaking with hundreds of families across the US,
                I have seen the same patterns repeat. Here are the most common mistakes.
              </p>

              <p>
                <strong>Waiting too long to start.</strong> The median marriage age for Indian
                Americans has moved to 29, but many people do not begin actively looking until
                their early thirties, when they feel ready but the urgency is higher. Starting
                the process earlier, even casually, gives you more time and less pressure.
              </p>

              <p>
                <strong>Using too many platforms at once.</strong> Spreading yourself across five
                apps and three matrimony sites sounds productive but usually leads to burnout.
                Pick one or two that align with your priorities and invest your energy there.
              </p>

              <p>
                <strong>Not involving family early enough.</strong> Even if your family is not
                directly managing the search, keeping them informed reduces friction later. The
                families who struggle most are the ones where{' '}
                <Link href="/blog/caught-between-dating-apps-and-arranged-marriage">
                  parents and children are searching separately without talking about it
                </Link>
                .
              </p>

              <p>
                <strong>Optimizing for the wrong things.</strong> Salary, height, and specific
                alma maters are easy to filter on. Emotional maturity, communication style, and
                shared values are not. The best matches I have seen come from people who
                prioritized character over credentials.
              </p>

              <h2>What Has Changed About Indian Matchmaking in 2026?</h2>

              <p>
                Three trends are reshaping the landscape right now, and they are worth understanding
                if you are entering the process.
              </p>

              <p>
                <strong>AI-powered compatibility matching.</strong> Several platforms now use AI
                to analyze compatibility across hundreds of factors, going beyond the basic filters
                of age, education, and location. Early data from platforms like NRI Marriage Bureau
                suggests these algorithms are producing matches with significantly higher satisfaction
                rates than manual search alone.
              </p>

              <p>
                <strong>Privacy as a priority.</strong> Indian Americans are increasingly unwilling
                to have their profiles publicly visible on large databases. The demand for{' '}
                <Link href="/privacy-first-matchmaking">
                  privacy-first matchmaking
                </Link>
                {' '}&mdash; where your information is only shared with verified, compatible individuals
                &mdash; has grown substantially.
              </p>

              <p>
                <strong>Family-involved but individual-driven.</strong> The old binary of
                &ldquo;arranged marriage&rdquo; versus &ldquo;love marriage&rdquo; is dissolving.
                According to the Jeevansathi data, the emerging norm is a self-driven process with
                family support rather than family control. Most Indian Americans want their parents
                involved but not in charge.
              </p>

              <h2>How Do You Choose the Right Approach for Your Family?</h2>

              <p>
                There is no single right answer. The best approach depends on your specific
                situation. Here are the questions that matter most.
              </p>

              <p>
                <strong>How large is your community network in the US?</strong> If your family has
                a wide, active network in your metro area, personal introductions may be your
                strongest channel. If your network is small, platforms become essential.
              </p>

              <p>
                <strong>How important is privacy to you?</strong> If you want to control who sees
                your profile and when, look for platforms with privacy-first designs rather than
                open directories.
              </p>

              <p>
                <strong>What level of family involvement feels right?</strong> Some platforms are
                designed for family-led searches. Others are individual-first. Choose the one that
                matches how your family actually operates, not how you think it should operate.
              </p>

              <p>
                <strong>What is your budget?</strong> Professional matchmakers offer high-touch
                service but at a premium. Platforms offer scale at lower cost. The right choice
                depends on what you value more: personal curation or broader reach.
              </p>

              <p>
                The{' '}
                <Link href="/blog/indian-american-marriage-arranged-dating-apps-middle-path-usa">
                  middle path that many Indian Americans are finding
                </Link>
                {' '}combines the intentionality of traditional matchmaking with the personal
                autonomy of modern relationships. It is not arranged marriage. It is not Western
                dating. It is something new, and it is working.
              </p>
            </div>

            {/* Author sign-off */}
            <div className="mt-10 flex items-center gap-4 p-6 bg-gray-50 rounded-xl not-prose">
              <div className="h-14 w-14 rounded-full bg-primary-600 flex items-center justify-center text-white font-display text-xl font-bold flex-shrink-0">
                L
              </div>
              <div>
                <p className="font-semibold text-gray-900">Lakshmi</p>
                <p className="text-sm text-gray-500">Founder, VivaahReady</p>
                <p className="text-sm text-gray-500 mt-1">
                  Building a private, values-first matchmaking space for Indian families in America.
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-12 border-gray-200" />

            {/* FAQ Section */}
            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-8">
                {faqs.map((faq, i) => (
                  <div key={i}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Divider */}
            <hr className="my-12 border-gray-200" />

            {/* CTA Section */}
            <section className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Start?
              </h2>
              <p className="text-primary-100 mb-8 max-w-xl mx-auto leading-relaxed">
                VivaahReady is a private, verified matchmaking space for Indian-origin families and
                professionals in the US. Serious intent. No public profiles. Family-friendly by design.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
                >
                  Create Your Profile
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              </div>

              <nav className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-200">
                <Link href="/about" className="hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
              </nav>
            </section>
          </div>
        </div>
      </article>
    </>
  )
}
