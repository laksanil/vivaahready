import { ChevronDown } from 'lucide-react'

export interface FAQ {
  question: string
  answer: string
}

interface FaqSectionProps {
  faqs: FAQ[]
  heading?: string
}

export function FaqSection({ faqs, heading = 'Frequently Asked Questions' }: FaqSectionProps) {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
          {heading}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group border border-gray-200 rounded-lg"
              open={i === 0}
            >
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="pr-4">{faq.question}</span>
                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 text-gray-600 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
