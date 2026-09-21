import "server-only"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { generateActionToken, generateTemporaryPassword, hashPassword, hashToken, isStrongPassword, verifyPassword } from "@/lib/password"
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_CUSTOMER_EMAIL,
  DEMO_CUSTOMER_PASSWORD,
  DEMO_OWNER_EMAIL,
  DEMO_OWNER_PASSWORD,
} from "@/lib/demo-admin-public"
import { canonicalizeRole, type AccountStatus, type Role } from "@/lib/roles"

export type StoreStatus = "pending" | "active" | "inactive"

export type ApplicationStatus = "submitted" | "under_review" | "approved" | "rejected"

export interface DirectoryUser {
  id: string
  email: string
  fullName: string
  role: Role
  storeId: string | null
  /** bcrypt hash only — never plaintext */
  passwordHash: string
  mustChangePassword: boolean
  passwordChangedAt: string | null
  accountStatus: AccountStatus
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
  storeEn?: string
  announcementKo?: string
  announcementEn?: string
  deliveryFee?: number
  freeDeliveryOver?: number
}

export interface DirectoryPromotion {
  id: string
  storeId: string
  code: string
  descriptionKo: string
  descriptionEn: string
  discountType: "percent" | "fixed"
  discountValue: number
  minOrder: number
  active: boolean
}

export interface DirectoryListingOverride {
  storeId: string
  productId: string
  price?: number
  stock?: number
  featured?: boolean
  active?: boolean
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
  ownerUserId: string | null
  address: string
  phone: string
  source: "offline" | "self_signup"
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
  promotions: DirectoryPromotion[]
  listingOverrides: DirectoryListingOverride[]
}

const FILE = path.join(process.cwd(), ".data", "tenant-auth.json")

async function empty(): Promise<DirectoryFile> {
  const now = new Date().toISOString()
  const adminId = crypto.randomUUID()
  const ownerId = "a11ce0e0-0000-4000-8000-000000000001"
  const customerId = "a11ce0e0-0000-4000-8000-0000000000c1"
  const storeId = "a11ce0e0-0000-4000-8000-0000000000aa"
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
        accountStatus: "active",
        createdAt: now,
      },
      {
        id: ownerId,
        email: DEMO_OWNER_EMAIL,
        fullName: "박서연",
        role: "owner",
        storeId,
        passwordHash: await hashPassword(DEMO_OWNER_PASSWORD),
        mustChangePassword: false,
        passwordChangedAt: now,
        accountStatus: "active",
        createdAt: now,
      },
      {
        id: customerId,
        email: DEMO_CUSTOMER_EMAIL,
        fullName: "김손님",
        role: "customer",
        storeId: null,
        passwordHash: await hashPassword(DEMO_CUSTOMER_PASSWORD),
        mustChangePassword: false,
        passwordChangedAt: now,
        accountStatus: "active",
        createdAt: now,
      },
    ],
    stores: [
      {
        id: storeId,
        name: "K-EuroMart 비엔나 1호점",
        legalName: "HanMart Vienna GmbH",
        businessNumber: "ATU-10998877",
        citySlug: "vienna",
        currencyCode: "EUR",
        address: "Kettenbrückengasse 19, 1050 Wien",
        status: "active",
        ownerUserId: ownerId,
        createdAt: now,
      },
    ],
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
        ownerUserId: null,
        address: "Kettenbrückengasse 21, 1050 Wien",
        phone: "+43 1 555 0199",
        source: "offline",
      },
    ],
    tokens: [],
    mail: [],
    promotions: [
      {
        id: `${storeId}:promo-welcome`,
        storeId,
        code: "KIMCHI10",
        descriptionKo: "김치·반찬 10% 할인",
        descriptionEn: "10% off kimchi & banchan",
        discountType: "percent",
        discountValue: 10,
        minOrder: 20,
        active: true,
      },
    ],
    listingOverrides: [],
  }
}

let writeQueue: Promise<void> = Promise.resolve()

function normalize(data: DirectoryFile): DirectoryFile {
  if (!Array.isArray(data.promotions)) {
    data.promotions = []
    const vienna = data.stores.find((s) => s.citySlug === "vienna")
    if (vienna) {
      data.promotions.push({
        id: `${vienna.id}:promo-welcome`,
        storeId: vienna.id,
        code: "KIMCHI10",
        descriptionKo: "김치·반찬 10% 할인",
        descriptionEn: "10% off kimchi & banchan",
        discountType: "percent",
        discountValue: 10,
        minOrder: 20,
        active: true,
      })
    }
  }
  if (!Array.isArray(data.listingOverrides)) data.listingOverrides = []
  for (const user of data.users) {
    user.role = canonicalizeRole(user.role)
    if (user.accountStatus !== "pending" && user.accountStatus !== "rejected") {
      user.accountStatus = "active"
    }
  }
  for (const app of data.applications) {
    if (app.ownerUserId === undefined) app.ownerUserId = null
    if (!app.address) app.address = ""
    if (!app.phone) app.phone = ""
    if (app.source !== "self_signup") app.source = "offline"
  }
  return data
}

