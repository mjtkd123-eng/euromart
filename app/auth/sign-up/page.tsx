"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

function signUpErrorMessage(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }
  if (code === "weak_password") return "더 강력한 비밀번호를 선택해 주세요."
  if (code === "email_address_invalid") {
    return "실제 이메일 주소를 사용해 주세요. (example/test 도메인은 지원되지 않습니다)"
  }
  if (code === "email_address_not_authorized") {
    return "해당 주소로는 인증 메일을 보낼 수 없습니다. 다른 주소를 사용해 주세요."
  }
  if (code === "validation_failed") return "입력하신 정보를 확인해 주세요."
  if (code === "over_email_send_rate_limit" || status === 429) {
    return "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."
  }
  return "회원가입을 완료할 수 없습니다. 다시 시도해 주세요."
}

export default function SignUpPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
          data: { full_name: fullName, role: "customer" },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      console.error("[v0] Sign-up error:", error)
      setError(signUpErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell title="회원가입" subtitle="새 계정을 만들어 유럽 어디서나 한국 식료품을 주문하세요">
      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="fullName">이름 · Name</Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="홍길동"
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">이메일 · Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">비밀번호 · Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repeat-password">비밀번호 확인 · Repeat</Label>
          <Input
            id="repeat-password"
            type="password"
            required
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className="h-11"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-11 w-full rounded-full text-base" disabled={isLoading}>
          {isLoading ? "계정 생성 중..." : "회원가입"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </AuthShell>
  )
}
