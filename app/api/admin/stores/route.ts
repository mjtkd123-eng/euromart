import { jsonError, jsonOk } from "@/lib/api"
import { readTenantSession } from "@/lib/tenant-auth"
import { listApplications, listMailOutbox, listOwners, listStores } from "@/lib/tenant-directory"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await readTenantSession()
  if (!session) return jsonError("로그인이 필요합니다.", 401)
  if (session.role !== "admin") return jsonError("최고 관리자만 조회할 수 있습니다.", 403)

  const [applications, stores, owners, mail] = await Promise.all([
    listApplications(),
    listStores(),
    listOwners(),
    listMailOutbox(),
  ])

  return jsonOk({ applications, stores, owners, mail })
}
