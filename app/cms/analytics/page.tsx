import { GrowthAnalyticsDashboard } from "@/components/cms/growth-analytics-dashboard"

export default function CmsAnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-sans text-2xl font-semibold tracking-tight">
        Analytics
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Read-only growth metrics for staff.
      </p>

      <div className="mt-8">
        <GrowthAnalyticsDashboard />
      </div>
    </div>
  )
}
