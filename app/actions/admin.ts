"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getSessionProfile } from "@/lib/auth"

type Result = { ok: boolean; error?: string }

/** 로그인 사용자가 관리자인지 확인합니다. RLS도 이중으로 차단합니다. */
async function requireAdmin() {
  const profile = await getSessionProfile()
  if (!profile) return { error: "로그인이 필요합니다." as const }
  if (profile.role !== "admin") return { error: "관리자 권한이 필요합니다." as const }
  const supabase = await createClient()
  return { supabase, profile }
}

function revalidateAll() {
  revalidatePath("/admin")
  revalidatePath("/vendor")
  revalidatePath("/")
}

/* ------------------------------ 지역 ------------------------------ */

export async function upsertRegion(input: {
  id: string
  city: string
  country: string
  countryCode: string
  storeKo: string
  currencyCode: string
  deliveryFee: number
  freeDeliveryOver: number
  sort: number
  active: boolean
  isNew: boolean
}): Promise<Result> {
  const guard = await requireAdmin()
  if ("error" in guard) return { ok: false, error: guard.error }

  const id = input.id.trim().toLowerCase()
  if (!/^[a-z0-9-]+$/.test(id)) {
    return { ok: false, error: "지역 ID는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다." }
  }
  if (!input.city.trim()) return { ok: false, error: "도시명을 입력해주세요." }
  if (!input.storeKo.trim()) return { ok: false, error: "매장명을 입력해주세요." }
  if (!/^[A-Z]{3}$/.test(input.currencyCode)) {
    return { ok: false, error: "통화 코드는 3자리 대문자여야 합니다. (예: EUR)" }
  }
  if (!Number.isFinite(input.deliveryFee) || input.deliveryFee < 0) {
    return { ok: false, error: "배송비는 0 이상이어야 합니다." }
  }
  if (!Number.isFinite(input.freeDeliveryOver) || input.freeDeliveryOver < 0) {
    return { ok: false, error: "무료배송 기준은 0 이상이어야 합니다." }
  }

  // 통화가 등록되어 있는지 확인 (외래키 오류를 사용자 친화적 메시지로)
  const { data: currency } = await guard.supabase
    .from("currencies")
    .select("code")
    .eq("code", input.currencyCode)
    .maybeSingle()
  if (!currency) {
    return { ok: false, error: `통화 ${input.currencyCode}가 등록되지 않았습니다. 먼저 환율 탭에서 추가해주세요.` }
  }

  const payload = {
    city: input.city.trim(),
    country: input.country.trim(),
    country_code: input.countryCode.trim().toUpperCase(),
    store_ko: input.storeKo.trim(),
    currency_code: input.currencyCode,
    delivery_fee: input.deliveryFee,
    free_delivery_over: input.freeDeliveryOver,
    sort: input.sort,
    active: input.active,
  }

  const { error } = input.isNew
    ? await guard.supabase.from("regions").insert({ id, ...payload, store_en: input.storeKo.trim() })
    : await guard.supabase.from("regions").update(payload).eq("id", id)

  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate")) {
      return { ok: false, error: "이미 존재하는 지역 ID입니다." }
    }
    return { ok: false, error: error.message }
  }
  revalidateAll()
  return { ok: true }
}

export async function assignVendor(regionId: string, vendorId: string | null): Promise<Result> {
  const guard = await requireAdmin()
  if ("error" in guard) return { ok: false, error: guard.error }

  if (vendorId) {
    const { data: vendor } = await guard.supabase
      .from("profiles")
      .select("id, role")
      .eq("id", vendorId)
      .maybeSingle()
    if (!vendor) return { ok: false, error: "해당 사용자를 찾을 수 없습니다." }
    if (vendor.role !== "vendor" && vendor.role !== "admin") {
      return { ok: false, error: "판매자 역할인 사용자만 매장에 배정할 수 있습니다." }
    }

    // 한 판매자는 하나의 매장만 담당 — 기존 배정을 먼저 해제
    await guard.supabase
      .from("regions")
      .update({ vendor_id: null })
      .eq("vendor_id", vendorId)
      .neq("id", regionId)
  }

  const { error } = await guard.supabase
    .from("regions")
    .update({ vendor_id: vendorId })
    .eq("id", regionId)

  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}

