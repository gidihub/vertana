import type { CodingLanguageId } from "@/lib/coding/languages"
import { STARTER_CODE } from "@/lib/coding/languages"

export interface CodingAnswerPayload {
  language: CodingLanguageId
  code: string
}

export function parseCodingResponse(raw: string): CodingAnswerPayload | null {
  if (!raw.trim()) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CodingAnswerPayload>
    if (
      parsed.language &&
      typeof parsed.code === "string" &&
      parsed.language in STARTER_CODE
    ) {
      return {
        language: parsed.language as CodingLanguageId,
        code: parsed.code,
      }
    }
  } catch {
    // Legacy plain-text coding answers
    return { language: "javascript", code: raw }
  }
  return null
}

export function serializeCodingResponse(payload: CodingAnswerPayload): string {
  return JSON.stringify(payload)
}

export function codingResponseIsEmpty(raw: string | undefined): boolean {
  if (!raw) return true
  const parsed = parseCodingResponse(raw)
  return !parsed?.code.trim()
}
