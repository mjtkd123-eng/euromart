import bcrypt from "bcryptjs"
import { randomBytes, createHash, timingSafeEqual } from "node:crypto"

/** Production cost. Demo still uses 12 — creation is an admin action, not a hot path. */
const BCRYPT_ROUNDS = 12

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 8)

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  const target = hash && hash.startsWith("$2") ? hash : DUMMY_HASH
  const ok = await bcrypt.compare(plain, target)
  return Boolean(hash) && ok
}

/** High-entropy one-time password shown to Super Admin once (never persisted in plain text). */
export function generateTemporaryPassword(length = 16): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghijkmnopqrstuvwxyz"
  const digits = "23456789"
  const symbols = "!@#$%+"
  const all = upper + lower + digits + symbols
  const bytes = randomBytes(length)
  const chars = Array.from(bytes, (b) => all[b % all.length])
  chars[0] = upper[bytes[0] % upper.length]
  chars[1] = lower[bytes[1] % lower.length]
  chars[2] = digits[bytes[2] % digits.length]
  chars[3] = symbols[bytes[3] % symbols.length]
  return chars.join("")
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function generateActionToken(): string {
  return randomBytes(32).toString("hex")
}

export function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function isStrongPassword(plain: string): boolean {
  return (
    plain.length >= 10 &&
    /[A-Z]/.test(plain) &&
    /[a-z]/.test(plain) &&
    /[0-9]/.test(plain)
  )
}
