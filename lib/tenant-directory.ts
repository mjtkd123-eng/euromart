import "server-only"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { generateActionToken, generateTemporaryPassword, hashPassword, hashToken, verifyPassword } from "@/lib/password"
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/demo-admin-public"

export type StoreStatus = "pending" | "active" | "inactive"

export type ApplicationStatus = "submitted" | "under_review" | "approved" | "rejected"

export interface DirectoryUser {
  id: string
  email: string
  fullName: string
  role: "vendor" | "admin"
  storeId: string | null
  /** bcrypt hash only — never plaintext */
  passwordHash: string
  mustChangePassword: boolean
  passwordChangedAt: string | null
  createdAt: string
}

export interface DirectoryStore {
  id: string
  name: string
  legalName: string
  businessNumber: string
  citySlug: string
  currencyCode: string
  address: string
  status: StoreStatus
  ownerUserId: string
  createdAt: string
}

export interface DirectoryApplication {
  id: string
  storeName: string
  legalName: string
  businessNumber: string
  citySlug: string
  contactEmail: string
  contactName: string
  documentsNote: string
  status: ApplicationStatus
  rejectionReason: string | null
  createdStoreId: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface DirectoryToken {
  id: string
  userId: string
  purpose: "invite" | "password_reset"
  tokenHash: string
  expiresAt: string
  usedAt: string | null
}

export interface MailOutboxRow {
  id: string
  to: string
  subject: string
  bodyRedacted: string
  createdAt: string
}

interface DirectoryFile {
  users: DirectoryUser[]
  stores: DirectoryStore[]
  applications: DirectoryApplication[]
  tokens: DirectoryToken[]
  mail: MailOutboxRow[]
}

const FILE = path.join(process.cwd(), ".data", "tenant-auth.json")

async function empty(): Promise<DirectoryFile> {
  const now = new Date().toISOString()
  const adminId = crypto.randomUUID()
  return {
    users: [
      {
        id: adminId,
        email: DEMO_ADMIN_EMAIL,
        fullName: "K-EuroMart Super Admin",
        role: "admin",
        storeId: null,
        passwordHash: await hashPassword(DEMO_ADMIN_PASSWORD),
        mustChangePassword: false,
        passwordChangedAt: now,
        createdAt: now,
      },
    ],
    stores: [],
    applications: [
      {
        id: crypto.randomUUID(),
        storeName: "K-EuroMart 비엔나 2호점",
        legalName: "HanMart Vienna GmbH",
        businessNumber: "ATU-12345678",
        citySlug: "vienna",
        contactEmail: "owner.vienna@example.com",
        contactName: "박서연",
        documentsNote: "사업자등록증 · PL 보험 증서 오프라인 접수 (서류함 #VIE-04)",
        status: "submitted",
        rejectionReason: null,
        createdStoreId: null,
        createdAt: now,
        reviewedAt: null,
      },
    ],
    tokens: [],
    mail: [],
  }
}

let writeQueue: Promise<void> = Promise.resolve()

async function loadUnlocked(): Promise<DirectoryFile> {
  try {
    const raw = await readFile(FILE, "utf8")
    return JSON.parse(raw) as DirectoryFile
  } catch {
    const seeded = await empty()
    await persist(seeded)
    return seeded
  }
}

async function persist(data: DirectoryFile): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true })
  await writeFile(FILE, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 })
}

function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn)
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function mutate<T>(fn: (data: DirectoryFile) => Promise<T> | T): Promise<T> {
  return runExclusive(async () => {
    const data = await loadUnlocked()
    const result = await fn(data)
    await persist(data)
    return result
  })
}

function read<T>(fn: (data: DirectoryFile) => T): Promise<T> {
  return runExclusive(async () => fn(await loadUnlocked()))
}

