import "server-only"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { readTenantSession } from "@/lib/tenant-auth"
import {
  canonicalizeRole,
  homePathForRole,
  isAdminRole,
  isOwnerRole,
  isStaffRole,
  loginPathForRole,
  type AccountStatus,
  type Role,
} from "@/lib/roles"

export type { Role, AccountStatus }
export { homePathForRole, isStaffRole, loginPathForRole, canonicalizeRole }

export interface SessionProfile {
  id: string
  email: string | null
  fullName: string | null
  role: Role
  storeId: string | null
  mustChangePassword: boolean
  accountStatus: AccountStatus
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
        .select("id, email, full_name, role, must_change_password, account_status")
        .eq("id", user.id)
        .maybeSingle()

      let storeId: string | null = null
      const role = canonicalizeRole((profile?.role as string) ?? user.user_metadata?.role)
      if (isOwnerRole(role)) {
        const { data: link } = await supabase
          .from("store_vendors")
          .select("store_id")
          .eq("user_id", user.id)
          .maybeSingle()
        storeId = link?.store_id ?? null
      }

      const accountStatus = (profile?.account_status as AccountStatus) ?? "active"
      return {
        id: user.id,
        email: profile?.email ?? user.email ?? null,
        fullName: profile?.full_name ?? null,
        role,
        storeId,
        mustChangePassword: Boolean(profile?.must_change_password),
        accountStatus: accountStatus === "pending" || accountStatus === "rejected" ? accountStatus : "active",
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
    accountStatus: sess.accountStatus,
  }
}

function forbiddenRedirect(from: string): never {
  redirect(`/forbidden?from=${encodeURIComponent(from)}`)
}

export async function requireCustomer(nextPath = "/account"): Promise<SessionProfile> {
  const profile = await getSessionProfile()
  if (!profile) redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`)
  if (profile.role !== "customer") forbiddenRedirect(nextPath)
  return profile
}

export async function requireStaff(nextPath: string): Promise<SessionProfile & { demo: boolean }> {
  const profile = await getSessionProfile()
  if (!profile) {
    redirect(`${loginPathForRole("owner")}?next=${encodeURIComponent(nextPath)}`)
  }
  if (!isStaffRole(profile.role)) forbiddenRedirect(nextPath)
  if (isOwnerRole(profile.role) && profile.accountStatus !== "active") {
    redirect("/owner/pending")
  }
  return { ...profile, demo: !isSupabaseConfigured() }
}

export async function requireSuperAdmin(nextPath = "/admin/dashboard"): Promise<SessionProfile> {
  const profile = await getSessionProfile()
  if (!profile) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`)
  if (!isAdminRole(profile.role)) forbiddenRedirect(nextPath)
  return profile
}

export async function requireStoreOwner(nextPath = "/owner/dashboard"): Promise<SessionProfile> {
  const profile = await getSessionProfile()
  if (!profile) redirect(`/owner/login?next=${encodeURIComponent(nextPath)}`)
  if (!isOwnerRole(profile.role)) forbiddenRedirect(nextPath)
  if (profile.accountStatus === "pending") redirect("/owner/pending")
  if (profile.accountStatus === "rejected") redirect("/owner/login?reason=rejected")
  if (profile.mustChangePassword) redirect("/auth/change-password")
  return profile
}
