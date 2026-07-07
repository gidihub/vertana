import { createClient } from "@/lib/supabase/server"

export async function getAuthenticatedUser(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) return user

  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null

  const {
    data: { user: tokenUser },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !tokenUser) return null
  return tokenUser
}
