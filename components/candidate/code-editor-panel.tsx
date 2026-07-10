"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Loader2, Play, Terminal } from "lucide-react"

import {
  CODING_LANGUAGES,
  STARTER_CODE,
  type CodingLanguageId,
} from "@/lib/coding/languages"
import {
  parseCodingResponse,
  serializeCodingResponse,
} from "@/lib/coding/response"
import type { TestCase } from "@/lib/types"
import { cn } from "@/lib/utils"
import { numericText } from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
})

const MONACO_LANGUAGE: Record<CodingLanguageId, string> = {
  javascript: "javascript",
  python: "python",
  typescript: "typescript",
}

type PreviewRunResult = {
  index: number
  passed: boolean
  status: string
  input: string
  expected: string
  actual: string
  stderr: string
}

export function CodeEditorPanel({
  value,
  onChange,
  token,
  previewQuestionId,
  previewTestCases,
}: {
  value: string
  onChange: (value: string) => void
  /** Required for candidate scratch runs (not metered on preview test runs). */
  token?: string
  /** Library preview: run against stored test cases without saving or metering. */
  previewQuestionId?: string
  previewTestCases?: TestCase[]
}) {
  const isPreview = Boolean(previewQuestionId && previewTestCases?.length)
  const parsed = parseCodingResponse(value)
  const [language, setLanguage] = useState<CodingLanguageId>(
    parsed?.language ?? "javascript",
  )
  const [code, setCode] = useState(
    parsed?.code ?? STARTER_CODE[language],
  )
  const [stdin, setStdin] = useState("")
  const [running, setRunning] = useState(false)
  const [stdout, setStdout] = useState("")
  const [stderr, setStderr] = useState("")
  const [runStatus, setRunStatus] = useState<string | null>(null)
  const [previewResults, setPreviewResults] = useState<PreviewRunResult[]>([])

  const persist = useCallback(
    (nextLanguage: CodingLanguageId, nextCode: string) => {
      onChange(
        serializeCodingResponse({ language: nextLanguage, code: nextCode }),
      )
    },
    [onChange],
  )

  useEffect(() => {
    if (!value.trim()) {
      persist(language, code)
    }
    // Only seed empty answers on mount for this question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCodeChange(nextCode: string | undefined) {
    const safe = nextCode ?? ""
    setCode(safe)
    persist(language, safe)
  }

  function handleLanguageChange(next: CodingLanguageId) {
    setLanguage(next)
    const starter = STARTER_CODE[next]
    const nextCode = code.trim() ? code : starter
    if (!code.trim()) setCode(starter)
    persist(next, nextCode)
  }

  async function handleRun() {
    setRunning(true)
    setStdout("")
    setStderr("")
    setRunStatus(null)
    setPreviewResults([])

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    try {
      if (isPreview) {
        const res = await fetch("/api/question-library/preview-run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: previewQuestionId,
            code,
            language,
          }),
          signal: controller.signal,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Execution failed")
        setPreviewResults(data.results ?? [])
        setStdout(data.output ?? "")
        setRunStatus(data.status ?? "unknown")
        return
      }

      if (!token) {
        throw new Error("Missing test token for code execution")
      }

      const res = await fetch("/api/execute-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, stdin, token }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Execution failed")
      setStdout(data.stdout ?? "")
      setStderr(data.stderr ?? "")
      setRunStatus(data.status ?? "unknown")
    } catch (err) {
      setStderr(
        (err as Error).name === "AbortError"
          ? "Execution timed out"
          : (err as Error).message,
      )
      setRunStatus("error")
    } finally {
      clearTimeout(timeoutId)
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          value={language}
          onValueChange={(v) => handleLanguageChange(v as CodingLanguageId)}
        >
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CODING_LANGUAGES.map((lang) => (
              <SelectItem key={lang.id} value={lang.id}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleRun()}
          disabled={running || !code.trim()}
          className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          ) : (
            <Play className="size-4" data-icon="inline-start" />
          )}
          {isPreview ? "Run tests" : "Run"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <MonacoEditor
          height="320px"
          language={MONACO_LANGUAGE[language]}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
          }}
        />
      </div>

      {!isPreview ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Custom input (optional, for scratch runs)
          </label>
          <Textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={2}
            placeholder="Paste sample input to test your code…"
            className="font-mono text-sm"
            spellCheck={false}
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Runs against all {previewTestCases?.length ?? 0} stored test case
          {(previewTestCases?.length ?? 0) === 1 ? "" : "s"}. Preview only —
          nothing is saved and no execution credits are used.
        </p>
      )}

      {isPreview && previewResults.length > 0 ? (
        <div className="flex flex-col gap-2">
          {previewResults.map((r) => (
            <div
              key={r.index}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                r.passed
                  ? "border-pine/30 bg-pine/5"
                  : "border-destructive/30 bg-destructive/5",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  Test {r.index + 1}: {r.passed ? "Pass" : "Fail"}
                </span>
                <span className={cn("text-xs text-muted-foreground", numericText)}>
                  {r.status.replace(/_/g, " ")}
                </span>
              </div>
              {r.stderr ? (
                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-destructive">
                  {r.stderr}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Terminal className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Output</span>
          {runStatus && (
            <span
              className={cn(
                "ml-auto rounded px-2 py-0.5 text-xs font-medium",
                runStatus === "accepted" || runStatus === "all_passed"
                  ? "bg-primary/10 text-primary"
                  : runStatus === "error" || runStatus.includes("error")
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {runStatus.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <div className="max-h-48 overflow-auto p-3 font-mono text-sm">
          {stdout && (
            <pre className="whitespace-pre-wrap text-foreground">{stdout}</pre>
          )}
          {stderr && (
            <pre className="mt-2 whitespace-pre-wrap text-destructive">
              {stderr}
            </pre>
          )}
          {!stdout && !stderr && (
            <p className="text-muted-foreground">
              {isPreview
                ? "Run tests to see pass/fail output for each case."
                : "Run your code to see output here. This is a scratch run — your final answer is graded against hidden test cases on submit."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
