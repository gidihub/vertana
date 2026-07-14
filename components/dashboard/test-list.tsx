"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus,
  Users,
  Clock,
  ListChecks,
  ShieldCheck,
  MoreHorizontal,
  BarChart3,
  Pencil,
  Link2,
  Trash2,
  CalendarClock,
  ClipboardCheck,
  UserPlus,
} from "lucide-react"

import {
  orgCompletionRate,
  totalNeedsScoring,
} from "@/lib/dashboard/stats"
import { warningSurface, numericText } from "@/lib/design-tokens"
import {
  useStore,
  useNeedsScoring,
  setTestStatus,
  deleteTest,
} from "@/lib/store"
import type { Test, TestStatus } from "@/lib/types"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { TestStatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { TestCardMockup } from "@/components/empty-mockups"
import { TestListSkeleton } from "@/components/loading-skeletons"
import { InviteCandidatesDialog } from "@/components/results/invite-candidates-dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

function StatCard({
  label,
  value,
  warning = false,
}: {
  label: string
  value: string | number
  warning?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        warning
          ? warningSurface
          : "border-border bg-card",
      )}
    >
      <div className={cn("text-2xl font-semibold", numericText)}>{value}</div>
      <div
        className={cn(
          "text-sm",
          warning ? "font-medium opacity-90" : "text-muted-foreground",
        )}
      >
        {label}
      </div>
    </div>
  )
}

function Meta({
  icon: Icon,
  children,
}: {
  icon: typeof Users
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-4" />
      {children}
    </span>
  )
}

function ScoringBadge({ count }: { count: number }) {
  if (count > 0) {
    return (
      <Badge variant="outline" className={warningSurface}>
        {count === 1 ? "1 needs scoring" : `${count} need scoring`}
      </Badge>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <ClipboardCheck className="size-3.5" />
      All scored
    </span>
  )
}

export function TestList() {
  const router = useRouter()
  const loading = useStore((db) => db.loading)
  const tests = useStore((db) => db.tests)
  const candidates = useStore((db) => db.candidates)
  const org = useStore((db) => db.organization)
  const needsScoring = useNeedsScoring()
  const [inviteTest, setInviteTest] = useState<Test | null>(null)

  const countFor = (id: string) =>
    candidates.filter((c) => c.test_id === id).length

  const sorted = [...tests].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
  const totalCandidates = candidates.length
  const completionRate = orgCompletionRate(candidates)
  const needsScoringTotal = totalNeedsScoring(needsScoring)

  function copyLink(test: Test) {
    if (!test.token) {
      toast.error("Publish this test first to get a candidate link.")
      return
    }
    if (org && !org.is_comp && org.credits_remaining <= 0) {
      toast.error(
        "No candidate credits remaining. Upgrade your plan or wait for your monthly reset before inviting candidates.",
      )
      return
    }
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    navigator.clipboard.writeText(`${origin}/t/${test.token}`)
    toast.success("Candidate link copied to clipboard")
  }

  async function changeStatus(test: Test, status: TestStatus) {
    try {
      await setTestStatus(test.id, status)
      toast.success(`"${test.title}" set to ${status}`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleDelete(test: Test) {
    try {
      await deleteTest(test.id)
      toast.success(`Deleted "${test.title}"`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {loading ? (
        <TestListSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total tests" value={tests.length} />
            <StatCard label="Total candidates" value={totalCandidates} />
            <StatCard
              label="Completion rate"
              value={`${completionRate}%`}
            />
            <StatCard
              label="Needs scoring"
              value={needsScoringTotal}
              warning={needsScoringTotal > 0}
            />
          </div>

          {sorted.length > 0 ? <DashboardAnalytics /> : null}

          {sorted.length === 0 ? (
            <Empty className="rounded-xl border border-dashed border-border py-10">
              <EmptyHeader>
                <EmptyMedia>
                  <TestCardMockup />
                </EmptyMedia>
                <EmptyTitle className="text-base">
                  Create your first test
                </EmptyTitle>
                <EmptyDescription>
                  Build a test, share its candidate link, and results land here
                  as people submit.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button nativeButton={false} render={<Link href="/tests/new" />}>
                  <Plus data-icon="inline-start" />
                  Create test
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sorted.map((test) => {
                const pending = needsScoring[test.id] ?? 0
                return (
                  <Card key={test.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <TestStatusBadge status={test.status} />
                            <ScoringBadge count={pending} />
                            {test.requires_proctoring && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <ShieldCheck className="size-3.5" />
                                Proctored
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-lg leading-tight">
                            <Link
                              href={`/tests/${test.id}/results`}
                              className="hover:underline"
                            >
                              {test.title}
                            </Link>
                          </CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Test actions"
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/tests/${test.id}/results`)
                                }
                              >
                                <BarChart3 data-icon="inline-start" />
                                View results
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/tests/${test.id}/edit`)
                                }
                              >
                                <Pencil data-icon="inline-start" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={test.status !== "active"}
                                onClick={() => setInviteTest(test)}
                              >
                                <UserPlus data-icon="inline-start" />
                                Invite candidates
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyLink(test)}>
                                <Link2 data-icon="inline-start" />
                                Copy candidate link
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              {test.status !== "active" && (
                                <DropdownMenuItem
                                  onClick={() => changeStatus(test, "active")}
                                >
                                  Set active
                                </DropdownMenuItem>
                              )}
                              {test.status !== "draft" && (
                                <DropdownMenuItem
                                  onClick={() => changeStatus(test, "draft")}
                                >
                                  Move to draft
                                </DropdownMenuItem>
                              )}
                              {test.status !== "closed" && (
                                <DropdownMenuItem
                                  onClick={() => changeStatus(test, "closed")}
                                >
                                  Close test
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(test)}
                              >
                                <Trash2 data-icon="inline-start" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {test.description || "No description."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-x-4 gap-y-2">
                      <Meta icon={ListChecks}>
                        {test.questions.length} questions
                      </Meta>
                      <Meta icon={Users}>{countFor(test.id)} candidates</Meta>
                      <Meta icon={Clock}>{test.time_limit_minutes} min</Meta>
                      {test.deadline && (
                        <Meta icon={CalendarClock}>
                          Due {formatDate(test.deadline)}
                        </Meta>
                      )}
                    </CardContent>
                    <CardFooter className="mt-auto gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/tests/${test.id}/results`} />}
                      >
                        View results
                      </Button>
                      <Button
                        size="sm"
                        className="bg-pine text-pine-foreground hover:bg-pine-deep"
                        disabled={test.status !== "active"}
                        onClick={() => setInviteTest(test)}
                      >
                        <UserPlus data-icon="inline-start" />
                        Invite
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(test)}
                      >
                        <Link2 data-icon="inline-start" />
                        Share link
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {inviteTest ? (
        <InviteCandidatesDialog
          test={inviteTest}
          open={Boolean(inviteTest)}
          onOpenChange={(open) => {
            if (!open) setInviteTest(null)
          }}
        />
      ) : null}
    </div>
  )
}
