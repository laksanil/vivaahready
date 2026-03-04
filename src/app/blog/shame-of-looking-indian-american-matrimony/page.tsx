import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nobody Talks About the Shame of Looking | VivaahReady',
  description:
    'Why Indian Americans hide that they are searching for a life partner and what it costs them. An honest look at matrimony, shame, and finding clarity.',
  keywords: [
    'Indian American matrimony shame',
    'Indian matrimony USA',
    'shame of looking for marriage',
    'Indian American marriage search',
    'Indian families partner search',
    'Indian matchmaking stigma',
    'Indian American relationships',
    'matrimony site embarrassment',
    'Indian diaspora marriage',
    'looking for life partner shame',
  ],
  openGraph: {
    title: 'Nobody Talks About the Shame of Looking',
    description:
      'Admitting you are actively looking feels like admitting something is missing. Why so many Indian Americans search in secret, and what changes when they stop.',
    url: 'https://vivaahready.com/blog/shame-of-looking-indian-american-matrimony',
    type: 'article',
    publishedTime: '2026-03-04T00:00:00Z',
  },
  alternates: {
    canonical: 'https://vivaahready.com/blog/shame-of-looking-indian-american-matrimony',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Nobody Talks About the Shame of Looking',
  description:
    'Why Indian Americans hide that they are searching for a life partner and what it costs them. An honest look at matrimony, shame, and finding clarity.',
  datePublished: '2026-03-04T00:00:00Z',
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
    '@id': 'https://vivaahready.com/blog/shame-of-looking-indian-american-matrimony',
  },
}

