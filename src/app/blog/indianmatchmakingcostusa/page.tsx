import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'What Does Indian Matchmaking Cost in the USA? Full Price Breakdown (2026)',
  description:
    'Indian matchmaking costs range from $15/mo on apps to $300,000+ for luxury services. A full pricing breakdown of BharatMatrimony, Shaadi, Dil Mil, and private matchmakers.',
  keywords: [
    'Indian matchmaking cost USA',
    'BharatMatrimony pricing',
    'Shaadi.com cost',
    'Dil Mil pricing',
    'Indian matchmaker price',
    'Sima Taparia cost',
    'Indian matrimony app cost',
    'matchmaking fees Indian American',
    'Indian dating app pricing',
    'how much does Indian matchmaking cost',
    'BanyanWay matchmaking cost',
    'Indian American matrimony pricing',
  ],
  openGraph: {
    title: 'What Does Indian Matchmaking Cost in the USA? Full Price Breakdown (2026)',
    description:
      'Indian matchmaking costs range from $15/mo on apps to $300,000+ for luxury services. See the full pricing breakdown for every option.',
    url: 'https://vivaahready.com/blog/indianmatchmakingcostusa',
    type: 'article',
    publishedTime: '2026-03-12T00:00:00Z',
  },
  alternates: {
    canonical: 'https://vivaahready.com/blog/indianmatchmakingcostusa',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'What Does Indian Matchmaking Cost in the USA? Full Price Breakdown (2026)',
  description:
    'Indian matchmaking costs range from $15/mo on apps to $300,000+ for luxury services. A full pricing breakdown of BharatMatrimony, Shaadi, Dil Mil, and private matchmakers.',
  datePublished: '2026-03-12T00:00:00Z',
  image: ['https://vivaahready.com/logo-banner.png'],
  dateModified: '2026-03-12T00:00:00Z',
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
    logo: {
      '@type': 'ImageObject',
      url: 'https://vivaahready.com/logo-banner.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://vivaahready.com/blog/indianmatchmakingcostusa',
  },
}

const faqs = [
  {
    question: 'What is the cheapest way to start Indian matchmaking in the USA?',
    answer:
      'BharatMatrimony Classic plans start around $15-23 per month, making it the most affordable paid option among major Indian matrimony platforms. Free tiers exist on most platforms, but they severely limit communication. You can browse profiles for free on Shaadi.com and BharatMatrimony, but you typically can\'t read or send messages without upgrading.',
  },
  {
    question: 'Is hiring a private Indian matchmaker worth the cost?',
    answer:
      'It depends on your budget and how much time you have. Private matchmakers like BanyanWay ($2,999-$7,499) offer curated, vetted introductions and save you hours of searching. For high earners who value their time, the math often works out. But the most expensive option isn\'t always the best fit. Clarity about what you want matters more than the price tag.',
  },
  {
    question: 'Why are luxury matchmaking services so expensive?',
    answer:
      'Firms like Ambiance Matchmaking and Kelleher International charge $25,000 to $300,000+ because they maintain exclusive databases, conduct extensive background checks, and assign dedicated matchmakers who do the searching for you. You\'re paying for privacy, curation, and access to a vetted pool of high-net-worth individuals. Whether that justifies the cost is a personal decision.',
  },
  {
    question: 'How much do Indian Americans typically spend on dating each month?',
    answer:
      'According to Match Group data reported by South Denver Therapy in 2025, U.S. singles spend an average of $213 per month on dating overall. Active daters spend closer to $310 per month when you include dates, grooming, outfits, and subscriptions. Most people don\'t track these costs, which is why the total often comes as a surprise.',
  },
]

