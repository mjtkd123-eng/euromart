"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export function CategoryNav() {
  const { t } = useLanguage()

  return (
    <nav aria-label={t.header.category} className="w-full bg-brand-orange text-brand-orange-foreground">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {t.nav.map((label, i) => (
          <Link
            key={`${label}-${i}`}
            href="/"
            className="shrink-0 whitespace-nowrap rounded-md px-3.5 py-3 text-sm font-bold transition-colors hover:bg-black/10"
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
