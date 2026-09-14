/**
 * Frankfurter (ECB) FX sync — call from Vercel/Supabase cron with CRON_SECRET.
 * Stores EUR→* rates into `exchange_rates`.
 */
import { createClient } from "@supabase/supabase-js";

const FRANKFURTER = "https://api.frankfurter.app/latest";

export type SyncFxResult = {
  base: string;
  updated: number;
  fetchedAt: string;
};

export async function syncFrankfurterRates(opts: {
  supabaseUrl: string;
  serviceRoleKey: string;
  /** ISO currencies to pull against EUR */
  symbols?: string[];
}): Promise<SyncFxResult> {
  const symbols = (opts.symbols ?? ["HUF", "CZK", "SEK", "PLN", "GBP", "USD"]).join(",");
  const res = await fetch(`${FRANKFURTER}?from=EUR&to=${symbols}`);
  if (!res.ok) {
    throw new Error(`Frankfurter error: ${res.status}`);
  }
  const data = (await res.json()) as {
    base: string;
    date: string;
    rates: Record<string, number>;
  };

  const fetchedAt = new Date().toISOString();
  const rows = Object.entries(data.rates).map(([target, rate]) => ({
    base_currency: "EUR",
    target_currency: target,
    rate,
    source: "frankfurter",
    fetched_at: fetchedAt,
  }));

  const supabase = createClient(opts.supabaseUrl, opts.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("exchange_rates").upsert(rows, {
    onConflict: "base_currency,target_currency",
  });
  if (error) throw error;

  return { base: data.base, updated: rows.length, fetchedAt };
}
