"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { libraryCopy } from "@/lib/question-library/copy"
import { fetchTestById, saveTest, useStore } from "@/lib/store"
import type { Question } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AddToTestDialog({
  open,
  onOpenChange,
  questions,
  codingEnabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  questions: Question[]
  codingEnabled: boolean
}) {
  const tests = useStore((db) => db.tests)
  const [testId, setTestId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  const eligible = questions.filter(
    (q) => codingEnabled || q.type !== "coding",
  )
  const skipped = questions.length - eligible.length

  async function handleAdd() {
    if (!testId) {
      toast.error("Choose a test first")
      return
    }
    if (eligible.length === 0) {
      toast.error("No eligible questions for your plan")
      return
    }

    setSaving(true)
    try {
      const test = await fetchTestById(testId)
      if (!test) throw new Error("Test not found")

      const start = test.questions.length
      const copies = eligible.map((q, i) =>
        libraryCopy(q, test.id, start + i),
      )
      await saveTest({
        ...test,
        questions: [...test.questions, ...copies],
      })

      const msg =
        skipped > 0
          ? `Added ${copies.length} questions (${skipped} coding skipped — Growth plan)`
          : `Added ${copies.length} question${copies.length === 1 ? "" : "s"} to "${test.title}"`
      toast.success(msg)
      onOpenChange(false)
      setTestId("")
    } catch (err) {
      toast.error((err as Error).message || "Could not add questions")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to test</DialogTitle>
          <DialogDescription>
            {eligible.length === 0
              ? "These questions require a Growth plan for coding items."
              : `Add ${eligible.length} library question${eligible.length === 1 ? "" : "s"} to an existing assessment.`}
          </DialogDescription>
        </DialogHeader>

        {tests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You do not have any tests yet.{" "}
            <Link href="/tests/new" className="font-medium text-pine underline">
              Create one first
            </Link>
            .
          </p>
        ) : (
          <Select value={testId} onValueChange={(v) => setTestId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select assessment" />
            </SelectTrigger>
            <SelectContent>
              {tests.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleAdd()}
            disabled={saving || tests.length === 0 || eligible.length === 0}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Add to test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
