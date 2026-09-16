"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"

function SetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const [newPassword, setNext] = useState("")
  const [repeat, setRepeat] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== repeat) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "설정에 실패했습니다.")
      return
    }
    router.push(data.redirectTo ?? "/vendor")
    router.refresh()
  }

  return (
    <AuthShell title="비밀번호 설정" subtitle="본부에서 받은 링크 또는 재설정 메일로 본인 비밀번호를 만듭니다.">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="next">새 비밀번호</Label>
          <Input
            id="next"
            type="password"
            required
            minLength={10}
            value={newPassword}
            onChange={(e) => setNext(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repeat">확인</Label>
          <Input
            id="repeat"
            type="password"
            required
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            className="h-11"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11 w-full rounded-full" disabled={busy || !token}>
          {busy ? "저장 중…" : "비밀번호 저장 후 로그인"}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="비밀번호 설정" subtitle="불러오는 중…" />}>
      <SetPasswordForm />
    </Suspense>
  )
}
