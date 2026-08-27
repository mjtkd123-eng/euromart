"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapPin, ChevronDown, ChevronRight, ChevronLeft, Check } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import type { Region } from "@/lib/storesData"

interface CountryGroup {
  country: string
  countryCode: string
  stores: Region[]
}

/**
 * NaviBar 매장 찾기 — 국가를 먼저 선택하고, 그 국가에 있는
 * 한국 식료품점 목록에서 매장을 고릅니다.
 */
export function StoreLocator() {
  const { regions, region, regionId, setRegionId, t, storeName } = useEuromart()
  const [open, setOpen] = useState(false)
  // null이면 국가 목록을, 값이 있으면 해당 국가의 매장 목록을 보여줍니다.
  const [country, setCountry] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  // 국가별로 매장을 묶습니다.
  const groups = useMemo<CountryGroup[]>(() => {
    const byCountry = new Map<string, CountryGroup>()
    for (const r of regions) {
      const existing = byCountry.get(r.country)
      if (existing) {
        existing.stores.push(r)
      } else {
        byCountry.set(r.country, {
          country: r.country,
          countryCode: r.countryCode,
          stores: [r],
        })
      }
    }
    return Array.from(byCountry.values()).sort((a, b) => a.country.localeCompare(b.country))
  }, [regions])

  const activeGroup = country ? groups.find((g) => g.country === country) : null

  function openPanel() {
    setOpen((v) => {
      // 열 때마다 현재 매장의 국가에서 시작하도록 초기화합니다.
      if (!v) setCountry(null)
      return !v
    })
  }

  function chooseStore(id: string) {
    setRegionId(id)
    setOpen(false)
    setCountry(null)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openPanel}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("selectStore")}
      >
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-bold text-foreground">{region.city}</span>
          <span className="truncate text-[11px] text-muted-foreground">{region.country}</span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
          {!activeGroup ? (
            <>
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("selectCountry")}
              </p>
              <ul role="list">
                {groups.map((g) => {
                  const isCurrent = g.country === region.country
                  return (
                    <li key={g.country}>
                      <button
                        onClick={() => setCountry(g.country)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted ${
                          isCurrent ? "bg-muted" : ""
                        }`}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                          {g.countryCode}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col leading-tight">
                          <span className="truncate text-sm font-semibold text-foreground">{g.country}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {g.stores.length === 1
                              ? t("storeCountOne")
                              : t("storeCount", { count: g.stores.length })}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <>
              <button
                onClick={() => setCountry(null)}
                className="flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
                {t("backToCountries")}
              </button>
              <p className="break-keep px-3 pb-1 pt-1.5 text-sm font-bold text-foreground">
                {t("koreanStoresIn", { country: activeGroup.country })}
              </p>
              <ul role="list">
                {activeGroup.stores.map((r) => {
                  const selected = r.id === regionId
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => chooseStore(r.id)}
                        aria-current={selected ? "true" : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted ${
                          selected ? "bg-muted" : ""
                        }`}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                          {r.countryCode}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col leading-tight">
                          <span className="truncate text-sm font-semibold text-foreground">{storeName(r)}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {r.city} · {r.currency.code}
                          </span>
                        </span>
                        {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
