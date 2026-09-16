import { jsonError, jsonOk } from "@/lib/api"
import { readTenantSession } from "@/lib/tenant-auth"
import { assertStoreAccess, StoreScopeError } from "@/lib/tenant-guard"
import { findStoreById } from "@/lib/tenant-directory"

export const dynamic = "force-dynamic"

/**
 * Example tenant-scoped read: GET /api/vendor/stores/:storeId
 * Rejects if the caller's store_id does not match the path.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ storeId: string }> },
) {
  const session = await readTenantSession()
  if (!session) return jsonError("Unauthorized", 401)

  const { storeId } = await context.params
  try {
    assertStoreAccess({ role: session.role, storeId: session.storeId }, storeId)
  } catch (err) {
    const scope = err as StoreScopeError
    return jsonError(scope.message, scope.status ?? 403)
  }

  const store = await findStoreById(storeId)
  if (!store) return jsonError("Store not found", 404)
  return jsonOk({
    id: store.id,
    name: store.name,
    status: store.status,
    businessNumber: store.businessNumber,
  })
}
