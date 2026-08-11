import { createClient } from "@/lib/supabase/server"
import { resolveRate, type FxRateRow } from "@/lib/fx"
import { jsonError, jsonOk } from "@/lib/api"

export const dynamic = "force-dynamic"

/**
 * GET /api/fx?from=HUF&to=EUR
 * Public display rate from cached exchange_rates.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = (searchParams.get("from") ?? "").toUpperCase()
  const to = (searchParams.get("to") ?? "EUR").toUpperCase()

  if (!from || from.length !== 3 || to.length !== 3) {
    return jsonError("Query params from & to must be ISO currency codes")
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("base_currency, target_currency, rate, fetched_at, source")

    if (error) {
      return jsonError(error.message, 500)
    }

    const rows: FxRateRow[] = (data ?? []).map((r) => ({
      baseCurrency: r.base_currency,
      targetCurrency: r.target_currency,
      rate: Number(r.rate),
      fetchedAt: r.fetched_at,
      source: r.source ?? undefined,
    }))

    const resolved = resolveRate(from, to, rows)
    return jsonOk({
      from,
      to,
      rate: resolved.rate,
      fetchedAt: resolved.fetchedAt,
      source: resolved.source,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "FX lookup failed"
    return jsonError(message, 503)
  }
}
