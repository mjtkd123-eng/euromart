"use client"

import { useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import { updateOrderStatus } from "@/app/actions/vendor"
import type { VendorOrder, VendorStore } from "@/lib/vendor-server"
import { formatPrice } from "@/lib/storesData"
import { Badge } from "@/components/ui/badge"
import { FormNotice } from "./form-notice"

/** 판매자가 선택할 수 있는 주문 처리 흐름 (Bolt 배달 연동 기준) */
const STATUS_FLOW = ["pending", "packed", "awaiting_courier", "shipped", "delivered", "cancelled"] as const

const STATUS_LABELS: Record<string, string> = {
  pending: "주문 접수",
  packed: "포장 완료",
  awaiting_courier: "Bolt 배달 호출 대기",
  shipped: "배달중",
  delivered: "배달 완료",
  cancelled: "취소",
  // 하위 호환
  confirmed: "확인",
}

interface Props {
  store: VendorStore
  orders: VendorOrder[]
  /** 판매자는 상태를 변경할 수 있고, 읽기 전용 뷰에서는 숨깁니다. */
  editable?: boolean
}

export function OrdersTable({ store, orders, editable = true }: Props) {
  const [error, setError] = useState<string | null>(null)

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        아직 접수된 주문이 없습니다.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-black text-foreground">주문 {orders.length}건</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">최근 50건을 최신순으로 표시합니다.</p>
      </div>

      {error && <FormNotice>{error}</FormNotice>}

      <ul className="flex flex-col gap-2">
        {orders.map((order) => (
          <OrderRow key={order.id} store={store} order={order} editable={editable} onError={setError} />
        ))}
      </ul>
    </div>
  )
}

function OrderRow({
  store,
  order,
  editable,
  onError,
}: {
  store: VendorStore
  order: VendorOrder
  editable: boolean
  onError: (m: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(order.status)
  const [busy, setBusy] = useState(false)

  async function change(next: string) {
    const prev = status
    setStatus(next)
    setBusy(true)
    onError(null)
    const result = await updateOrderStatus(store.id, order.id, next)
    setBusy(false)
    if (!result.ok) {
      setStatus(prev)
      onError(result.error ?? "상태 변경에 실패했습니다.")
    }
  }

  const date = new Date(order.createdAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <li className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {order.customerName}
              <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {date} · {order.items.length}개 품목
            </p>
          </div>
        </button>

        <span className="font-mono text-sm font-bold tabular-nums text-foreground">
          {formatPrice(order.total, store.currency)}
        </span>

        {editable ? (
          <div className="flex items-center gap-1.5">
            {busy && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />}
            <select
              value={status}
              onChange={(e) => change(e.target.value)}
              disabled={busy}
              aria-label={`${order.customerName} 주문 상태`}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold text-foreground"
            >
              {STATUS_FLOW.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
              {/* 기존 데이터의 상태값이 흐름에 없으면 현재 값을 옵션으로 유지 */}
              {!STATUS_FLOW.includes(status as (typeof STATUS_FLOW)[number]) && (
                <option value={status}>{STATUS_LABELS[status] ?? status}</option>
              )}
            </select>
          </div>
        ) : (
          <Badge variant={status === "cancelled" ? "secondary" : "default"} className="text-[10px]">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )}
      </div>

      {open && (
        <div className="border-t border-border px-3 py-3">
          <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">주소</dt>
              <dd className="text-foreground">{order.address}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">연락처</dt>
              <dd className="font-mono text-foreground">{order.phone}</dd>
            </div>
          </dl>

          <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
            {order.items.map((item, i) => (
              <li key={`${order.id}-${i}`} className="flex items-center justify-between text-xs">
                <span className="text-foreground">
                  {item.nameKo} <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatPrice(item.price * item.quantity, store.currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-xs">
            <Line label="상품 합계" value={formatPrice(order.subtotal, store.currency)} />
            <Line label="배송비" value={formatPrice(order.deliveryFee, store.currency)} />
            {order.discount > 0 && (
              <Line
                label={`할인${order.promoCode ? ` (${order.promoCode})` : ""}`}
                value={`- ${formatPrice(order.discount, store.currency)}`}
              />
            )}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-1.5">
              <dt className="text-sm font-bold text-foreground">합계</dt>
              <dd className="font-mono text-sm font-bold tabular-nums text-foreground">
                {formatPrice(order.total, store.currency)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </li>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums text-foreground">{value}</dd>
    </div>
  )
}
