import type { ReactNode } from "react"
import Link from "next/link"
import { ShoppingBag, ExternalLink } from "lucide-react"
import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

interface DashboardShellProps {
  /** 대시보드 종류 라벨 — 예: "업주 대시보드" */
  kicker: string
  title: string
  subtitle?: string
  email?: string | null
  children: ReactNode
}

export function DashboardShell({ kicker, title, subtitle, email, children }: DashboardShellProps) {
  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-black tracking-tight text-foreground">K-EuroMart</span>
          </Link>

          <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground sm:inline">
            {kicker}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {email && <span className="hidden text-xs text-muted-foreground md:inline">{email}</span>}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ExternalLink className="size-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only sm:ml-1.5">스토어</span>
              </Link>
            </Button>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                로그아웃
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-foreground text-balance">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground text-pretty">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  hint?: string
  tone?: "default" | "warning" | "danger"
}

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  const toneClass =
    tone === "danger" ? "text-destructive" : tone === "warning" ? "text-primary" : "text-foreground"
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-2xl font-black tabular-nums ${toneClass}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
