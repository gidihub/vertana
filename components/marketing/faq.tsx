import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: "How is Vertana different from other assessment tools?",
    a: "Most tools fight AI cheating with surveillance. We design assessments an AI can't complete for the candidate, and treat monitoring as consented evidence — not a cage. Ten seats on Growth with no per-seat pricing, a real free tier, and pricing that adjusts to your country.",
  },
  {
    q: "Do you charge per seat?",
    a: "No. Every plan includes a generous seat count (2 on Free, 5 on Starter, 10 on Growth — more than double what comparable tools include at twice the price). If you need more, extra seats are a few dollars a month, not a per-user licence.",
  },
  {
    q: "Can candidates just use ChatGPT to pass?",
    a: "No. Library questions are screened for how easily an LLM solves them, and work-sample questions are scored on how well a candidate directs AI — not whether they avoided it.",
  },
  {
    q: "Is proctoring required?",
    a: "No. Proctoring and face verification are optional, consent-first features on Starter and above. Candidates must explicitly agree before any monitoring begins.",
  },
  {
    q: "How does regional pricing work?",
    a: "Prices adjust automatically to your country's purchasing power. Every plan includes the same features and the same credit allowance everywhere — only the price changes. Billing is in USD.",
  },
  {
    q: "Can I change my plan later?",
    a: "Yes — upgrade or downgrade any time from Settings. Changes apply to your next billing cycle.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, there's no lock-in contract. Cancel from Settings and you'll keep access through the end of your current billing period.",
  },
  {
    q: "Is candidate data private?",
    a: "Yes. Candidate data is only visible to your hiring team, never shared or sold, and session recordings are deleted on a fixed retention schedule.",
  },
  {
    q: "What happens if a candidate doesn't consent to proctoring?",
    a: "They can still take the assessment unmonitored where your plan allows, or you can require consent as a condition of starting the test — the choice is yours.",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
}

export function Faq() {
  return (
    <section id="faq" className="border-b border-sage-line/70 bg-card">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            FAQ
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Questions, answered
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
            Still curious about something? Reach out and we'll walk you through
            it.
          </p>
        </div>

        <Accordion multiple={false} className="gap-1">
          {FAQS.map((item) => (
            <AccordionItem
              key={item.q}
              value={item.q}
              className="border-b border-sage-line"
            >
              <AccordionTrigger className="py-4 text-base text-ink">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pr-6 text-sm leading-relaxed text-ink-muted">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
