"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function BillingCheckoutToast() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const billing = searchParams.get("billing")
    if (billing === "success") {
      toast.success("Subscription updated. Your plan may take a moment to sync.")
    } else if (billing === "canceled") {
      toast.message("Checkout canceled.")
    }
  }, [searchParams])

  return null
}