const faqs = [
  {
    question: 'Why do Indian Americans feel ashamed of using matrimony sites?',
    answer:
      'The stigma comes from a feeling that needing help finding a partner means something is wrong with you. In a culture that values self-sufficiency and professional achievement, admitting you are actively looking can feel like admitting you have failed at something everyone else seems to figure out naturally.',
  },
  {
    question: 'How is matrimony site shame different from dating app stigma?',
    answer:
      'Dating apps carry a casual connotation that many Indian Americans are comfortable dismissing. Matrimony sites, on the other hand, signal serious intent and family involvement, which feels heavier. The shame is not about the tool itself but about what using it seems to announce: that you are ready and looking, and that it has not happened on its own.',
  },
  {
    question: 'What happens when families search for a partner in secret?',
    answer:
      'Secrecy creates isolation. Parents browse profiles without telling their children. Children create accounts without telling their parents. Everyone is working toward the same goal but nobody is talking about it, which leads to missed opportunities, duplicated effort, and unnecessary emotional weight.',
  },
  {
    question: 'How can Indian Americans approach partner search without shame?',
    answer:
      'Clarity helps. When a platform is built around serious intent, verified profiles, and family involvement from the start, the search stops feeling like something to hide. The shame fades when looking becomes just looking, not a confession or an emergency, but a calm and honest step forward.',
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
                  Perspectives
                </span>
                <span className="text-sm text-gray-400">10 min read</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight">
                Nobody Talks About the Shame of Looking
              </h1>

              <p className="mt-4 text-2xl md:text-3xl font-display text-gray-500 leading-snug">
                Why Indian Americans Hide That They&rsquo;re Searching for a Life Partner
              </p>

              <p className="mt-6 text-xl text-gray-500 leading-relaxed">
                Admitting you are actively looking feels like admitting something is missing. So most
                people search quietly, and carry the weight of that silence alone.
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
                    <time dateTime="2026-03-04">March 4, 2026</time>
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
              {/* Drop cap opening */}
              <p className="first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:text-primary-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none">
                He is 34. An engineer at a well-known company in the Bay Area. His parents live in
                New Jersey. He calls them every Sunday evening, talks about work, about the weather,
                about his sister&rsquo;s kids. The one topic nobody brings up anymore is marriage.
              </p>

              <p>
                Not secretly, exactly. His family knows he wants to get married eventually. They
                know he is not opposed to it. But he has not told them he created a profile on a
                matrimony site six months ago. He logs in late at night, scrolls through profiles,
                and closes the tab before bed.
              </p>

              <p>He has not told his friends either.</p>

              <p>
                If someone asked, he would probably say he is open to meeting someone. He would not
                say he is actively searching. Those two sentences feel completely different, and he
                knows it.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>The Unspoken Rule</h2>

              <p>
                There is an unspoken rule among many Indian Americans when it comes to finding a
                life partner. You are allowed to want marriage. You are allowed to be ready. But you
                are not supposed to look like you are trying too hard.
              </p>

              <p>
                Being on a dating app is casual enough to mention over coffee. Being on a matrimony
                site feels different. It signals something more deliberate, more vulnerable. It says
                you have thought about this seriously, that you have taken a step, and that it has
                not happened on its own yet.
              </p>

              <p>
                For a generation that was raised to be capable, accomplished, and self-sufficient,
                that last part stings. It feels like admitting you could not figure out the one
                thing everyone assumes will just happen naturally.
              </p>

              {/* Pull quote */}
              <figure className="my-10 md:my-14 py-8 px-6 md:px-10 bg-gray-50 rounded-2xl border-l-4 border-primary-500 not-prose">
                <blockquote className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed">
                  &ldquo;I have a great career, wonderful friends, and a full life. But telling
                  someone I am on a matrimony site makes me feel like I am confessing that something
                  is missing.&rdquo;
                </blockquote>
              </figure>

              <h2>What We Actually Hide</h2>

              <p>
                It is not marriage itself that feels embarrassing. Most people I talk to want
                companionship. They want a partner who understands their family, their culture, their
                way of seeing the world. They want someone who gets what it means to live between two
                identities, to carry the expectations of one generation while building a life in
                another.
              </p>

              <p>That is a beautiful thing to want. So why does the search feel shameful?</p>

              <p>
                Because somewhere along the way, actively looking became synonymous with being
                desperate. And desperation, in Indian culture, is almost worse than being alone.
              </p>

              <p>
                A mother in Houston told me she created an account on a matrimony platform for her
                son. She did not tell him. She was afraid he would be upset, not because he did not
                want to get married, but because he would feel like she was saying he could not
                handle it himself.
              </p>

              <p>
                Meanwhile, her son had already created his own profile on a different site. He had
                not told her either.
              </p>

              <p>
                Two people in the same family, working toward the same goal, and neither one talking
                about it.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>The Double Standard Nobody Mentions</h2>

              <p>
                Here is the strange part. In India, arranged marriage is a system. Nobody apologizes
                for it. Families sit down, talk openly, and work together to find a match. There is
                structure, clarity, and purpose. Nobody hides.
              </p>

              <p>
                But in America, among the diaspora, that same process carries a different weight.
                Saying &ldquo;my parents are looking for matches&rdquo; in a room full of colleagues
                or American friends feels awkward. It does not translate easily. And so Indian
                Americans who are doing the exact same thing their parents did, just in a new
                country, end up doing it quietly.
              </p>

              <p>
                The secrecy is not about disagreeing with the process. It is about not wanting to
                explain it. Not wanting to see the raised eyebrows or hear the polite
                &ldquo;oh&rdquo; that says more than any sentence could.
              </p>

              <p>
                A woman in Dallas, 31, told me she deactivates her profile every time she starts a
                new job. She does not want a coworker to stumble across it. She is not ashamed of
                wanting to get married. She is ashamed of being seen looking.
              </p>

              <p className="text-xl font-display font-semibold text-gray-900">
                There is a real difference between wanting something and being caught wanting it.
              </p>

              <h2>What Secrecy Actually Costs</h2>

              <p>
                When you search in silence, every part of the process becomes heavier than it needs
                to be.
              </p>

              <p>
                You cannot ask your parents for help because you do not want them to know you are
                looking. You cannot ask friends for introductions because you do not want them to
                think you are struggling. You scroll through profiles at night and close the browser
                in the morning, and nobody in your life knows you spent two hours thinking about
                your future.
              </p>

              <p>
                The loneliness of the search is not about being single. It is about carrying
                something privately that could be shared.
              </p>

              <p>
                And the longer you carry it alone, the more it starts to feel like something is
                actually wrong. The shame reinforces itself. If this were normal, you tell yourself,
                I would not need to hide it. And since I am hiding it, maybe it is not normal.
              </p>

              {/* Pull quote */}
              <figure className="my-10 md:my-14 py-8 px-6 md:px-10 bg-primary-50 rounded-2xl not-prose">
                <blockquote className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed">
                  &ldquo;The loneliness of the search is not about being single. It is about
                  carrying something privately that could be shared.&rdquo;
                </blockquote>
              </figure>

              <p>
                I have seen this pattern so many times. A professional in their early thirties,
                accomplished and thoughtful, quietly browsing profiles on their phone, then putting
                the phone face down when someone walks into the room.
              </p>

              <p>
                The shame does not come from the outside. It comes from within. From a deeply
                internalized belief that needing help with this particular thing means you have
                somehow fallen short.
              </p>

              <h2>When I Stopped Hiding</h2>

              <p>
                I remember the moment clearly. A friend of mine, someone I respect deeply, told me
                casually over lunch that she had signed up for a matchmaking service. She said it the
                same way you might say you hired a financial advisor or joined a gym.
              </p>

              <p>No drama. No embarrassment. Just a decision she had made and felt fine about.</p>

              <p>
                I remember thinking: why does that feel so radical? She was not desperate. She was
                not broken. She was just clear about what she wanted and willing to take a step
                toward it.
              </p>

              <p>
                That is all it was. A step. Not a confession, not an emergency, not an admission of
                failure. Just a step.
              </p>

              <p>
                And hearing her say it out loud made me realize how much energy I had spent, and how
                much energy others around me had spent, treating the search like a secret.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>What If Looking Is Just Looking?</h2>

              <p>
                What if searching for a partner did not carry any extra meaning? What if it was just
                a thing people did, like looking for the right home or the right career path? Not
                something to announce to the world, but not something to hide from the people who
                love you or from the people you are trying to meet.
              </p>

              <p>
                I think the shame fades when two things change.
              </p>

              <p>
                First, when the space where you look feels safe. When profiles are verified, when
                intentions are clear, when families can be involved without it feeling forced. When
                the platform itself says: this is a serious place for serious people. Not a last
                resort. A first choice.
              </p>

              <p>
                Second, when you stop treating the search as evidence of something wrong and start
                seeing it as evidence of something right. You are clear. You are ready. You are
                taking a step. That is not weakness. That is courage.
              </p>

              <p>
                I see you, the one browsing quietly late at night. The one who closes the tab when
                someone walks in. The one who wants to tell your parents but does not know how to
                start the conversation.
              </p>

              <p>
                I see you, and I want you to know there is nothing wrong with looking.
              </p>

              <p>
                Looking is just looking. And it is one of the bravest, most honest things you can do.
              </p>

              <p>
                If you have ever felt{' '}
                <Link
                  href="/blog/caught-between-dating-apps-and-arranged-marriage"
                  className="text-primary-600 hover:underline"
                >
                  caught between dating apps and arranged marriage
                </Link>
                , you are not alone. That tension is real, and it is worth understanding before you
                decide how to move forward.
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
                Ready to Start the Conversation?
              </h2>
              <p className="text-primary-100 mb-8 max-w-xl mx-auto leading-relaxed">
                VivaahReady is a private, verified space for Indian-origin families and professionals
                in the US to explore marriage thoughtfully.
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