async function loadUnlocked(): Promise<DirectoryFile> {
  try {
    const raw = await readFile(FILE, "utf8")
    const data = normalize(JSON.parse(raw) as DirectoryFile)
    const changed = await ensureDemoAccounts(data)
    if (changed) await persist(data)
    return data
  } catch {
    const seeded = await empty()
    await persist(seeded)
    return seeded
  }
}

async function ensureDemoAccounts(data: DirectoryFile): Promise<boolean> {
  let changed = false
  const now = new Date().toISOString()
  if (!data.users.some((u) => u.email.toLowerCase() === DEMO_CUSTOMER_EMAIL)) {
    data.users.push({
      id: "a11ce0e0-0000-4000-8000-0000000000c1",
      email: DEMO_CUSTOMER_EMAIL,
      fullName: "김손님",
      role: "customer",
      storeId: null,
      passwordHash: await hashPassword(DEMO_CUSTOMER_PASSWORD),
      mustChangePassword: false,
      passwordChangedAt: now,
      accountStatus: "active",
      createdAt: now,
    })
    changed = true
  }
  return changed
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
      .filter((u) => canonicalizeRole(u.role) === "owner")
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
      role: "owner",
      storeId,
      passwordHash,
      mustChangePassword: true,
      passwordChangedAt: null,
      accountStatus: "active",
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
    if (app.ownerUserId) {
      const owner = data.users.find((u) => u.id === app.ownerUserId)
      if (owner && canonicalizeRole(owner.role) === "owner") {
        owner.accountStatus = "rejected"
      }
    }
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

export async function listDirectoryPromotions(storeId: string): Promise<DirectoryPromotion[]> {
  return read((data) => data.promotions.filter((p) => p.storeId === storeId))
}

export async function upsertDirectoryPromotion(
  storeId: string,
  input: Omit<DirectoryPromotion, "id" | "storeId"> & { id?: string },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  return mutate((data) => {
    const code = input.code.trim().toUpperCase()
    const dup = data.promotions.find(
      (p) => p.storeId === storeId && p.code === code && p.id !== input.id,
    )
    if (dup) return { ok: false as const, error: "이미 존재하는 프로모션 코드입니다." }

    if (input.id) {
      const row = data.promotions.find((p) => p.id === input.id && p.storeId === storeId)
      if (!row) return { ok: false as const, error: "프로모션을 찾을 수 없습니다." }
      Object.assign(row, {
        code,
        descriptionKo: input.descriptionKo,
        descriptionEn: input.descriptionEn,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrder: input.minOrder,
        active: input.active,
      })
      return { ok: true as const, id: row.id }
    }

    const row: DirectoryPromotion = {
      id: crypto.randomUUID(),
      storeId,
      code,
      descriptionKo: input.descriptionKo,
      descriptionEn: input.descriptionEn,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrder: input.minOrder,
      active: input.active,
    }
    data.promotions.push(row)
    return { ok: true as const, id: row.id }
  })
}

export async function deleteDirectoryPromotion(storeId: string, promotionId: string): Promise<boolean> {
  return mutate((data) => {
    const before = data.promotions.length
    data.promotions = data.promotions.filter((p) => !(p.id === promotionId && p.storeId === storeId))
    return data.promotions.length < before
  })
}

export async function listListingOverrides(storeId: string): Promise<DirectoryListingOverride[]> {
  return read((data) => data.listingOverrides.filter((r) => r.storeId === storeId))
}

export async function upsertListingOverride(
  storeId: string,
  productId: string,
  patch: Omit<DirectoryListingOverride, "storeId" | "productId">,
): Promise<void> {
  await mutate((data) => {
    const row = data.listingOverrides.find((r) => r.storeId === storeId && r.productId === productId)
    if (row) Object.assign(row, patch)
    else data.listingOverrides.push({ storeId, productId, ...patch })
  })
}

export async function removeListingOverride(storeId: string, productId: string): Promise<void> {
  await mutate((data) => {
    data.listingOverrides = data.listingOverrides.filter(
      (r) => !(r.storeId === storeId && r.productId === productId),
    )
  })
}

export async function updateDirectoryStore(
  storeId: string,
  patch: Partial<
    Pick<
      DirectoryStore,
      | "name"
      | "storeEn"
      | "announcementKo"
      | "announcementEn"
      | "deliveryFee"
      | "freeDeliveryOver"
    >
  >,
): Promise<boolean> {
  return mutate((data) => {
    const store = data.stores.find((s) => s.id === storeId)
    if (!store) return false
    Object.assign(store, patch)
    return true
  })
}

export interface CustomerSignupInput {
  email: string
  password: string
  fullName: string
}

export async function signupCustomer(
  input: CustomerSignupInput,
): Promise<{ ok: true; user: Omit<DirectoryUser, "passwordHash"> } | { error: string }> {
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes("@")) return { error: "유효한 이메일이 필요합니다." }
  if (!isStrongPassword(input.password)) {
    return { error: "비밀번호는 10자 이상, 영문 대·소문자와 숫자를 포함해야 합니다." }
  }
  if (!input.fullName.trim()) return { error: "이름을 입력하세요." }

  return mutate(async (data) => {
    if (data.users.some((u) => u.email.toLowerCase() === email)) {
      return { error: "이미 가입된 이메일입니다." }
    }
    const now = new Date().toISOString()
    const user: DirectoryUser = {
      id: crypto.randomUUID(),
      email,
      fullName: input.fullName.trim(),
      role: "customer",
      storeId: null,
      passwordHash: await hashPassword(input.password),
      mustChangePassword: false,
      passwordChangedAt: now,
      accountStatus: "active",
      createdAt: now,
    }
    data.users.push(user)
    const { passwordHash: _omit, ...safe } = user
    return { ok: true as const, user: safe }
  })
}

