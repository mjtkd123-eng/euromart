"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, ChevronDown, Check } from "lucide-react"
import { regions } from "@/lib/storesData"
import { useEuromart } from "@/lib/euromart-context"

export function RegionSwitcher() {
  const { region, regionId, setRegionId } = useEuromart()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="매장 지역 선택 / Select store location"
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
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl"
        >
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            매장 선택 · Choose your store
          </p>
          {regions.map((r) => {
            const selected = r.id === regionId
            return (
              <button
                key={r.id}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setRegionId(r.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted ${
                  selected ? "bg-muted" : ""
                }`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                  {r.countryCode}
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">{r.store.ko}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {r.city}, {r.country} · {r.currency.code}
                  </span>
                </span>
                {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
