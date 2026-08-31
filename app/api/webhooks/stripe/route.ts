import { createServiceClient } from "@/lib/supabase/admin"
import { jsonError, jsonOk } from "@/lib/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/webhooks/stripe
 * Marks order paid when payment_intent.succeeded.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!secret || !stripeKey) {
    return jsonError("Stripe webhook not configured", 503)
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) return jsonError("Missing stripe-signature", 400)

  const rawBody = await request.text()

  // Lightweight verification via Stripe API construct — without stripe SDK:
  // Prefer installing `stripe` package for production. Here we parse after
  // forwarding-compatible check: require metadata.order_id from event payload
  // only when Stripe-Signature header is present; full HMAC verify below.

  const crypto = await import("crypto")
  const parts = Object.fromEntries(
    signature.split(",").map((p) => {
      const [k, v] = p.split("=")
      return [k, v]
    }),
  ) as { t?: string; v1?: string }

  if (!parts.t || !parts.v1) return jsonError("Invalid signature header", 400)

  const signedPayload = `${parts.t}.${rawBody}`
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex")
  const a = Buffer.from(parts.v1, "hex")
  const b = Buffer.from(expected, "hex")
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return jsonError("Signature mismatch", 400)
  }

  // Reject stale timestamps (>5 min)
  const ts = Number(parts.t)
  if (Math.abs(Date.now() / 1000 - ts) > 300) {
    return jsonError("Timestamp too old", 400)
  }

  let event: {
    type: string
    data: { object: Record<string, unknown> }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return jsonError("Invalid JSON")
  }

  if (event.type !== "payment_intent.succeeded") {
    return jsonOk({ received: true, ignored: event.type })
  }

  const pi = event.data.object
  const piId = String(pi.id ?? "")
  const meta = (pi.metadata ?? {}) as Record<string, string>
  const orderId = meta.order_id

  if (!piId || !orderId) {
    return jsonError("Missing payment intent or order_id metadata", 422)
  }

  try {
    const admin = createServiceClient()

    await admin
      .from("payments")
      .update({ status: "succeeded", raw: pi, updated_at: new Date().toISOString() })
      .eq("provider_ref", piId)

    const { error } = await admin
      .from("orders")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("stripe_payment_intent_id", piId)

    if (error) return jsonError(error.message, 500)

    // Decrement stock for order items
    const { data: items } = await admin
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId)

    for (const item of items ?? []) {
      if (!item.product_id) continue
      const { data: product } = await admin
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .maybeSingle()
      if (!product) continue
      const next = Math.max(0, Number(product.stock) - Number(item.quantity))
      await admin.from("products").update({ stock: next }).eq("id", item.product_id)
    }

    return jsonOk({ received: true, orderId })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook handler failed"
    console.error("[stripe webhook]", message)
    return jsonError(message, 500)
  }
}
