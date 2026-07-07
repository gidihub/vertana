import { cn } from "@/lib/utils"

// Quiet, ghosted previews of real product UI used inside empty states.
// They are decorative — hidden from assistive tech and non-interactive.

function MockShell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none select-none rounded-xl border border-border bg-card/60 p-4 opacity-70",
        className,
      )}
    >
      {children}
    </div>
  )
}

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded bg-muted", className)} />
}

/** Faded preview of a question card with a type badge. */
export function QuestionCardMockup({ className }: { className?: string }) {
  return (
    <MockShell className={cn("w-full max-w-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Multiple choice
        </span>
        <Bar className="h-3 w-6" />
      </div>
      <Bar className="mt-3 h-3 w-4/5" />
      <Bar className="mt-1.5 h-3 w-3/5" />
      <div className="mt-4 flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2"
          >
            <span className="size-3.5 shrink-0 rounded-full border border-border" />
            <Bar className={cn("h-2.5", i === 0 ? "w-1/2" : i === 1 ? "w-2/3" : "w-2/5")} />
          </div>
        ))}
      </div>
    </MockShell>
  )
}

/** Faded preview of a test card as it appears on the dashboard. */
export function TestCardMockup({ className }: { className?: string }) {
  return (
    <MockShell className={cn("w-full max-w-sm", className)}>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Active
        </span>
        <span className="size-3.5 rounded-full bg-muted" />
      </div>
      <Bar className="mt-3 h-4 w-3/4" />
      <Bar className="mt-2 h-2.5 w-full" />
      <Bar className="mt-1.5 h-2.5 w-5/6" />
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {["w-16", "w-20", "w-12"].map((w) => (
          <div key={w} className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-muted" />
            <Bar className={cn("h-2.5", w)} />
          </div>
        ))}
      </div>
    </MockShell>
  )
}

/** Faded preview of the results summary: a small score-distribution chart plus table rows. */
export function ResultsPreviewMockup({ className }: { className?: string }) {
  const bars = [30, 55, 80, 100, 65, 40]
  return (
    <MockShell className={cn("w-full max-w-md", className)}>
      <Bar className="h-3 w-28" />
      <div className="mt-4 flex h-24 items-end justify-between gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-muted"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Bar className="h-2.5 w-1/3" />
            <span className="size-3.5 rounded-full bg-muted" />
            <Bar className="h-2.5 w-10" />
          </div>
        ))}
      </div>
    </MockShell>
  )
}
