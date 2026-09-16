import { jsonError, jsonOk } from "@/lib/api"
import { readTenantSession } from "@/lib/tenant-auth"
import { rejectApplication } from "@/lib/tenant-directory"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readTenantSession()
  if (!session) return jsonError("로그인이 필요합니다.", 401)
  if (session.role !== "admin") return jsonError("최고 관리자만 반려할 수 있습니다.", 403)

  const { id } = await context.params
  let reason = ""
  try {
    const body = (await request.json()) as { reason?: string }
    reason = body.reason ?? ""
  } catch {
    reason = ""
  }

  const ok = await rejectApplication(id, reason)
  if (!ok) return jsonError("반려할 수 없는 서류입니다.")
  return jsonOk({ ok: true })
}
