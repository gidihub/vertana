import Link from "next/link"
import {
  BarChart3,
  FileText,
  Megaphone,
  MessageSquare,
  Users,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const SECTIONS = [
  {
    href: "/cms/blog",
    title: "Blog",
    description: "Write, preview, and publish articles.",
    icon: FileText,
  },
  {
    href: "/cms/authors",
    title: "Authors",
    description: "Manage bylines, bios, and social links.",
    icon: Users,
  },
  {
    href: "/cms/announcements",
    title: "Announcements",
    description: "Post in-app messages for users.",
    icon: Megaphone,
  },
  {
    href: "/cms/feedback",
    title: "Feedback",
    description: "Review submissions from the site.",
    icon: MessageSquare,
  },
  {
    href: "/cms/users",
    title: "Analytics",
    description: "Read-only growth metrics.",
    icon: BarChart3,
  },
] as const

export default function CmsOverviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-pine">
          Vertana CMS
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Manage marketing content, announcements, and feedback. Published blog
          posts appear at{" "}
          <Link href="/blog" className="font-medium text-pine hover:underline">
            /blog
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group block">
            <Card className="h-full transition-colors hover:border-pine/30 hover:ring-pine/20">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="mt-1">
                      {description}
                    </CardDescription>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pine/10 text-pine transition-colors group-hover:bg-pine/15">
                    <Icon className="size-4" aria-hidden />
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-pine group-hover:underline">
                  Open →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
