"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ChevronRight, Search } from "lucide-react"

import type { Candidate, Test } from "@/lib/types"
import { hasIntegrityConcern } from "@/lib/integrity"
import { numericText } from "@/lib/design-tokens"
import { useStore } from "@/lib/store"
import { candidateDisplayName, candidateInitials } from "@/lib/candidate-name"
import { IntegrityConcernBadge } from "@/components/integrity-concern-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

interface CandidateGroup {
  email: string
  name: string
  attempts: Candidate[]
  assessments: number
  completed: number
  avgScore: number | null
  lastActivity: string | null
  flagged: boolean
}

export function GlobalCandidatesTable() {
  const router = useRouter()
  const tests = useStore((db) => db.tests)
  const candidates = useStore((db) => db.candidates)
  const loading = useStore((db) => db.loading)
  const integrityThreshold = useStore(
    (db) => db.organization?.tab_switch_threshold ?? 3,
  )

  const [search, setSearch] = useState("")
  const [testFilter, setTestFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const byEmail = new Map<string, Candidate[]>()

    for (const c of candidates) {
      if (testFilter !== "all" && c.test_id !== testFilter) continue
      const key = c.email.toLowerCase()
      const list = byEmail.get(key)
      if (list) list.push(c)
      else byEmail.set(key, [c])
    }

    const result: CandidateGroup[] = []
    for (const [email, attempts] of byEmail) {
      const name = candidateDisplayName(attempts[0].email)
      if (q && !email.includes(q) && !name.toLowerCase().includes(q)) continue

      const testIds = new Set(attempts.map((a) => a.test_id))
      const completedTestIds = new Set(
        attempts.filter((a) => a.status === "submitted").map((a) => a.test_id),
      )
      const scored = attempts.filter((a) => a.score !== null)
      const avgScore =
        scored.length > 0
          ? Math.round(
              scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length,
            )
          : null
      const lastActivity =
        attempts
          .map((a) => a.submitted_at ?? a.started_at ?? "")
          .filter(Boolean)
          .sort((a, b) => b.localeCompare(a))[0] ?? null
      const flagged = attempts.some((a) =>
        hasIntegrityConcern(a.tab_switch_count, integrityThreshold),
      )

      result.push({
        email: attempts[0].email,
        name,
        attempts,
        assessments: testIds.size,
        completed: completedTestIds.size,
        avgScore,
        lastActivity,
        flagged,
      })
    }

    return result.sort((a, b) =>
      (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""),
    )
  }, [candidates, integrityThreshold, search, testFilter])

  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageGroups = useMemo(
    () => groups.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [groups, currentPage],
  )

  useEffect(() => {
    setPage(1)
  }, [search, testFilter])

  useEffect(() => {
    if (currentPage !== page) setPage(currentPage)
  }, [currentPage, page])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search any candidate by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={testFilter}
          onValueChange={(v) => setTestFilter(v ?? "all")}
        >
          <SelectTrigger className="h-9 w-full min-w-0 sm:w-52">
            <SelectValue placeholder="All assessments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assessments</SelectItem>
            {tests.map((t: Test) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead className="text-center">Assessments</TableHead>
              <TableHead className="text-right">Avg score</TableHead>
              <TableHead>Last activity</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading candidates…
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No candidates match your filters.
                </TableCell>
              </TableRow>
            ) : (
              pageGroups.map((group) => {
                const href = `/candidates/${encodeURIComponent(group.email)}`
                return (
                <TableRow
                  key={group.email}
                  className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  role="link"
                  tabIndex={0}
                  aria-label={`View ${group.name}`}
                  onClick={() => router.push(href)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      router.push(href)
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {candidateInitials(group.email)}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="truncate font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          {group.name}
                        </Link>
                        <span className="truncate text-xs text-muted-foreground">
                          {group.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={numericText}>{group.assessments}</span>
                    {group.completed < group.assessments && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({group.completed} done)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {group.flagged && (
                      <span className="mr-2 inline-flex align-middle">
                        <IntegrityConcernBadge compact variant="danger" />
                      </span>
                    )}
                    <span
                      className={cn(
                        "font-semibold align-middle",
                        numericText,
                        group.avgScore === null && "text-muted-foreground",
                      )}
                    >
                      {group.avgScore === null ? "—" : `${group.avgScore}%`}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(group.lastActivity)}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {groups.length > pageSize && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, groups.length)} of {groups.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
