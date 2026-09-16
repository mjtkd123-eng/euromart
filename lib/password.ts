import { compare, hash, hashSync } from "bcryptjs"
import { randomBytes, createHash, timingSafeEqual } from "node:crypto"

/** Production cost. Demo still uses 12 — creation is an admin action, not a hot path. */
const BCRYPT_ROUNDS = 12

const DUMMY_HASH = hashSync("not-a-real-password", 8)

/** Unambiguous alphabet — no +/O/0/I/l/1 so handoff and OCR cannot swap characters. */
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const LOWER = "abcdefghijkmnopqrstuvwxyz"
const DIGITS = "23456789"
const TEMP_ALPHABET = UPPER + LOWER + DIGITS

export async function hashPassword(plain: string): Promise<string> {
  const digest = await hash(plain, BCRYPT_ROUNDS)
  if (!(await verifyPassword(plain, digest))) {
    throw new Error("bcrypt round-trip failed")
  }
  return digest
}

export async function verifyPassword(plain: string, storedHash: string | null | undefined): Promise<boolean> {
  const target = storedHash && storedHash.startsWith("$2") ? storedHash : DUMMY_HASH
  const ok = await compare(plain, target)
  return Boolean(storedHash) && ok
}

/** High-entropy one-time password shown to Super Admin once (never persisted in plain text). */
export function generateTemporaryPassword(length = 16): string {
  const size = Math.max(length, 12)
  const bytes = randomBytes(size + size)
  const chars: string[] = [
    UPPER[bytes[0] % UPPER.length],
    LOWER[bytes[1] % LOWER.length],
    DIGITS[bytes[2] % DIGITS.length],
  ]
  for (let i = 3; i < size; i++) {
    chars.push(TEMP_ALPHABET[bytes[i] % TEMP_ALPHABET.length])
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[size + i] % (i + 1)
    const tmp = chars[i]
    chars[i] = chars[j]
    chars[j] = tmp
  }
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
