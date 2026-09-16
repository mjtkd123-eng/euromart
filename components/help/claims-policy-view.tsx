"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Camera,
  Clock,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from "lucide-react"
import { classifyClaim, type ClaimIssue, type ClaimMarket } from "@/lib/claims-routing"
import {
  BAND_LABELS,
  DECISION_LABELS,
  ISSUE_LABELS,
  customerRouteCopy,
} from "@/lib/claims-copy"
import { CONTACT, helpText } from "@/lib/help-center"
import { useEuromart } from "@/lib/euromart-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const ISSUES: ClaimIssue[] = [
  "omission",
  "partial_damage",
  "freshness",
  "full_misdelivery",
  "batch_freshness",
  "food_poisoning",
  "unlabeled_allergen",
  "legal_threat",
  "change_of_mind",
]

const THRESHOLDS = [
  {
    band: "micro" as const,
    kr: "≤ ₩30,000",
    eu: "≤ €20",
    issues: { ko: "누락, 부분 파손, 신선도 (사진 필수)", en: "Omission, partial damage, freshness (photo required)" },
    action: {
      ko: "즉시 환불 또는 재배송. 회수 없음 (물류비 절감).",
      en: "Refund or re-ship immediately. No item retrieval.",
    },
  },
  {
    band: "medium" as const,
    kr: "₩30,000 – ₩100,000",
    eu: "€20 – €50",
    issues: { ko: "완전 오배송, 배치 신선도", en: "Full misdelivery, batch freshness" },
    action: {
      ko: "플랫폼이 자동 승인. 회수는 환불을 막지 않습니다.",
      en: "Platform auto-approves. Retrieval does not block the refund.",
    },
  },
  {
    band: "high" as const,
    kr: "> ₩100,000",
    eu: "> €50",
    issues: {
      ko: "식중독, 알레르기 미표시, 법적 위협, FDS 차단 계정",
      en: "Food poisoning, unlabeled allergen, legal threat, FDS-blocked users",
    },
    action: {
      ko: "매장을 건너뛰고 플랫폼 CS·법무(Tier 2)로 직행.",
      en: "Skip the store. Direct Tier 2 (platform CS & Legal).",
    },
  },
]

const SOP = [
  {
    title: { ko: "식중독 · 식품 안전", en: "Food poisoning / safety" },
    steps: {
      ko: ["해당 SKU 판매 즉시 중단", "진단서 제출", "플랫폼 배상책임보험으로 고객 선지급", "보건 당국 협조 (기록)"],
      en: ["Halt the SKU immediately", "Require a medical certificate", "Pay the customer from platform CGL", "Coordinate with health authorities (logged)"],
    },
  },
  {
    title: { ko: "알레르기 미표시", en: "Unlabeled allergens" },
    steps: {
      ko: ["구매자에게 긴급 푸시·이메일 리콜", "주문·배달비 100% 환불", "매장 상품 DB 라벨·원재료 감사"],
      en: ["Emergency push + email recall to purchasers", "100% refund (order + delivery)", "Audit merchant labels and ingredients"],
    },
  },
  {
    title: { ko: "법적 분쟁", en: "Legal disputes" },
    steps: {
      ko: ["단일 CR 담당자 배정", "로그·사진·통화 메타데이터 수집", "표준 NDA/합의해제 합의로 종결"],
      en: ["Assign a single CR agent", "Collect audit trail (logs, photos, call metadata)", "Settle with a standard NDA / release"],
    },
  },
  {
    title: { ko: "악용 (FDS)", en: "Malicious abuse (FDS)" },
    steps: {
      ko: ["90일 환불율 30% 초과(최소 5건) 시 자동승인 차단", "경고 ARS/인앱 경고", "3회 경고 후 계정 차단 · 법무 이관"],
      en: [">30% refund rate over 90 days (min 5 orders) blocks Tier 1 auto-approval", "Warning ARS / in-app warning", "After 3 warnings: disconnect the account and queue legal"],
    },
  },
]

function fieldClass() {
  return "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
}

