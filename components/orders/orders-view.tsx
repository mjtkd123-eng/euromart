"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, PackageCheck, ShieldAlert, Clock, CheckCircle2, XCircle, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatMoney, formatDateTime, formatDeadline } from "@/lib/format"
import {
  type OrderView,
  type ClaimView,
  STATUS_LABELS,
  STATUS_TONE,
  REASON_LABELS,
  RESOLUTION_LABELS,
} from "@/lib/claims-types"
import { ClaimSheet, type ClaimTarget } from "./claim-sheet"

function StatusBadge({ status }: { status: ClaimView["status"] }) {
  const Icon =
    status === "refunded"
      ? CheckCircle2
      : status === "rejected"
        ? XCircle
        : status === "mediation"
          ? ShieldAlert
          : Clock
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}

function ClaimTimeline({ claim }: { claim: ClaimView }) {
  const deadline = formatDeadline(claim.deadlineAt)
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={claim.status} />
        <span className="font-semibold tabular-nums">
          {formatMoney(claim.refundAmount, claim.currencyCode)}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {REASON_LABELS[claim.reason]}
        {claim.targetName ? ` · ${claim.targetName}` : " · 주문 전체 · Whole order"}
      </p>
      {claim.description && <p className="mt-1 text-xs text-foreground/80">&ldquo;{claim.description}&rdquo;</p>}

      {claim.evidence.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {claim.evidence.map((e) =>
            e.url ? (
              <a
                key={e.id}
                href={e.url}
                target="_blank"
                rel="noreferrer"
                className="relative size-14 overflow-hidden rounded-lg border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.url || "/placeholder.svg"} alt="증빙 사진" className="size-full object-cover" />
              </a>
            ) : null,
          )}
        </div>
      )}

      {claim.status === "pending_vendor" && (
        <p className={`mt-2 text-xs font-medium ${deadline.overdue ? "text-rose-600" : "text-amber-700 dark:text-amber-300"}`}>
          <Clock className="mr-1 inline size-3.5" aria-hidden="true" />
          판매자 응답 기한: {deadline.text}
        </p>
      )}
      {claim.status === "mediation" && claim.vendorResponse && (
        <p className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <span className="font-semibold">판매자 이의: </span>
          {claim.vendorResponse}
        </p>
      )}
      {(claim.status === "refunded" || claim.status === "rejected") && (
        <p className="mt-2 text-xs text-muted-foreground">
          {claim.resolutionType ? RESOLUTION_LABELS[claim.resolutionType] : ""}
          {claim.resolutionNote ? ` — ${claim.resolutionNote}` : ""}
          {claim.refundedAt ? ` · ${formatDateTime(claim.refundedAt)}` : ""}
        </p>
      )}
    </div>
  )
}

export function OrdersView({
  orders,
  claims,
  userId,
}: {
  orders: OrderView[]
  claims: ClaimView[]
  userId: string
}) {
  const [target, setTarget] = useState<ClaimTarget | null>(null)

  const claimsByOrder = useMemo(() => {
    const map = new Map<string, ClaimView[]>()
    for (const c of claims) {
      const list = map.get(c.orderId) ?? []
      list.push(c)
      map.set(c.orderId, list)
    }
    return map
  }, [claims])

  /** 특정 대상(주문 전체 or 아이템)에 진행 중 클레임이 있는지 */
  function hasActiveClaim(orderId: string, orderItemId: string | null) {
    const list = claimsByOrder.get(orderId) ?? []
    return list.some(
      (c) =>
        c.orderItemId === orderItemId &&
        (c.status === "pending_vendor" || c.status === "mediation"),
    )
  }

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/" aria-label="홈으로 · Home">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ScrollText className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold leading-tight">주문 내역 · My Orders</h1>
              <p className="text-xs text-muted-foreground">환불·교환 신고 및 처리 현황</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {orders.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <PackageCheck className="size-10 text-muted-foreground" />
            <p className="font-medium">주문 내역이 없습니다</p>
            <p className="text-sm text-muted-foreground">No orders yet. 상품을 담고 주문해 보세요.</p>
            <Button asChild className="mt-2">
              <Link href="/">쇼핑하러 가기 · Shop now</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderClaims = claimsByOrder.get(order.id) ?? []
              const delivered = order.status === "delivered"
              const wholeOrderClaimable = delivered && !hasActiveClaim(order.id, null)
              return (
                <Card key={order.id} className="overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {order.regionCity} · {formatDateTime(order.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">주문번호 {order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          delivered
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {delivered ? "배송 완료 · Delivered" : order.status}
                      </span>
                      <span className="text-sm font-bold tabular-nums">
                        {formatMoney(order.total, order.currencyCode)}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {order.items.map((item) => {
                      const itemActive = hasActiveClaim(order.id, item.id)
                      return (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.nameKo}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.nameEn} · {formatMoney(item.price, order.currencyCode)} × {item.quantity}
                            </p>
                          </div>
                          {delivered && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={itemActive}
                              onClick={() =>
                                setTarget({
                                  orderId: order.id,
                                  orderItemId: item.id,
                                  label: `${item.nameKo} · ${item.nameEn}`,
                                  amount: item.lineTotal,
                                  currencyCode: order.currencyCode,
                                })
                              }
                              className="shrink-0"
                            >
                              <ShieldAlert className="size-4" />
                              {itemActive ? "신고됨" : "환불 신고"}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {(wholeOrderClaimable || orderClaims.length > 0) && (
                    <div className="space-y-3 px-4 py-3">
                      {wholeOrderClaimable && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              주문 전체에 문제가 있나요? · Issue with the whole order?
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setTarget({
                                  orderId: order.id,
                                  orderItemId: null,
                                  label: "주문 전체 · Whole order",
                                  amount: order.total,
                                  currencyCode: order.currencyCode,
                                })
                              }
                            >
                              전체 신고
                            </Button>
                          </div>
                        </>
                      )}

                      {orderClaims.map((claim) => (
                        <ClaimTimeline key={claim.id} claim={claim} />
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <ClaimSheet target={target} userId={userId} onClose={() => setTarget(null)} />
    </div>
  )
}
