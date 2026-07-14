"use client"

import {
  AlignLeft,
  BookOpen,
  Braces,
  CheckSquare,
  Lock,
  Pencil,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react"

import { AiResistanceBadge } from "@/components/builder/ai-resistance-badge"
import { Badge } from "@/components/ui/badge"
import type { Question, QuestionSource, QuestionType } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  SOURCE_LABELS,
  TYPE_LABELS,
  isLibraryQuestionNew,
  librarySkillTags,
  librarySubcategoryLabel,
} from "@/lib/question-library/display"

const TYPE_ICONS: Record<QuestionType, LucideIcon> = {
  multiple_choice: CheckSquare,
  short_answer: AlignLeft,
  coding: Braces,
}

/** Active filter chip — blue signal, distinct from brand green CTAs and AI-resistance. */
const FILTER_CHIP_ACTIVE =
  "border-[oklch(0.46_0.14_245)] bg-[oklch(0.46_0.14_245)] text-white shadow-sm"

const SOURCE_STYLES: Record<
  QuestionSource,
  { className: string; icon: LucideIcon }
> = {
  library: {
    className: "border-border bg-background font-normal text-muted-foreground",
    icon: BookOpen,
  },
  ai_generated: {
    className: "border-amber-300/70 bg-amber-50 text-amber-950",
    icon: Sparkles,
  },
  custom: {
    className: "border-border bg-muted/60 text-foreground",
    icon: Pencil,
  },
}

/** Descriptive category/skill topic — neutral outline only. */
export function LibraryCategoryTag({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="h-auto max-w-full whitespace-normal break-words border-border bg-background py-0.5 text-left font-normal leading-snug text-muted-foreground"
    >
      {label}
    </Badge>
  )
}

/** Provenance — neutral outline; does not compete with AI-resistance green. */
export function LibrarySourceBadge({
  source = "library",
}: {
  source?: QuestionSource
}) {
  const style = SOURCE_STYLES[source]
  const Icon = style.icon
  return (
    <Badge
      variant="outline"
      className={cn("gap-1", style.className)}
    >
      <Icon className="size-3 shrink-0" />
      {SOURCE_LABELS[source]}
    </Badge>
  )
}

/** Recently added library content — blue accent, not brand green. */
export function LibraryNewBadge() {
  return (
    <Badge
      variant="outline"
      className="border-[oklch(0.46_0.14_245)]/35 bg-[oklch(0.46_0.14_245)]/8 font-medium text-[oklch(0.38_0.12_245)]"
    >
      New
    </Badge>
  )
}

/** Question format with type icon. */
export function LibraryTypeMeta({ type }: { type: QuestionType }) {
  const Icon = TYPE_ICONS[type]
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      {TYPE_LABELS[type]}
    </span>
  )
}

/** Plan gate — access control, not content metadata. */
export function LibraryGrowthBadge() {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-border bg-muted/40 text-muted-foreground"
    >
      <Lock className="size-3" />
      Growth
    </Badge>
  )
}

export function LibraryQuestionTagRow({
  question,
  showNew = true,
}: {
  question: Question
  showNew?: boolean
}) {
  const subcategory = librarySubcategoryLabel(question)
  const skills = librarySkillTags(question)
  const source = question.source ?? "library"
  const isNew = showNew && isLibraryQuestionNew(question)

  return (
    <>
      {subcategory ? <LibraryCategoryTag label={subcategory} /> : null}
      {skills.map((skill) => (
        <LibraryCategoryTag key={skill} label={skill} />
      ))}
      <LibrarySourceBadge source={source} />
      {isNew ? <LibraryNewBadge /> : null}
      {question.ai_resistance ? (
        <AiResistanceBadge level={question.ai_resistance} compact />
      ) : null}
    </>
  )
}

export function LibraryFilterChip({
  label,
  active,
  onClick,
  onRemove,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  onRemove?: () => void
}) {
  const chipClass = cn(
    "inline-flex items-center gap-0.5 rounded-full text-xs font-medium transition-colors",
    active
      ? FILTER_CHIP_ACTIVE
      : "border border-border bg-muted/40 text-muted-foreground hover:bg-muted",
    onRemove ? "py-1 pl-2.5 pr-1" : "px-2.5 py-1",
  )

  if (!onRemove) {
    return (
      <button type="button" onClick={onClick} className={chipClass}>
        {label}
      </button>
    )
  }

  return (
    <span className={chipClass}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 bg-transparent text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
        >
          {label}
        </button>
      ) : (
        <span>{label}</span>
      )}
      <button
        type="button"
        aria-label={`Remove ${label} filter`}
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="inline-flex shrink-0 rounded-full p-0.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <X className="size-3" aria-hidden />
      </button>
    </span>
  )
}
