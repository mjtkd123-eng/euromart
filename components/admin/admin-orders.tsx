"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { AdminOrder } from "@/lib/admin-server"

const STATUS_LABEL: Record<string, string> = {
  pending: "접수",
  confirmed: "확인",
  shipped: "배송중",
  delivered: "완료",
  cancelled: "취소",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  shipped: "default",
  delivered: "outline",
  cancelled: "destructive",
}

export function AdminOrders({ orders }: { orders: AdminOrder[] }) {
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("")

  const regionOptions = useMemo(
    () => Array.from(new Set(orders.map((o) => o.city))).sort(),
    [orders],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      if (region && o.city !== region) return false
      if (!q) return true
      return (
        o.customerName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.promoCode ?? "").toLowerCase().includes(q)
      )
    })
  }, [orders, query, region])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="주문번호 · 고객명 · 프로모션 코드 검색"
          className="h-9 max-w-xs"
          aria-label="주문 검색"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="지역 필터"
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
        >
          <option value="">전체 지역</option>
          {regionOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length}건</span>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          조건에 맞는 주문이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border bg-card p-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-mono text-xs font-semibold text-foreground">
                    {o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"} className="text-[10px]">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {o.city}
                  </Badge>
                  {o.promoCode && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {o.promoCode}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {o.customerName} ·{" "}
                  {new Date(o.createdAt).toLocaleString("ko-KR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <p className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
                {o.total.toLocaleString()} {o.currencyCode}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
