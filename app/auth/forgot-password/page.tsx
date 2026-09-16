"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await fetch("/api/auth/reset-password-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setBusy(false)
    setDone(true)
  }

  return (
    <AuthShell
      title="비밀번호 재설정"
      subtitle="업주 계정 이메일을 입력하면 재설정 링크를 보냅니다. 등록되지 않은 주소인지는 알려 드리지 않습니다."
    >
      {done ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          해당 이메일이 업주 계정으로 등록되어 있으면 안내를 보냈습니다.{" "}
          <Link href="/vendor/login" className="font-semibold text-primary">
            로그인으로
          </Link>
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-full" disabled={busy}>
            {busy ? "보내는 중…" : "재설정 메일 요청"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
