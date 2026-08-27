import "server-only"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { FX_BASE, type FxRateMap } from "@/lib/fx-shared"

export { FX_BASE, convert, formatConverted, type FxRateMap } from "@/lib/fx-shared"

/** 외부 API 실패 시 사용하는 시드 폴백값 (EUR 기준, 대략치). */
const SEED_RATES: Record<string, number> = {
  EUR: 1,
  CZK: 25,
  HUF: 395,
  PLN: 4.3,
  GBP: 0.85,
  SEK: 11.3,
  DKK: 7.46,
  RON: 4.97,
  CHF: 0.94,
  NOK: 11.7,
}

export interface FxRefreshResult {
  ok: boolean
  updated: number
  source: "ecb" | "seed"
  date: string | null
  error?: string
  skipped?: string[]
}

/** 스토어프론트/대시보드가 읽는 캐시된 환율 맵 (EUR → 통화코드). */
export async function getFxRateMap(): Promise<FxRateMap> {
  const supabase = await createClient()
  const { data } = await supabase.from("fx_rates").select("quote, rate").eq("base", FX_BASE)

  const map: FxRateMap = { [FX_BASE]: 1 }
  for (const row of data ?? []) map[row.quote] = Number(row.rate)
  return map
}

/**
 * ECB(European Central Bank) 피드에서 최신 환율을 가져와 fx_rates에 upsert합니다.
 * - 갱신 대상은 currencies 테이블에 등록된 통화로 제한합니다.
 * - 외부 호출이 실패하면 기존 캐시값을 유지하고, 비어 있는 통화만 시드값으로 채웁니다.
 */
export async function refreshFxRates(): Promise<FxRefreshResult> {
  const supabase = createServiceClient()

  const { data: currencyRows, error: currencyError } = await supabase.from("currencies").select("code")
  if (currencyError) {
    return { ok: false, updated: 0, source: "seed", date: null, error: currencyError.message }
  }

  const codes = (currencyRows ?? []).map((c) => c.code as string)
  const quotes = codes.filter((c) => c !== FX_BASE)

  if (quotes.length === 0) {
    // 기준 통화만 등록된 경우에도 base→base=1은 보장합니다.
    await supabase
      .from("fx_rates")
      .upsert(
        { base: FX_BASE, quote: FX_BASE, rate: 1, updated_at: new Date().toISOString() },
        { onConflict: "base,quote" },
      )
    return { ok: true, updated: 1, source: "ecb", date: null }
  }

  let fetched: Record<string, number> | null = null
  let date: string | null = null
  let fetchError: string | undefined

  try {
    const url = `https://api.frankfurter.dev/v1/latest?base=${FX_BASE}&symbols=${quotes.join(",")}`
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`환율 API가 ${res.status}를 반환했습니다.`)

    const json = (await res.json()) as { date?: string; rates?: Record<string, number> }
    if (!json.rates || Object.keys(json.rates).length === 0) {
      throw new Error("환율 API 응답에 rates가 없습니다.")
    }
    fetched = json.rates
    date = json.date ?? null
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "환율 API 호출에 실패했습니다."
  }

  const now = new Date().toISOString()
  const skipped: string[] = []

  // 기준 통화는 항상 1로 유지합니다.
  const rows: { base: string; quote: string; rate: number; updated_at: string }[] = [
    { base: FX_BASE, quote: FX_BASE, rate: 1, updated_at: now },
  ]

  if (fetched) {
    for (const quote of quotes) {
      const rate = fetched[quote]
      if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
        rows.push({ base: FX_BASE, quote, rate, updated_at: now })
      } else {
        // ECB가 지원하지 않는 통화는 기존 캐시값을 그대로 둡니다.
        skipped.push(quote)
      }
    }
  } else {
    // 외부 호출 실패: 캐시가 비어 있는 통화만 시드값으로 보강합니다.
    const { data: existing } = await supabase.from("fx_rates").select("quote").eq("base", FX_BASE)
    const have = new Set((existing ?? []).map((r) => r.quote as string))

    for (const quote of quotes) {
      if (have.has(quote)) {
        skipped.push(quote)
        continue
      }
      const seed = SEED_RATES[quote]
      if (seed) rows.push({ base: FX_BASE, quote, rate: seed, updated_at: now })
      else skipped.push(quote)
    }
  }

  const { error: upsertError } = await supabase
    .from("fx_rates")
    .upsert(rows, { onConflict: "base,quote" })

  if (upsertError) {
    return { ok: false, updated: 0, source: fetched ? "ecb" : "seed", date, error: upsertError.message }
  }

  return {
    ok: fetched !== null,
    updated: rows.length,
    source: fetched ? "ecb" : "seed",
    date,
    error: fetchError,
    skipped: skipped.length > 0 ? skipped : undefined,
  }
}
