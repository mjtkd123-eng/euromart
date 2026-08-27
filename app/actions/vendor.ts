"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getSessionProfile } from "@/lib/auth"

type Result = { ok: boolean; error?: string }

/**
 * 로그인 사용자가 판매자이며, 대상 지역이 본인에게 배정된 매장인지 확인합니다.
 * RLS가 이미 서버측에서 차단하지만, 명확한 오류 메시지를 위해 먼저 검사합니다.
 */
async function requireVendorRegion(regionId: string) {
  const profile = await getSessionProfile()
  if (!profile) return { error: "로그인이 필요합니다." as const }
  if (profile.role !== "vendor" && profile.role !== "admin") {
    return { error: "판매자 권한이 필요합니다." as const }
  }

  const supabase = await createClient()
  const { data } = await supabase.from("regions").select("id, vendor_id").eq("id", regionId).maybeSingle()

  if (!data) return { error: "매장을 찾을 수 없습니다." as const }
  if (profile.role === "vendor" && data.vendor_id !== profile.id) {
    return { error: "이 매장에 대한 권한이 없습니다." as const }
  }
  return { supabase, profile }
}

/* --------------------------- 매장 정보 수정 --------------------------- */

export async function updateStore(input: {
  regionId: string
  storeKo: string
  storeEn: string
  announcementKo: string
  announcementEn: string
  heroTitleKo: string
  heroTitleEn: string
  heroSubtitleKo: string
  heroSubtitleEn: string
  deliveryFee: number
  freeDeliveryOver: number
}): Promise<Result> {
  const guard = await requireVendorRegion(input.regionId)
  if ("error" in guard) return { ok: false, error: guard.error }

  if (!input.storeKo.trim()) return { ok: false, error: "매장명(한글)을 입력해주세요." }
  if (!Number.isFinite(input.deliveryFee) || input.deliveryFee < 0) {
    return { ok: false, error: "배송비는 0 이상이어야 합니다." }
  }
  if (!Number.isFinite(input.freeDeliveryOver) || input.freeDeliveryOver < 0) {
    return { ok: false, error: "무료배송 기준 금액은 0 이상이어야 합니다." }
  }

  const { error } = await guard.supabase
    .from("regions")
    .update({
      store_ko: input.storeKo.trim(),
      store_en: input.storeEn.trim(),
      announcement_ko: input.announcementKo.trim(),
      announcement_en: input.announcementEn.trim(),
      hero_title_ko: input.heroTitleKo.trim(),
      hero_title_en: input.heroTitleEn.trim(),
      hero_subtitle_ko: input.heroSubtitleKo.trim(),
      hero_subtitle_en: input.heroSubtitleEn.trim(),
      delivery_fee: input.deliveryFee,
      free_delivery_over: input.freeDeliveryOver,
    })
    .eq("id", input.regionId)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/vendor")
  revalidatePath("/")
  return { ok: true }
}

/* ---------------------------- 판매 상품 ---------------------------- */

export async function upsertListing(input: {
  regionId: string
  productId: string
  price: number
  stock: number
  featured: boolean
  active: boolean
}): Promise<Result> {
  const guard = await requireVendorRegion(input.regionId)
  if ("error" in guard) return { ok: false, error: guard.error }

  if (!Number.isFinite(input.price) || input.price <= 0) {
    return { ok: false, error: "가격은 0보다 커야 합니다." }
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { ok: false, error: "재고는 0 이상의 정수여야 합니다." }
  }

  const { error } = await guard.supabase.from("region_products").upsert(
    {
      region_id: input.regionId,
      product_id: input.productId,
      price: input.price,
      stock: input.stock,
      featured: input.featured,
      active: input.active,
    },
    { onConflict: "region_id,product_id" },
  )

  if (error) return { ok: false, error: error.message }
  revalidatePath("/vendor")
  revalidatePath("/")
  return { ok: true }
}

