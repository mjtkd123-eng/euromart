import Link from "next/link"
import { ShoppingBag } from "lucide-react"

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-muted/40 p-6 md:p-10">
      <Link href="/" className="flex items-center gap-2.5" aria-label="K-EuroMart">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShoppingBag className="size-5" aria-hidden="true" />
        </span>
        <span className="text-xl font-black tracking-tight">
          K<span className="text-primary">EuroMart</span>
        </span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-black text-foreground text-balance">{title}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
