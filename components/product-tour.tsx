"use client"

/**
 * Self-contained, dependency-free product tour (guided walkthrough / coach marks).
 *
 * HOW TO USE
 * ----------
 * 1. Mark targets in your markup with a `data-tour` attribute, e.g.
 *      <Link href="/dashboard" data-tour="nav-tests">Tests</Link>
 *    Targets are matched by selector only — no coupling to class names or DOM position.
 *    Any step whose target selector is not in the DOM is skipped automatically, so
 *    features hidden by permissions/plan simply drop out of the tour.
 *
 * 2. Edit the TOUR_STEPS array below to add/remove/reorder steps.
 *
 * 3. Mount the tour once (e.g. inside the settings panel or app shell):
 *      const [tourOpen, setTourOpen] = useState(false)
 *      <Button onClick={() => setTourOpen(true)}>Product tour</Button>
 *      {tourOpen && <ProductTour onDone={() => setTourOpen(false)} />}
 *    Hide the launch entry once complete with `tourAlreadyDone()`.
 *
 * Completion is persisted in localStorage under TOUR_STORAGE_KEY.
 */

import { createPortal } from "react-dom"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  LayoutGrid,
  UserRound,
  BookOpen,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Coins,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Editable step data
// ---------------------------------------------------------------------------

type Placement = "top" | "bottom" | "left" | "right" | "center"

export type TourStep = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  /** CSS selector for the element to highlight, or null for a centered modal. */
  target: string | null
  placement: Placement
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Vertana",
    description:
      "Take a quick tour of the workspace. We'll point out the key areas so you can get to hiring faster. Use the arrow keys or the buttons to move along.",
    icon: Sparkles,
    target: null,
    placement: "center",
  },
  {
    id: "create-test",
    title: "Create a test",
    description:
      "Start here to build a new assessment. Add coding, multiple-choice, or open-ended questions, then publish it to get a shareable link and invite candidates by email.",
    icon: Plus,
    target: '[data-tour="create-test"]',
    placement: "right",
  },
  {
    id: "sidebar-usage",
    title: "Plan & credits",
    description:
      "Keep an eye on your limits here. Each candidate attempt uses a credit, and AI question generation and code executions are metered by plan — you'll need credits available to invite candidates.",
    icon: Coins,
    target: '[data-tour="sidebar-usage"]',
    placement: "right",
  },
  {
    id: "nav-tests",
    title: "Your tests",
    description:
      "All of your assessments live here. Jump into any test to edit questions or review candidate results.",
    icon: LayoutGrid,
    target: '[data-tour="nav-tests"]',
    placement: "right",
  },
  {
    id: "nav-candidates",
    title: "Candidates",
    description:
      "Browse every candidate who has taken a test, filter by score, and dig into individual submissions.",
    icon: UserRound,
    target: '[data-tour="nav-candidates"]',
    placement: "right",
  },
  {
    id: "nav-library",
    title: "Question library",
    description:
      "Reuse vetted questions across tests. Save your best prompts here to build assessments in seconds.",
    icon: BookOpen,
    target: '[data-tour="nav-library"]',
    placement: "right",
  },
  {
    id: "nav-analytics",
    title: "Analytics",
    description:
      "See how your hiring funnel is performing across all tests — completion rates, score distributions, and integrity flags at a glance.",
    icon: BarChart3,
    target: '[data-tour="nav-analytics"]',
    placement: "right",
  },
  {
    id: "nav-team",
    title: "Your team",
    description:
      "Invite teammates to collaborate on tests and review candidates. Manage roles and seats from here.",
    icon: Users,
    target: '[data-tour="nav-team"]',
    placement: "right",
  },
  {
    id: "finish",
    title: "You're all set",
    description:
      "That's the tour! You can relaunch it anytime from Account settings. Happy hiring.",
    icon: Sparkles,
    target: null,
    placement: "center",
  },
]

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const TOUR_STORAGE_KEY = "vertana-product-tour-done"

