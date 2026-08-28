import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { ClaimView, OrderView, EvidenceView } from "./claims-types"

/** 지역 id → 도시명 캐시(간단히 매 호출 조회) */
async function regionCityMap(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("regions").select("id, city")
  const map = new Map<string, string>()
  for (const r of (data ?? []) as { id: string; city: string }[]) map.set(r.id, r.city)
  return map
}

/** 마감 지난 판매자 미응답 클레임을 자동 강제 환불 처리 (조회 전에 호출) */
export async function sweepOverdueClaims() {
  const supabase = await createClient()
  await supabase.rpc("auto_resolve_overdue_claims")
}

/** 클레임 증빙에 대한 서명 URL 생성 (10분 유효) */
async function loadEvidence(
  supabase: Awaited<ReturnType<typeof createClient>>,
  claimIds: string[],
): Promise<Map<string, EvidenceView[]>> {
  const map = new Map<string, EvidenceView[]>()
  if (claimIds.length === 0) return map

  const { data: rows } = await supabase
    .from("claim_evidence")
    .select("id, claim_id, storage_path")
    .in("claim_id", claimIds)

  const evidenceRows = (rows ?? []) as { id: string; claim_id: string; storage_path: string }[]
  for (const e of evidenceRows) {
    const { data: signed } = await supabase.storage
      .from("claim-evidence")
      .createSignedUrl(e.storage_path, 600)
    const list = map.get(e.claim_id) ?? []
    list.push({ id: e.id, url: signed?.signedUrl ?? null })
    map.set(e.claim_id, list)
  }
  return map
}

interface ClaimRow {
  id: string
  order_id: string
  order_item_id: string | null
  user_id: string
  region_id: string
  vendor_id: string | null
  reason: string
  description: string | null
  refund_amount: number
  currency_code: string
  status: string
  resolution_type: string | null
  vendor_response: string | null
  resolution_note: string | null
  deadline_at: string
  refunded_at: string | null
  created_at: string
}

async function mapClaims(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: ClaimRow[],
  opts: { includeCustomer?: boolean; includeVendorLabel?: boolean } = {},
): Promise<ClaimView[]> {
  if (rows.length === 0) return []
  const cities = await regionCityMap(supabase)
  const evidence = await loadEvidence(supabase, rows.map((r) => r.id))

  // 대상 상품명
  const itemIds = rows.map((r) => r.order_item_id).filter((v): v is string => !!v)
  const itemNames = new Map<string, string>()
  if (itemIds.length) {
    const { data: items } = await supabase
      .from("order_items")
      .select("id, name_ko, name_en")
      .in("id", itemIds)
    for (const it of (items ?? []) as { id: string; name_ko: string; name_en: string }[]) {
      itemNames.set(it.id, `${it.name_ko} · ${it.name_en}`)
    }
  }

  // 고객명 (관리자/판매자 뷰)
  const customerNames = new Map<string, string>()
  if (opts.includeCustomer) {
    const userIds = [...new Set(rows.map((r) => r.user_id))]
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
    for (const p of (profs ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
      customerNames.set(p.id, p.full_name || p.email || "고객")
    }
  }

  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    orderItemId: r.order_item_id,
    reason: r.reason as ClaimView["reason"],
    description: r.description,
    refundAmount: Number(r.refund_amount),
    currencyCode: r.currency_code,
    status: r.status as ClaimView["status"],
    resolutionType: (r.resolution_type as ClaimView["resolutionType"]) ?? null,
    vendorResponse: r.vendor_response,
    resolutionNote: r.resolution_note,
    deadlineAt: r.deadline_at,
    refundedAt: r.refunded_at,
    createdAt: r.created_at,
    regionCity: cities.get(r.region_id) ?? r.region_id,
    targetName: r.order_item_id ? (itemNames.get(r.order_item_id) ?? null) : null,
    customerName: opts.includeCustomer ? (customerNames.get(r.user_id) ?? null) : undefined,
    vendorLabel: opts.includeVendorLabel ? (cities.get(r.region_id) ?? r.region_id) : undefined,
    evidence: evidence.get(r.id) ?? [],
  }))
}

