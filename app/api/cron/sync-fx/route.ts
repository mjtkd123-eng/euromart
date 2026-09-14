import { syncFrankfurterRates } from "@/lib/fx-sync"
import { assertCronAuth, jsonError, jsonOk } from "@/lib/api"
import { requireEnv } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Cron: sync EUR→* rates into exchange_rates.
 * Auth: Authorization: Bearer $CRON_SECRET
 */
export async function POST(request: Request) {
  if (!assertCronAuth(request)) {
    return jsonError("Unauthorized", 401)
  }

  try {
    const result = await syncFrankfurterRates({
      supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    })
    return jsonOk({ ok: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : "FX sync failed"
    console.error("[sync-fx]", message)
    return jsonError(message, 500)
  }
}

/** Allow GET for Vercel Cron (same auth). */
export async function GET(request: Request) {
  return POST(request)
}
