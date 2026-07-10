import { openai } from "@ai-sdk/openai"

/** Default model for question generation and ai_resistance rating. Override with OPENAI_MODEL in env. */
export const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini"

export function getOpenAiModel() {
  const id = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
  return openai(id)
}

/** @deprecated Use getOpenAiModel — single model handles bulk + rating. */
export function getOpenAiRatingModel() {
  return getOpenAiModel()
}

export function requireOpenAiApiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local and restart the dev server.",
    )
  }
  return key
}
