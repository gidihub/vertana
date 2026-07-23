import { UsersDashboard } from "@/components/cms/users-dashboard"

export default function CmsUsersPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-sans text-2xl font-semibold tracking-tight">Users</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Platform-wide user analytics.
      </p>

      <div className="mt-8">
        <UsersDashboard />
      </div>
    </div>
  )
}
