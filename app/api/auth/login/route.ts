import { jsonError, jsonOk } from "@/lib/api"
import { loginWithPortal, redirectForSession } from "@/lib/tenant-auth"
import { canonicalizeRole, type Role } from "@/lib/roles"

export const dynamic = "force-dynamic"

function parsePortal(value: unknown): Role | null {
  if (value === "customer" || value === "owner" || value === "admin") return value
  if (value === "vendor") return "owner"
  return null
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string; portal?: string }
  try {
    body = (await request.json()) as { email?: string; password?: string; portal?: string }
  } catch {
    return jsonError("Invalid JSON")
  }

  const email = body.email?.trim() ?? ""
  const password = body.password ?? ""
  const portal = parsePortal(body.portal)
  if (!email || !password) return jsonError("이메일과 비밀번호를 입력하세요.")
  if (!portal) {
    return jsonError("로그인 포털을 지정하세요. (customer | owner | admin)")
  }

  const result = await loginWithPortal(email, password, portal)
  if (!result.ok) return jsonError(result.error, 401)

  const { session } = result
  return jsonOk({
    userId: session.sub,
    email: session.email,
    role: canonicalizeRole(session.role),
    storeId: session.storeId,
    accountStatus: session.accountStatus,
    mustChangePassword: session.mustChangePassword,
    redirectTo: redirectForSession(session),
  })
}
