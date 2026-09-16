import { jsonError, jsonOk } from "@/lib/api"
import { consumeActionToken, updateDirectoryPassword } from "@/lib/tenant-directory"
import { isStrongPassword } from "@/lib/password"
import { writeTenantSession } from "@/lib/tenant-auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { token?: string; newPassword?: string }
  try {
    body = (await request.json()) as { token?: string; newPassword?: string }
  } catch {
    return jsonError("Invalid JSON")
  }

  const token = body.token?.trim() ?? ""
  const next = body.newPassword ?? ""
  if (!token) return jsonError("유효하지 않은 링크입니다.")
  if (!isStrongPassword(next)) {
    return jsonError("비밀번호는 10자 이상, 영문 대·소문자와 숫자를 포함해야 합니다.")
  }

  const user =
    (await consumeActionToken(token, "invite")) ??
    (await consumeActionToken(token, "password_reset"))
  if (!user) return jsonError("링크가 만료되었거나 이미 사용되었습니다.", 410)

  await updateDirectoryPassword(user.id, next)
  await writeTenantSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
    mustChangePassword: false,
  })

  return jsonOk({ ok: true, redirectTo: user.role === "admin" ? "/admin" : "/vendor" })
}
