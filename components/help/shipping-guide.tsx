import { Truck, Clock, BadgePercent, Store, Info, Snowflake } from "lucide-react"
import { SHIPPING_GUIDE, SHIPPING_NOTES } from "@/lib/help-center"

export function ShippingGuide() {
  return (
    <div className="flex flex-col gap-8">
      {/* 무료배송 하이라이트 */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <BadgePercent className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-foreground">무료배송 기준</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            일정 금액 이상 주문 시 배송비가 무료입니다. 기준 금액은 매장의 현지 통화 기준이며 국가·매장별로 다릅니다.
            예: 헝가리 <span className="font-semibold text-foreground">15,000 Ft</span> 이상 무료배송.
          </p>
        </div>
      </div>

      {/* 국가별 배송 카드 */}
      <div className="grid gap-4 md:grid-cols-2">
        {SHIPPING_GUIDE.map((c) => (
          <section key={c.code} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <header className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Truck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-bold">
                    {c.country}
                    <span className="ml-1.5 text-xs font-medium text-muted-foreground">{c.countryEn}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">{c.cities.join(" · ")}</p>
                </div>
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                {c.code}
              </span>
            </header>

            <dl className="flex flex-col divide-y divide-border text-sm">
              <Row icon={Store} label="배송 파트너" value={c.carriers} />
              <Row icon={Clock} label="도시 내 배달" value={c.localTime} />
              <Row icon={Truck} label="지역 외 배송" value={c.standardTime} />
              <Row icon={BadgePercent} label="무료배송" value={c.freeOver} highlight />
              <Row icon={Info} label="기본 배송비" value={c.baseFee} />
            </dl>
          </section>
        ))}
      </div>

      {/* 신선식품 배송 안내 */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-5">
        <Snowflake className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-foreground">신선·냉장·냉동식품 배송</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            콜드체인 유지를 위해 신선식품은 도시 내 당일 배달을 우선 제공합니다. 폭염 등 품질에 영향을 줄 수 있는
            상황에서는 배송 일정이 조정될 수 있습니다.
          </p>
        </div>
      </div>

      {/* 공통 유의사항 */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">배송 유의사항</h2>
        <ul className="flex flex-col gap-2">
          {SHIPPING_NOTES.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Truck
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </dt>
      <dd className={`text-right font-medium ${highlight ? "text-primary" : "text-foreground"}`}>{value}</dd>
    </div>
  )
}
