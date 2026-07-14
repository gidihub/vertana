import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { auditRecruiterAction } from "@/lib/audit/events"
import {
  createCandidateInvite,
  createCandidateInvitesBulk,
  loadEmailInvitesForTest,
  loadTestById,
} from "@/lib/db/queries"

const optionsSchema = z.object({
  deadlineAt: z.string().datetime().nullish(),
  message: z.string().max(2000).nullish(),
  subject: z.string().max(300).nullish(),
  replyTo: z.string().email().nullish(),
  scheduledAt: z.string().datetime().nullish(),
})

// Accepts either a single `email` (legacy) or a list of `emails` for bulk sends.
const inviteSchema = z
  .object({
    email: z.string().email().optional(),
    emails: z.array(z.string().email()).max(500).optional(),
  })
  .merge(optionsSchema)
  .refine((v) => Boolean(v.email) || (v.emails && v.emails.length > 0), {
    message: "Provide at least one candidate email.",
  })

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async () => {
    const { id } = await params
    const test = await loadTestById(id)
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    const invites = await loadEmailInvitesForTest(id)
    return NextResponse.json({ invites, uses_share_link: test.status === "active" })
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async (ctx) => {
    try {
      const { id } = await params
      const body = inviteSchema.parse(await req.json())
      const options = {
        deadlineAt: body.deadlineAt ?? null,
        message: body.message ?? null,
        subject: body.subject ?? null,
        replyTo: body.replyTo ?? null,
        scheduledAt: body.scheduledAt ?? null,
      }

      // Bulk path: one row per email, each independently succeeding/failing.
      if (body.emails && body.emails.length > 0) {
        const results = await createCandidateInvitesBulk({
          testId: id,
          emails: body.emails,
          options,
        })
        const created = results.filter((r) => r.ok)
        if (created.length > 0) {
          try {
            await auditRecruiterAction({
              orgId: ctx.orgId,
              userId: ctx.user.id,
              action: "invite.created",
              resourceType: "test_invite",
              resourceId: id,
              metadata: {
                testId: id,
                count: created.length,
                emails: created.map((r) => r.email),
                scheduled: Boolean(options.scheduledAt),
              },
            })
          } catch {
            // Audit failure is logged in writeAuditLog; don't block invites.
          }
        }
        return NextResponse.json({ results })
      }

      const invite = await createCandidateInvite({
        testId: id,
        email: body.email as string,
        options,
      })
      try {
        await auditRecruiterAction({
          orgId: ctx.orgId,
          userId: ctx.user.id,
          action: "invite.created",
          resourceType: "test_invite",
          resourceId: invite.id,
          metadata: {
            testId: id,
            email: body.email,
            scheduled: Boolean(options.scheduledAt),
          },
        })
      } catch {
        // Audit failure is logged in writeAuditLog; don't block invite creation.
      }
      return NextResponse.json({ invite })
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 },
      )
    }
  })
}
