"use client"

import { useEffect, useState } from "react"

export interface AccountInfo {
  email: string | null
  role: string | null
}

/**
 * Fetches the signed-in recruiter's email and org role from /api/org.
 * Used by settings pages to gate owner-only actions and show account details.
 */
export function useAccount(): { account: AccountInfo | null; loading: boolean } {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetch("/api/org")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setAccount({
          email: data.user_email ?? null,
          role: data.role ?? null,
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { account, loading }
}
