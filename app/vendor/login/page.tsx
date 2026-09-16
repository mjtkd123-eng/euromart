"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/demo-admin-public"

function VendorLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "로그인에 실패했습니다.")
      return
    }
    const fallback = data.redirectTo ?? "/vendor"
    const dest = next && next.startsWith("/") ? next : fallback
    router.push(data.mustChangePassword ? "/auth/change-password" : dest)
    router.refresh()
  }

  return (
    <AuthShell
      title="업주 · 본부 로그인"
      subtitle="마트 업주 계정은 본부 심사 후 발급됩니다. 고객 회원가입과 분리되어 있습니다."
    >
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
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
      <p className="mt-4 text-center text-sm">
        <Link href="/auth/forgot-password" className="font-semibold text-primary underline-offset-4 hover:underline">
          비밀번호 찾기 / 재설정
        </Link>
      </p>
      <p className="mt-6 rounded-xl bg-muted/60 px-3 py-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        데모 본부 계정
        <br />
        {DEMO_ADMIN_EMAIL} / {DEMO_ADMIN_PASSWORD}
      </p>
    </AuthShell>
  )
}

export default function VendorLoginPage() {
  return (
    <Suspense fallback={<AuthShell title="업주 · 본부 로그인" subtitle="불러오는 중…" />}>
      <VendorLoginForm />
    </Suspense>
  )
}
