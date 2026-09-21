"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import { useDetectedLang } from "@/lib/use-detected-lang"
import type { Lang } from "@/lib/i18n"
import { DEMO_CUSTOMER_EMAIL, DEMO_CUSTOMER_PASSWORD } from "@/lib/demo-admin-public"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

function safeCustomerNext(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null
  if (next.startsWith("/owner") || next.startsWith("/admin") || next.startsWith("/vendor") || next.startsWith("/ops")) {
    return null
  }
  return next
}

function loginErrorMessage(error: unknown, lang: Lang): string {
  if (typeof error === "string" && error.trim()) return error
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
  return ko ? "이메일 또는 비밀번호가 올바르지 않습니다." : "That email or password is incorrect."
}

function CustomerLoginForm() {
  const { lang, t } = useDetectedLang()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const next = params.get("next")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal: "customer" }),
      })
      const data = await res.json()
      if (!res.ok) throw data.error ?? "login failed"
      const dest = safeCustomerNext(next) ?? data.redirectTo ?? "/account"
      router.push(dest)
      router.refresh()
    } catch (err: unknown) {
      setError(loginErrorMessage(err, lang))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell title={t("loginTitle")} subtitle="일반 회원 전용입니다. 업주·관리자 계정은 각각의 포털에서만 로그인할 수 있습니다.">
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
      <p className="mt-6 whitespace-pre-line rounded-xl bg-muted/60 px-3 py-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        {`데모 일반 회원\n${DEMO_CUSTOMER_EMAIL} / ${DEMO_CUSTOMER_PASSWORD}`}
      </p>
      <ul className="mt-5 flex flex-col gap-1 text-center text-xs text-muted-foreground">
        <li>
          <Link href="/owner/login" className="underline-offset-4 hover:text-foreground hover:underline">
            업주(파트너) 로그인
          </Link>
        </li>
        <li>
          <Link href="/admin/login" className="underline-offset-4 hover:text-foreground hover:underline">
            플랫폼 관리자 로그인
          </Link>
        </li>
      </ul>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell title="로그인" subtitle="불러오는 중…" />}>
      <CustomerLoginForm />
    </Suspense>
  )
}
