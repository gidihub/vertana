import { Logo } from "@/components/logo"

export function CandidateHeader() {
  return (
    <header className="border-b border-sage-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center px-4">
        <Logo size={28} />
      </div>
    </header>
  )
}
