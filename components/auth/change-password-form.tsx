"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"

import { homePathForRole, type Role } from "@/lib/roles"

export function ChangePasswordForm({
  email,
  firstLogin,
  role,
}: {
  email: string
  firstLogin: boolean
  role: Role | "vendor"
}) {
  const router = useRouter()
  const [currentPassword, setCurrent] = useState("")
  const [newPassword, setNext] = useState("")
  const [repeat, setRepeat] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== repeat) {
      setError("새 비밀번호가 일치하지 않습니다.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: firstLogin ? "" : currentPassword, newPassword }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "변경에 실패했습니다.")
      return
    }
    router.push(data.redirectTo ?? homePathForRole(role))
    router.refresh()
  }

  return (
    <AuthShell
      title="비밀번호 변경"
      subtitle={
        firstLogin
          ? "최초 로그인입니다. 본인만 아는 비밀번호로 바꾼 뒤에 매장 관리를 사용할 수 있습니다."
          : "현재 비밀번호를 확인한 뒤 새 비밀번호를 저장합니다."
      }
    >
      <p className="mb-4 rounded-xl bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
        {email}
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5" autoComplete="off">
        {!firstLogin && (
          <div className="grid gap-2">
            <Label htmlFor="current">현재 비밀번호</Label>
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
              className="h-11"
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="next">새 비밀번호</Label>
          <Input
            id="next"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            value={newPassword}
            onChange={(e) => setNext(e.target.value)}
            className="h-11"
          />
          <p className="text-[11px] text-muted-foreground">10자 이상, 영문 대·소문자와 숫자 포함</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repeat">새 비밀번호 확인</Label>
          <Input
            id="repeat"
            type="password"
            autoComplete="new-password"
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
        <Button type="submit" className="h-11 w-full rounded-full" disabled={busy}>
          {busy ? "저장 중…" : "비밀번호 저장"}
        </Button>
      </form>
    </AuthShell>
  )
}