export interface OwnerSignupInput {
  email: string
  password: string
  fullName: string
  storeName: string
  legalName: string
  businessNumber: string
  citySlug: string
  address: string
  phone: string
  documentsNote: string
}

export async function signupOwnerApplication(
  input: OwnerSignupInput,
): Promise<{ ok: true; applicationId: string } | { error: string }> {
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes("@")) return { error: "유효한 이메일이 필요합니다." }
  if (!isStrongPassword(input.password)) {
    return { error: "비밀번호는 10자 이상, 영문 대·소문자와 숫자를 포함해야 합니다." }
  }
  if (!input.fullName.trim()) return { error: "담당자 이름을 입력하세요." }
  if (!input.storeName.trim()) return { error: "매장명을 입력하세요." }
  if (!input.businessNumber.trim()) return { error: "사업자등록번호를 입력하세요." }

  return mutate(async (data) => {
    if (data.users.some((u) => u.email.toLowerCase() === email)) {
      return { error: "이미 등록된 이메일입니다." }
    }
    const now = new Date().toISOString()
    const userId = crypto.randomUUID()
    const applicationId = crypto.randomUUID()
    const owner: DirectoryUser = {
      id: userId,
      email,
      fullName: input.fullName.trim(),
      role: "owner",
      storeId: null,
      passwordHash: await hashPassword(input.password),
      mustChangePassword: false,
      passwordChangedAt: now,
      accountStatus: "pending",
      createdAt: now,
    }
    const application: DirectoryApplication = {
      id: applicationId,
      storeName: input.storeName.trim(),
      legalName: input.legalName.trim() || input.storeName.trim(),
      businessNumber: input.businessNumber.trim(),
      citySlug: input.citySlug.trim() || "budapest",
      contactEmail: email,
      contactName: input.fullName.trim(),
      documentsNote: input.documentsNote.trim() || "온라인 입점 신청",
      status: "submitted",
      rejectionReason: null,
      createdStoreId: null,
      createdAt: now,
      reviewedAt: null,
      ownerUserId: userId,
      address: input.address.trim(),
      phone: input.phone.trim(),
      source: "self_signup",
    }
    data.users.push(owner)
    data.applications.push(application)
    return { ok: true as const, applicationId }
  })
}

export async function approveOwnerApplication(
  applicationId: string,
): Promise<{ ok: true; storeId: string; email: string } | { error: string }> {
  return mutate((data) => {
    const app = data.applications.find((a) => a.id === applicationId)
    if (!app) return { error: "서류를 찾을 수 없습니다." }
    if (app.status === "approved") return { error: "이미 승인된 신청입니다." }
    if (app.status === "rejected") return { error: "반려된 신청은 승인할 수 없습니다." }
    if (!app.ownerUserId) {
      return { error: "온라인 가입 계정이 없습니다. 수동 발급 폼을 사용하세요." }
    }
    const owner = data.users.find((u) => u.id === app.ownerUserId)
    if (!owner) return { error: "업주 계정을 찾을 수 없습니다." }

    const now = new Date().toISOString()
    const storeId = crypto.randomUUID()
    const store: DirectoryStore = {
      id: storeId,
      name: app.storeName,
      legalName: app.legalName || app.storeName,
      businessNumber: app.businessNumber,
      citySlug: app.citySlug || "budapest",
      currencyCode: "EUR",
      address: app.address || "—",
      status: "active",
      ownerUserId: owner.id,
      createdAt: now,
    }
    data.stores.push(store)
    owner.role = "owner"
    owner.storeId = storeId
    owner.accountStatus = "active"
    app.status = "approved"
    app.createdStoreId = storeId
    app.reviewedAt = now
    return { ok: true as const, storeId, email: owner.email }
  })
}
