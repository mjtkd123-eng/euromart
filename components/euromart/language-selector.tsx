"use client"

import { useEffect, useRef, useState } from "react"
import { Globe, Check } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import type { Locale } from "@/lib/i18n"

/**
 * 언어 선택기 — 영어 / 한국어 / 현지 언어.
 * "현지 언어"는 현재 선택된 매장이 위치한 국가의 언어로 자동 결정됩니다.
 */
export function LanguageSelector() {
  const { locale, setLocale, localLangLabel, t } = useEuromart()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const options: { value: Locale; label: string; hint?: string }[] = [
    { value: "en", label: "English" },
    { value: "ko", label: "한국어" },
    // 현지 언어 매핑이 없는 국가에서는 이 항목을 숨깁니다.
    ...(localLangLabel
      ? [{ value: "local" as Locale, label: localLangLabel, hint: t("localLanguage") }]
      : []),
  ]

  const current = options.find((o) => o.value === locale) ?? options[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-2 transition-colors hover:bg-muted"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("selectLanguage")}
      >
        <Globe className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="hidden text-sm font-semibold text-foreground sm:inline">{current.label}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("language")}
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl"
        >
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("language")}
          </p>
          {options.map((option) => {
            const selected = option.value === locale
            return (
              <button
                key={option.value}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setLocale(option.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted ${
                  selected ? "bg-muted" : ""
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">{option.label}</span>
                  {option.hint && (
                    <span className="truncate text-[11px] text-muted-foreground">{option.hint}</span>
                  )}
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
