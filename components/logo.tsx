import type { SVGProps } from "react"
import { cn } from "@/lib/utils"

/**
 * Vertana brand mark + wordmark.
 *
 * The mark is two angled bars converging into a "V", with a checkmark notch
 * growing out of the vertex — reading as both the initial letter and a
 * verification signal. It uses the site's "Ink & Signal" pine + lime palette so
 * the logo sits naturally within the brand system.
 */

import { colors } from "@/lib/design-tokens"

const PINE = colors.pine
const LIME = colors.lime
const PINE_DEEP = colors.pineDeep
const PAPER = colors.paper

type Variant = "default" | "onDark"

interface LogoMarkProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  /** Rendered width/height in px. The mark is a square. */
  size?: number
  /** Adapts colors for light (default) or dark backgrounds. */
  variant?: Variant
  /** Accessible label. Set to "" for decorative use alongside a text label. */
  title?: string
}

export function LogoMark({
  size = 32,
  variant = "default",
  title = "Vertana",
  className,
  ...props
}: LogoMarkProps) {
  // On light surfaces: pine bars with a bright lime checkmark that pops.
  // On dark surfaces: the bars go lime so the "V" stays visible, and the
  // checkmark switches to pine-deep for contrast against the lime.
  const barColor = variant === "onDark" ? LIME : PINE
  const checkColor = variant === "onDark" ? PINE_DEEP : LIME
  const decorative = title === ""

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      className={className}
      {...props}
    >
      {!decorative ? <title>{title}</title> : null}
      {/* Two angled bars converging into a V */}
      <path
        d="M10 12L24 34L38 12"
        stroke={barColor}
        strokeWidth={7.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Checkmark notch growing out of the vertex */}
      <path
        d="M18 24L23 30L33 16"
        stroke={checkColor}
        strokeWidth={4.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface LogoProps {
  /** Drives the mark size; the wordmark scales relative to it. */
  size?: number
  /** Adapts colors for light (default) or dark backgrounds. */
  variant?: Variant
  /** Accessible label for the whole lockup. */
  title?: string
  className?: string
}

export function Logo({
  size = 30,
  variant = "default",
  title = "Vertana",
  className,
}: LogoProps) {
  const wordColor = variant === "onDark" ? PAPER : PINE_DEEP

  return (
    <span className={cn("inline-flex items-center gap-2", className)} aria-label={title} role="img">
      <LogoMark size={size} variant={variant} title="" />
      <span
        className="font-medium leading-none"
        style={{
          fontSize: Math.round(size * 0.7),
          letterSpacing: "-0.03em",
          color: wordColor,
        }}
      >
        vertana
      </span>
    </span>
  )
}
