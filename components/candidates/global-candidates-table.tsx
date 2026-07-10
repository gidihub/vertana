"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import type { Candidate, CandidateDisposition, CandidateStatus, Test } from "@/lib/types"
import { hasIntegrityConcern } from "@/lib/integrity"
import { numericText } from "@/lib/design-tokens"
import { useStore } from "@/lib/store"
import { CandidateDispositionSelect } from "@/components/candidates/candidate-disposition"
import { IntegrityConcernBadge } from "@/components/integrity-concern-badge"
import { CandidateStatusBadge } from "@/components/status-badge"
import { DISPOSITION_FILTER_OPTIONS } from "@/lib/disposition"
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

type Row = Candidate & { testTitle: string }

const STATUS_OPTIONS: { value: CandidateStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "invited", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "submitted", label: "Completed" },
  { value: "expired", label: "Expired" },
]

export function GlobalCandidatesTable() {
  const tests = useStore((db) => db.tests)
  const candidates = useStore((db) => db.candidates)
  const loading = useStore((db) => db.loading)
  const integrityThreshold = useStore(
    (db) => db.organization?.tab_switch_threshold ?? 3,
  )

  const [search, setSearch] = useState("")
  const [testFilter, setTestFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "all">(
    "all",
  )
  const [dispositionFilter, setDispositionFilter] = useState<
    CandidateDisposition | "all"
  >("all")

  const testById = useMemo(
    () => new Map(tests.map((t) => [t.id, t] as const)),
    [tests],
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return candidates
      .map((c): Row => ({
        ...c,
        testTitle: testById.get(c.test_id)?.title ?? "Unknown test",
      }))
      .filter((row) => {
        if (testFilter !== "all" && row.test_id !== testFilter) return false
        if (statusFilter !== "all" && row.status !== statusFilter) return false
        if (
          dispositionFilter !== "all" &&
          (row.disposition ?? "under_review") !== dispositionFilter
        ) {
          return false
        }
        if (!q) return true
        return (
          row.email.toLowerCase().includes(q) ||
          row.testTitle.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const aTime = a.submitted_at ?? a.started_at ?? ""
        const bTime = b.submitted_at ?? b.started_at ?? ""
        return bTime.localeCompare(aTime)
      })
  }, [candidates, dispositionFilter, search, statusFilter, testById, testFilter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email or test name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={testFilter}
          onValueChange={(v) => setTestFilter(v ?? "all")}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All tests" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tests</SelectItem>
            {tests.map((t: Test) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as CandidateStatus | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={dispositionFilter}
          onValueChange={(v) =>
            setDispositionFilter(v as CandidateDisposition | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Disposition" />
          </SelectTrigger>
          <SelectContent>
            {DISPOSITION_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
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
              <TableHead>Test</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Disposition</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Loading candidates…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No candidates match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const integrity = hasIntegrityConcern(
                  row.tab_switch_count,
                  integrityThreshold,
                )
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>
                      <Link
                        href={`/tests/${row.test_id}/results`}
                        className="text-pine hover:underline"
                      >
                        {row.testTitle}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <CandidateStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>
                      <CandidateDispositionSelect candidate={row} compact />
                    </TableCell>
                    <TableCell className="text-right">
                      {integrity ? (
                        <div className="flex justify-end">
                          <IntegrityConcernBadge compact variant="danger" />
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "font-semibold",
                            numericText,
                            row.score === null && "text-muted-foreground",
                          )}
                        >
                          {row.score === null ? "—" : `${row.score}%`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(row.submitted_at)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