export function ClaimsPolicyView() {
  const { lang, t } = useEuromart()
  const [market, setMarket] = useState<ClaimMarket>("EU")
  const [amount, setAmount] = useState("18")
  const [issue, setIssue] = useState<ClaimIssue>("freshness")
  const [photo, setPhoto] = useState(true)
  const [storage, setStorage] = useState<"fresh" | "chilled" | "frozen" | "ambient">("chilled")
  const [fxStale, setFxStale] = useState(false)
  const [blacklisted, setBlacklisted] = useState(false)
  const [refundRate, setRefundRate] = useState("10")
  const [orderCount, setOrderCount] = useState("8")
  const [warnings, setWarnings] = useState("0")

  const result = useMemo(() => {
    const n = Number(amount)
    return classifyClaim({
      issue,
      amount: Number.isFinite(n) && n >= 0 ? n : 0,
      market,
      photoCount: photo ? 1 : 0,
      fxStale,
      storage,
      fds: {
        blacklisted,
        refundRate90d: (Number(refundRate) || 0) / 100,
        orderCount90d: Math.max(0, Number(orderCount) || 0),
        warningCount: Math.max(0, Number(warnings) || 0),
      },
    })
  }, [amount, blacklisted, fxStale, issue, market, orderCount, photo, refundRate, storage, warnings])

  const copy = customerRouteCopy(result.decision, result.reason, market)
  const sla = new Date(result.slaDeadlineAt)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {lang === "ko"
            ? "클레임은 금액·사유·위험도에 따라 매장(2시간) 또는 플랫폼 법무로 나뉩니다. 플랫폼이 고객에게 먼저 지급하고, 매장 PL 보험으로 구상합니다."
            : "Claims route by amount, issue, and risk — store (2-hour SLA) or platform Legal. The platform pays you first, then recovers from the merchant’s product-liability insurance."}
        </p>
      </div>

      <section>
        <h2 className="text-base font-bold sm:text-lg">
          {lang === "ko" ? "승인 기준 (KR / EU)" : "Authorization thresholds (KR / EU)"}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {THRESHOLDS.map((row) => (
            <article key={row.band} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary">{helpText(BAND_LABELS[row.band], lang)}</Badge>
                <span className="text-xs font-semibold text-muted-foreground">
                  {row.eu} · {row.kr}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{helpText(row.issues, lang)}</p>
              <p className="mt-2 text-sm font-medium leading-relaxed">{helpText(row.action, lang)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-base font-bold sm:text-lg">
          {lang === "ko" ? "내 클레임은 어디로 가나요?" : "Where does my claim go?"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "ko"
            ? "실제 라우팅 엔진과 동일한 규칙입니다. 주문 접수 없이 결과만 미리 봅니다."
            : "Same rules as production routing. This preview does not file a claim."}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-market">{lang === "ko" ? "시장" : "Market"}</Label>
            <select
              id="claim-market"
              className={fieldClass()}
              value={market}
              onChange={(e) => setMarket(e.target.value as ClaimMarket)}
            >
              <option value="EU">EU (€)</option>
              <option value="KR">KR (₩)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-amount">
              {lang === "ko" ? "환불 요청 금액" : "Requested refund"} ({market === "KR" ? "₩" : "€"})
            </Label>
            <Input
              id="claim-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="claim-issue">{lang === "ko" ? "사유" : "Issue"}</Label>
            <select
              id="claim-issue"
              className={fieldClass()}
              value={issue}
              onChange={(e) => setIssue(e.target.value as ClaimIssue)}
            >
              {ISSUES.map((code) => (
                <option key={code} value={code}>
                  {helpText(ISSUE_LABELS[code], lang)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-storage">{lang === "ko" ? "보관 온도" : "Storage"}</Label>
            <select
              id="claim-storage"
              className={fieldClass()}
              value={storage}
              onChange={(e) =>
                setStorage(e.target.value as "fresh" | "chilled" | "frozen" | "ambient")
              }
            >
              <option value="fresh">{lang === "ko" ? "신선" : "Fresh"}</option>
              <option value="chilled">{lang === "ko" ? "냉장" : "Chilled"}</option>
              <option value="frozen">{lang === "ko" ? "냉동" : "Frozen"}</option>
              <option value="ambient">{lang === "ko" ? "상온 · 일반상품" : "Ambient / general"}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} />
            <Camera className="size-4 text-muted-foreground" aria-hidden="true" />
            {lang === "ko" ? "사진 첨부" : "Photo attached"}
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <input type="checkbox" checked={fxStale} onChange={(e) => setFxStale(e.target.checked)} />
            {lang === "ko" ? "환율 스냅샷 24시간 초과 (고액 취급)" : "FX snapshot older than 24h (treat as high)"}
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={blacklisted}
              onChange={(e) => setBlacklisted(e.target.checked)}
            />
            {lang === "ko" ? "FDS 블랙리스트" : "FDS blacklisted"}
          </label>
          <div className="grid grid-cols-3 gap-2 sm:col-span-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fds-rate">{lang === "ko" ? "90일 환불율 %" : "90d refund %"}</Label>
              <Input id="fds-rate" inputMode="decimal" value={refundRate} onChange={(e) => setRefundRate(e.target.value)} className="h-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fds-orders">{lang === "ko" ? "90일 주문 수" : "90d orders"}</Label>
              <Input id="fds-orders" inputMode="numeric" value={orderCount} onChange={(e) => setOrderCount(e.target.value)} className="h-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fds-warn">{lang === "ko" ? "FDS 경고" : "FDS warnings"}</Label>
              <Input id="fds-warn" inputMode="numeric" value={warnings} onChange={(e) => setWarnings(e.target.value)} className="h-9" />
            </div>
          </div>
        </div>

        <div
          className={`mt-6 rounded-2xl border p-5 ${
            result.decision === "REJECT"
              ? "border-destructive/40 bg-destructive/5"
              : result.decision === "TIER2"
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-primary/30 bg-primary/5"
          }`}
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{helpText(DECISION_LABELS[result.decision], lang)}</Badge>
            <Badge variant="outline">{helpText(BAND_LABELS[result.band], lang)}</Badge>
            <Badge variant="secondary">{result.reason}</Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{helpText(copy, lang)}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="font-semibold">{lang === "ko" ? "매장 SLA 마감" : "Merchant SLA deadline"}</dt>
                <dd className="text-muted-foreground">
                  {lang === "ko" ? "접수 후 2시간" : "2 hours from filing"} · {sla.toLocaleString(lang === "ko" ? "ko-KR" : "en-GB")}
                </dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="font-semibold">{lang === "ko" ? "상품 회수" : "Item retrieval"}</dt>
                <dd className="text-muted-foreground">
                  {result.retrievalRequired
                    ? lang === "ko"
                      ? "회수 필요"
                      : "Required"
                    : result.retrievalSuggested
                      ? lang === "ko"
                        ? "선택 (환불은 기다리지 않음)"
                        : "Optional (does not block refund)"
                      : lang === "ko"
                        ? "없음 — 물류비 절감"
                        : "None — skip reverse logistics"}
                </dd>
              </div>
            </div>
          </dl>
          {result.fdsAction && (
            <p className="mt-3 flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
              <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
              FDS: {result.fdsAction}
              {result.fdsAction === "force_disconnect"
                ? lang === "ko"
                  ? " — 3회 경고 후 계정 차단"
                  : " — account hold after 3 warnings"
                : null}
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg">
          <AlertTriangle className="size-4 text-primary" aria-hidden="true" />
          {lang === "ko" ? "고위험 SOP (Tier 2)" : "High-risk SOP (Tier 2)"}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {SOP.map((item) => (
            <article key={item.title.en} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold">{helpText(item.title, lang)}</h3>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-muted-foreground">
                {(lang === "ko" ? item.steps.ko : item.steps.en).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-5">
        <h2 className="text-base font-bold">{lang === "ko" ? "반품 · 보험 · 개인정보" : "Returns, insurance & privacy"}</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            {lang === "ko"
              ? "신선·냉장·냉동: 단순 변심 환불 불가. 일반상품: 미개봉 시 KR 7일 / EU 14일, 반송비 고객 부담."
              : "Fresh/chilled/frozen: not refundable for change of mind. General goods: unopened, 7 days (KR) / 14 days (EU); customer pays return shipping."}
          </li>
          <li>
            {lang === "ko"
              ? "매장은 EU 지침에 따라 생산물배상책임(PL) 보험 최저 €1M–€2M을 유지해야 합니다. 플랫폼이 고객에게 선지급한 뒤 매장 PL로 구상합니다."
              : "Merchants must hold PL insurance (EU minimum €1M–€2M). The platform pays the customer first, then claims recourse against merchant PL."}
          </li>
          <li>
            {lang === "ko"
              ? "클레임 설명·사진은 종결 후 24개월(식중독 진단서 36개월) 뒤 마스킹·삭제됩니다. 정산·세무 기록은 7년 보관합니다."
              : "Claim descriptions and photos are masked or deleted 24 months after close (36 months for medical certificates). Settlement/tax records are kept 7 years."}
          </li>
        </ul>
      </section>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold">{t("returnsCtaTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("returnsCtaDesc")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("customerCenter")} {CONTACT.email} · {helpText(CONTACT.hours, lang)}
          </p>
        </div>
        <Link
          href="/help/contact"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {t("returnsCtaButton")}
        </Link>
      </div>
    </div>
  )
}