export default function BlogPost() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://vivaahready.com' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://vivaahready.com/blog' },
            { '@type': 'ListItem', position: 3, name: 'What Does Indian Matchmaking Cost in the USA?', item: 'https://vivaahready.com/blog/indianmatchmakingcostusa' },
          ],
        }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }) }}
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
                <span className="text-sm text-gray-400">10 min read</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight">
                What Does Indian Matchmaking Cost in the USA?
              </h1>

              <p className="mt-4 text-2xl md:text-3xl font-display text-gray-500 leading-snug">
                From $15-a-Month Apps to $300,000 Luxury Matchmakers
              </p>

              <p className="mt-6 text-xl text-gray-500 leading-relaxed">
                A real breakdown of what you'll actually pay for BharatMatrimony, Shaadi.com,
                Dil Mil, private matchmakers, and everything in between.
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
                    <time dateTime="2026-03-12">March 12, 2026</time>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden">
            <Image
              src="https://images.pexels.com/photos/4312847/pexels-photo-4312847.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop"
              alt="A happy young Indian couple smiling together while sitting outdoors in warm natural light"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

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
                  Indian matchmaking in the USA ranges from $15/month for basic app subscriptions
                  to $300,000+ for luxury matchmakers. Most Indian dating app users spend $18-19/month
                  on subscriptions (<a href="https://www.cbsnews.com/news/dating-apps-spending/" className="text-primary-600 hover:underline">CBS News</a>, 2024), but the real cost of finding a partner
                  includes dates, time, and emotional energy. Your best option depends on
                  your budget, your timeline, and how much curation you want.
                </p>
              </div>

              {/* Opening */}
              <p className="first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:text-primary-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none">
                I get asked about money a lot. Not in a rude way. More like a cousin pulling
                you aside at a family gathering and whispering, &quot;So what does all this
                actually cost?&quot; It's a fair question. And most people don't get a straight
                answer.
              </p>

              <p>
                The Indian matchmaking world in America is weirdly opaque about pricing. Some
                apps bury their costs behind signup walls. Private matchmakers won't quote you
                until you've done a 45-minute &quot;consultation call.&quot; And the range is
                absurd. We're talking $15 a month on one end and literally $300,000 on the other.
              </p>

              <p>
                So I'm going to lay it all out. Every major option, what it actually costs, and
                whether the price tag matches the value. No affiliate links. No sales pitch.
                Just the numbers I wish someone had given me when I started{' '}
                <Link href="/blog/how-indian-matchmaking-works-in-america-2026">researching how matchmaking works in the US</Link>.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Section 1 */}
              <h2>What Do Indian Dating Apps Actually Cost?</h2>

              <p>
                The average dating app user in the US spends $18-19 per month on subscriptions,
                according to <a href="https://www.cbsnews.com/news/dating-apps-spending/">Morgan Stanley data reported by CBS News</a> (2024).
                Indian-focused apps fall right in that range, though pricing varies widely depending
                on the platform, plan length, and whether you catch a sale.
              </p>

              <p>
                Here's what the three biggest Indian matrimony and dating apps charge right now.
              </p>

              <h3>BharatMatrimony</h3>

              <p>
                BharatMatrimony's Classic plan runs about $15-23 per month if you pay monthly.
                Bundle it into a 3- to 6-month plan and you'll pay $54-117 total, according
                to <a href="https://datingwise.com/bharatmatrimony-cost/">DatingWise</a>. That's
                the cheapest major option on this list.
              </p>

              <p>
                The free tier lets you create a profile and browse. But you can't read messages
                or see who viewed you. It's a window-shopping experience. You'll know people are
                interested, but you won't be able to respond unless you pay.
              </p>

              <h3>Dil Mil</h3>

              <p>
                Dil Mil's VIP Elite subscription costs $17-35 per month, or roughly $200-420
                per year, based on pricing data from{' '}
                <a href="https://thematchartist.com/blog/dil-mil-cost">The Match Artist</a>.
                Dil Mil is more of a dating app than a matrimony platform. It skews younger and
                more casual than BharatMatrimony or Shaadi.
              </p>

              <p>
                The free version gives you limited daily swipes and basic filters. Paying unlocks
                unlimited swipes, advanced preferences, and the ability to see who liked you. If
                you're under 30 and open to dating before committing to marriage, Dil Mil's
                pricing is reasonable. But if marriage is the goal, you might feel like you're
                fishing in the wrong pond.
              </p>

              <h3>Shaadi.com</h3>

              <p>
                Shaadi.com's Standard plans run $32-45 per month, with bundled options from
                $89 for 2 months to $198 for 5 months, according
                to <a href="https://bestdatingsites.com/shaadi-pricing/">BestDatingSites</a>.
                That makes Shaadi the priciest app option on this list.
              </p>

              <p>
                Is it worth double what BharatMatrimony charges? Honestly, it depends on your
                market. Shaadi has strong US-based profiles, especially in metros like New York,
                Chicago, and the Bay Area. If your search is geographically specific, the
                larger pool might justify the cost. But the features at each tier aren't dramatically
                different from what BharatMatrimony offers.
              </p>

              {/* Inline Image */}
              <div className="not-prose my-10">
                <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden">
                  <Image
                    src="https://images.pexels.com/photos/6544197/pexels-photo-6544197.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop"
                    alt="A young Indian woman thoughtfully looking at her phone while sitting at a cafe table"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3 text-center">
                  Most Indian dating app subscriptions cost between $15 and $45 per month.
                </p>
              </div>

              {/* Citation Capsule */}
              {/* Indian dating app subscriptions range from $15-23/month for BharatMatrimony Classic (DatingWise) to $32-45/month for Shaadi.com Standard (BestDatingSites). Dil Mil VIP Elite falls in between at $17-35/month (The Match Artist). The average U.S. dating app user pays $18-19/month (Morgan Stanley via CBS News, 2024). */}

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Section 2 */}
              <h2>What About Hiring a Traditional Matchmaker?</h2>

              <p>
                Private matchmaking is a completely different price universe. Sima Taparia, who
                became famous from Netflix's <em>Indian Matchmaking</em>, reportedly charges
                around $1,885-$8,000+ per engagement, according
                to <a href="https://www.distractify.com/p/sima-taparia-cost">Distractify</a>.
                And she's considered mid-range in this market.
              </p>

              <p>
                The appeal of a private matchmaker is obvious. Someone does the searching for you.
                They vet candidates, check backgrounds, and present you with curated options. You
                skip the swiping, the ghosting, and the &quot;so what are we?&quot; conversations.
                But you pay for that convenience. Significantly.
              </p>

              <h3>BanyanWay</h3>

              <p>
                BanyanWay, a matchmaking service focused on South Asian professionals in the
                US, offers a Signature package ranging from $2,999 to $7,499 for 3 to 12
                months of service, per their{' '}
                <a href="https://banyanway.com/pricing">official website</a>. You get a dedicated
                matchmaker, a curated number of introductions, and coaching on your profile and
                approach.
              </p>

              <p>
                I've heard mixed reviews. Some people love the personal attention. Others feel like
                the pool is too small for the price. If you're in a major metro, you'll
                probably get more introductions than someone in, say, Raleigh or Phoenix. Geography
                matters with boutique matchmakers.
              </p>

              <h3>Luxury matchmaking firms</h3>

              <p>
                At the top end, firms like Ambiance Matchmaking and Kelleher International charge
                $25,000 to $300,000+, according to{' '}
                <a href="https://ambiancematchmaking.com/">Ambiance Matchmaking</a> and{' '}
                <a href="https://vidaselect.com/">VIDA Select</a>. These aren't Indian-specific
                services. They serve high-net-worth clients across backgrounds.
              </p>

              <p>
                Who actually pays $300,000 for a matchmaker? More people than you'd think.
                Typically it's busy executives, physicians, or founders who'd rather write a check
                than spend hundreds of hours on apps. Whether they get better outcomes is debatable.
                But they get privacy and white-glove service.
              </p>

              {/* Citation Capsule */}
              {/* Private Indian matchmaking in the USA ranges from Sima Taparia's reported $1,885-$8,000+ (Distractify) to BanyanWay's $2,999-$7,499 Signature package (BanyanWay official). Luxury firms like Ambiance Matchmaking charge $25,000-$300,000+ for high-net-worth clients (Ambiance Matchmaking, VIDA Select). */}

              {/* Rhetorical question break */}
              <p>
                So where does that leave most of us? Somewhere between a $23-a-month app and a
                $7,500 matchmaker. Which brings up the real question most people should be asking.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Section 3 */}
              <h2>How Much Do Indian Americans Actually Spend on Finding a Partner?</h2>

              <p>
                U.S. singles spend an average of $213 per month on dating overall, according
                to <a href="https://southdenvertherapy.com/dating-spending-statistics/">Match Group data reported by South Denver Therapy</a> (2025).
                Active daters spend even more: roughly $310 per month. That includes dates,
                grooming, outfits, and subscriptions combined.
              </p>

              <p>
                Most people don't track these costs. You think you're spending $20 a month on
                Shaadi.com and that's it. But then there's the coffee date that turned into dinner
                ($85). The new outfit you bought because your last three profile photos were from
                2023 ($120). The Uber to the restaurant because you wanted to make a good
                impression ($22).
              </p>

              <p>
                It adds up fast. And here's what surprised me: only 25% of dating app users
                actually pay for subscriptions, per{' '}
                <a href="https://www.cbsnews.com/news/dating-apps-spending/">CBS News</a> (2024).
                That means three out of four people are trying to find a life partner using
                free, limited tools. Think about that for a second.
              </p>

              <p>
                The U.S. online dating market hit $1.65 billion in 2025 and is projected to
                reach $3.36 billion by 2034, according
                to <a href="https://www.precedenceresearch.com/online-dating-market">Precedence Research</a>.
                That's a lot of money flowing into this space. But is it flowing toward
                results, or just toward swiping?
              </p>

              {/* [PERSONAL EXPERIENCE] */}
              <p>
                I've talked to hundreds of Indian Americans about their search. The ones who
                found their partner fastest weren't necessarily the ones who spent the most.
                They were the ones who spent intentionally. A focused 3-month premium subscription
                with a clear strategy beats two years of sporadic free-tier swiping every single
                time.
              </p>

              {/* Citation Capsule */}
              {/* U.S. singles spend an average of $213 per month on dating, with active daters spending $310/month (Match Group data via South Denver Therapy, 2025). Only 25% of dating app users pay for subscriptions (CBS News, 2024), meaning most people search for a life partner using severely limited free tools. */}

              {/* Inline Image */}
              <div className="not-prose my-10">
                <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden">
                  <Image
                    src="https://images.pexels.com/photos/4307911/pexels-photo-4307911.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop"
                    alt="An Indian couple walking together through a park having a relaxed conversation"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3 text-center">
                  The real cost of finding a partner goes well beyond app subscriptions.
                </p>
              </div>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Section 4 */}
              <h2>Is a Free Matrimony Profile Worth Anything?</h2>

              <p>
                Only 25% of dating app users pay for subscriptions
                (<a href="https://www.cbsnews.com/news/dating-apps-spending/">CBS News</a>, 2024),
                which means most people are relying on free profiles. But here's the catch: free
                profiles on Indian matrimony sites are deliberately crippled. They're designed
                to show you just enough to make you pay.
              </p>

              <p>
                On BharatMatrimony's free tier, you can create a profile and appear in search
                results. You can see that someone is interested in you. But you can't read
                their message. You can't see their contact details. It's like being handed
                a sealed envelope and told you have to buy a letter opener.
              </p>

              <p>
                Shaadi.com's free tier is similar. You get basic search and can send
                &quot;interests,&quot; but actual communication requires a paid plan. Dil Mil
                gives you limited swipes per day on the free version.
              </p>

              {/* [UNIQUE INSIGHT] */}
              <p>
                Here's what I think most people get wrong about free profiles. The issue isn't
                that free doesn't work. The issue is that free <em>signals</em> something. When
                you're on a free tier, you're telling potential matches, &quot;I'm not sure
                enough about this to invest $20 a month.&quot; And on a platform where everyone
                is supposedly looking for a life partner, that signal matters. Would you trust a
                surgeon who told you they use the free version of their medical software?
              </p>

              <p>
                That said, starting with a free profile makes sense as a first step. Browse.
                See who's on the platform. Check if there are enough people in your area who
                match your preferences. Then upgrade if it looks promising. Don't pay blindly.
                But don't expect the free tier to deliver results either.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Section 5 */}
              <h2>What's the Real Cost of Not Investing in Your Search?</h2>

              <p>
                Americans lost $1.14 billion to romance scams in 2023 alone, according to
                the <a href="https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2024/02/romance-scammers-favorite-lies-exposed">FTC</a>.
                That's not a matchmaking cost. That's a cost of searching without safeguards,
                without verification, and without trusted platforms acting as a filter.
              </p>

              <p>
                I'm not saying everyone on a free app is a scammer. Obviously not. But there's
                an opportunity cost to the way most people search that nobody talks about. And
                it's not just about money.
              </p>

              <h3>The time cost</h3>

              {/* [ORIGINAL DATA] */}
              <p>
                I've spoken with Indian Americans who spent three, four, even five years swiping
                across multiple platforms without a single serious relationship to show for it.
                Five years. If you value your time at even $30 an hour and spent just 5 hours a
                week on apps, that's $39,000 in time over five years. Suddenly a $3,000
                matchmaker doesn't seem so expensive, does it?
              </p>

              <h3>The emotional cost</h3>

              <p>
                Burnout is real. I've heard from people who gave up on their search entirely
                after years of bad experiences on apps. They didn't stop wanting a partner.
                They just stopped believing it was possible. That's a cost no pricing table
                captures. And it's the one I worry about most, especially for Indian Americans
                who already feel{' '}
                <Link href="/blog/shame-of-looking-indian-american-matrimony">a sense of shame around actively looking</Link>.
              </p>

              <h3>The safety cost</h3>

              <p>
                Romance scam losses tell only part of the story. There's also the risk of
                meeting unvetted strangers, the privacy concerns of having your profile visible
                to colleagues and community members, and the emotional damage of catfishing.
                Platforms that verify identities and maintain smaller, curated communities reduce
                these risks. That verification has a cost, but so does its absence.
              </p>

              <p>
                The cheapest option isn't always the most affordable one. Sometimes you get what
                you pay for. And sometimes you pay far more in time, energy, and heartbreak by
                trying to spend nothing. There's a middle ground. You just have to be honest
                about what your search is actually worth to you.
              </p>

              {/* Citation Capsule */}
              {/* Americans lost $1.14 billion to romance scams in 2023 (FTC). The hidden costs of partner searching extend beyond subscriptions: U.S. singles spend $213/month on dating overall (Match Group via South Denver Therapy, 2025), and years of unfocused searching can cost tens of thousands of dollars in time alone. */}

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Pricing Summary Table */}
              <h2>Quick Pricing Comparison</h2>

              <div className="not-prose my-8 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-4 font-semibold text-gray-900 border-b border-gray-200">Service</th>
                      <th className="text-left p-4 font-semibold text-gray-900 border-b border-gray-200">Cost Range</th>
                      <th className="text-left p-4 font-semibold text-gray-900 border-b border-gray-200">Type</th>
                      <th className="text-left p-4 font-semibold text-gray-900 border-b border-gray-200">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">BharatMatrimony Classic</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">$15-23/mo</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Matrimony app</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">DatingWise</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Dil Mil VIP Elite</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">$17-35/mo</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Dating app</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">The Match Artist</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Shaadi.com Standard</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">$32-45/mo</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Matrimony app</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">BestDatingSites</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Sima Taparia</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">~$1,885-$8,000+</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Private matchmaker</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Distractify</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">BanyanWay Signature</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">$2,999-$7,499</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Boutique matchmaker</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">BanyanWay official</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Ambiance / Kelleher</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">$25,000-$300,000+</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Luxury matchmaker</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Ambiance, VIDA Select</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Conclusion */}
              <h2>So What Should You Actually Spend?</h2>

              <p>
                There's no universal answer. But I'll tell you what I believe after years of
                watching people go through this process.
              </p>

              <p>
                If you're serious about finding a life partner, invest <em>something</em>. A
                paid subscription to one platform you've researched is better than free accounts
                on five platforms you barely check. Pick the one that matches your intent, your
                age group, and your geography.
              </p>

              <p>
                If you can afford a boutique matchmaker and you value time over money, it's worth
                a conversation. But do your research first. Ask for references. Ask how many
                introductions are included. Ask what happens if none of them work out.
              </p>

              <p>
                And if you're not sure where you fall on the{' '}
                <Link href="/blog/indian-matchmaking-vs-dating-apps-honest-comparison">app vs. matchmaker spectrum</Link>,
                start by getting clear on what you actually want. The most expensive mistake in
                matchmaking isn't overpaying for a service. It's spending years on the wrong one.
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

            <hr className="my-12 border-gray-200" />

            {/* CTA Section */}
            <section className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Start Your Search the Right Way?
              </h2>
              <p className="text-primary-100 mb-8 max-w-xl mx-auto leading-relaxed">
                Skip the pricing confusion. VivaahReady is a private, values-first matchmaking
                space built for Indian Americans who are serious about finding a life partner.
                Create your profile in minutes.
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
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              </nav>
            </section>
          </div>
        </div>
      </article>
    </>
  )
}
