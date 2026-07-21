"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TagChipInput({
  tags,
  onChange,
  placeholder = "Add tag…",
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState("")

  function addTag(raw: string) {
    const next = raw.trim().toLowerCase().replace(/\s+/g, "-")
    if (!next || tags.includes(next)) return
    onChange([...tags, next])
    setDraft("")
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-sage-line/80 bg-paper px-2.5 py-1 text-xs font-medium text-ink-muted"
          >
            {tag}
            <button
              type="button"
              className="rounded-full p-0.5 text-ink-muted hover:bg-paper hover:text-ink"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              addTag(draft)
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => addTag(draft)}
        >
          Add
        </Button>
      </div>
    </div>
  )
}
