"use client"

import { Truck, Clock, BadgePercent, Store, Info, Snowflake } from "lucide-react"
import { SHIPPING_GUIDE, SHIPPING_NOTES, helpText } from "@/lib/help-center"
import { useEuromart } from "@/lib/euromart-context"

export function ShippingGuide() {
  const { lang, t } = useEuromart()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <BadgePercent className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-foreground">{t("shippingFreeTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("shippingFreeBody")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SHIPPING_GUIDE.map((c) => (
          <section key={c.code} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <header className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Truck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-bold">{lang === "ko" ? c.country : c.countryEn}</h2>
                  <p className="text-xs text-muted-foreground">
                    {(lang === "ko" ? c.cities : c.citiesEn).join(" · ")}
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                {c.code}
              </span>
            </header>

            <dl className="flex flex-col divide-y divide-border text-sm">
              <Row icon={Store} label={t("shippingPartner")} value={helpText(c.carriers, lang)} />
              <Row icon={Clock} label={t("shippingLocalDelivery")} value={helpText(c.localTime, lang)} />
              <Row icon={Truck} label={t("shippingRegional")} value={helpText(c.standardTime, lang)} />
              <Row icon={BadgePercent} label={t("shippingFree")} value={c.freeOver} highlight />
              <Row icon={Info} label={t("shippingBaseFee")} value={c.baseFee} />
            </dl>
          </section>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-5">
        <Snowflake className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-foreground">{t("shippingFreshTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("shippingFreshBody")}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">{t("shippingNotesTitle")}</h2>
        <ul className="flex flex-col gap-2">
          {SHIPPING_NOTES.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              {helpText(note, lang)}
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
