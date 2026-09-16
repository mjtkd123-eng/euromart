import "server-only"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export type Role = "customer" | "vendor" | "admin"

export interface SessionProfile {
  id: string
  email: string | null
  fullName: string | null
  role: Role
}

/** 현재 로그인 사용자와 프로필(역할)을 반환합니다. 없으면 null. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single()

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: (profile?.role as Role) ?? "customer",
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

/**
 * Vendor (마트 업주) or platform admin only.
 * When Supabase is not configured, returns a demo staff profile so ops screens
 * remain previewable without login.
 */
export async function requireStaff(nextPath: string): Promise<SessionProfile & { demo: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      id: "demo-staff",
      email: "ops@k-euromart.demo",
      fullName: "Demo operator",
      role: "admin",
      demo: true,
    }
  }

  const profile = await getSessionProfile()
  if (!profile) redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`)
  if (!isStaffRole(profile.role)) redirect("/")
  return { ...profile, demo: false }
}
