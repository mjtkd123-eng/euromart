"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD } from "@/lib/demo-admin-public"

export function OwnerLoginFields() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, portal: "owner" }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "로그인에 실패했습니다.")
      return
    }
    router.push(data.mustChangePassword ? "/auth/change-password" : (data.redirectTo ?? "/owner/dashboard"))
    router.refresh()
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4" autoComplete="on">
      <div className="grid gap-2">
        <Label htmlFor="owner-landing-email">이메일</Label>
        <Input
          id="owner-landing-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="owner-landing-password">비밀번호</Label>
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "숨기기" : "비밀번호 표시"}
          </button>
        </div>
        <Input
          id="owner-landing-password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
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
        {busy ? "확인 중…" : "업주 로그인"}
      </Button>
      <p className="whitespace-pre-line rounded-xl bg-muted/60 px-3 py-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        {`승인된 데모 업주 (비엔나 1호점)\n${DEMO_OWNER_EMAIL} / ${DEMO_OWNER_PASSWORD}`}
      </p>
    </form>
  )
}
