import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { createCheckoutPaymentIntent } from "@/lib/payments/stripe"
import type { CheckoutQuote } from "@/lib/fx"
import { jsonError, jsonOk } from "@/lib/api"

export const dynamic = "force-dynamic"

type Body = {
  quoteId: string
  customerName: string
  address: string
  phone: string
  notes?: string
}

/**
 * POST /api/checkout/create-intent
 * Creates order (awaiting_payment) + Stripe PaymentIntent from a locked quote.
 */
export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError("Invalid JSON body")
  }

  const quoteId = body.quoteId?.trim()
  const customerName = body.customerName?.trim()
  const address = body.address?.trim()
  const phone = body.phone?.trim()

  if (!quoteId) return jsonError("quoteId is required")
  if (!customerName || !address || !phone) {
    return jsonError("customerName, address, and phone are required")
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return jsonError("Authentication required", 401)

    const admin = createServiceClient()
    const { data: quoteRow, error: qErr } = await admin
      .from("checkout_quotes")
      .select("*")
      .eq("id", quoteId)
      .maybeSingle()

    if (qErr) return jsonError(qErr.message, 500)
    if (!quoteRow) return jsonError("Quote not found", 404)
    if (new Date(quoteRow.expires_at).getTime() < Date.now()) {
      return jsonError("Quote expired; request a new quote", 410)
    }

    const items = quoteRow.items as CheckoutQuote["lines"]
    if (!Array.isArray(items) || !items.length) {
      return jsonError("Quote has no items", 422)
    }

    const quote: CheckoutQuote = {
      storeCurrency: quoteRow.store_currency,
      chargeCurrency: quoteRow.charge_currency,
      fxRate: Number(quoteRow.fx_rate),
      fxFetchedAt: quoteRow.fx_fetched_at,
      subtotalStore: Number(quoteRow.subtotal_store),
      deliveryFeeStore: Number(quoteRow.delivery_fee_store),
      totalStore: Number(quoteRow.subtotal_store) + Number(quoteRow.delivery_fee_store),
      totalCharge: Number(quoteRow.total_charge),
      lines: items,
      expiresAt: quoteRow.expires_at,
    }

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        store_id: quoteRow.store_id,
        quote_id: quoteId,
        status: "awaiting_payment",
        store_currency: quote.storeCurrency,
        charge_currency: quote.chargeCurrency,
        fx_rate: quote.fxRate,
        fx_fetched_at: quote.fxFetchedAt,
        subtotal_store: quote.subtotalStore,
        delivery_fee_store: quote.deliveryFeeStore,
        total_charge: quote.totalCharge,
        customer_name: customerName,
        address,
        phone,
        notes: body.notes?.trim() || null,
      })
      .select("id")
      .single()

    if (orderErr) {
      console.error("[create-intent] order", orderErr.message)
      return jsonError("Failed to create order", 500)
    }

    const orderItems = items.map((line) => ({
      order_id: order.id,
      product_id: line.productId,
      name_snapshot: line.name,
      quantity: line.quantity,
      unit_price_store: line.unitPriceStore,
      unit_price_charge: line.unitPriceCharge,
      line_total_store: line.lineTotalStore,
      line_total_charge: line.lineTotalCharge,
    }))

    const { error: itemsErr } = await admin.from("order_items").insert(orderItems)
    if (itemsErr) {
      console.error("[create-intent] items", itemsErr.message)
      return jsonError("Failed to create order items", 500)
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return jsonError("STRIPE_SECRET_KEY not configured", 503, { orderId: order.id })
    }

    const pi = await createCheckoutPaymentIntent({
      stripeSecretKey: stripeKey,
      quote,
      orderId: order.id,
      customerEmail: user.email ?? undefined,
    })

    await admin
      .from("orders")
      .update({ stripe_payment_intent_id: pi.paymentIntentId })
      .eq("id", order.id)

    await admin.from("payments").insert({
      order_id: order.id,
      provider: "stripe",
      provider_ref: pi.paymentIntentId,
      amount: quote.totalCharge,
      currency: quote.chargeCurrency,
      status: "pending",
    })

    return jsonOk({
      orderId: order.id,
      clientSecret: pi.clientSecret,
      paymentIntentId: pi.paymentIntentId,
      amount: pi.amount,
      currency: pi.currency,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Payment intent failed"
    console.error("[create-intent]", message)
    return jsonError(message, 500)
  }
}
