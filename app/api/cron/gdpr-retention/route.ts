import { jsonError, jsonOk, assertCronAuth } from "@/lib/api"

export const dynamic = "force-dynamic"

/** Daily GDPR mask/delete for closed claims past retention. */
export async function POST(request: Request) {
  if (!assertCronAuth(request)) {
    return jsonError("Unauthorized", 401)
  }

  const { isSupabaseConfigured } = await import("@/lib/supabase/config")
  if (!isSupabaseConfigured()) {
    return jsonOk({ skipped: true, reason: "supabase_unconfigured", purged: 0, filesRemoved: 0 })
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin")
    const supabase = createServiceClient()

    const { data: paths, error: pathError } = await supabase.rpc("gdpr_evidence_paths_due")
    if (pathError) return jsonError(pathError.message, 500)

    const list = (paths ?? []) as { storage_path?: string }[]
    const toRemove = list.map((p) => p.storage_path).filter((p): p is string => Boolean(p))
    let filesRemoved = 0
    if (toRemove.length > 0) {
      const { error: storageError } = await supabase.storage.from("claim-evidence").remove(toRemove)
      if (!storageError) filesRemoved = toRemove.length
    }

    const { data, error } = await supabase.rpc("gdpr_purge_closed_claims")
    if (error) return jsonError(error.message, 500)
    return jsonOk({ purged: data ?? 0, filesRemoved })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "purge failed", 500)
  }
}

export async function GET(request: Request) {
  return POST(request)
}
