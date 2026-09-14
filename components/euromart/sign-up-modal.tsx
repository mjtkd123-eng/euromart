"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEuromart } from "@/lib/euromart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Lang } from "@/lib/i18n"
import { TermsConsent } from "./terms-consent"

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
  if (code === "user_already_exists" || code === "email_exists") {
    return ko ? "이미 가입된 이메일입니다." : "That email is already registered."
  }
  if (code === "over_email_send_rate_limit" || status === 429) {
    return ko
      ? "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."
      : "Too many attempts. Please try again shortly."
  }
  return ko
    ? "회원가입을 완료할 수 없습니다. 다시 시도해 주세요."
    : "We could not complete your sign-up. Please try again."
}

/**
 * 화면 중앙에 뜨는 회원가입 모달.
 *
 * EU GDPR 요건에 맞춰 필수 약관 동의 없이는 제출이 차단되며,
 * 약관 본문은 모달 안에서 아코디언으로 펼쳐 확인할 수 있습니다.
 * 동의 시각(termsAcceptedAt)은 증빙을 위해 사용자 메타데이터로 함께 저장합니다.
 */
export function SignUpModal() {
  const { signUpOpen, setSignUpOpen, lang, t } = useEuromart()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function reset() {
    setEmail("")
    setPassword("")
    setRepeatPassword("")
    setAgreedTerms(false)
    setError(null)
  }

  function handleOpenChange(open: boolean) {
    setSignUpOpen(open)
    if (!open) reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError(t("passwordMismatch"))
      return
    }
    if (!agreedTerms) {
      setError(t("termsRequiredError"))
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            role: "customer",
            terms_accepted_at: new Date().toISOString(),
            terms_version: "2026-08-eu-gdpr",
          },
        },
      })
      if (error) throw error
      handleOpenChange(false)
      router.push("/auth/sign-up-success")
    } catch (err: unknown) {
      console.error("[v0] Sign-up error:", err)
      setError(signUpErrorMessage(err, lang))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={signUpOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserPlus className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="break-keep text-balance text-xl font-black">
            {t("signUpModalTitle")}
          </DialogTitle>
          <DialogDescription className="break-keep text-pretty leading-relaxed">
            {t("signUpModalSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="signup-email">{t("emailLabel")}</Label>
            <Input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="signup-password">{t("passwordLabel")}</Label>
            <Input
              id="signup-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="signup-repeat">{t("repeatPasswordLabel")}</Label>
            <Input
              id="signup-repeat"
              type="password"
              required
              autoComplete="new-password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* --- GDPR 약관 / 쿠키 동의 --- */}
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
            size="lg"
            disabled={isLoading || !agreedTerms}
            className="h-12 w-full rounded-full text-base font-bold"
          >
            {isLoading ? t("creatingAccount") : t("createAccount")}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            GDPR
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
