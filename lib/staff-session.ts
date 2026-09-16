/**
 * HMAC-signed tenant session cookie. Edge-safe (Web Crypto).
 * Payload never includes a password — only ids, role, and first-login flag.
 */

export const TENANT_COOKIE = "kem_tenant"

export type StaffRole = "vendor" | "admin"

export interface TenantSession {
  sub: string
  email: string
  role: StaffRole
  storeId: string | null
  mustChangePassword: boolean
  exp: number
}

const TTL_SEC = 60 * 60 * 12

function sessionSecret(): string {
  return process.env.STAFF_SESSION_SECRET || "kem-demo-session-not-for-production"
}

function b64url(data: Uint8Array): string {
  let bin = ""
  for (const byte of data) bin += String.fromCharCode(byte)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function unb64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  return b64url(new Uint8Array(sig))
}

export async function encodeTenantSession(
  input: Omit<TenantSession, "exp"> & { exp?: number },
): Promise<string> {
  const payload: TenantSession = {
    ...input,
    exp: input.exp ?? Math.floor(Date.now() / 1000) + TTL_SEC,
  }
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)))
  const sig = await hmac(body)
  return `${body}.${sig}`
}

export async function decodeTenantSession(token: string | undefined | null): Promise<TenantSession | null> {
  if (!token || !token.includes(".")) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = await hmac(body)
  if (expected.length !== sig.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  if (diff !== 0) return null
  try {
    const json = new TextDecoder().decode(unb64url(body))
    const payload = JSON.parse(json) as TenantSession
    if (!payload.sub || !payload.role || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function tenantCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_SEC,
  }
}