/* ------------------------------ 고객 뷰 ------------------------------ */

export async function fetchCustomerOrders(): Promise<{ orders: OrderView[]; claims: ClaimView[] }> {
  const supabase = await createClient()
  const cities = await regionCityMap(supabase)

  const { data: orderRows } = await supabase
    .from("orders")
    .select(
      "id, region_id, status, currency_code, subtotal, delivery_fee, discount, total, created_at, address",
    )
    .order("created_at", { ascending: false })

  const orders = (orderRows ?? []) as {
    id: string
    region_id: string
    status: string
    currency_code: string
    subtotal: number
    delivery_fee: number
    discount: number
    total: number
    created_at: string
    address: string
  }[]

  const orderIds = orders.map((o) => o.id)
  const itemsByOrder = new Map<string, OrderView["items"]>()
  if (orderIds.length) {
    const { data: itemRows } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, name_ko, name_en, price, quantity")
      .in("order_id", orderIds)
    for (const it of (itemRows ?? []) as {
      id: string
      order_id: string
      product_id: string
      name_ko: string
      name_en: string
      price: number
      quantity: number
    }[]) {
      const list = itemsByOrder.get(it.order_id) ?? []
      list.push({
        id: it.id,
        productId: it.product_id,
        nameKo: it.name_ko,
        nameEn: it.name_en,
        price: Number(it.price),
        quantity: it.quantity,
        lineTotal: Number(it.price) * it.quantity,
      })
      itemsByOrder.set(it.order_id, list)
    }
  }

  const orderViews: OrderView[] = orders.map((o) => ({
    id: o.id,
    regionId: o.region_id,
    regionCity: cities.get(o.region_id) ?? o.region_id,
    status: o.status,
    currencyCode: o.currency_code,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    discount: Number(o.discount),
    total: Number(o.total),
    createdAt: o.created_at,
    address: o.address,
    items: itemsByOrder.get(o.id) ?? [],
  }))

  const { data: claimRows } = await supabase
    .from("claims")
    .select("*")
    .order("created_at", { ascending: false })
  const claims = await mapClaims(supabase, (claimRows ?? []) as ClaimRow[])

  return { orders: orderViews, claims }
}

/* ------------------------------ 판매자 뷰 ------------------------------ */

export async function fetchVendorClaims(): Promise<{
  claims: ClaimView[]
  ledger: { id: string; entryType: string; amount: number; currencyCode: string; note: string | null; createdAt: string }[]
  penaltyPoints: number
  suspended: boolean
}> {
  const supabase = await createClient()

  const { data: claimRows } = await supabase
    .from("claims")
    .select("*")
    .order("created_at", { ascending: false })
  const claims = await mapClaims(supabase, (claimRows ?? []) as ClaimRow[], { includeCustomer: true })

  const { data: ledgerRows } = await supabase
    .from("vendor_settlement_ledger")
    .select("id, entry_type, amount, currency_code, note, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  const ledger = ((ledgerRows ?? []) as {
    id: string
    entry_type: string
    amount: number
    currency_code: string
    note: string | null
    created_at: string
  }[]).map((l) => ({
    id: l.id,
    entryType: l.entry_type,
    amount: Number(l.amount),
    currencyCode: l.currency_code,
    note: l.note,
    createdAt: l.created_at,
  }))

  const {
    data: { user },
  } = await supabase.auth.getUser()
  let penaltyPoints = 0
  let suspended = false
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("penalty_points, suspended")
      .eq("id", user.id)
      .single()
    penaltyPoints = prof?.penalty_points ?? 0
    suspended = prof?.suspended ?? false
  }

  return { claims, ledger, penaltyPoints, suspended }
}

/* ------------------------------ 관리자 뷰 ------------------------------ */

export async function fetchAdminClaims(): Promise<ClaimView[]> {
  const supabase = await createClient()
  const { data: claimRows } = await supabase
    .from("claims")
    .select("*")
    .order("created_at", { ascending: false })
  return mapClaims(supabase, (claimRows ?? []) as ClaimRow[], {
    includeCustomer: true,
    includeVendorLabel: true,
  })
}
