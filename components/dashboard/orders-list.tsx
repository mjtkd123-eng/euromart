"use client"

import { useState, useTransition } from "react"
import { ChevronDown, AlertCircle } from "lucide-react"
import { updateOrderStatus } from "@/app/actions/vendor"
import type { VendorOrder } from "@/lib/vendor-server"
import { formatPrice, type Currency } from "@/lib/storesData"

const STATUS_LABELS: Record<string, string> = {
  paid: "결제완료",
  preparing: "준비중",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
}

const STATUS_TONE: Record<string, string> = {
  paid: "bg-secondary text-secondary-foreground",
  preparing: "bg-primary/15 text-primary",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

interface Props {
  orders: VendorOrder[]
  currency: Currency
  /** 상태 변경 허용 여부 (고객 화면에서는 false) */
  editable?: boolean
}

export function OrdersList({ orders, currency, editable = true }: Props) {
  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background px-4 py-12 text-center text-sm text-muted-foreground">
        아직 주문이 없습니다.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} currency={currency} editable={editable} />
      ))}
    </ul>
  )
}

function OrderRow({
  order,
  currency,
  editable,
}: {
  order: VendorOrder
  currency: Currency
  editable: boolean
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(order.status)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function change(next: string) {
    const previous = status
    setStatus(next)
    setError(null)
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, next)
      if (!result.ok) {
        setStatus(previous)
        setError(result.error ?? "변경 실패")
      }
    })
  }

  const created = new Date(order.createdAt).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <li className="rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-foreground">
                {order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="truncate text-sm font-semibold text-foreground">{order.customerName}</span>
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {created} · {order.items.length}개 품목
            </p>
          </div>
        </button>

        <span className="text-sm font-black tabular-nums text-foreground">
          {formatPrice(order.total, currency)}
        </span>

        {editable ? (
          <select
            value={status}
            onChange={(e) => change(e.target.value)}
            disabled={pending}
            aria-label={`주문 ${order.id.slice(0, 8)} 상태`}
            className="h-9 rounded-md border border-input bg-background px-2 text-xs font-semibold text-foreground"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_TONE[status] ?? "bg-muted text-muted-foreground"}`}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 px-4 pb-3 text-xs font-medium text-destructive" role="alert">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {open && (
        <div className="border-t border-border px-4 py-3">
          <ul className="flex flex-col gap-1.5">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  {item.nameKo} <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatPrice(item.price * item.quantity, currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">소계</dt>
              <dd className="tabular-nums text-foreground">{formatPrice(order.subtotal, currency)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  할인{order.promoCode ? ` (${order.promoCode})` : ""}
                </dt>
                <dd className="tabular-nums text-foreground">-{formatPrice(order.discount, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">배송비</dt>
              <dd className="tabular-nums text-foreground">{formatPrice(order.deliveryFee, currency)}</dd>
            </div>
          </dl>

          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            {order.address} · {order.phone}
          </p>
        </div>
      )}
    </li>
  )
}
