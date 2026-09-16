import { jsonOk } from "@/lib/api"
import { clearTenantSession } from "@/lib/tenant-auth"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

export async function POST() {
  await clearTenantSession()
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {
      /* ignore */
    }
  }
  return jsonOk({ ok: true })
}
