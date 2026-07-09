import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: "Can I change my plan later?",
    a: "Yes. Upgrade or downgrade at any time from your account settings — changes take effect on your next billing cycle, and unused time is prorated.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no long-term contracts on Starter or Pro. Cancel whenever you like and you'll keep access through the end of your current period.",
  },
  {
    q: "Is candidate data private?",
    a: "Candidate submissions and any proctoring data are only visible to your team, are never sold, and are retained on a defined schedule tied to the hiring decision before being deleted.",
  },
  {
    q: "What happens if a candidate doesn't consent to proctoring?",
    a: "Consent is required before proctoring begins. If a candidate declines, they can still take an un-proctored version where allowed, or opt out — you decide the policy per test, and their choice is recorded.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="border-b border-sage-line/70 bg-card">
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
