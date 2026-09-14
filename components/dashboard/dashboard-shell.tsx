import Link from "next/link"
import { ArrowUpRight, Store } from "lucide-react"
import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

interface DashboardShellProps {
  eyebrow: string
  title: string
  subtitle: string
  email: string | null
  children: React.ReactNode
}

export function DashboardShell({ eyebrow, title, subtitle, email, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
            <p className="truncate text-sm font-black leading-tight text-foreground">{title}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              스토어 보기
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
            {email && (
              <span className="hidden max-w-[180px] truncate border-l border-border pl-2 text-xs text-muted-foreground md:inline">
                {email}
              </span>
            )}
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm" className="text-xs">
                로그아웃
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <p className="break-keep text-pretty text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-5">{children}</div>
      </main>
    </div>
  )
}

interface StatStripProps {
  items: { label: string; value: string; hint?: string; alert?: boolean }[]
}

export function StatStrip({ items }: StatStripProps) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-3.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</dt>
          <dd
            className={`mt-1 font-mono text-xl font-bold tabular-nums ${
              s.alert ? "text-destructive" : "text-foreground"
            }`}
          >
            {s.value}
          </dd>
          {s.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</p>}
        </div>
      ))}
    </dl>
  )
}
