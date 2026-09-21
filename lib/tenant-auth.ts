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
  signupCustomer,
  signupOwnerApplication,
  updateDirectoryPassword,
  type CreateStoreInput,
  type CustomerSignupInput,
  type OwnerSignupInput,
} from "@/lib/tenant-directory"
import { sendOwnerCredentials, sendPasswordResetMail } from "@/lib/owner-mail"
import { isStrongPassword } from "@/lib/password"
import {
  canonicalizeRole,
  homePathForRole,
  portalMismatchMessage,
  type AccountStatus,
  type Role,
} from "@/lib/roles"

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

function sessionFromUser(user: {
  id: string
  email: string
  role: string
  storeId: string | null
  mustChangePassword: boolean
  accountStatus?: AccountStatus
}): Omit<TenantSession, "exp"> {
  return {
    sub: user.id,
    email: user.email,
    role: canonicalizeRole(user.role),
    storeId: user.storeId,
    mustChangePassword: user.mustChangePassword,
    accountStatus: user.accountStatus === "pending" || user.accountStatus === "rejected" ? user.accountStatus : "active",
  }
}

export function redirectForSession(session: Pick<TenantSession, "role" | "mustChangePassword" | "accountStatus">): string {
  if (session.mustChangePassword) return "/auth/change-password"
  if (canonicalizeRole(session.role) === "owner" && session.accountStatus === "pending") {
    return "/owner/pending"
  }
  if (canonicalizeRole(session.role) === "owner" && session.accountStatus === "rejected") {
    return "/owner/login?reason=rejected"
  }
  return homePathForRole(session.role)
}

export async function loginWithPortal(
  email: string,
  password: string,
  portal: Role,
): Promise<{ ok: true; session: TenantSession } | { ok: false; error: string }> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) return { ok: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, must_change_password, account_status")
        .eq("id", data.user.id)
        .maybeSingle()

      const role = canonicalizeRole((profile?.role ?? data.user.user_metadata?.role) as string)
      if (role !== portal) {
        await supabase.auth.signOut()
        return { ok: false, error: portalMismatchMessage(portal) }
      }

      const accountStatus: AccountStatus =
        profile?.account_status === "pending" || profile?.account_status === "rejected"
          ? profile.account_status
          : "active"

      if (role === "owner" && accountStatus === "rejected") {
        await supabase.auth.signOut()
        return { ok: false, error: "입점 신청이 반려된 계정입니다. 본부에 문의해 주세요." }
      }

      let storeId: string | null = null
      if (role === "owner") {
        const { data: link } = await supabase
          .from("store_vendors")
          .select("store_id")
          .eq("user_id", data.user.id)
          .maybeSingle()
        storeId = link?.store_id ?? null
      }

      const session = sessionFromUser({
        id: data.user.id,
        email: profile?.email ?? data.user.email ?? email,
        role,
        storeId,
        mustChangePassword: Boolean(profile?.must_change_password),
        accountStatus,
      })
      await writeTenantSession(session)
      return { ok: true, session: { ...session, exp: 0 } }
    } catch {
      return { ok: false, error: "로그인에 실패했습니다." }
    }
  }

  const user = await authenticateDirectory(email, password)
  if (!user) return { ok: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." }

  const role = canonicalizeRole(user.role)
  if (role !== portal) return { ok: false, error: portalMismatchMessage(portal) }
  if (role === "owner" && user.accountStatus === "rejected") {
    return { ok: false, error: "입점 신청이 반려된 계정입니다. 본부에 문의해 주세요." }
  }

  const session = sessionFromUser(user)
  await writeTenantSession(session)
  return { ok: true, session: { ...session, exp: 0 } }
}

/** @deprecated Use loginWithPortal. Kept for any leftover staff callers. */
export async function loginStaff(email: string, password: string) {
  const owner = await loginWithPortal(email, password, "owner")
  if (owner.ok) return owner
  return loginWithPortal(email, password, "admin")
}

export async function registerCustomer(input: CustomerSignupInput) {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:43147"
      const { error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: input.fullName,
            role: "customer",
            terms_accepted_at: new Date().toISOString(),
            terms_version: "2026-08-eu-gdpr",
          },
        },
      })
      if (error) return { error: error.message }
      return { ok: true as const, needsEmailConfirm: true }
    } catch {
      return { error: "회원가입에 실패했습니다." }
    }
  }

  const created = await signupCustomer(input)
  if ("error" in created) return created
  const session = sessionFromUser({
    ...created.user,
    mustChangePassword: false,
  })
  await writeTenantSession(session)
  return { ok: true as const, needsEmailConfirm: false, session: { ...session, exp: 0 } }
}

export async function registerOwner(input: OwnerSignupInput) {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:43147"
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: input.fullName,
            role: "owner",
            account_status: "pending",
          },
        },
      })
      if (error) return { error: error.message }
      const userId = data.user?.id
      if (userId) {
        await supabase.from("profiles").upsert({
          id: userId,
          email: input.email.trim().toLowerCase(),
          full_name: input.fullName,
          role: "owner",
          account_status: "pending",
        })
        await supabase.from("store_applications").insert({
          store_name: input.storeName,
          legal_name: input.legalName,
          business_number: input.businessNumber,
          city_slug: input.citySlug,
          contact_email: input.email.trim().toLowerCase(),
          contact_name: input.fullName,
          documents_note: input.documentsNote,
          address: input.address,
          phone: input.phone,
          source: "self_signup",
          owner_user_id: userId,
          status: "submitted",
        })
      }
      return { ok: true as const }
    } catch {
      return { error: "입점 신청에 실패했습니다." }
    }
  }

  return signupOwnerApplication(input)
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
