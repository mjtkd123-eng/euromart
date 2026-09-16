import { jsonError, jsonOk } from "@/lib/api"
import { assertCronAuth } from "@/lib/api"

export const dynamic = "force-dynamic"

/**
 * POST/GET /api/cron/sweep-claim-sla
 * Authorization: Bearer $CRON_SECRET
 * Escalates Tier 1 claims past the 2h merchant SLA and applies a timeout penalty.
 */
export async function POST(request: Request) {
  if (!assertCronAuth(request)) {
    return jsonError("Unauthorized", 401)
  }

  const { createServiceClient } = await import("@/lib/supabase/admin")
  const { isSupabaseConfigured } = await import("@/lib/supabase/config")

  if (!isSupabaseConfigured()) {
    return jsonOk({ skipped: true, reason: "supabase_unconfigured", escalated: 0 })
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc("sweep_claim_sla")
    if (error) return jsonError(error.message, 500)
    return jsonOk({ escalated: data ?? 0 })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "sweep failed", 500)
  }
}

export async function GET(request: Request) {
  return POST(request)
}
