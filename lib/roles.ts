/**
 * Canonical account roles for K-EuroMart.
 * Legacy directory/DB value `vendor` is treated as `owner`.
 */

export const ROLES = ["customer", "owner", "admin"] as const
export type Role = (typeof ROLES)[number]

export const ACCOUNT_STATUSES = ["pending", "active", "rejected"] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export function canonicalizeRole(role: string | null | undefined): Role {
  if (role === "admin") return "admin"
  if (role === "owner" || role === "vendor") return "owner"
  return "customer"
}

export function isOwnerRole(role: string | null | undefined): boolean {
  return canonicalizeRole(role) === "owner"
}

export function isAdminRole(role: string | null | undefined): boolean {
  return canonicalizeRole(role) === "admin"
}

export function isStaffRole(role: string | null | undefined): boolean {
  const r = canonicalizeRole(role)
  return r === "owner" || r === "admin"
}

export function homePathForRole(role: string | null | undefined): string {
  const r = canonicalizeRole(role)
  if (r === "admin") return "/admin/dashboard"
  if (r === "owner") return "/owner/dashboard"
  return "/account"
}

export function loginPathForRole(role: string | null | undefined): string {
  const r = canonicalizeRole(role)
  if (r === "admin") return "/admin/login"
  if (r === "owner") return "/owner/login"
  return "/auth/login"
}

export function portalMismatchMessage(portal: Role): string {
  if (portal === "admin") {
    return "플랫폼 관리자 전용 로그인입니다. 일반 회원은 쇼핑몰 로그인, 업주는 /owner/login 을 이용하세요."
  }
  if (portal === "owner") {
    return "업주(파트너) 전용 로그인입니다. 일반 회원은 쇼핑몰 로그인, 관리자는 /admin/login 을 이용하세요."
  }
  return "일반 회원 전용 로그인입니다. 업주는 /owner/login, 관리자는 /admin/login 을 이용하세요."
}
