export const CODING_LANGUAGES = [
  { id: "javascript", label: "JavaScript", judge0Id: 63 },
  { id: "python", label: "Python", judge0Id: 71 },
  { id: "typescript", label: "TypeScript", judge0Id: 74 },
] as const

export type CodingLanguageId = (typeof CODING_LANGUAGES)[number]["id"]

export function judge0LanguageId(language: string): number | null {
  const match = CODING_LANGUAGES.find((l) => l.id === language)
  return match?.judge0Id ?? null
}

export function languageLabel(language: string): string {
  const match = CODING_LANGUAGES.find((l) => l.id === language)
  return match?.label ?? language
}

export const STARTER_CODE: Record<CodingLanguageId, string> = {
  javascript: `// Write your solution here\nfunction solve(input) {\n  return input;\n}\n`,
  python: `# Write your solution here\ndef solve(input):\n    return input\n`,
  typescript: `// Write your solution here\nfunction solve(input: string): string {\n  return input;\n}\n`,
}
