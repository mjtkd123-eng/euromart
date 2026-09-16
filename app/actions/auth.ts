"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { clearTenantSession } from "@/lib/tenant-auth"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export async function signOut() {
  await clearTenantSession()
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect("/vendor/login")
}
