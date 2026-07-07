"use client"

import { CheckCircle2 } from "lucide-react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export function DoneStep({ email }: { email: string }) {
  return (
    <Card className="text-center">
      <CardHeader className="items-center">
        <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-7" />
        </div>
        <CardTitle className="text-balance">Assessment submitted</CardTitle>
        <CardDescription className="text-pretty">
          Thanks for completing the assessment. Your responses have been recorded.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground text-pretty">
          A confirmation is associated with{" "}
          <span className="font-medium text-foreground">{email}</span>. The hiring
          team will review your results and follow up with next steps. You can
          safely close this window.
        </p>
      </CardContent>
    </Card>
  )
}
