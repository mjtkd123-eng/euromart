import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { requireStaff } from "@/lib/auth"
import { ClaimsPolicyView } from "@/components/help/claims-policy-view"

export const metadata: Metadata = {
  title: "클레임 처리 기준 (내부) · K-EuroMart",
  description: "마트 업주와 플랫폼 관리자 전용 — 금액대별 라우팅, 2시간 SLA, 고위험 SOP, GDPR 보관.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function OpsClaimsPolicyPage() {
  const staff = await requireStaff("/ops/claims")
  const backHref = staff.demo ? "/" : staff.role === "admin" ? "/admin/dashboard" : "/owner/claims"
  const backLabel = staff.demo ? "스토어" : staff.role === "admin" ? "관리자 콘솔" : "환불·분쟁 관리"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {backLabel}
          </Link>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Lock className="size-3.5" aria-hidden="true" />
            업주 · 관리자 전용
          </p>
        </div>
      </header>

      <div className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Internal · CS / Legal
          </p>
          <h1 className="mt-1 text-balance text-2xl font-black tracking-tight sm:text-3xl">
            클레임 처리 기준
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            금액대별 즉시 환불, 매장 2시간 SLA, 식중독·알레르기 Tier 2 이관. 고객 고객센터에는 공개하지 않습니다.
          </p>
          {staff.demo && (
            <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              데모: 로그인이 없어 내부 화면을 미리 봅니다. 실제 서비스에서는 마트 업주와 관리자만 이 페이지에 들어올 수 있습니다.
            </p>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <ClaimsPolicyView audience="staff" />
      </main>
    </div>
  )
}
