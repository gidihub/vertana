"use client"

import { useEffect, useState } from "react"

// Simulates initial fetch latency so loading skeletons are exercised against
// the current in-memory store. When wired to Supabase, drop the timer and drive
// this flag from the real query's pending state instead.
export function useSimulatedLoad(ms = 550): boolean {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(timer)
  }, [ms])
  return loading
}
