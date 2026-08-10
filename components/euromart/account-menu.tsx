"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { User, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"

export function AccountMenu() {
  const { user } = useEuromart()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" className="rounded-full">
        <Link href="/auth/login">
          <User className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">로그인</span>
        </Link>
      </Button>
    )
  }

  const label = user.fullName || user.email || "내 계정"

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="계정 메뉴"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
          {label.slice(0, 1).toUpperCase()}
        </span>
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold text-foreground">{label}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.role === "admin" ? "관리자" : user.role === "vendor" ? "판매자" : "고객"}
            </p>
          </div>

          {user.role === "vendor" && (
            <Link
              href="/vendor"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="size-4 text-primary" aria-hidden="true" />
              판매자 대시보드
            </Link>
          )}
          {user.role === "admin" && (
            <Link
              href="/admin"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              관리자 콘솔
            </Link>
          )}

          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