export async function listApplications(): Promise<DirectoryApplication[]> {
  return read((data) => [...data.applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export async function listStores(): Promise<DirectoryStore[]> {
  return read((data) => [...data.stores].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export async function listOwners(): Promise<Omit<DirectoryUser, "passwordHash">[]> {
  return read((data) =>
    data.users
      .filter((u) => u.role === "vendor")
      .map(({ passwordHash: _h, ...rest }) => rest),
  )
}

export async function listMailOutbox(): Promise<MailOutboxRow[]> {
  return read((data) => [...data.mail].slice(0, 20))
}

export async function findUserByEmail(email: string): Promise<DirectoryUser | null> {
  const needle = email.trim().toLowerCase()
  return read((data) => data.users.find((u) => u.email.toLowerCase() === needle) ?? null)
}

export async function findUserById(id: string): Promise<DirectoryUser | null> {
  return read((data) => data.users.find((u) => u.id === id) ?? null)
}

export async function findStoreById(id: string): Promise<DirectoryStore | null> {
  return read((data) => data.stores.find((s) => s.id === id) ?? null)
}

export async function authenticateDirectory(
  email: string,
  password: string,
): Promise<DirectoryUser | null> {
  const user = await findUserByEmail(email)
  const ok = await verifyPassword(password, user?.passwordHash)
  if (!user || !ok) return null
  return user
}

export async function updateDirectoryPassword(userId: string, newPlain: string): Promise<boolean> {
  return mutate(async (data) => {
    const user = data.users.find((u) => u.id === userId)
    if (!user) return false
    user.passwordHash = await hashPassword(newPlain)
    user.mustChangePassword = false
    user.passwordChangedAt = new Date().toISOString()
    data.tokens = data.tokens.map((t) =>
      t.userId === userId && !t.usedAt ? { ...t, usedAt: new Date().toISOString() } : t,
    )
    return true
  })
}

export interface CreateStoreInput {
  storeName: string
  legalName: string
  businessNumber: string
  citySlug: string
  address: string
  ownerEmail: string
  ownerName: string
  applicationId?: string | null
}

export interface CreateStoreResult {
  store: DirectoryStore
  owner: Omit<DirectoryUser, "passwordHash">
  temporaryPassword: string
  inviteToken: string
  inviteExpiresAt: string
}

export async function createStoreAndOwner(input: CreateStoreInput): Promise<CreateStoreResult | { error: string }> {
  const email = input.ownerEmail.trim().toLowerCase()
  if (!email || !email.includes("@")) return { error: "유효한 업주 이메일이 필요합니다." }
  if (!input.storeName.trim()) return { error: "매장명을 입력하세요." }
  if (!input.businessNumber.trim()) return { error: "사업자등록번호를 입력하세요." }

  return mutate(async (data) => {
    if (data.users.some((u) => u.email.toLowerCase() === email)) {
      return { error: "이미 발급된 이메일입니다." }
    }

    const now = new Date().toISOString()
    const storeId = crypto.randomUUID()
    const userId = crypto.randomUUID()
    const temporaryPassword = generateTemporaryPassword()
    const inviteToken = generateActionToken()
    const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const store: DirectoryStore = {
      id: storeId,
      name: input.storeName.trim(),
      legalName: input.legalName.trim() || input.storeName.trim(),
      businessNumber: input.businessNumber.trim(),
      citySlug: input.citySlug.trim() || "budapest",
      currencyCode: "EUR",
      address: input.address.trim() || "—",
      status: "active",
      ownerUserId: userId,
      createdAt: now,
    }

    let passwordHash: string
    try {
      passwordHash = await hashPassword(temporaryPassword)
    } catch {
      return { error: "비밀번호 해시 생성에 실패했습니다. 다시 발급하세요." }
    }

    const owner: DirectoryUser = {
      id: userId,
      email,
      fullName: input.ownerName.trim() || email,
      role: "vendor",
      storeId,
      passwordHash,
      mustChangePassword: true,
      passwordChangedAt: null,
      createdAt: now,
    }

    data.stores.push(store)
    data.users.push(owner)
    data.tokens.push({
      id: crypto.randomUUID(),
      userId,
      purpose: "invite",
      tokenHash: hashToken(inviteToken),
      expiresAt: inviteExpiresAt,
      usedAt: null,
    })

    if (input.applicationId) {
      const app = data.applications.find((a) => a.id === input.applicationId)
      if (app) {
        app.status = "approved"
        app.createdStoreId = storeId
        app.reviewedAt = now
      }
    }

    const { passwordHash: _omit, ...safeOwner } = owner
    return { store, owner: safeOwner, temporaryPassword, inviteToken, inviteExpiresAt }
  })
}

export async function rejectApplication(id: string, reason: string): Promise<boolean> {
  return mutate((data) => {
    const app = data.applications.find((a) => a.id === id)
    if (!app || app.status === "approved") return false
    app.status = "rejected"
    app.rejectionReason = reason.trim() || "서류 미비"
    app.reviewedAt = new Date().toISOString()
    return true
  })
}

export async function setStoreStatus(storeId: string, status: StoreStatus): Promise<boolean> {
  return mutate((data) => {
    const store = data.stores.find((s) => s.id === storeId)
    if (!store) return false
    store.status = status
    return true
  })
}

export async function issueResetToken(email: string): Promise<{ token: string; userId: string } | null> {
  const user = await findUserByEmail(email)
  if (!user) return null
  const token = generateActionToken()
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  await mutate((data) => {
    data.tokens.push({
      id: crypto.randomUUID(),
      userId: user.id,
      purpose: "password_reset",
      tokenHash: hashToken(token),
      expiresAt,
      usedAt: null,
    })
  })
  return { token, userId: user.id }
}

export async function consumeActionToken(
  token: string,
  purpose: "invite" | "password_reset",
): Promise<DirectoryUser | null> {
  const tokenHash = hashToken(token)
  return mutate((data) => {
    const row = data.tokens.find(
      (t) => t.tokenHash === tokenHash && t.purpose === purpose && !t.usedAt && t.expiresAt > new Date().toISOString(),
    )
    if (!row) return null
    row.usedAt = new Date().toISOString()
    return data.users.find((u) => u.id === row.userId) ?? null
  })
}

export async function recordMail(to: string, subject: string, body: string): Promise<void> {
  const redacted = body.replace(/임시 비밀번호:.*$/gm, "임시 비밀번호: ••••••••")
    .replace(/Temporary password:.*$/gim, "Temporary password: ••••••••")
  await mutate((data) => {
    data.mail.unshift({
      id: crypto.randomUUID(),
      to,
      subject,
      bodyRedacted: redacted.slice(0, 2000),
      createdAt: new Date().toISOString(),
    })
    data.mail = data.mail.slice(0, 50)
  })
}
