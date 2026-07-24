import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * Permanently deletes the signed-in user's account.
 *
 * Guard rail: a sole owner cannot delete themselves, since that would orphan the
 * organization (its data, billing, and any teammates). They must transfer
 * ownership or delete the organization first.
 */
export async function POST() {
  return handleApiAuth(async ({ user, orgId, role }) => {
    const admin = createAdminClient()

    // Atomically re-check sole ownership and remove the membership under a lock,
    // so two concurrent last-owner deletions can't both pass the check and leave
    // the organization ownerless. team_members.user_id has no FK to auth.users,
    // so the row is removed explicitly here rather than via cascade.
    const { data: status, error: rpcError } = await admin.rpc(
      "delete_own_membership_atomic",
      { p_org_id: orgId, p_user_id: user.id },
    )

    if (rpcError) {
      console.error("Failed to remove membership during account deletion", rpcError)
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 },
      )
    }

    if (status === "sole_owner") {
      return NextResponse.json(
        {
          error:
            "You're the only owner of this organization. Transfer ownership to a teammate or delete the organization before deleting your account.",
        },
        { status: 409 },
      )
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      // The membership is already gone but the auth user remains — a partial
      // state that would strand a login with no organization. Compensate by
      // restoring the membership so the caller can safely retry.
      if (status === "deleted") {
        const { error: restoreError } = await admin
          .from("team_members")
          .insert({ org_id: orgId, user_id: user.id, role })
        if (restoreError) {
          console.error(
            "Failed to restore membership after auth deletion failure",
            restoreError,
          )
        }
      }
      console.error("Failed to delete auth user during account deletion", deleteError)
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 },
      )
    }

    // Clear this browser's auth cookies now that the account is gone.
    const supabase = await createClient()
    await supabase.auth.signOut({ scope: "local" })

    return NextResponse.json({ ok: true })
  })
}
