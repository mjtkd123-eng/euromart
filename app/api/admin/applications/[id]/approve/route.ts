import { jsonError, jsonOk } from "@/lib/api"
import { readTenantSession } from "@/lib/tenant-auth"
import { approveOwnerApplication } from "@/lib/tenant-directory"

export const dynamic = "force-dynamic"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readTenantSession()
  if (!session) return jsonError("로그인이 필요합니다.", 401)
  if (session.role !== "admin") return jsonError("최고 관리자만 승인할 수 있습니다.", 403)

  const { id } = await context.params
  const result = await approveOwnerApplication(id)
  if ("error" in result) return jsonError(result.error)
  return jsonOk({
    ok: true,
    storeId: result.storeId,
    email: result.email,
    notice: "온라인 입점 신청을 승인했습니다. 업주가 /owner/login 으로 매장 대시보드에 들어갈 수 있습니다.",
  })
}
