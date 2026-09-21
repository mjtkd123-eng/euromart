"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"
import { TermsConsent } from "@/components/euromart/terms-consent"
import { useDetectedLang } from "@/lib/use-detected-lang"
import type { Lang } from "@/lib/i18n"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

function signUpErrorMessage(error: unknown, lang: Lang): string {
  if (typeof error === "string" && error.trim()) return error
  const { code, status, message } = (error ?? {}) as { code?: string; status?: number; message?: string }
  const ko = lang === "ko"
  if (typeof message === "string" && message.includes("이미")) return message

  if (code === "weak_password") {
    return ko ? "더 강력한 비밀번호를 선택해 주세요." : "Please choose a stronger password."
  }
  if (code === "email_address_invalid") {
    return ko
      ? "실제 이메일 주소를 사용해 주세요. (example/test 도메인은 지원되지 않습니다)"
      : "Please use a real email address — example/test domains are not supported."
  }
  if (code === "email_address_not_authorized") {
    return ko
      ? "해당 주소로는 인증 메일을 보낼 수 없습니다. 다른 주소를 사용해 주세요."
      : "We cannot send a verification email to that address. Please try another one."
  }
  if (code === "validation_failed") {
    return ko ? "입력하신 정보를 확인해 주세요." : "Please check the details you entered."
  }
  if (code === "over_email_send_rate_limit" || status === 429) {
    return ko ? "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." : "Too many attempts. Please try again shortly."
  }
  return ko ? "회원가입을 완료할 수 없습니다. 다시 시도해 주세요." : "We could not complete your sign-up. Please try again."
}

export default function SignUpPage() {
  const { lang, t } = useDetectedLang()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(t("passwordMismatch"))
      setIsLoading(false)
      return
    }
    if (!agreedTerms) {
      setError(t("termsRequiredError"))
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/customer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      })
      const data = await res.json()
      if (!res.ok) throw data.error ?? "sign-up failed"
      router.push(data.redirectTo ?? "/auth/sign-up-success")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Sign-up error:", error)
      setError(signUpErrorMessage(error, lang))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell title={t("signUpTitle")} subtitle={t("signUpSubtitle")}>
      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="fullName">{t("nameLabel")}</Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={lang === "ko" ? "홍길동" : "Jane Doe"}
            className="h-11"
          />
        </div>
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
          <p className="text-[11px] text-muted-foreground">
            {lang === "ko" ? "10자 이상, 영문 대·소문자와 숫자 포함" : "At least 10 characters with upper, lower, and a number."}
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repeat-password">{t("repeatPasswordLabel")}</Label>
          <Input
            id="repeat-password"
            type="password"
            required
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className="h-11"
          />
        </div>
        <TermsConsent
          t={t}
          agreed={agreedTerms}
          onAgreedChange={(next) => {
            setAgreedTerms(next)
            setError(null)
          }}
        />
        {error && (
          <p role="alert" className="break-keep text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="h-11 w-full rounded-full text-base"
          disabled={isLoading || !agreedTerms}
        >
          {isLoading ? t("creatingAccount") : t("signUpTitle")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("alreadyMember")}{" "}
        <Link href="/auth/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("loginTitle")}
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        마트 업주이신가요?{" "}
        <Link href="/owner/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
          업주 입점 신청
        </Link>
      </p>
    </AuthShell>
  )
}
