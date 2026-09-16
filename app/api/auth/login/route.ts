import { jsonError, jsonOk } from "@/lib/api"
import { loginStaff } from "@/lib/tenant-auth"
import { homePathForRole } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = (await request.json()) as { email?: string; password?: string }
  } catch {
    return jsonError("Invalid JSON")
  }

  const email = body.email?.trim() ?? ""
  const password = body.password ?? ""
  if (!email || !password) return jsonError("이메일과 비밀번호를 입력하세요.")

  const result = await loginStaff(email, password)
  if (!result.ok) return jsonError(result.error, 401)

  const { session } = result
  const next = session.mustChangePassword
    ? "/auth/change-password"
    : homePathForRole(session.role)

  return jsonOk({
    userId: session.sub,
    email: session.email,
    role: session.role,
    storeId: session.storeId,
    mustChangePassword: session.mustChangePassword,
    redirectTo: next,
  })
}
