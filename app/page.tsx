import { MarketingNav } from "@/components/marketing/marketing-nav"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { AiResistance } from "@/components/marketing/ai-resistance"
import { TrustSection } from "@/components/marketing/trust-section"
import { UseCaseGrid } from "@/components/marketing/use-case-grid"
import { Pricing } from "@/components/marketing/pricing"
import { Faq } from "@/components/marketing/faq"
import { SiteFooter } from "@/components/marketing/site-footer"

export default function HomePage() {
  return (
    <div className="min-h-svh bg-paper font-sans text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-pine focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-pine-foreground"
      >
        Skip to content
      </a>
      <MarketingNav />
      <main id="main">
        <Hero />
        <HowItWorks />
        <AiResistance />
        <TrustSection />
        <UseCaseGrid />
        <Pricing />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  )
}
