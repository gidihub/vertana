import { handleApiAuth } from "@/lib/auth/api"
import { loadAllCandidates, loadTestsForOrg } from "@/lib/db/queries"

function csvCell(value: unknown): string {
  const str = value == null ? "" : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET() {
  return handleApiAuth(async () => {
    const [tests, candidates] = await Promise.all([
      loadTestsForOrg(),
      loadAllCandidates(),
    ])
    const testTitles = new Map(tests.map((t) => [t.id, t.title]))

    const header = [
      "Email",
      "Test",
      "Status",
      "Score (%)",
      "Disposition",
      "Flagged",
      "Tab switches",
      "Started at",
      "Submitted at",
    ]

    const rows = candidates.map((c) =>
      [
        c.email,
        testTitles.get(c.test_id) ?? c.test_id,
        c.status,
        c.score ?? "",
        c.disposition,
        c.flagged ? "yes" : "no",
        c.tab_switch_count,
        c.started_at ?? "",
        c.submitted_at ?? "",
      ]
        .map(csvCell)
        .join(","),
    )

    const csv = [header.map(csvCell).join(","), ...rows].join("\n")
    const filename = `vertana-candidates-${new Date().toISOString().slice(0, 10)}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  })
}
