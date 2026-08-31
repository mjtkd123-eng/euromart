"use client"

import { ShoppingBag, MapPin, LifeBuoy } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { HELP_SECTIONS } from "@/lib/help-center"

export function EuromartFooter() {
  const { countries, countryCode, selectCountry, t } = useEuromart()

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-black tracking-tight">
            K<span className="text-primary">EuroMart</span>
          </span>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {t("countriesLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <button
                key={c.code}
                onClick={() => selectCountry(c.code)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  c.code === countryCode
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
            <LifeBuoy className="size-4 text-primary" aria-hidden="true" />
            {t("helpCenter")}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {HELP_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={s.href}
                  className="text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("footerTagline")} · k-euromart.com
        </p>
      </div>
    </footer>
  )
}