/* ------------------------------ 사용자 ------------------------------ */

const ROLES = ["customer", "vendor", "admin"] as const

export async function updateUserRole(userId: string, role: string): Promise<Result> {
  const guard = await requireAdmin()
  if ("error" in guard) return { ok: false, error: guard.error }

  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { ok: false, error: "올바르지 않은 역할입니다." }
  }
  if (userId === guard.profile.id && role !== "admin") {
    return { ok: false, error: "본인의 관리자 권한은 해제할 수 없습니다." }
  }

  // 판매자 역할을 잃으면 담당 매장 배정도 함께 해제
  if (role !== "vendor" && role !== "admin") {
    await guard.supabase.from("regions").update({ vendor_id: null }).eq("vendor_id", userId)
  }

  const { error } = await guard.supabase.from("profiles").update({ role }).eq("id", userId)
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}

/* ---------------------------- 마스터 상품 ---------------------------- */

export async function upsertProduct(input: {
  id: string
  nameKo: string
  nameEn: string
  categoryId: string
  unit: string
  brand: string
  image: string
  isNew: boolean
}): Promise<Result> {
  const guard = await requireAdmin()
  if ("error" in guard) return { ok: false, error: guard.error }

  const id = input.id.trim().toLowerCase()
  if (!/^[a-z0-9-]+$/.test(id)) {
    return { ok: false, error: "상품 ID는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다." }
  }
  if (!input.nameKo.trim()) return { ok: false, error: "상품명(한글)을 입력해주세요." }
  if (!input.categoryId) return { ok: false, error: "카테고리를 선택해주세요." }

  const payload = {
    name_ko: input.nameKo.trim(),
    name_en: input.nameEn.trim() || input.nameKo.trim(),
    category_id: input.categoryId,
    unit: input.unit.trim(),
    brand: input.brand.trim(),
    image: input.image.trim() || "/placeholder.svg",
  }

  const { error } = input.isNew
    ? await guard.supabase.from("products").insert({ id, ...payload })
    : await guard.supabase.from("products").update(payload).eq("id", id)

  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate")) {
      return { ok: false, error: "이미 존재하는 상품 ID입니다." }
    }
    return { ok: false, error: error.message }
  }
  revalidateAll()
  return { ok: true }
}

export async function deleteProduct(productId: string): Promise<Result> {
  const guard = await requireAdmin()
  if ("error" in guard) return { ok: false, error: guard.error }

  const { count } = await guard.supabase
    .from("region_products")
    .select("product_id", { count: "exact", head: true })
    .eq("product_id", productId)

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `${count}개 매장에서 판매 중입니다. 먼저 각 매장에서 상품을 내려주세요.`,
    }
  }

  const { error } = await guard.supabase.from("products").delete().eq("id", productId)
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}

/* ------------------------------ 환율 ------------------------------ */

export async function upsertFxRate(input: {
  base: string
  quote: string
  rate: number
}): Promise<Result> {
  const guard = await requireAdmin()
  if ("error" in guard) return { ok: false, error: guard.error }

  const base = input.base.trim().toUpperCase()
  const quote = input.quote.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote)) {
    return { ok: false, error: "통화 코드는 3자리 대문자여야 합니다." }
  }
  if (base === quote) return { ok: false, error: "기준 통화와 대상 통화가 같을 수 없습니다." }
  if (!Number.isFinite(input.rate) || input.rate <= 0) {
    return { ok: false, error: "환율은 0보다 커야 합니다." }
  }

  const { error } = await guard.supabase.from("fx_rates").upsert(
    { base, quote, rate: input.rate, updated_at: new Date().toISOString() },
    { onConflict: "base,quote" },
  )

  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}
