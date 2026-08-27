"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface ActionResult {
  ok: boolean
  error?: string
}

/**
 * 모든 액션은 사용자 세션 클라이언트를 사용합니다.
 * 따라서 RLS(업주는 자신의 region 만) 가 그대로 적용되어 권한 우회가 불가능합니다.
 */

function toNumber(value: FormDataEntryValue | null): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/* --------------------------- 매장 설정 --------------------------- */

export async function updateStoreSettings(formData: FormData): Promise<ActionResult> {
  const regionId = String(formData.get("regionId") ?? "")
  if (!regionId) return { ok: false, error: "매장을 찾을 수 없습니다." }

  const deliveryFee = toNumber(formData.get("deliveryFee"))
  const freeDeliveryOver = toNumber(formData.get("freeDeliveryOver"))
  if (deliveryFee < 0 || freeDeliveryOver < 0) {
    return { ok: false, error: "배송비와 무료배송 기준은 0 이상이어야 합니다." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("regions")
    .update({
      store_ko: String(formData.get("storeKo") ?? "").trim(),
      store_en: String(formData.get("storeEn") ?? "").trim(),
      announcement_ko: String(formData.get("announcementKo") ?? "").trim(),
      announcement_en: String(formData.get("announcementEn") ?? "").trim(),
      hero_title_ko: String(formData.get("heroTitleKo") ?? "").trim(),
      hero_title_en: String(formData.get("heroTitleEn") ?? "").trim(),
      hero_subtitle_ko: String(formData.get("heroSubtitleKo") ?? "").trim(),
      hero_subtitle_en: String(formData.get("heroSubtitleEn") ?? "").trim(),
      delivery_fee: deliveryFee,
      free_delivery_over: freeDeliveryOver,
    })
    .eq("id", regionId)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/vendor")
  revalidatePath("/")
  return { ok: true }
}

/* --------------------------- 상품 / 재고 --------------------------- */

export async function updateRegionProduct(input: {
  rowId: string
  price: number
  stock: number
  featured: boolean
  active: boolean
}): Promise<ActionResult> {
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "가격이 올바르지 않습니다." }
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { ok: false, error: "재고는 0 이상의 정수여야 합니다." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("region_products")
    .update({
      price: input.price,
      stock: input.stock,
      featured: input.featured,
      active: input.active,
    })
    .eq("id", input.rowId)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/vendor")
  revalidatePath("/")
  return { ok: true }
}

/** 마스터 카탈로그의 상품을 내 매장에 추가합니다. */
export async function addProductToStore(input: {
  regionId: string
  productId: string
  price: number
  stock: number
}): Promise<ActionResult> {
  if (!input.productId) return { ok: false, error: "상품을 선택하세요." }
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "가격이 올바르지 않습니다." }
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { ok: false, error: "재고는 0 이상의 정수여야 합니다." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("region_products").insert({
    region_id: input.regionId,
    product_id: input.productId,
    price: input.price,
    stock: input.stock,
    featured: false,
    active: true,
  })

  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate")) {
      return { ok: false, error: "이미 매장에 등록된 상품입니다." }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath("/vendor")
  revalidatePath("/")
  return { ok: true }
}

/* ---------------------------- 프로모션 ---------------------------- */

export async function upsertPromotion(input: {
  id?: string
  regionId: string
  code: string
  descriptionKo: string
  discountType: "percent" | "fixed"
  discountValue: number
  minOrder: number
  active: boolean
}): Promise<ActionResult> {
  const code = input.code.trim().toUpperCase()
  if (!code) return { ok: false, error: "프로모션 코드를 입력하세요." }
  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
    return { ok: false, error: "할인값은 0보다 커야 합니다." }
  }
  if (input.discountType === "percent" && input.discountValue > 100) {
    return { ok: false, error: "퍼센트 할인은 100을 넘을 수 없습니다." }
  }
  if (input.minOrder < 0) return { ok: false, error: "최소 주문 금액은 0 이상이어야 합니다." }

  const supabase = await createClient()
  const payload = {
    region_id: input.regionId,
    code,
    description_ko: input.descriptionKo.trim(),
    description_en: input.descriptionKo.trim(),
    discount_type: input.discountType,
    discount_value: input.discountValue,
    min_order: input.minOrder,
    active: input.active,
  }

  const { error } = input.id
    ? await supabase.from("promotions").update(payload).eq("id", input.id)
    : await supabase.from("promotions").insert(payload)

  if (error) {
    if (error.message.includes("duplicate")) {
      return { ok: false, error: "같은 코드의 프로모션이 이미 있습니다." }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath("/vendor")
  return { ok: true }
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from("promotions").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/vendor")
  return { ok: true }
}

/* ----------------------------- 주문 ----------------------------- */

const ORDER_STATUSES = ["paid", "preparing", "shipped", "delivered", "cancelled"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return { ok: false, error: "허용되지 않은 주문 상태입니다." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("orders").update({ status }).eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/vendor")
  revalidatePath("/admin")
  return { ok: true }
}
