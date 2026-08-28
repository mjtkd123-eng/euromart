"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ShieldAlert,
  Check,
  Loader2,
  Wallet,
  TriangleAlert,
  Ban,
  Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatMoney, formatDateTime, formatDeadline } from "@/lib/format"
import {
  type ClaimView,
  STATUS_LABELS,
  STATUS_TONE,
  REASON_LABELS,
  RESOLUTION_LABELS,
} from "@/lib/claims-types"
import { vendorApproveClaim, vendorDisputeClaim } from "@/app/actions/claims"

interface LedgerRow {
  id: string
  entryType: string
  amount: number
  currencyCode: string
  note: string | null
  createdAt: string
}

function Evidence({ claim }: { claim: ClaimView }) {
  if (claim.evidence.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {claim.evidence.map((e) =>
        e.url ? (
          <a
            key={e.id}
            href={e.url}
            target="_blank"
            rel="noreferrer"
            className="relative size-16 overflow-hidden rounded-lg border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.url || "/placeholder.svg"} alt="증빙 사진" className="size-full object-cover" />
          </a>
        ) : null,
      )}
    </div>
  )
}

function PendingCard({ claim }: { claim: ClaimView }) {
  const router = useRouter()
  const [mode, setMode] = useState<"idle" | "dispute">("idle")
  const [response, setResponse] = useState("")
  const [busy, setBusy] = useState<"approve" | "dispute" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const deadline = formatDeadline(claim.deadlineAt)

  async function approve() {
    setBusy("approve")
    setError(null)
    const res = await vendorApproveClaim(claim.id)
    if (!res.ok) {
      setError(res.error ?? "처리 실패")
      setBusy(null)
      return
    }
    router.refresh()
  }

  async function dispute() {
    if (!response.trim()) {
      setError("이의 제기 사유를 입력해 주세요.")
      return
    }
    setBusy("dispute")
    setError(null)
    const res = await vendorDisputeClaim(claim.id, response)
    if (!res.ok) {
      setError(res.error ?? "처리 실패")
      setBusy(null)
      return
    }
    router.refresh()
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">
            {claim.targetName ?? "주문 전체 · Whole order"}
          </p>
          <p className="text-xs text-muted-foreground">
            {claim.regionCity} · {claim.customerName ?? "고객"} · {formatDateTime(claim.createdAt)}
          </p>
        </div>
        <span className="text-sm font-bold tabular-nums">
          {formatMoney(claim.refundAmount, claim.currencyCode)}
        </span>
      </div>

      <div className="p-4">
        <p className="text-sm font-medium">{REASON_LABELS[claim.reason]}</p>
        {claim.description && (
          <p className="mt-1 rounded-lg bg-muted/50 p-2.5 text-sm text-foreground/80">{claim.description}</p>
        )}
        <Evidence claim={claim} />

        <p
          className={`mt-3 text-xs font-medium ${
            deadline.overdue ? "text-rose-600" : "text-amber-700 dark:text-amber-300"
          }`}
        >
          응답 기한: {deadline.text} · 무응답 시 자동 환불 + 페널티
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
            {error}
          </p>
        )}

        {mode === "idle" ? (
          <div className="mt-4 flex gap-2">
            <Button onClick={approve} disabled={busy !== null} className="flex-1">
              {busy === "approve" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              환불 승인
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode("dispute")}
              disabled={busy !== null}
              className="flex-1"
            >
              <ShieldAlert className="size-4" />
              이의 제기
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="이의 제기 사유를 구체적으로 작성해 주세요. 관리자 중재에 전달됩니다."
              rows={3}
              maxLength={1000}
            />
            <div className="flex gap-2">
              <Button onClick={dispute} disabled={busy !== null} className="flex-1">
                {busy === "dispute" ? <Loader2 className="size-4 animate-spin" /> : <ShieldAlert className="size-4" />}
                중재 요청 제출
              </Button>
              <Button variant="ghost" onClick={() => setMode("idle")} disabled={busy !== null}>
                취소
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function HistoryCard({ claim }: { claim: ClaimView }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{claim.targetName ?? "주문 전체 · Whole order"}</p>
          <p className="text-xs text-muted-foreground">
            {claim.regionCity} · {claim.customerName ?? "고객"} · {formatDateTime(claim.createdAt)}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[claim.status]}`}>
          {STATUS_LABELS[claim.status]}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {REASON_LABELS[claim.reason]}
          {claim.resolutionType ? ` · ${RESOLUTION_LABELS[claim.resolutionType]}` : ""}
        </p>
        <span className="text-sm font-semibold tabular-nums">
          {formatMoney(claim.refundAmount, claim.currencyCode)}
        </span>
      </div>
      {claim.vendorResponse && (
        <p className="mt-2 text-xs text-muted-foreground">이의: {claim.vendorResponse}</p>
      )}
      {claim.resolutionNote && (
        <p className="mt-1 text-xs text-muted-foreground">관리자 메모: {claim.resolutionNote}</p>
      )}
    </Card>
  )
}

export function VendorClaimsView({
  claims,
  ledger,
  penaltyPoints,
  suspended,
}: {
  claims: ClaimView[]
  ledger: LedgerRow[]
  penaltyPoints: number
  suspended: boolean
}) {
  const pending = useMemo(() => claims.filter((c) => c.status === "pending_vendor"), [claims])
  const history = useMemo(
    () => claims.filter((c) => c.status !== "pending_vendor"),
    [claims],
  )

  // 통화별 환불 차감 합계
  const deductionByCurrency = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of ledger) {
      if (l.entryType === "refund_deduction") {
        map.set(l.currencyCode, (map.get(l.currencyCode) ?? 0) + Math.abs(l.amount))
      }
    }
    return [...map.entries()]
  }, [ledger])

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="판매자 대시보드"
            render={<Link href="/vendor" />}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold leading-tight">환불·분쟁 관리 · Claims</h1>
              <p className="text-xs text-muted-foreground">고객 환불 신고 확인 및 정산 현황</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {suspended && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
            <Ban className="size-5 shrink-0" />
            <p className="text-sm font-medium">
              누적 페널티로 판매가 정지되었습니다. 검색 노출이 제한됩니다. 관리자에게 문의하세요.
            </p>
          </div>
        )}

        {/* 요약 카드 */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Inbox className="size-4" /> 대기
            </div>
            <p className="mt-1 text-2xl font-black tabular-nums">{pending.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-4" /> 환불 차감
            </div>
            <p className="mt-1 text-sm font-bold leading-tight">
              {deductionByCurrency.length === 0 ? (
                <span className="text-2xl">0</span>
              ) : (
                deductionByCurrency.map(([code, amt]) => (
                  <span key={code} className="block tabular-nums">
                    -{formatMoney(amt, code)}
                  </span>
                ))
              )}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TriangleAlert className="size-4" /> 페널티
            </div>
            <p className={`mt-1 text-2xl font-black tabular-nums ${penaltyPoints > 0 ? "text-rose-600" : ""}`}>
              {penaltyPoints}
            </p>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">확인 대기 ({pending.length})</TabsTrigger>
            <TabsTrigger value="history">처리 내역 ({history.length})</TabsTrigger>
            <TabsTrigger value="ledger">정산 원장</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <Card className="flex flex-col items-center gap-2 p-10 text-center">
                <Check className="size-8 text-emerald-500" />
                <p className="font-medium">확인 대기 중인 신고가 없습니다</p>
                <p className="text-sm text-muted-foreground">All caught up.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pending.map((c) => (
                  <PendingCard key={c.id} claim={c} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {history.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">처리 내역이 없습니다.</Card>
            ) : (
              <div className="space-y-3">
                {history.map((c) => (
                  <HistoryCard key={c.id} claim={c} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ledger">
            {ledger.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">정산 내역이 없습니다.</Card>
            ) : (
              <Card className="divide-y divide-border">
                {ledger.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {l.entryType === "refund_deduction"
                          ? "환불 차감"
                          : l.entryType === "escrow_hold"
                            ? "에스크로 보관"
                            : "페널티"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {l.note} · {formatDateTime(l.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        l.amount < 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {l.amount < 0 ? "-" : "+"}
                      {formatMoney(Math.abs(l.amount), l.currencyCode)}
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
