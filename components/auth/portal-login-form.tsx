"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import type { Role } from "@/lib/roles"

function safeNext(next: string | null, portal: Role): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null
  if (portal === "owner" && (next.startsWith("/owner") || next.startsWith("/ops"))) return next
  if (portal === "admin" && (next.startsWith("/admin") || next.startsWith("/ops"))) return next
  if (portal === "customer" && !next.startsWith("/owner") && !next.startsWith("/admin") && !next.startsWith("/vendor") && !next.startsWith("/ops")) {
    return next
  }
  return null
}

export function PortalLoginForm({
  portal,
  title,
  subtitle,
  demoHint,
  signupHref,
  signupLabel,
  otherPortals,
}: {
  portal: Role
  title: string
  subtitle: string
  demoHint?: string
  signupHref?: string
  signupLabel?: string
  otherPortals: { href: string; label: string }[]
}) {
  return (
    <Suspense fallback={<AuthShell title={title} subtitle="불러오는 중…" />}>
      <PortalLoginFields
        portal={portal}
        title={title}
        subtitle={subtitle}
        demoHint={demoHint}
        signupHref={signupHref}
        signupLabel={signupLabel}
        otherPortals={otherPortals}
      />
    </Suspense>
  )
}

function PortalLoginFields({
  portal,
  title,
  subtitle,
  demoHint,
  signupHref,
  signupLabel,
  otherPortals,
}: {
  portal: Role
  title: string
  subtitle: string
  demoHint?: string
  signupHref?: string
  signupLabel?: string
  otherPortals: { href: string; label: string }[]
}) {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")
  const [email, setEmail] = useState(params.get("email") ?? "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(
    params.get("reason") === "rejected" ? "입점 신청이 반려된 계정입니다. 본부에 문의해 주세요." : null,
  )
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, portal }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "로그인에 실패했습니다.")
      return
    }
    const dest = safeNext(next, portal) ?? data.redirectTo
    router.push(data.mustChangePassword ? "/auth/change-password" : dest)
    router.refresh()
  }

  return (
    <AuthShell title={title} subtitle={subtitle}>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5" autoComplete="on">
        <div className="grid gap-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name={`${portal}-email`}
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <button
              type="button"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "숨기기" : "비밀번호 표시"}
            </button>
          </div>
          <Input
            id="password"
            name={`${portal}-password`}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 font-mono"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11 w-full rounded-full text-base" disabled={busy}>
          {busy ? "확인 중…" : "로그인"}
        </Button>
      </form>
      {signupHref && (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          아직 계정이 없나요?{" "}
          <Link href={signupHref} className="font-semibold text-primary underline-offset-4 hover:underline">
            {signupLabel ?? "회원가입"}
          </Link>
        </p>
      )}
      {portal !== "customer" && (
        <p className="mt-4 text-center text-sm">
          <Link href="/auth/forgot-password" className="font-semibold text-primary underline-offset-4 hover:underline">
            비밀번호 찾기 / 재설정
          </Link>
        </p>
      )}
      {demoHint && (
        <p className="mt-6 whitespace-pre-line rounded-xl bg-muted/60 px-3 py-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          {demoHint}
        </p>
      )}
      <ul className="mt-5 flex flex-col gap-1 text-center text-xs text-muted-foreground">
        {otherPortals.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="underline-offset-4 hover:text-foreground hover:underline">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </AuthShell>
  )
}
