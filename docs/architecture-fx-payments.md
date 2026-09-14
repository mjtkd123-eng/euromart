# Euromart — FX & Payment Architecture

## Goals

- Vendors price in **local currency** (HUF, CZK, SEK, EUR, …).
- Customers see **local + converted** amounts (default charge currency: **EUR**).
- Checkout **locks FX** for 15 minutes and persists the snapshot on the order.
- Stripe charges in `charge_currency`; webhooks finalize `orders.status = paid`.

## Components

| Piece | Location |
|-------|----------|
| Schema | `supabase/migrations/20260811_euromart_core.sql` |
| Quote math | `lib/fx.ts` |
| ECB sync | `lib/fx-sync.ts` (Frankfurter) |
| Stripe PI | `lib/payments/stripe.ts` |

## Sequence

```
Customer cart
    → POST /api/checkout/quote
         load products + effective prices (sale / promo)
         get_fx_rate(store→charge) from exchange_rates
         buildCheckoutQuote() → checkout_quotes row (TTL 15m)
    → POST /api/checkout/create-intent
         validate quote not expired + FX age < 24h
         insert orders (awaiting_payment) + order_items
         createCheckoutPaymentIntent()
    → Client Stripe.confirmPayment
    → POST /api/webhooks/stripe
         payment_intent.succeeded → payments + orders.paid
         decrement stock
```

## Cron

`POST /api/cron/sync-fx` (Authorization: `Bearer $CRON_SECRET`) every 1–6h:

1. `syncFrankfurterRates({ supabaseUrl, serviceRoleKey })`
2. Upsert EUR→* into `exchange_rates`
3. Alert if fetch fails (keep last good rates)

## Env

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
CRON_SECRET=
```

## Display rule

`formatDualPrice({ amountStore, storeCurrency, amountCharge, chargeCurrency })`
→ e.g. `4 990 Ft ≈ €12.45` with footnote: rate + `fxFetchedAt`.
