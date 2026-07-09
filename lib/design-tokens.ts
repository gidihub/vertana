/**
 * Vertana "Ink & Signal" design system.
 *
 * Canonical values live in `app/globals.css` under `@theme`.
 * Import from here for JS/SVG (e.g. Logo) and shared class strings.
 */

export const colors = {
  paper: "#f2f3ef",
  ink: "#18231d",
  inkMuted: "#55655c",
  pine: "#0e4a34",
  pineDeep: "#0a3325",
  pineForeground: "#f2f3ef",
  lime: "#c4f250",
  limeInk: "#23331a",
  sage: "#dde2d6",
  sageLine: "#cbd2c3",
  card: "#ffffff",
} as const

/** App shell — cream page background + ink body text */
export const appShell = "min-h-svh bg-paper font-sans text-ink"

/** Recruiter sidebar — slightly deeper cream for depth */
export const appSidebar =
  "flex w-[272px] shrink-0 flex-col border-r border-sage-line/70 bg-[#e9ebe5]"

/** Sticky header used on marketing, auth, and recruiter surfaces */
export const appHeader =
  "sticky top-0 z-40 border-b border-sage-line/70 bg-paper/85 backdrop-blur"

/** Primary CTA — matches homepage "Get started" buttons */
export const primaryCta =
  "inline-flex items-center justify-center rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"

/** In-text links */
export const linkClass =
  "font-medium text-pine underline-offset-4 transition-colors hover:text-pine-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-sm"

/** Amber warning surfaces (needs scoring, etc.) */
export const warningSurface =
  "border-amber-500/40 bg-amber-500/15 text-amber-950 dark:text-amber-100"

/** Red danger surfaces (integrity concern) */
export const dangerSurface =
  "border-destructive/40 bg-destructive/10 text-destructive"

/** Display headings (Inter) */
export const displayHeading = "font-sans tracking-tight text-ink"

/** Numeric / data values (Geist Mono) */
export const numericText = "font-mono tabular-nums"
