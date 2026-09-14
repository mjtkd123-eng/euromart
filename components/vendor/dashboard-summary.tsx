"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react"
import { quickUpdateStock } from "@/app/actions/vendor"
import type { VendorListing, VendorOrder, VendorStats, VendorStore } from "@/lib/vendor-server"
import { formatPrice } from "@/lib/storesData"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FormNotice } from "./form-notice"

const LOW_STOCK_THRESHOLD = 10

/** 최근 주문 상태 뱃지 색상 매핑 (Bolt 배달 흐름) */
const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "주문 접수", className: "bg-primary/15 text-primary" },
  packed: { label: "포장 완료", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  awaiting_courier: {
    label: "Bolt 배달 호출 대기",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  shipped: { label: "배달중", className: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  delivered: { label: "배달 완료", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  cancelled: { label: "취소", className: "bg-muted text-muted-foreground" },
  confirmed: { label: "확인", className: "bg-primary/15 text-primary" },
}

interface Props {
  store: VendorStore
  listings: VendorListing[]
  orders: VendorOrder[]
  stats: VendorStats
  /** 상품/주문 탭으로 이동하는 콜백 (탭 전환) */
  onNavigate?: (tab: string) => void
}

export function DashboardSummary({ store, listings, orders, stats, onNavigate }: Props) {
  const [error, setError] = useState<string | null>(null)

  const lowStockListings = useMemo(
    () =>
      listings
        .filter((l) => l.active && l.stock <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.stock - b.stock),
    [listings],
  )

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders])

  return (
    <div className="flex flex-col gap-5">
      {/* --- 오늘 요약 카드 --- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<ShoppingCart className="size-5" aria-hidden="true" />}
          label="오늘 주문"
          value={String(stats.todayOrderCount)}
          unit="건"
          tone="primary"
        />
        <SummaryCard
          icon={<Wallet className="size-5" aria-hidden="true" />}
          label="오늘 매출"
          value={formatPrice(stats.todayRevenue, store.currency)}
        />
        <SummaryCard
          icon={<Truck className="size-5" aria-hidden="true" />}
          label="처리 대기 주문"
          value={String(stats.openOrderCount)}
          unit="건"
          tone={stats.openOrderCount > 0 ? "alert" : "muted"}
        />
        <SummaryCard
          icon={<AlertTriangle className="size-5" aria-hidden="true" />}
          label="품절 임박"
          value={String(lowStockListings.length)}
          unit="개"
          tone={lowStockListings.length > 0 ? "alert" : "muted"}
        />
      </div>

      {error && <FormNotice>{error}</FormNotice>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* --- 품절 임박 상품 (재고 즉시 수정) --- */}
        <section className="flex flex-col rounded-2xl border border-border bg-card">
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-1.5 text-sm font-black text-foreground">
              <Package className="size-4 text-primary" aria-hidden="true" />
              품절 임박 상품
            </h2>
            <button
              type="button"
              onClick={() => onNavigate?.("listings")}
              className="flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
            >
              전체 재고 관리
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </header>

          {lowStockListings.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              품절 임박 상품이 없습니다. 재고 상태가 양호합니다.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStockListings.map((listing) => (
                <QuickStockRow
                  key={listing.id}
                  store={store}
                  listing={listing}
                  onError={setError}
                />
              ))}
            </ul>
          )}
        </section>

        {/* --- 최근 주문 상태 --- */}
        <section className="flex flex-col rounded-2xl border border-border bg-card">
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-1.5 text-sm font-black text-foreground">
              <Receipt className="size-4 text-primary" aria-hidden="true" />
              최근 주문
            </h2>
            <button
              type="button"
              onClick={() => onNavigate?.("orders")}
              className="flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
            >
              실시간 주문 접수
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </header>

          {recentOrders.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              아직 접수된 주문이 없습니다.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((order) => {
                const meta = STATUS_META[order.status] ?? {
                  label: order.status,
                  className: "bg-muted text-muted-foreground",
                }
                const time = new Date(order.createdAt).toLocaleString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                return (
                  <li key={order.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {order.customerName}
                        <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
                          #{order.id.slice(0, 6).toUpperCase()}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {time} · {order.items.length}개 품목
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
                      {formatPrice(order.total, store.currency)}
                    </span>
                    <Badge className={`shrink-0 border-0 text-[10px] ${meta.className}`}>{meta.label}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        스토어 바로가기{" "}
        <Link href="/" className="font-semibold text-primary hover:underline">
          K-EuroMart 홈
        </Link>
      </p>
    </div>
  )
}

/* ------------------------- 재고 즉시 수정 행 ------------------------- */

function QuickStockRow({
  store,
  listing,
  onError,
}: {
  store: VendorStore
  listing: VendorListing
  onError: (m: string | null) => void
}) {
  const [stock, setStock] = useState(listing.stock)
  const [draft, setDraft] = useState(listing.stock)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const dirty = draft !== stock
  const isOut = stock <= 0

  async function save() {
    if (!dirty || busy) return
    setBusy(true)
    onError(null)
    const result = await quickUpdateStock(store.id, listing.id, draft)
    setBusy(false)
    if (result.ok) {
      setStock(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } else {
      setDraft(stock)
      onError(result.error ?? "재고 수정에 실패했습니다.")
    }
  }

  return (
    <li
      className={`flex items-center gap-3 px-4 py-2.5 ${
        isOut ? "bg-destructive/5" : "bg-amber-500/5"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{listing.nameKo}</p>
        <p className="truncate text-xs text-muted-foreground">
          {formatPrice(listing.price, store.currency)} · {listing.unit || listing.brand}
        </p>
      </div>

      <Badge
        className={`shrink-0 border-0 text-[10px] ${
          isOut ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        }`}
      >
        {isOut ? "품절" : `재고 ${stock}`}
      </Badge>

      {/* 수량 즉시 수정 스텝퍼 */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setDraft((v) => Math.max(0, v - 1))}
          disabled={busy || draft <= 0}
          aria-label="재고 1 감소"
          className="flex size-7 items-center justify-center rounded-md border border-input text-foreground disabled:opacity-40"
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </button>
        <input
          type="number"
          min={0}
          value={draft}
          onChange={(e) => setDraft(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          aria-label={`${listing.nameKo} 재고 수량`}
          className="h-7 w-12 rounded-md border border-input bg-background text-center text-sm font-bold tabular-nums text-foreground"
        />
        <button
          type="button"
          onClick={() => setDraft((v) => v + 1)}
          disabled={busy}
          aria-label="재고 1 증가"
          className="flex size-7 items-center justify-center rounded-md border border-input text-foreground disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
        <Button
          size="sm"
          className="ml-1 h-7 rounded-md px-2 text-xs"
          disabled={!dirty || busy}
          onClick={save}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : saved ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            "저장"
          )}
        </Button>
      </div>
    </li>
  )
}

/* ---------------------------- 요약 카드 ---------------------------- */

function SummaryCard({
  icon,
  label,
  value,
  unit,
  tone = "default",
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  tone?: "default" | "primary" | "active" | "alert" | "muted"
}) {
  const iconTone =
    tone === "alert"
      ? "bg-destructive/10 text-destructive"
      : tone === "primary"
        ? "bg-primary/10 text-primary"
        : tone === "muted"
          ? "bg-muted text-muted-foreground"
          : "bg-primary/10 text-primary"

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-pretty text-lg font-black tabular-nums text-foreground">
          {value}
          {unit && <span className="ml-0.5 text-sm font-bold text-muted-foreground">{unit}</span>}
        </p>
      </div>
    </div>
  )
}
