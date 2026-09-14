"use client"

import type { TransKey } from "@/lib/i18n"

/** 약관 조항 목록 — 사전 키 쌍으로만 관리해 번역과 본문이 어긋나지 않게 합니다. */
const ARTICLES: { title: TransKey; body: TransKey }[] = [
  { title: "termsArt1Title", body: "termsArt1Body" },
  { title: "termsArt2Title", body: "termsArt2Body" },
  { title: "termsArt3Title", body: "termsArt3Body" },
  { title: "termsArt4Title", body: "termsArt4Body" },
  { title: "termsArt5Title", body: "termsArt5Body" },
  { title: "termsArt6Title", body: "termsArt6Body" },
]

interface TermsContentProps {
  t: (key: TransKey, params?: Record<string, string | number>) => string
}

/**
 * 이용약관 및 개인정보 처리방침 본문.
 * 회원가입 모달의 펼침 영역과 별도 약관 페이지에서 함께 사용합니다.
 */
export function TermsContent({ t }: TermsContentProps) {
  return (
    <div className="flex flex-col gap-4">
      {ARTICLES.map(({ title, body }) => (
        <section key={title}>
          <h4 className="text-xs font-bold text-foreground">{t(title)}</h4>
          <p className="mt-1 break-keep text-pretty text-xs leading-relaxed text-muted-foreground">
            {t(body)}
          </p>
        </section>
      ))}
    </div>
  )
}
