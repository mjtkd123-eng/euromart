"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { TransKey } from "@/lib/i18n"
import { TermsContent } from "./terms-content"

interface TermsConsentProps {
  t: (key: TransKey, params?: Record<string, string | number>) => string
  agreed: boolean
  onAgreedChange: (agreed: boolean) => void
}

/**
 * EU GDPR 약관·쿠키 동의 영역.
 *
 * 회원가입 모달과 회원가입 페이지가 동일한 마크업을 공유하도록 분리했습니다.
 * 현재 필수 항목이 하나이므로 "전체 동의"는 그 항목과 함께 움직이며,
 * 선택 동의 항목이 늘어나면 이 컴포넌트만 확장하면 됩니다.
 */
export function TermsConsent({ t, agreed, onAgreedChange }: TermsConsentProps) {
  const [termsOpen, setTermsOpen] = useState(false)

  return (
    <fieldset className="rounded-2xl border border-border bg-muted/40 p-3.5">
      <legend className="sr-only">{t("termsDocTitle")}</legend>

      <label className="flex cursor-pointer items-start gap-2.5">
        <Checkbox
          checked={agreed}
          onCheckedChange={(checked) => onAgreedChange(checked === true)}
          className="mt-0.5 shrink-0"
        />
        <span className="break-keep text-pretty text-[13px] font-bold leading-relaxed text-foreground">
          {t("agreeAll")}
        </span>
      </label>

      <div className="my-3 h-px bg-border" aria-hidden="true" />

      <div className="flex items-start gap-2.5">
        <Checkbox
          id="consent-terms"
          checked={agreed}
          onCheckedChange={(checked) => onAgreedChange(checked === true)}
          className="mt-0.5 shrink-0"
          aria-describedby="consent-terms-hint"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">
              {t("requiredTag")}
            </span>
            <Label
              htmlFor="consent-terms"
              className="cursor-pointer break-keep text-pretty text-[13px] font-medium leading-relaxed"
            >
              {t("termsConsentLabel")}
            </Label>
          </div>
          <p
            id="consent-terms-hint"
            className="mt-1 break-keep text-pretty text-[11px] leading-relaxed text-muted-foreground"
          >
            {t("termsConsentHint")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setTermsOpen((v) => !v)}
          aria-expanded={termsOpen}
          aria-controls="terms-panel"
          className="flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/10"
        >
          {termsOpen ? t("hideTerms") : t("viewTerms")}
          <ChevronDown
            className={cn("size-3.5 transition-transform", termsOpen && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </div>

      {termsOpen && (
        <div
          id="terms-panel"
          className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-border bg-background p-3"
        >
          <TermsContent t={t} />
        </div>
      )}
    </fieldset>
  )
}