export async function deleteListing(regionId: string, listingId: string): Promise<Result> {
  const guard = await requireVendorRegion(regionId)
  if ("error" in guard) return { ok: false, error: guard.error }

  const { error } = await guard.supabase
    .from("region_products")
    .delete()
    .eq("id", listingId)
    .eq("region_id", regionId)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/vendor")
  revalidatePath("/")
  return { ok: true }
}

/* ---------------------------- 프로모션 ---------------------------- */

export async function upsertPromotion(input: {
  regionId: string
  id?: string
  code: string
  descriptionKo: string
  descriptionEn: string
  discountType: "percent" | "fixed"
  discountValue: number
  minOrder: number
  active: boolean
}): Promise<Result> {
  const guard = await requireVendorRegion(input.regionId)
  if ("error" in guard) return { ok: false, error: guard.error }

  const code = input.code.trim().toUpperCase()
  if (!code) return { ok: false, error: "프로모션 코드를 입력해주세요." }
  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
    return { ok: false, error: "할인값은 0보다 커야 합니다." }
  }
  if (input.discountType === "percent" && input.discountValue > 100) {
    return { ok: false, error: "퍼센트 할인은 100을 넘을 수 없습니다." }
  }
  if (!Number.isFinite(input.minOrder) || input.minOrder < 0) {
    return { ok: false, error: "최소 주문금액은 0 이상이어야 합니다." }
  }

  const payload = {
    region_id: input.regionId,
    code,
    description_ko: input.descriptionKo.trim(),
    description_en: input.descriptionEn.trim(),
    discount_type: input.discountType,
    discount_value: input.discountValue,
    min_order: input.minOrder,
    active: input.active,
  }

  const { error } = input.id
    ? await guard.supabase.from("promotions").update(payload).eq("id", input.id).eq("region_id", input.regionId)
    : await guard.supabase.from("promotions").insert(payload)

  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate")) {
      return { ok: false, error: "이미 존재하는 프로모션 코드입니다." }
    }
    return { ok: false, error: error.message }
  }
  revalidatePath("/vendor")
  return { ok: true }
}

export async function deletePromotion(regionId: string, promotionId: string): Promise<Result> {
  const guard = await requireVendorRegion(regionId)
  if ("error" in guard) return { ok: false, error: guard.error }

  const { error } = await guard.supabase
    .from("promotions")
    .delete()
    .eq("id", promotionId)
    .eq("region_id", regionId)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/vendor")
  return { ok: true }
}

/* ----------------------------- 주문 상태 ----------------------------- */

const ORDER_STATUSES = [
  "pending", // 주문 접수
  "packed", // 포장 완료
  "awaiting_courier", // Bolt 배달 호출 대기
  "shipped", // 배달중
  "delivered", // 배달 완료
  "cancelled", // 취소
  // 하위 호환: 기존 데이터에 남아있을 수 있는 상태값
  "confirmed",
] as const

export async function updateOrderStatus(
  regionId: string,
  orderId: string,
  status: string,
): Promise<Result> {
  const guard = await requireVendorRegion(regionId)
  if ("error" in guard) return { ok: false, error: guard.error }

  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return { ok: false, error: "올바르지 않은 주문 상태입니다." }
  }

  const { error } = await guard.supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("region_id", regionId)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/vendor")
  return { ok: true }
}

/* --------------------------- 재고 즉시 수정 --------------------------- */

/**
 * 대시보드 요약 화면에서 품절 임박 상품의 재고만 빠르게 갱신합니다.
 * 가격 등 다른 필드는 건드리지 않습니다.
 */
export async function quickUpdateStock(
  regionId: string,
  listingId: string,
  stock: number,
): Promise<Result> {
  const guard = await requireVendorRegion(regionId)
  if ("error" in guard) return { ok: false, error: guard.error }

  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "재고는 0 이상의 정수여야 합니다." }
  }
  if (stock > 100000) {
    return { ok: false, error: "재고 수량이 너무 큽니다." }
  }

  const { error } = await guard.supabase
    .from("region_products")
    .update({ stock })
    .eq("id", listingId)
    .eq("region_id", regionId)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/vendor")
  revalidatePath("/")
  return { ok: true }
}
