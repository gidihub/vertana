import { openai } from "@ai-sdk/openai"

/** Default model for assessment generation. Override with OPENAI_MODEL in env. */
export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"

export function getOpenAiModel() {
  const id = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
  return openai(id)
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
