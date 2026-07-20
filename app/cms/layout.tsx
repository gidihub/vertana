import { redirect } from "next/navigation"

import { CmsSidebar } from "@/components/cms/cms-sidebar"
import { assertStaff } from "@/lib/cms-auth"

export default async function CmsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const staff = await assertStaff()
  if (!staff) redirect("/login?next=/cms")

  return (
    <div className="flex h-svh overflow-hidden bg-paper font-sans text-ink">
      <CmsSidebar email={staff.email} />
      <main className="min-w-0 flex-1 overflow-y-auto bg-paper">{children}</main>
    </div>
  )
}
