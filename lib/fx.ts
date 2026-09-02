import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createServiceClient } from "@/lib/supabase/service"
import { DEMO_FX_RATES } from "@/lib/demo-regions"
import { FX_BASE, type FxRateMap } from "@/lib/fx-shared"

export { FX_BASE, convert, formatConverted, type FxRateMap } from "@/lib/fx-shared"

/* ============================================================================
 * 1) 체크아웃 견적 / 결제 통화 계산 (main: exchange_rates 기반)
 *    - Stripe 결제 금액 스냅샷, 다통화 견적에 사용됩니다.
 * ==========================================================================*/

export type CurrencyCode = string // ISO 4217, e.g. HUF | EUR | CZK

export type FxRateRow = {
  baseCurrency: CurrencyCode
  targetCurrency: CurrencyCode
  rate: number
  fetchedAt: string // ISO
  source?: string
}

export type MoneyLine = {
  productId: string
  name: string
  quantity: number
  unitPriceStore: number
}

export type CheckoutQuoteInput = {
  storeCurrency: CurrencyCode
  chargeCurrency: CurrencyCode
  deliveryFeeStore: number
  lines: MoneyLine[]
  rate: FxRateRow
  chargeDecimals?: number
}

export type CheckoutQuote = {
  storeCurrency: CurrencyCode
  chargeCurrency: CurrencyCode
  fxRate: number
  fxFetchedAt: string
  subtotalStore: number
  deliveryFeeStore: number
  totalStore: number
  totalCharge: number
  lines: Array<
    MoneyLine & {
      unitPriceCharge: number
      lineTotalStore: number
      lineTotalCharge: number
    }
  >
  expiresAt: string
}

const QUOTE_TTL_MS = 15 * 60 * 1000
/** Reject checkout if cached FX is older than this (stale protection). */
export const FX_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function moneyRound(amount: number, decimals = 2): number {
  const f = 10 ** decimals
  return Math.round((amount + Number.EPSILON) * f) / f
}

/** Convert amount in `from` to `to` using EUR-pivoted or direct rate map. */
export function resolveRate(from: CurrencyCode, to: CurrencyCode, rows: FxRateRow[]): FxRateRow {
  if (from === to) {
    return {
      baseCurrency: from,
      targetCurrency: to,
      rate: 1,
      fetchedAt: new Date().toISOString(),
      source: "identity",
    }
  }

  const direct = rows.find((r) => r.baseCurrency === from && r.targetCurrency === to)
  if (direct) return direct

  const inverse = rows.find((r) => r.baseCurrency === to && r.targetCurrency === from)
  if (inverse) {
    return {
      baseCurrency: from,
      targetCurrency: to,
      rate: moneyRound(1 / inverse.rate, 8),
      fetchedAt: inverse.fetchedAt,
      source: inverse.source ? `${inverse.source}:inverse` : "inverse",
    }
  }

  const fromEur = rows.find((r) => r.baseCurrency === "EUR" && r.targetCurrency === from)
  const toEur = rows.find((r) => r.baseCurrency === "EUR" && r.targetCurrency === to)
  if (fromEur && toEur) {
    return {
      baseCurrency: from,
      targetCurrency: to,
      rate: moneyRound(toEur.rate / fromEur.rate, 8),
      fetchedAt: fromEur.fetchedAt < toEur.fetchedAt ? fromEur.fetchedAt : toEur.fetchedAt,
      source: "eur-pivot",
    }
  }

  throw new Error(`FX rate not available for ${from} → ${to}`)
}

export function assertFxFresh(fetchedAt: string, now = Date.now()): void {
  const age = now - new Date(fetchedAt).getTime()
  if (Number.isNaN(age) || age > FX_MAX_AGE_MS) {
    throw new Error("Exchange rate is stale; refresh FX before checkout")
  }
}

/**
 * Build a payable quote. All store amounts stay in store currency;
 * charge totals use snapshotted fxRate.
 */
export function buildCheckoutQuote(input: CheckoutQuoteInput): CheckoutQuote {
  const decimals = input.chargeDecimals ?? 2
  assertFxFresh(input.rate.fetchedAt)

  const lines = input.lines.map((line) => {
    const lineTotalStore = moneyRound(line.unitPriceStore * line.quantity, 4)
    const unitPriceCharge = moneyRound(line.unitPriceStore * input.rate.rate, decimals)
    const lineTotalCharge = moneyRound(unitPriceCharge * line.quantity, decimals)
    return {
      ...line,
      unitPriceCharge,
      lineTotalStore,
      lineTotalCharge,
    }
  })

  const subtotalStore = moneyRound(
    lines.reduce((s, l) => s + l.lineTotalStore, 0),
    4,
  )
  const deliveryFeeStore = moneyRound(input.deliveryFeeStore, 4)
  const totalStore = moneyRound(subtotalStore + deliveryFeeStore, 4)
  const totalCharge = moneyRound(totalStore * input.rate.rate, decimals)

  return {
    storeCurrency: input.storeCurrency,
    chargeCurrency: input.chargeCurrency,
    fxRate: input.rate.rate,
    fxFetchedAt: input.rate.fetchedAt,
    subtotalStore,
    deliveryFeeStore,
    totalStore,
    totalCharge,
    lines,
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
  }
}

/** Stripe expects the smallest currency unit (e.g. cents; HUF is zero-decimal). */
export function toStripeAmount(amount: number, currency: CurrencyCode): number {
  const zeroDecimal = new Set(["HUF", "JPY", "KRW", "VND", "CLP", "ISK"])
  if (zeroDecimal.has(currency.toUpperCase())) {
    return Math.round(amount)
  }
  return Math.round(amount * 100)
}

/** Display helper: local + converted. */
export function formatDualPrice(opts: {
  amountStore: number
  storeCurrency: CurrencyCode
  amountCharge: number
  chargeCurrency: CurrencyCode
  storeLocale?: string
  chargeLocale?: string
}): string {
  const a = new Intl.NumberFormat(opts.storeLocale ?? undefined, {
    style: "currency",
    currency: opts.storeCurrency,
  }).format(opts.amountStore)
  const b = new Intl.NumberFormat(opts.chargeLocale ?? undefined, {
    style: "currency",
    currency: opts.chargeCurrency,
  }).format(opts.amountCharge)
  return `${a} ≈ ${b}`
}

/* ============================================================================
 * 2) 스토어프론트/대시보드 표시용 환율 캐시 (HEAD: fx_rates 기반)
 *    - ECB 피드에서 EUR 기준 환율을 가져와 fx_rates에 저장하고,
 *      페이지가 EUR 기준 맵으로 읽습니다.
 * ==========================================================================*/

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
  if (!isSupabaseConfigured()) return { ...DEMO_FX_RATES }

  try {
    const supabase = await createClient()
    const { data } = await supabase.from("fx_rates").select("quote, rate").eq("base", FX_BASE)

    const map: FxRateMap = { [FX_BASE]: 1 }
    for (const row of data ?? []) map[row.quote] = Number(row.rate)
    return Object.keys(map).length > 1 ? map : { ...DEMO_FX_RATES }
  } catch {
    return { ...DEMO_FX_RATES }
  }
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

  const { error: upsertError } = await supabase.from("fx_rates").upsert(rows, { onConflict: "base,quote" })

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
