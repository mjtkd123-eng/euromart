import "server-only"
import { cookies } from "next/headers"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import {
  encodeTenantSession,
  decodeTenantSession,
  TENANT_COOKIE,
  tenantCookieOptions,
  type TenantSession,
} from "@/lib/staff-session"
import {
  authenticateDirectory,
  createStoreAndOwner,
  findUserById,
  issueResetToken,
  updateDirectoryPassword,
  type CreateStoreInput,
} from "@/lib/tenant-directory"
import { sendOwnerCredentials, sendPasswordResetMail } from "@/lib/owner-mail"
import { isStrongPassword } from "@/lib/password"

export async function readTenantSession(): Promise<TenantSession | null> {
  const store = await cookies()
  return decodeTenantSession(store.get(TENANT_COOKIE)?.value)
}

export async function writeTenantSession(session: Omit<TenantSession, "exp">): Promise<void> {
  const token = await encodeTenantSession(session)
  const store = await cookies()
  store.set(TENANT_COOKIE, token, tenantCookieOptions())
}

export async function clearTenantSession(): Promise<void> {
  const store = await cookies()
  store.set(TENANT_COOKIE, "", { ...tenantCookieOptions(), maxAge: 0 })
}

export async function loginStaff(email: string, password: string): Promise<
  | { ok: true; session: TenantSession }
  | { ok: false; error: string }
> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) return { ok: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, must_change_password")
        .eq("id", data.user.id)
        .maybeSingle()

      const role = (profile?.role ?? data.user.user_metadata?.role) as string
      if (role !== "vendor" && role !== "admin") {
        await supabase.auth.signOut()
        return { ok: false, error: "업주 또는 본부 관리자 계정이 아닙니다." }
      }

      let storeId: string | null = null
      if (role === "vendor") {
        const { data: link } = await supabase
          .from("store_vendors")
          .select("store_id")
          .eq("user_id", data.user.id)
          .maybeSingle()
        storeId = link?.store_id ?? null
      }

      const session = {
        sub: data.user.id,
        email: profile?.email ?? data.user.email ?? email,
        role: role as "vendor" | "admin",
        storeId,
        mustChangePassword: Boolean(profile?.must_change_password),
      }
      await writeTenantSession(session)
      return { ok: true, session: { ...session, exp: 0 } }
    } catch {
      return { ok: false, error: "로그인에 실패했습니다." }
    }
  }

  const user = await authenticateDirectory(email, password)
  if (!user) return { ok: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." }

  const session = {
    sub: user.id,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
    mustChangePassword: user.mustChangePassword,
  }
  await writeTenantSession(session)
  return { ok: true, session: { ...session, exp: 0 } }
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isStrongPassword(nextPassword)) {
    return { ok: false, error: "비밀번호는 10자 이상, 영문 대·소문자와 숫자를 포함해야 합니다." }
  }

  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user || userData.user.id !== userId) {
      return { ok: false, error: "세션이 만료되었습니다. 다시 로그인해 주세요." }
    }
    const sess = await readTenantSession()
    const firstLogin = Boolean(sess?.mustChangePassword)
    if (!firstLogin) {
      if (!currentPassword) return { ok: false, error: "현재 비밀번호가 올바르지 않습니다." }
      const { error: reauth } = await supabase.auth.signInWithPassword({
        email: userData.user.email ?? "",
        password: currentPassword,
      })
      if (reauth) return { ok: false, error: "현재 비밀번호가 올바르지 않습니다." }
    }
    if (currentPassword && currentPassword === nextPassword) {
      return { ok: false, error: "이전과 다른 비밀번호를 사용하세요." }
    }
    const { error } = await supabase.auth.updateUser({ password: nextPassword })
    if (error) return { ok: false, error: error.message }
    await supabase.from("profiles").update({
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
    }).eq("id", userId)
    if (sess) await writeTenantSession({ ...sess, mustChangePassword: false })
    return { ok: true }
  }

  const user = await findUserById(userId)
  if (!user) return { ok: false, error: "계정을 찾을 수 없습니다." }

  if (user.mustChangePassword) {
    if (currentPassword && currentPassword === nextPassword) {
      return { ok: false, error: "이전과 다른 비밀번호를 사용하세요." }
    }
  } else {
    if (currentPassword === nextPassword) {
      return { ok: false, error: "이전과 다른 비밀번호를 사용하세요." }
    }
    const ok = await authenticateDirectory(user.email, currentPassword)
    if (!ok) return { ok: false, error: "현재 비밀번호가 올바르지 않습니다." }
  }

  await updateDirectoryPassword(userId, nextPassword)
  const sess = await readTenantSession()
  if (sess) await writeTenantSession({ ...sess, mustChangePassword: false })
  return { ok: true }
}

export async function requestPasswordReset(email: string, origin: string): Promise<void> {
  const issued = await issueResetToken(email)
  if (issued) {
    await sendPasswordResetMail({
      to: email.trim().toLowerCase(),
      origin,
      resetUrl: `${origin}/auth/reset-password?token=${issued.token}`,
    })
  }
}

export async function provisionStoreAndOwner(
  input: CreateStoreInput,
  origin: string,
): Promise<
  | {
      ok: true
      storeId: string
      userId: string
      email: string
      temporaryPassword: string
      inviteUrl: string
      emailDelivered: boolean
    }
  | { ok: false; error: string }
> {
  const created = await createStoreAndOwner(input)
  if ("error" in created) return { ok: false, error: created.error }

  const inviteUrl = `${origin}/auth/set-password?token=${created.inviteToken}`
  const mail = await sendOwnerCredentials({
    to: created.owner.email,
    ownerName: created.owner.fullName,
    storeName: created.store.name,
    temporaryPassword: created.temporaryPassword,
    setPasswordUrl: inviteUrl,
    origin,
  })

  return {
    ok: true,
    storeId: created.store.id,
    userId: created.owner.id,
    email: created.owner.email,
    temporaryPassword: created.temporaryPassword,
    inviteUrl,
    emailDelivered: mail.delivered,
  }
}
