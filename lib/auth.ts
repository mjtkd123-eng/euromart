import "server-only"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { readTenantSession } from "@/lib/tenant-auth"

export type Role = "customer" | "vendor" | "admin"

export interface SessionProfile {
  id: string
  email: string | null
  fullName: string | null
  role: Role
  storeId: string | null
  mustChangePassword: boolean
}

/** 현재 로그인 사용자와 프로필(역할)을 반환합니다. 없으면 null. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, must_change_password")
        .eq("id", user.id)
        .maybeSingle()

      let storeId: string | null = null
      const role = (profile?.role as Role) ?? "customer"
      if (role === "vendor") {
        const { data: link } = await supabase
          .from("store_vendors")
          .select("store_id")
          .eq("user_id", user.id)
          .maybeSingle()
        storeId = link?.store_id ?? null
      }

      return {
        id: user.id,
        email: profile?.email ?? user.email ?? null,
        fullName: profile?.full_name ?? null,
        role,
        storeId,
        mustChangePassword: Boolean(profile?.must_change_password),
      }
    }
  }

  const sess = await readTenantSession()
  if (!sess) return null
  return {
    id: sess.sub,
    email: sess.email,
    fullName: sess.email,
    role: sess.role,
    storeId: sess.storeId,
    mustChangePassword: sess.mustChangePassword,
  }
}

export function homePathForRole(role: Role): string {
  if (role === "admin") return "/admin"
  if (role === "vendor") return "/vendor"
  return "/"
}

export function isStaffRole(role: Role | null | undefined): boolean {
  return role === "vendor" || role === "admin"
}

export async function requireStaff(nextPath: string): Promise<SessionProfile & { demo: boolean }> {
  const profile = await getSessionProfile()
  if (!profile) redirect(`/vendor/login?next=${encodeURIComponent(nextPath)}`)
  if (!isStaffRole(profile.role)) redirect("/")
  return { ...profile, demo: !isSupabaseConfigured() }
}

export async function requireSuperAdmin(nextPath = "/admin"): Promise<SessionProfile> {
  const profile = await getSessionProfile()
  if (!profile) redirect(`/vendor/login?next=${encodeURIComponent(nextPath)}`)
  if (profile.role !== "admin") redirect("/")
  return profile
}

export async function requireStoreOwner(nextPath = "/vendor"): Promise<SessionProfile> {
  const profile = await getSessionProfile()
  if (!profile) redirect(`/vendor/login?next=${encodeURIComponent(nextPath)}`)
  if (profile.role !== "vendor" && profile.role !== "admin") redirect("/")
  if (profile.mustChangePassword) redirect("/auth/change-password")
  return profile
}
