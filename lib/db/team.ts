import { generateToken } from "@/lib/db/mappers"
import { sendTeamInviteEmail } from "@/lib/notifications/team-invite-email"
import { createAdminClient } from "@/lib/supabase/admin"

export type TeamMemberRole = "owner" | "admin" | "member"
export type TeamInviteRole = "admin" | "member"

export interface TeamMemberView {
  id: string
  user_id: string
  email: string
  role: TeamMemberRole
  created_at: string
}

export interface TeamInviteView {
  id: string
  email: string
  role: TeamInviteRole
  status: "pending" | "accepted" | "revoked"
  created_at: string
  expires_at: string
  invited_by_email: string | null
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function userEmailById(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data.user?.email) return null
  return data.user.email
}

export async function loadTeamMembers(orgId: string): Promise<TeamMemberView[]> {
  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from("team_members")
    .select("id, user_id, role, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  const members: TeamMemberView[] = []
  for (const row of rows ?? []) {
    const email = (await userEmailById(row.user_id as string)) ?? "Unknown"
    members.push({
      id: row.id as string,
      user_id: row.user_id as string,
      email,
      role: row.role as TeamMemberRole,
      created_at: row.created_at as string,
    })
  }
  return members
}

export async function loadTeamInvites(orgId: string): Promise<TeamInviteView[]> {
  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from("team_invites")
    .select("id, email, role, status, created_at, expires_at, invited_by")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  const invites: TeamInviteView[] = []
  for (const row of rows ?? []) {
    const invitedByEmail = row.invited_by
      ? await userEmailById(row.invited_by as string)
      : null
    invites.push({
      id: row.id as string,
      email: row.email as string,
      role: row.role as TeamInviteRole,
      status: row.status as TeamInviteView["status"],
      created_at: row.created_at as string,
      expires_at: row.expires_at as string,
      invited_by_email: invitedByEmail,
    })
  }
  return invites
}

export async function createTeamInvite(input: {
  orgId: string
  email: string
  role: TeamInviteRole
  invitedByUserId: string
  inviterEmail: string
  orgName: string
}): Promise<TeamInviteView> {
  const admin = createAdminClient()
  const email = normalizeEmail(input.email)

  const { data: existingMember } = await admin
    .from("team_members")
    .select("user_id")
    .eq("org_id", input.orgId)

  for (const row of existingMember ?? []) {
    const memberEmail = await userEmailById(row.user_id as string)
    if (memberEmail && normalizeEmail(memberEmail) === email) {
      throw new Error("This person is already on your team")
    }
  }

  const { data: pending } = await admin
    .from("team_invites")
    .select("id")
    .eq("org_id", input.orgId)
    .eq("status", "pending")
    .ilike("email", email)
    .maybeSingle()

  if (pending) {
    throw new Error("An invite is already pending for this email")
  }

  const token = generateToken()
  const { data: invite, error } = await admin
    .from("team_invites")
    .insert({
      org_id: input.orgId,
      email,
      role: input.role,
      token,
      status: "pending",
      invited_by: input.invitedByUserId,
    })
    .select("id, email, role, status, created_at, expires_at, invited_by")
    .single()

  if (error || !invite) {
    throw new Error(error?.message ?? "Failed to create invite")
  }

  await sendTeamInviteEmail({
    to: email,
    orgName: input.orgName,
    inviterEmail: input.inviterEmail,
    token,
    role: input.role,
  })

  return {
    id: invite.id as string,
    email: invite.email as string,
    role: invite.role as TeamInviteRole,
    status: invite.status as TeamInviteView["status"],
    created_at: invite.created_at as string,
    expires_at: invite.expires_at as string,
    invited_by_email: input.inviterEmail,
  }
}

export async function revokeTeamInvite(
  orgId: string,
  inviteId: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("team_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("org_id", orgId)
    .eq("status", "pending")

  if (error) throw new Error(error.message)
}

export async function acceptTeamInviteByToken(input: {
  token: string
  userId: string
  userEmail: string
}): Promise<{ orgId: string; orgName: string }> {
  const admin = createAdminClient()
  const email = normalizeEmail(input.userEmail)

  const { data: invite, error: inviteError } = await admin
    .from("team_invites")
    .select("id, org_id, email, role, status, expires_at")
    .eq("token", input.token)
    .maybeSingle()

  if (inviteError || !invite) {
    throw new Error("Invite not found")
  }
  if (invite.status !== "pending") {
    throw new Error("This invite is no longer active")
  }
  if (new Date(invite.expires_at as string).getTime() < Date.now()) {
    throw new Error("This invite has expired")
  }
  if (normalizeEmail(invite.email as string) !== email) {
    throw new Error(
      `Sign in as ${invite.email as string} to accept this invitation`,
    )
  }

  const { data: existing } = await admin
    .from("team_members")
    .select("org_id")
    .eq("user_id", input.userId)
    .maybeSingle()

  if (existing) {
    if (existing.org_id === invite.org_id) {
      const { data: org } = await admin
        .from("organizations")
        .select("name")
        .eq("id", invite.org_id)
        .single()
      return {
        orgId: invite.org_id as string,
        orgName: (org?.name as string) ?? "Organization",
      }
    }
    throw new Error("You already belong to another organization")
  }

  const { error: memberError } = await admin.from("team_members").insert({
    org_id: invite.org_id,
    user_id: input.userId,
    role: invite.role,
  })

  if (memberError) {
    throw new Error(memberError.message)
  }

  await admin
    .from("team_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id)

  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", invite.org_id)
    .single()

  return {
    orgId: invite.org_id as string,
    orgName: (org?.name as string) ?? "Organization",
  }
}

export async function tryAcceptPendingInviteForEmail(input: {
  userId: string
  userEmail: string
}): Promise<{ orgId: string; orgName: string } | null> {
  const admin = createAdminClient()
  const email = normalizeEmail(input.userEmail)

  const { data: invite } = await admin
    .from("team_invites")
    .select("token")
    .eq("status", "pending")
    .ilike("email", email)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!invite?.token) return null

  return acceptTeamInviteByToken({
    token: invite.token as string,
    userId: input.userId,
    userEmail: input.userEmail,
  })
}

export async function loadTeamInvitePreview(token: string): Promise<{
  orgName: string
  email: string
  role: string
  status: string
  expired: boolean
} | null> {
  const admin = createAdminClient()
  const { data: invite } = await admin
    .from("team_invites")
    .select("org_id, email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (!invite) return null

  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", invite.org_id)
    .maybeSingle()

  return {
    orgName: (org?.name as string) ?? "Organization",
    email: invite.email as string,
    role: invite.role as string,
    status: invite.status as string,
    expired: new Date(invite.expires_at as string).getTime() < Date.now(),
  }
}
