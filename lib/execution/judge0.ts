import { judge0LanguageId } from "@/lib/coding/languages"

/**
 * Judge0 code execution client (hosted RapidAPI or self-hosted CE).
 *
 * ## RapidAPI hosted (default)
 * 1. Subscribe at https://rapidapi.com/judge0-official/api/judge0-ce
 * 2. Set in `.env.local`:
 *    JUDGE0_API_KEY=<your RapidAPI key>
 *    # optional — defaults shown:
 *    # JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
 *    # JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
 *
 * ## Self-hosted Judge0 CE
 * 1. Deploy Judge0 CE on your VPS (Docker Compose — see https://github.com/judge0/judge0)
 * 2. Expose the API (default port 2358), e.g. `http://your-vps:2358`
 * 3. Set in `.env.local`:
 *    JUDGE0_AUTH_MODE=self-hosted
 *    JUDGE0_API_URL=http://your-vps:2358
 *    JUDGE0_API_KEY=<optional X-Auth-Token if auth is enabled on your instance>
 *
 * Self-hosted mode sends `X-Auth-Token` instead of RapidAPI headers. Leave
 * JUDGE0_API_KEY empty if your instance has authentication disabled (dev only).
 *
 * The submission endpoint and response shape are the same for both modes:
 * POST `{baseUrl}/submissions?base64_encoded=false&wait=true`
 */

export type ExecutionStatus =
  | "accepted"
  | "wrong_answer"
  | "time_limit"
  | "compilation_error"
  | "runtime_error"
  | "internal_error"

export interface ExecutionResult {
  stdout: string
  stderr: string
  status: ExecutionStatus
  compileOutput?: string
  time?: string | null
  memory?: number | null
}

const JUDGE0_STATUS: Record<number, ExecutionStatus> = {
  3: "accepted",
  4: "wrong_answer",
  5: "time_limit",
  6: "compilation_error",
  7: "runtime_error",
  8: "runtime_error",
  9: "runtime_error",
  10: "runtime_error",
  11: "runtime_error",
  12: "runtime_error",
  13: "internal_error",
  14: "runtime_error",
  15: "runtime_error",
}

function isSelfHostedMode(): boolean {
  return (
    process.env.JUDGE0_AUTH_MODE === "self-hosted" ||
    (!!process.env.JUDGE0_API_URL && !process.env.JUDGE0_RAPIDAPI_HOST)
  )
}

function getJudge0Config(): { baseUrl: string; headers: Record<string, string> } {
  const apiKey = process.env.JUDGE0_API_KEY

  if (isSelfHostedMode()) {
    const baseUrl = (process.env.JUDGE0_API_URL ?? "http://localhost:2358").replace(
      /\/$/,
      "",
    )
    return {
      baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-Auth-Token": apiKey } : {}),
      },
    }
  }

  if (!apiKey) {
    throw new Error("JUDGE0_API_KEY is not configured")
  }

  const rapidHost = process.env.JUDGE0_RAPIDAPI_HOST ?? "judge0-ce.p.rapidapi.com"
  const baseUrl = process.env.JUDGE0_API_URL ?? `https://${rapidHost}`

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": rapidHost,
    },
  }
}

interface Judge0Submission {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  status?: { id: number; description: string }
  time?: string | null
  memory?: number | null
  message?: string | null
}

export function normalizeOutput(value: string): string {
  return value.replace(/\r\n/g, "\n").trimEnd()
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected)
}

export async function executeCode(input: {
  code: string
  language: string
  stdin?: string
}): Promise<ExecutionResult> {
  const languageId = judge0LanguageId(input.language)
  if (languageId === null) {
    throw new Error(`Unsupported language: ${input.language}`)
  }

  const { baseUrl, headers } = getJudge0Config()
  const url = `${baseUrl}/submissions?base64_encoded=false&wait=true`

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: input.code,
      language_id: languageId,
      stdin: input.stdin ?? "",
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Judge0 request failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as Judge0Submission
  const statusId = data.status?.id ?? 13
  const status = JUDGE0_STATUS[statusId] ?? "internal_error"

  return {
    stdout: data.stdout ?? "",
    stderr: data.stderr ?? data.message ?? "",
    status,
    compileOutput: data.compile_output ?? undefined,
    time: data.time ?? null,
    memory: data.memory ?? null,
  }
}
