import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { generateTemporaryPassword, hashPassword, isStrongPassword, verifyPassword } from "./password.ts"
import { assertStoreAccess, canAccessStore, StoreScopeError } from "./tenant-guard.ts"
import { canonicalizeRole, homePathForRole, loginPathForRole } from "./roles.ts"

describe("password hashing", () => {
  it("bcrypt hashes are not reversible and verify the original", async () => {
    const plain = "EuroMart-Owner-2026!"
    const hash = await hashPassword(plain)
    assert.equal(hash.startsWith("$2"), true)
    assert.notEqual(hash, plain)
    assert.equal(await verifyPassword(plain, hash), true)
    assert.equal(await verifyPassword("wrong-password", hash), false)
  })

  it("temporary passwords meet complexity", () => {
    const pwd = generateTemporaryPassword()
    assert.equal(pwd.length >= 16, true)
    assert.equal(isStrongPassword(pwd), true)
  })

  it("temporary passwords are unambiguous and verify against their own hash", async () => {
    const allowed = /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789]+$/
    for (let i = 0; i < 3; i++) {
      const pwd = generateTemporaryPassword()
      assert.equal(allowed.test(pwd), true)
      assert.equal(/[+O0Il1!@#$%]/.test(pwd), false)
      assert.equal(await verifyPassword(pwd, await hashPassword(pwd)), true)
    }
  })
})

describe("store_id tenant guard", () => {
  const storeA = "11111111-1111-1111-1111-111111111111"
  const storeB = "22222222-2222-2222-2222-222222222222"

  it("STORE_OWNER can only access their store", () => {
    const owner = { role: "owner" as const, storeId: storeA }
    assert.equal(canAccessStore(owner, storeA), true)
    assert.equal(canAccessStore(owner, storeB), false)
    assert.throws(() => assertStoreAccess(owner, storeB), StoreScopeError)
  })

  it("legacy vendor role still scopes to one store", () => {
    const owner = { role: "vendor" as const, storeId: storeA }
    assert.equal(canAccessStore(owner, storeA), true)
    assert.equal(canAccessStore(owner, storeB), false)
  })

  it("Super Admin may access any store but still has no password field", () => {
    const admin = { role: "admin" as const, storeId: null }
    assert.equal(canAccessStore(admin, storeA), true)
    assert.equal(canAccessStore(admin, storeB), true)
  })

  it("customers cannot access a store", () => {
    const customer = { role: "customer" as const, storeId: storeA }
    assert.equal(canAccessStore(customer, storeA), false)
  })
})

describe("split auth roles", () => {
  it("maps legacy vendor to owner", () => {
    assert.equal(canonicalizeRole("vendor"), "owner")
    assert.equal(canonicalizeRole("owner"), "owner")
    assert.equal(canonicalizeRole("admin"), "admin")
    assert.equal(canonicalizeRole("customer"), "customer")
  })

  it("sends each role to its own portal home", () => {
    assert.equal(homePathForRole("customer"), "/account")
    assert.equal(homePathForRole("owner"), "/owner/dashboard")
    assert.equal(homePathForRole("vendor"), "/owner/dashboard")
    assert.equal(homePathForRole("admin"), "/admin/dashboard")
    assert.equal(loginPathForRole("customer"), "/auth/login")
    assert.equal(loginPathForRole("owner"), "/owner/login")
    assert.equal(loginPathForRole("admin"), "/admin/login")
  })
})
