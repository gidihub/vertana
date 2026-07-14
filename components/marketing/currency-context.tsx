"use client"

import { createContext, useContext, useState } from "react"
import type { ComponentType, SVGProps } from "react"
import {
  US,
  NG,
  KE,
  ZA,
  GH,
  UG,
  TZ,
  EU,
  GB,
} from "country-flag-icons/react/3x2"

import {
  DEFAULT_CURRENCY,
  RATES_AS_OF,
  SUPPORTED_CURRENCIES,
  flagForCurrency,
  isSupportedCurrency,
} from "@/lib/pricing/currency"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type CurrencyContextValue = {
  currency: string
  setCurrency: (code: string) => void
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

const FLAGS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  US,
  NG,
  KE,
  ZA,
  GH,
  UG,
  TZ,
  EU,
  GB,
}

function Flag({ code, className }: { code: string; className?: string }) {
  const Component = FLAGS[flagForCurrency(code)] ?? US
  return (
    <span
      className={cn(
        "inline-block h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/5",
        className,
      )}
    >
      <Component className="h-full w-full object-cover" />
    </span>
  )
}

/**
 * Shares the selected DISPLAY currency across the plans + packs on a page. This
 * only affects which currency the prices are shown in; the real, billed price is
 * always USD and the amount is pegged to it (local = USD × a fixed rate).
 */
export function CurrencyProvider({
  defaultCurrency = DEFAULT_CURRENCY,
  children,
}: {
  defaultCurrency?: string
  children: React.ReactNode
}) {
  const [currency, setCurrency] = useState(
    isSupportedCurrency(defaultCurrency) ? defaultCurrency : DEFAULT_CURRENCY,
  )
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (ctx) return ctx
  // Graceful fallback if a card is rendered outside a provider.
  return { currency: DEFAULT_CURRENCY, setCurrency: () => {} }
}

/** Cosmetic display-currency dropdown with flags. Never changes the billed price. */
export function CurrencyPicker() {
  const { currency, setCurrency } = useCurrency()
  return (
    <Select value={currency} onValueChange={(v) => setCurrency(v as string)}>
      <SelectTrigger
        size="sm"
        aria-label="Display currency"
        className="h-9 min-w-[6.5rem] rounded-full border-sage-line bg-card px-3 font-semibold text-ink"
      >
        <span className="flex items-center gap-2">
          <Flag code={currency} />
          {currency}
        </span>
      </SelectTrigger>
      <SelectContent className="min-w-[15rem]">
        {SUPPORTED_CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code} className="pr-8">
            <Flag code={c.code} />
            <span className="font-medium text-ink">{c.code}</span>
            <span className="ml-auto text-ink-muted">{c.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Small centered note clarifying the estimate is approximate and billed in USD. */
export function CurrencyNote({ className }: { className?: string }) {
  const { currency } = useCurrency()
  if (currency === DEFAULT_CURRENCY) return null
  return (
    <p className={cn("text-center text-xs text-ink-muted", className)}>
      Shown in {currency} · approximate · billed in USD · rates {RATES_AS_OF}
    </p>
  )
}
