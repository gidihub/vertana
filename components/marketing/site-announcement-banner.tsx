import Link from "next/link"

import { announcementMessage } from "@/lib/cms/announcements"
import { getActiveAnnouncement } from "@/lib/cms/announcement-queries"

export async function SiteAnnouncementBanner() {
  const announcement = await getActiveAnnouncement()
  if (!announcement) return null

  const message = announcementMessage(announcement)
  if (!message) return null

  const ctaLabel = announcement.title.trim()
  const ctaHref = announcement.link_url?.trim()

  return (
    <div className="border-b border-pine-deep/20 bg-pine px-4 py-2.5 text-center text-sm text-pine-foreground">
      <p className="inline leading-relaxed">
        {message}
        {ctaLabel && ctaHref ? (
          <>
            {" "}
            <Link
              href={ctaHref}
              className="font-semibold underline underline-offset-2 hover:text-white"
            >
              {ctaLabel}
            </Link>
          </>
        ) : null}
      </p>
    </div>
  )
}