/** Returns true once the user has completed (or dismissed) the tour. SSR-safe. */
export function tourAlreadyDone(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(TOUR_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function markTourDone() {
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1")
  } catch {
    // ignore quota / private mode
  }
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

const SPOTLIGHT_PADDING = 8
const TOOLTIP_WIDTH = 320
const TOOLTIP_OFFSET = 16
const VIEWPORT_MARGIN = 12

type Rect = { top: number; left: number; width: number; height: number }

/**
 * Find the first *visible* element matching the selector. A selector may match
 * multiple nodes (e.g. a desktop sidebar plus an off-screen mobile drawer); we
 * prefer one that is actually rendered with a non-zero box.
 */
function findVisible(selector: string): HTMLElement | null {
  if (typeof document === "undefined") return null
  const nodes = document.querySelectorAll<HTMLElement>(selector)
  let fallback: HTMLElement | null = null
  for (const el of nodes) {
    fallback = fallback ?? el
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return fallback
}

function selectorInDom(selector: string | null): boolean {
  if (selector == null) return true
  return findVisible(selector) != null
}

function measure(selector: string | null): Rect | null {
  if (selector == null) return null
  const el = findVisible(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

/**
 * Compute a fixed-position tooltip box for the given target rect, flipping to the
 * opposite side on overflow and clamping within the viewport margins.
 */
function placeTooltip(
  rect: Rect | null,
  placement: Placement,
  tooltip: { width: number; height: number },
  viewport: { width: number; height: number },
): { top: number; left: number } {
  const { width: tw, height: th } = tooltip
  const { width: vw, height: vh } = viewport

  // Centered modal: no target rect, or explicit center placement.
  if (!rect || placement === "center") {
    return {
      top: Math.max(VIEWPORT_MARGIN, (vh - th) / 2),
      left: Math.max(VIEWPORT_MARGIN, (vw - tw) / 2),
    }
  }

  const pad = SPOTLIGHT_PADDING + TOOLTIP_OFFSET
  const fits = {
    top: rect.top - pad - th >= VIEWPORT_MARGIN,
    bottom: rect.top + rect.height + pad + th <= vh - VIEWPORT_MARGIN,
    left: rect.left - pad - tw >= VIEWPORT_MARGIN,
    right: rect.left + rect.width + pad + tw <= vw - VIEWPORT_MARGIN,
  }

  const opposite: Record<Exclude<Placement, "center">, Exclude<Placement, "center">> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  }

  let side = placement as Exclude<Placement, "center">
  if (!fits[side] && fits[opposite[side]]) side = opposite[side]

  let top: number
  let left: number

  switch (side) {
    case "top":
      top = rect.top - pad - th
      left = rect.left + rect.width / 2 - tw / 2
      break
    case "bottom":
      top = rect.top + rect.height + pad
      left = rect.left + rect.width / 2 - tw / 2
      break
    case "left":
      top = rect.top + rect.height / 2 - th / 2
      left = rect.left - pad - tw
      break
    case "right":
    default:
      top = rect.top + rect.height / 2 - th / 2
      left = rect.left + rect.width + pad
      break
  }

  // Clamp within viewport margins.
  top = Math.min(Math.max(top, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vh - th - VIEWPORT_MARGIN))
  left = Math.min(Math.max(left, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vw - tw - VIEWPORT_MARGIN))

  return { top, left }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductTour({ onDone }: { onDone?: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [tooltipSize, setTooltipSize] = useState({ width: TOOLTIP_WIDTH, height: 220 })
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  // SSR guard: only render after mount, on the client.
  useEffect(() => {
    setMounted(true)
    setViewport({ width: window.innerWidth, height: window.innerHeight })
  }, [])

  // Filter steps down to those whose targets are present in the DOM.
  const steps = useMemo(() => {
    if (!mounted) return []
    const present = TOUR_STEPS.filter((s) => selectorInDom(s.target))
    // Always keep the welcome step even if it's the only survivor.
    if (present.length === 0) {
      const welcome = TOUR_STEPS.find((s) => s.target == null)
      return welcome ? [welcome] : []
    }
    return present
  }, [mounted])

  const total = steps.length
  const step = steps[index]

  const close = useCallback(
    (completed: boolean) => {
      if (completed) markTourDone()
      onDone?.()
    },
    [onDone],
  )

  const finishAndClose = useCallback(() => close(true), [close])

  const goNext = useCallback(() => {
    // Skip forward over any step whose target has since disappeared.
    let next = index + 1
    while (next < steps.length && !selectorInDom(steps[next].target)) next += 1
    if (next >= steps.length) {
      markTourDone()
      onDone?.()
      return
    }
    setIndex(next)
  }, [index, steps, onDone])

  const goBack = useCallback(() => {
    setIndex((i) => {
      let prev = i - 1
      while (prev >= 0 && !selectorInDom(steps[prev].target)) prev -= 1
      return prev < 0 ? i : prev
    })
  }, [steps])

  // Live positioning: measure the current target and keep it in sync with
  // scroll (rAF-throttled, capture phase) and element resize (ResizeObserver).
  useLayoutEffect(() => {
    if (!mounted || !step) return

    const update = () => setRect(measure(step.target))
    update()

    let rafId = 0
    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        update()
      })
    }
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
      update()
    }

    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)

    let ro: ResizeObserver | null = null
    const targetEl = step.target ? findVisible(step.target) : null
    if (targetEl && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => update())
      ro.observe(targetEl)
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
      ro?.disconnect()
    }
  }, [mounted, step])

  // Track tooltip size so placement/flip math uses the real height.
  useLayoutEffect(() => {
    if (!tooltipRef.current) return
    const el = tooltipRef.current
    const sync = () =>
      setTooltipSize({ width: el.offsetWidth || TOOLTIP_WIDTH, height: el.offsetHeight || 220 })
    sync()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [step])

  // Focus management: move focus into the dialog when the tour opens and restore
  // it to the previously focused element when the tour closes.
  useEffect(() => {
    if (!mounted) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    tooltipRef.current?.focus()
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [mounted])

  // Trap Tab navigation within the dialog so focus can't escape to background.
  const trapTab = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return
    const node = tooltipRef.current
    if (!node) return
    const focusable = Array.from(
      node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    if (focusable.length === 0) {
      e.preventDefault()
      node.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (e.shiftKey) {
      if (active === first || active === node) {
        e.preventDefault()
        last.focus()
      }
    } else if (active === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  // Keyboard: Escape closes, ArrowRight next, ArrowLeft back.
  useEffect(() => {
    if (!mounted || !step) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close(false)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        goBack()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mounted, step, close, goNext, goBack])

  if (!mounted || total === 0 || !step) return null

  const isLast = index === total - 1
  const isFirst = index === 0
  const percent = Math.round(((index + 1) / total) * 100)
  const tooltipPos = placeTooltip(rect, step.placement, tooltipSize, viewport)
  const Icon = step.icon

  return createPortal(
    <div className="fixed inset-0 z-[1000]" aria-live="polite">
      {/* Dimmed backdrop (lowest). Clicking it closes the tour. */}
      <div
        className="absolute inset-0 z-0 bg-ink/45 backdrop-blur-[1px]"
        onClick={() => close(false)}
        aria-hidden
      />

      {/* Spotlight ring over the target — never intercepts clicks. */}
      {rect && (
        <div
          className="pointer-events-none fixed z-10 rounded-lg ring-2 ring-lime ring-offset-2 ring-offset-transparent transition-all duration-150"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 4px color-mix(in oklch, var(--color-lime), transparent 70%)",
          }}
        />
      )}

      {/* Tooltip card (highest). */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Product tour: ${step.title}`}
        tabIndex={-1}
        onKeyDown={trapTab}
        className="fixed z-20 w-[320px] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10 outline-none"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        {/* Progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-pine transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pine/10 text-pine">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-ink">{step.title}</h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="-mr-1 -mt-1 shrink-0 text-ink-muted hover:text-ink"
              onClick={() => close(false)}
              aria-label="Close tour"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted">
              {index + 1} of {total}
            </span>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button type="button" variant="outline" size="sm" onClick={goBack}>
                  <ArrowLeft data-icon="inline-start" />
                  Back
                </Button>
              )}
              {isLast ? (
                <Button type="button" size="sm" onClick={finishAndClose}>
                  Done
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={goNext}>
                  Next
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
