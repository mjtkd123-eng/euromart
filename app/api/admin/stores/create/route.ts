import { jsonError, jsonOk } from "@/lib/api"
import { provisionStoreAndOwner, readTenantSession } from "@/lib/tenant-auth"
import { assertStoreAccess } from "@/lib/tenant-guard"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/stores/create
 * Super Admin only. Issues a store + STORE_OWNER account after document review.
 * Temporary password is returned once and never stored in plaintext.
 */
export async function POST(request: Request) {
  const session = await readTenantSession()
  if (!session) return jsonError("로그인이 필요합니다.", 401)
  if (session.role !== "admin") return jsonError("최고 관리자만 업주 계정을 발급할 수 있습니다.", 403)

  let body: {
    storeName?: string
    legalName?: string
    businessNumber?: string
    citySlug?: string
    address?: string
    ownerEmail?: string
    ownerName?: string
    applicationId?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON")
  }

  const origin = new URL(request.url).origin
  const result = await provisionStoreAndOwner(
    {
      storeName: body.storeName ?? "",
      legalName: body.legalName ?? "",
      businessNumber: body.businessNumber ?? "",
      citySlug: body.citySlug ?? "budapest",
      address: body.address ?? "",
      ownerEmail: body.ownerEmail ?? "",
      ownerName: body.ownerName ?? "",
      applicationId: body.applicationId,
    },
    origin,
  )

  if (!result.ok) return jsonError(result.error)

  // Super Admin is allowed to create any store; scope check is a no-op for admin.
  assertStoreAccess({ role: "admin", storeId: null }, result.storeId)

  return jsonOk({
    storeId: result.storeId,
    userId: result.userId,
    email: result.email,
    role: "STORE_OWNER",
    temporaryPassword: result.temporaryPassword,
    inviteUrl: result.inviteUrl,
    emailDelivered: result.emailDelivered,
    passwordReadableAgain: false,
    notice:
      "임시 비밀번호는 지금 이 응답에만 있습니다. 본부는 해시만 보관하며 평문을 다시 조회할 수 없습니다.",
  })
}
