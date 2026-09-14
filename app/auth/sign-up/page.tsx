"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
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
  const { code, status } = (error ?? {}) as { code?: string; status?: number }
  const ko = lang === "ko"

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            role: "customer",
            terms_accepted_at: new Date().toISOString(),
            terms_version: "2026-08-eu-gdpr",
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
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
    </AuthShell>
  )
}
