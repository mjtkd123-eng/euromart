"use client"

import { useMemo } from "react"
import { Banknote, Info, Percent, TrendingUp, Wallet } from "lucide-react"
import type { VendorOrder, VendorStore } from "@/lib/vendor-server"
import { formatPrice } from "@/lib/storesData"

/** 플랫폼 중개 수수료율 (데모 기준 12%) */
const PLATFORM_FEE_RATE = 0.12

interface Props {
  store: VendorStore
  orders: VendorOrder[]
}

interface MonthlyRow {
  key: string
  label: string
  orderCount: number
  gross: number
  fee: number
  net: number
}

export function SettlementPanel({ store, orders }: Props) {
  const { totalGross, totalFee, totalNet, months, settledOrders } = useMemo(() => {
    // 정산 대상: 배달 완료된 주문만 (취소/진행중 제외)
    const settled = orders.filter((o) => o.status === "delivered")

    const gross = settled.reduce((s, o) => s + o.total, 0)
    const fee = Math.round(gross * PLATFORM_FEE_RATE)
    const net = gross - fee

    const byMonth = new Map<string, MonthlyRow>()
    for (const o of settled) {
      const d = new Date(o.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = d.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })
      const row = byMonth.get(key) ?? { key, label, orderCount: 0, gross: 0, fee: 0, net: 0 }
      row.orderCount += 1
      row.gross += o.total
      byMonth.set(key, row)
    }
    const monthRows = Array.from(byMonth.values())
      .map((r) => {
        const rFee = Math.round(r.gross * PLATFORM_FEE_RATE)
        return { ...r, fee: rFee, net: r.gross - rFee }
      })
      .sort((a, b) => b.key.localeCompare(a.key))

    return {
      totalGross: gross,
      totalFee: fee,
      totalNet: net,
      months: monthRows,
      settledOrders: settled.length,
    }
  }, [orders])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="flex items-center gap-1.5 text-sm font-black text-foreground">
          <Wallet className="size-4 text-primary" aria-hidden="true" />
          정산 관리
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          배달 완료된 주문을 기준으로 정산 예정 금액을 계산합니다. 플랫폼 수수료{" "}
          {Math.round(PLATFORM_FEE_RATE * 100)}%가 적용됩니다.
        </p>
      </div>

      {/* --- 정산 요약 카드 --- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SettleCard
          icon={<TrendingUp className="size-5" aria-hidden="true" />}
          label="총 매출 (정산 대상)"
          value={formatPrice(totalGross, store.currency)}
          hint={`배달 완료 ${settledOrders}건`}
        />
        <SettleCard
          icon={<Percent className="size-5" aria-hidden="true" />}
          label={`플랫폼 수수료 (${Math.round(PLATFORM_FEE_RATE * 100)}%)`}
          value={`- ${formatPrice(totalFee, store.currency)}`}
          tone="muted"
        />
        <SettleCard
          icon={<Banknote className="size-5" aria-hidden="true" />}
          label="정산 예정 금액"
          value={formatPrice(totalNet, store.currency)}
          tone="primary"
        />
      </div>

      {/* --- 월별 정산 내역 --- */}
      {months.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          아직 정산 대상 주문(배달 완료)이 없습니다.
        </p>
      ) : (
        <>
          {/* 데스크톱: 테이블 */}
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th scope="col" className="px-4 py-2.5 font-bold text-muted-foreground">
                    정산월
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-center font-bold text-muted-foreground">
                    주문
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold text-muted-foreground">
                    매출
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold text-muted-foreground">
                    수수료
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold text-muted-foreground">
                    정산액
                  </th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.key} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-bold text-foreground">{m.label}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {m.orderCount}건
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                      {formatPrice(m.gross, store.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                      - {formatPrice(m.fee, store.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-primary">
                      {formatPrice(m.net, store.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 카드 */}
          <ul className="flex flex-col gap-2 md:hidden">
            {months.map((m) => (
              <li key={m.key} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.orderCount}건</span>
                </div>
                <dl className="mt-2 flex flex-col gap-1 border-t border-border pt-2 text-xs">
                  <Row label="매출" value={formatPrice(m.gross, store.currency)} />
                  <Row label="수수료" value={`- ${formatPrice(m.fee, store.currency)}`} muted />
                  <div className="mt-0.5 flex items-center justify-between border-t border-border pt-1.5">
                    <dt className="font-bold text-foreground">정산액</dt>
                    <dd className="font-mono font-bold tabular-nums text-primary">
                      {formatPrice(m.net, store.currency)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          정산 금액은 배달 완료 주문 기준의 예상치이며, 실제 지급액은 환불·조정 반영 후 확정됩니다. 정산은 매월
          영업일 기준 익월 초에 등록된 계좌로 지급됩니다.
        </span>
      </p>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-mono tabular-nums ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  )
}

function SettleCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  tone?: "default" | "primary" | "muted"
}) {
  const iconTone =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "muted"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/10 text-primary"

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <span className={`flex size-10 items-center justify-center rounded-xl ${iconTone}`}>{icon}</span>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={`text-pretty text-xl font-black tabular-nums ${
            tone === "primary" ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
