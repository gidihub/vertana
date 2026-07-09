"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    orgName: string
    email: string
    role: string
    status: string
    expired: boolean
  } | null>(null)

  useEffect(() => {
    void Promise.all([
      fetch(`/api/team/invites/${token}`).then((r) => r.json()),
      createClient().auth.getUser(),
    ]).then(([inviteRes, authRes]) => {
      if (inviteRes.invite) setPreview(inviteRes.invite)
      setSignedIn(!!authRes.data.user)
      setUserEmail(authRes.data.user?.email ?? null)
      setLoading(false)
    })
  }, [token])

  async function accept() {
    setAccepting(true)
    try {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not accept invite")
      toast.success(`Joined ${data.organization.orgName}`)
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-paper">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!preview || preview.status !== "pending" || preview.expired) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-paper px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invite unavailable</CardTitle>
            <CardDescription>
              This invitation is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/login" />}>
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const emailMismatch =
    signedIn &&
    userEmail &&
    userEmail.toLowerCase() !== preview.email.toLowerCase()

  return (
    <div className="flex min-h-svh items-center justify-center bg-paper px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {preview.orgName}</CardTitle>
          <CardDescription>
            You have been invited as a <strong>{preview.role}</strong>. Sign in
            as <strong>{preview.email}</strong> to accept.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!signedIn ? (
            <Button
              className="bg-pine text-pine-foreground hover:bg-pine-deep"
              nativeButton={false}
              render={
                <Link
                  href={`/login?next=${encodeURIComponent(`/accept-invite/${token}`)}`}
                />
              }
            >
              Sign in to accept
            </Button>
          ) : emailMismatch ? (
            <p className="text-sm text-destructive">
              You are signed in as {userEmail}. Sign out and sign in as{" "}
              {preview.email} to accept.
            </p>
          ) : (
            <Button
              className="bg-pine text-pine-foreground hover:bg-pine-deep"
              onClick={() => void accept()}
              disabled={accepting}
            >
              {accepting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Accept invitation"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
