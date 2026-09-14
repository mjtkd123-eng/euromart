import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import {
  buildCheckoutQuote,
  resolveRate,
  type FxRateRow,
  type MoneyLine,
} from "@/lib/fx"
import { jsonError, jsonOk } from "@/lib/api"

export const dynamic = "force-dynamic"

type QuoteBody = {
  storeId: string
  chargeCurrency?: string
  items: { productId: string; quantity: number }[]
}

type ProductRow = {
  id: string
  name: string
  price: number
  sale_price: number | null
  stock: number
  active: boolean
  store_id: string
}

/**
 * POST /api/checkout/quote
 * Body: { storeId, chargeCurrency?, items: [{ productId, quantity }] }
 * Locks FX + line prices for 15 minutes in checkout_quotes.
 */
export async function POST(request: Request) {
  let body: QuoteBody
  try {
    body = (await request.json()) as QuoteBody
  } catch {
    return jsonError("Invalid JSON body")
  }

  const storeId = body.storeId?.trim()
  const chargeCurrency = (
    body.chargeCurrency ??
    process.env.NEXT_PUBLIC_DEFAULT_CHARGE_CURRENCY ??
    "EUR"
  ).toUpperCase()

  if (!storeId) return jsonError("storeId is required")
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonError("items are required")
  }

  const merged = new Map<string, number>()
  for (const line of body.items) {
    if (!line.productId) continue
    const q = Math.floor(Number(line.quantity))
    if (!Number.isFinite(q) || q <= 0) return jsonError("Invalid quantity")
    if (q > 99) return jsonError("Max 99 per product")
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + q)
  }
  const productIds = [...merged.keys()]
  if (!productIds.length) return jsonError("No valid items")

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("id, currency_code, delivery_fee, min_order, status")
      .eq("id", storeId)
      .maybeSingle()

    if (storeErr) return jsonError(storeErr.message, 500)
    if (!store || store.status !== "active") {
      return jsonError("Store not found or inactive", 404)
    }

    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, sale_price, stock, active, store_id")
      .eq("store_id", storeId)
      .in("id", productIds)

    if (prodErr) return jsonError(prodErr.message, 500)

    const byId = new Map((products as ProductRow[] | null)?.map((p) => [p.id, p]) ?? [])
    const moneyLines: MoneyLine[] = []

    for (const [productId, quantity] of merged) {
      const p = byId.get(productId)
      if (!p || !p.active) return jsonError(`Product unavailable: ${productId}`, 409)
      if (p.stock < quantity) {
        return jsonError(`Insufficient stock for ${p.name}`, 409)
      }

      const unit = Number(p.sale_price ?? p.price)
      moneyLines.push({
        productId: p.id,
        name: p.name,
        quantity,
        unitPriceStore: unit,
      })
    }

    const { data: rates, error: rateErr } = await supabase
      .from("exchange_rates")
      .select("base_currency, target_currency, rate, fetched_at, source")

    if (rateErr) return jsonError(rateErr.message, 500)

    const fxRows: FxRateRow[] = (rates ?? []).map((r) => ({
      baseCurrency: r.base_currency,
      targetCurrency: r.target_currency,
      rate: Number(r.rate),
      fetchedAt: r.fetched_at,
      source: r.source ?? undefined,
    }))

    const storeCurrency = String(store.currency_code).toUpperCase()
    const rate = resolveRate(storeCurrency, chargeCurrency, fxRows)

    const { data: currencyMeta } = await supabase
      .from("currencies")
      .select("decimals")
      .eq("code", chargeCurrency)
      .maybeSingle()

    const quote = buildCheckoutQuote({
      storeCurrency,
      chargeCurrency,
      deliveryFeeStore: Number(store.delivery_fee ?? 0),
      lines: moneyLines,
      rate,
      chargeDecimals: currencyMeta?.decimals ?? 2,
    })

    if (quote.subtotalStore < Number(store.min_order ?? 0)) {
      return jsonError(`Minimum order is ${store.min_order} ${storeCurrency}`, 422, {
        minOrder: store.min_order,
      })
    }

    // Persist quote with service role so guests can still checkout later with quote id
    const admin = createServiceClient()
    const { data: saved, error: saveErr } = await admin
      .from("checkout_quotes")
      .insert({
        user_id: user?.id ?? null,
        store_id: storeId,
        store_currency: quote.storeCurrency,
        charge_currency: quote.chargeCurrency,
        fx_rate: quote.fxRate,
        fx_fetched_at: quote.fxFetchedAt,
        subtotal_store: quote.subtotalStore,
        delivery_fee_store: quote.deliveryFeeStore,
        total_charge: quote.totalCharge,
        items: quote.lines,
        expires_at: quote.expiresAt,
      })
      .select("id")
      .single()

    if (saveErr) {
      console.error("[quote] save", saveErr.message)
      return jsonError("Failed to lock quote", 500)
    }

    return jsonOk({
      quoteId: saved.id,
      ...quote,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Quote failed"
    console.error("[quote]", message)
    return jsonError(message, 503)
  }
}
