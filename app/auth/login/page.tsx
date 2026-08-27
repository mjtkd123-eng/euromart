"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import { useDetectedLang } from "@/lib/use-detected-lang"
import type { Lang } from "@/lib/i18n"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

// 계정 존재 여부를 노출하지 않도록 자격 증명 오류만 일반화합니다.
function loginErrorMessage(error: unknown, lang: Lang): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }
  const ko = lang === "ko"

  if (code === "email_not_confirmed") {
    return ko
      ? "이메일 인증이 필요합니다. 받은 편지함의 인증 링크를 확인해 주세요."
      : "Please confirm your email first — check your inbox for the verification link."
  }
  if (code === "over_request_rate_limit" || status === 429) {
    return ko ? "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." : "Too many attempts. Please try again shortly."
  }
  if (code === "invalid_credentials") {
    return ko ? "이메일 또는 비밀번호가 올바르지 않습니다." : "That email or password is incorrect."
  }
  return ko ? "문제가 발생했습니다. 다시 시도해 주세요." : "Something went wrong. Please try again."
}

export default function LoginPage() {
  const { lang, t } = useDetectedLang()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/account")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)
      setError(loginErrorMessage(error, lang))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email">{t("emailLabel")}</Label>
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
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-11 w-full rounded-full text-base" disabled={isLoading}>
          {isLoading ? t("signingIn") : t("loginTitle")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("noAccountYet")}{" "}
        <Link href="/auth/sign-up" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("signUpAction")}
        </Link>
      </p>
    </AuthShell>
  )
}
