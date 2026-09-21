/**
 * Tenant isolation: a store owner may only touch their own store_id.
 * Super Admin may operate across stores but never reads a password hash for display.
 */

export type Actor = {
  role: "customer" | "owner" | "admin" | "vendor" | string
  storeId: string | null
}

function isAdmin(role: string | null | undefined): boolean {
  return role === "admin"
}

function isOwner(role: string | null | undefined): boolean {
  return role === "owner" || role === "vendor"
}

export function canAccessStore(actor: Actor, targetStoreId: string): boolean {
  if (!targetStoreId) return false
  if (isAdmin(actor.role)) return true
  if (!isOwner(actor.role)) return false
  return actor.storeId === targetStoreId
}

export class StoreScopeError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

export function assertStoreAccess(actor: Actor, targetStoreId: string): void {
  if (!actor) throw new StoreScopeError("Unauthorized", 401)
  if (isAdmin(actor.role)) return
  if (!isOwner(actor.role)) throw new StoreScopeError("Forbidden", 403)
  if (!actor.storeId || actor.storeId !== targetStoreId) {
    throw new StoreScopeError("store_id mismatch: this account cannot access another store", 403)
  }
}
