/**
 * Stripe PaymentIntent creation from a locked checkout quote.
 * Wire from app/api/checkout/create-intent/route.ts after auth + quote validation.
 */
import type { CheckoutQuote } from "@/lib/fx";
import { toStripeAmount } from "@/lib/fx";

export type CreatePaymentIntentParams = {
  stripeSecretKey: string;
  quote: CheckoutQuote;
  orderId: string;
  customerEmail?: string;
};

export type CreatePaymentIntentResult = {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
};

export async function createCheckoutPaymentIntent(
  params: CreatePaymentIntentParams,
): Promise<CreatePaymentIntentResult> {
  const amount = toStripeAmount(params.quote.totalCharge, params.quote.chargeCurrency);
  const currency = params.quote.chargeCurrency.toLowerCase();

  const body = new URLSearchParams({
    amount: String(amount),
    currency,
    "automatic_payment_methods[enabled]": "true",
    "metadata[order_id]": params.orderId,
    "metadata[fx_rate]": String(params.quote.fxRate),
    "metadata[fx_fetched_at]": params.quote.fxFetchedAt,
    "metadata[store_currency]": params.quote.storeCurrency,
  });
  if (params.customerEmail) {
    body.set("receipt_email", params.customerEmail);
  }

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe PI failed: ${err}`);
  }

  const pi = (await res.json()) as {
    id: string;
    client_secret: string;
    amount: number;
    currency: string;
  };

  return {
    paymentIntentId: pi.id,
    clientSecret: pi.client_secret,
    amount: pi.amount,
    currency: pi.currency,
  };
}
