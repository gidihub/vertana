import { z } from "zod"
import { NextResponse } from "next/server"

import { loadTestByToken } from "@/lib/db/queries"
import { executeCode } from "@/lib/execution/judge0"
import { recordCodeExecutions } from "@/lib/org"

const bodySchema = z.object({
  code: z.string().max(100_000),
  language: z.enum(["javascript", "python", "typescript"]),
  stdin: z.string().max(10_000).optional(),
  token: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json())
    const loaded = await loadTestByToken(body.token)
    if (!loaded?.test.org_id) {
      return NextResponse.json({ error: "Invalid test token" }, { status: 400 })
    }

    const result = await executeCode({
      code: body.code,
      language: body.language,
      stdin: body.stdin ?? "",
    })

    await recordCodeExecutions(loaded.test.org_id, 1)

    return NextResponse.json({
      stdout: result.stdout,
      stderr: [result.stderr, result.compileOutput].filter(Boolean).join("\n"),
      status: result.status,
      time: result.time,
      memory: result.memory,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Code execution failed unexpectedly"
    console.error("[vertana] execute-code failed:", message)
    const status = message.includes("JUDGE0_API_KEY") ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
