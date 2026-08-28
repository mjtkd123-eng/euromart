"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ShieldCheck,
  Gavel,
  Loader2,
  Check,
  X,
  Store,
  User as UserIcon,
  Scale,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatMoney, formatDateTime } from "@/lib/format"
import {
  type ClaimView,
  type PenaltyType,
  STATUS_LABELS,
  STATUS_TONE,
  REASON_LABELS,
  RESOLUTION_LABELS,
  PENALTY_LABELS,
} from "@/lib/claims-types"
import { adminResolveClaim } from "@/app/actions/claims"

const PENALTY_OPTIONS: PenaltyType[] = ["none", "warning", "rank_down", "suspension"]

function Evidence({ claim }: { claim: ClaimView }) {
  if (claim.evidence.length === 0) {
    return <p className="mt-2 text-xs text-muted-foreground">첨부된 증빙 사진이 없습니다.</p>
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {claim.evidence.map((e) =>
        e.url ? (
          <a
            key={e.id}
            href={e.url}
            target="_blank"
            rel="noreferrer"
            className="relative size-20 overflow-hidden rounded-lg border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.url || "/placeholder.svg"} alt="증빙 사진" className="size-full object-cover" />
          </a>
        ) : null,
      )}
    </div>
  )
}

function MediationCard({ claim }: { claim: ClaimView }) {
  const router = useRouter()
  const [note, setNote] = useState("")
  const [penalty, setPenalty] = useState<PenaltyType>("warning")
  const [busy, setBusy] = useState<"refund" | "deny" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function resolve(decision: "refund" | "deny") {
    setBusy(decision)
    setError(null)
    const res = await adminResolveClaim({
      claimId: claim.id,
      decision,
      note,
      // 기각 시에는 판매자 페널티 없음
      penalty: decision === "deny" ? "none" : penalty,
    })
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
          <p className="text-sm font-semibold">{claim.targetName ?? "주문 전체 · Whole order"}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(claim.createdAt)}</p>
        </div>
        <span className="text-sm font-bold tabular-nums">
          {formatMoney(claim.refundAmount, claim.currencyCode)}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <UserIcon className="size-4" /> {claim.customerName ?? "고객"}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Store className="size-4" /> {claim.vendorLabel ?? claim.regionCity}
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-semibold text-muted-foreground">고객 신고 · {REASON_LABELS[claim.reason]}</p>
          {claim.description && <p className="mt-1 text-sm">{claim.description}</p>}
          <Evidence claim={claim} />
        </div>

        {claim.vendorResponse && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">판매자 이의 제기</p>
            <p className="mt-1 text-sm text-blue-900 dark:text-blue-100">{claim.vendorResponse}</p>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">중재 메모 (양측에 공개)</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="판단 근거를 기록하세요."
            rows={2}
            maxLength={1000}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">판매자 페널티 (환불 인용 시)</p>
          <div className="flex flex-wrap gap-2">
            {PENALTY_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPenalty(p)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  penalty === p
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
                aria-pressed={penalty === p}
              >
                {PENALTY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={() => resolve("refund")} disabled={busy !== null} className="flex-1">
            {busy === "refund" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            환불 인용
          </Button>
          <Button
            variant="outline"
            onClick={() => resolve("deny")}
            disabled={busy !== null}
            className="flex-1"
          >
            {busy === "deny" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            신고 기각
          </Button>
        </div>
      </div>
    </Card>
  )
}

function HistoryCard({ claim }: { claim: ClaimView }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{claim.targetName ?? "주문 전체"}</p>
          <p className="text-xs text-muted-foreground">
            {claim.customerName ?? "고객"} · {claim.vendorLabel ?? claim.regionCity} · {formatDateTime(claim.createdAt)}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[claim.status]}`}>
          {STATUS_LABELS[claim.status]}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {claim.resolutionType ? RESOLUTION_LABELS[claim.resolutionType] : REASON_LABELS[claim.reason]}
        </p>
        <span className="text-sm font-semibold tabular-nums">
          {formatMoney(claim.refundAmount, claim.currencyCode)}
        </span>
      </div>
      {claim.resolutionNote && (
        <p className="mt-1 text-xs text-muted-foreground">메모: {claim.resolutionNote}</p>
      )}
    </Card>
  )
}

export function AdminClaimsView({ claims }: { claims: ClaimView[] }) {
  const mediation = useMemo(() => claims.filter((c) => c.status === "mediation"), [claims])
  const pending = useMemo(() => claims.filter((c) => c.status === "pending_vendor"), [claims])
  const resolved = useMemo(
    () => claims.filter((c) => c.status === "refunded" || c.status === "rejected"),
    [claims],
  )

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/" aria-label="홈으로">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold leading-tight">중재 콘솔 · Admin</h1>
              <p className="text-xs text-muted-foreground">분쟁 중재 및 판매자 페널티 관리</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Scale className="size-4" /> 중재 대기
            </div>
            <p className="mt-1 text-2xl font-black tabular-nums">{mediation.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Gavel className="size-4" /> 판매자 대기
            </div>
            <p className="mt-1 text-2xl font-black tabular-nums">{pending.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="size-4" /> 처리 완료
            </div>
            <p className="mt-1 text-2xl font-black tabular-nums">{resolved.length}</p>
          </Card>
        </div>

        <Tabs defaultValue="mediation">
          <TabsList className="mb-4">
            <TabsTrigger value="mediation">중재 대기 ({mediation.length})</TabsTrigger>
            <TabsTrigger value="pending">판매자 대기 ({pending.length})</TabsTrigger>
            <TabsTrigger value="resolved">완료 ({resolved.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="mediation">
            {mediation.length === 0 ? (
              <Card className="flex flex-col items-center gap-2 p-10 text-center">
                <Scale className="size-8 text-muted-foreground" />
                <p className="font-medium">중재할 분쟁이 없습니다</p>
                <p className="text-sm text-muted-foreground">판매자가 이의 제기한 건이 여기에 표시됩니다.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {mediation.map((c) => (
                  <MediationCard key={c.id} claim={c} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">판매자 확인 대기 건이 없습니다.</Card>
            ) : (
              <div className="space-y-3">
                {pending.map((c) => (
                  <HistoryCard key={c.id} claim={c} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved">
            {resolved.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">처리 완료된 건이 없습니다.</Card>
            ) : (
              <div className="space-y-3">
                {resolved.map((c) => (
                  <HistoryCard key={c.id} claim={c} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
