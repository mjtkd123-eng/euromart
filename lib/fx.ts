/**
 * Multi-currency FX helpers for Euromart checkout.
 * Rates are loaded from `exchange_rates` (EUR-base preferred) and snapshotted at quote time.
 */

export type CurrencyCode = string; // ISO 4217, e.g. HUF | EUR | CZK

export type FxRateRow = {
  baseCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rate: number;
  fetchedAt: string; // ISO
  source?: string;
};

export type MoneyLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceStore: number;
};

export type CheckoutQuoteInput = {
  storeCurrency: CurrencyCode;
  chargeCurrency: CurrencyCode;
  deliveryFeeStore: number;
  lines: MoneyLine[];
  rate: FxRateRow;
  chargeDecimals?: number;
};

export type CheckoutQuote = {
  storeCurrency: CurrencyCode;
  chargeCurrency: CurrencyCode;
  fxRate: number;
  fxFetchedAt: string;
  subtotalStore: number;
  deliveryFeeStore: number;
  totalStore: number;
  totalCharge: number;
  lines: Array<
    MoneyLine & {
      unitPriceCharge: number;
      lineTotalStore: number;
      lineTotalCharge: number;
    }
  >;
  expiresAt: string;
};

const QUOTE_TTL_MS = 15 * 60 * 1000;
/** Reject checkout if cached FX is older than this (stale protection). */
export const FX_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function moneyRound(amount: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round((amount + Number.EPSILON) * f) / f;
}

/** Convert amount in `from` to `to` using EUR-pivoted or direct rate map. */
export function resolveRate(
  from: CurrencyCode,
  to: CurrencyCode,
  rows: FxRateRow[],
): FxRateRow {
  if (from === to) {
    return {
      baseCurrency: from,
      targetCurrency: to,
      rate: 1,
      fetchedAt: new Date().toISOString(),
      source: "identity",
    };
  }

  const direct = rows.find((r) => r.baseCurrency === from && r.targetCurrency === to);
  if (direct) return direct;

  const inverse = rows.find((r) => r.baseCurrency === to && r.targetCurrency === from);
  if (inverse) {
    return {
      baseCurrency: from,
      targetCurrency: to,
      rate: moneyRound(1 / inverse.rate, 8),
      fetchedAt: inverse.fetchedAt,
      source: inverse.source ? `${inverse.source}:inverse` : "inverse",
    };
  }

  const fromEur = rows.find((r) => r.baseCurrency === "EUR" && r.targetCurrency === from);
  const toEur = rows.find((r) => r.baseCurrency === "EUR" && r.targetCurrency === to);
  if (fromEur && toEur) {
    return {
      baseCurrency: from,
      targetCurrency: to,
      rate: moneyRound(toEur.rate / fromEur.rate, 8),
      fetchedAt:
        fromEur.fetchedAt < toEur.fetchedAt ? fromEur.fetchedAt : toEur.fetchedAt,
      source: "eur-pivot",
    };
  }

  throw new Error(`FX rate not available for ${from} → ${to}`);
}

export function assertFxFresh(fetchedAt: string, now = Date.now()): void {
  const age = now - new Date(fetchedAt).getTime();
  if (Number.isNaN(age) || age > FX_MAX_AGE_MS) {
    throw new Error("Exchange rate is stale; refresh FX before checkout");
  }
}

/**
 * Build a payable quote. All store amounts stay in store currency;
 * charge totals use snapshotted fxRate.
 */
export function buildCheckoutQuote(input: CheckoutQuoteInput): CheckoutQuote {
  const decimals = input.chargeDecimals ?? 2;
  assertFxFresh(input.rate.fetchedAt);

  const lines = input.lines.map((line) => {
    const lineTotalStore = moneyRound(line.unitPriceStore * line.quantity, 4);
    const unitPriceCharge = moneyRound(line.unitPriceStore * input.rate.rate, decimals);
    const lineTotalCharge = moneyRound(unitPriceCharge * line.quantity, decimals);
    return {
      ...line,
      unitPriceCharge,
      lineTotalStore,
      lineTotalCharge,
    };
  });

  const subtotalStore = moneyRound(
    lines.reduce((s, l) => s + l.lineTotalStore, 0),
    4,
  );
  const deliveryFeeStore = moneyRound(input.deliveryFeeStore, 4);
  const totalStore = moneyRound(subtotalStore + deliveryFeeStore, 4);
  const totalCharge = moneyRound(totalStore * input.rate.rate, decimals);

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
  };
}

/** Stripe expects the smallest currency unit (e.g. cents; HUF is zero-decimal). */
export function toStripeAmount(amount: number, currency: CurrencyCode): number {
  const zeroDecimal = new Set([
    "HUF",
    "JPY",
    "KRW",
    "VND",
    "CLP",
    "ISK",
  ]);
  if (zeroDecimal.has(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

/** Display helper: local + converted. */
export function formatDualPrice(opts: {
  amountStore: number;
  storeCurrency: CurrencyCode;
  amountCharge: number;
  chargeCurrency: CurrencyCode;
  storeLocale?: string;
  chargeLocale?: string;
}): string {
  const a = new Intl.NumberFormat(opts.storeLocale ?? undefined, {
    style: "currency",
    currency: opts.storeCurrency,
  }).format(opts.amountStore);
  const b = new Intl.NumberFormat(opts.chargeLocale ?? undefined, {
    style: "currency",
    currency: opts.chargeCurrency,
  }).format(opts.amountCharge);
  return `${a} ≈ ${b}`;
}
