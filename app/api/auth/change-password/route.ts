import { jsonError, jsonOk } from "@/lib/api"
import { changeOwnPassword, readTenantSession, redirectForSession } from "@/lib/tenant-auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const session = await readTenantSession()
  if (!session) return jsonError("로그인이 필요합니다.", 401)

  let body: { currentPassword?: string; newPassword?: string }
  try {
    body = (await request.json()) as { currentPassword?: string; newPassword?: string }
  } catch {
    return jsonError("Invalid JSON")
  }

  const result = await changeOwnPassword(
    session.sub,
    body.currentPassword ?? "",
    body.newPassword ?? "",
  )
  if (!result.ok) return jsonError(result.error)
  return jsonOk({
    ok: true,
    redirectTo: redirectForSession({ ...session, mustChangePassword: false }),
  })
}
