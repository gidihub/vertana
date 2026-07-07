"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

import type { Question } from "@/lib/types"
import { uid } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

interface AiGeneratedQuestion {
  type: Question["type"]
  prompt: string
  options: string[]
  correct_option_index: number | null
}

export function AiGenerateDialog({
  open,
  onOpenChange,
  testId,
  onInsert,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  testId: string
  onInsert: (questions: Question[]) => void
}) {
  const [role, setRole] = useState("")
  const [count, setCount] = useState("3")
  const [loading, setLoading] = useState(false)

  async function generate() {
    if (!role.trim()) {
      toast.error("Enter a role or topic first")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.trim(), count: Number(count) }),
      })
      if (!res.ok) throw new Error("Request failed")
      const data: { questions: AiGeneratedQuestion[]; source: string } =
        await res.json()

      const questions: Question[] = data.questions.map((q, i) => ({
        id: uid("q"),
        test_id: testId,
        type: q.type,
        prompt: q.prompt,
        options: q.options ?? [],
        correct_option_index: q.correct_option_index,
        position: i,
      }))

      onInsert(questions)
      onOpenChange(false)
      setRole("")
      toast.success(
        `Added ${questions.length} question${questions.length === 1 ? "" : "s"}${
          data.source === "fallback" ? " (offline templates)" : ""
        }`,
      )
    } catch {
      toast.error("Could not generate questions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Generate questions with AI
          </DialogTitle>
          <DialogDescription>
            Describe the role or topic and we&apos;ll draft assessment questions you
            can edit or remove.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="ai-role">Role or topic</FieldLabel>
            <Input
              id="ai-role"
              placeholder="e.g. Senior React Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  generate()
                }
              }}
            />
          </Field>

          <Field>
            <FieldLabel>Number of questions</FieldLabel>
            <Select
              value={count}
              onValueChange={(v) => setCount(String(v))}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["3", "5", "8", "10"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Generated questions are appended to your current list.
            </FieldDescription>
          </Field>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={loading} />}>
            Cancel
          </DialogClose>
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            {loading ? "Generating…" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
