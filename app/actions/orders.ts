"use server"

import { createClient } from "@/lib/supabase/server"

export interface PlaceOrderInput {
  regionId: string
  customerName: string
  address: string
  phone: string
  promoCode?: string
  items: { productId: string; quantity: number }[]
}

export interface PlaceOrderResult {
  ok: boolean
  orderId?: string
  error?: string
}

/**
 * 주문 생성 — 재고/가격/할인/배송비는 모두 서버(place_order RPC)에서 검증·계산됩니다.
 * 클라이언트가 보낸 금액은 신뢰하지 않습니다.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  // 기본 입력 검증
  const name = input.customerName?.trim()
  const address = input.address?.trim()
  const phone = input.phone?.trim()
  if (!name || !address || !phone) {
    return { ok: false, error: "배송 정보를 모두 입력해 주세요." }
  }
  if (!input.items?.length) {
    return { ok: false, error: "장바구니가 비어 있습니다." }
  }

  // 라인 정규화(중복 상품 합산, 수량 정수/상한 검증)
  const merged = new Map<string, number>()
  for (const line of input.items) {
    if (!line.productId) continue
    const q = Math.floor(Number(line.quantity))
    if (!Number.isFinite(q) || q <= 0) {
      return { ok: false, error: "수량이 올바르지 않습니다." }
    }
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + q)
  }
  const items = [...merged.entries()].map(([product_id, quantity]) => ({ product_id, quantity }))
  if (items.some((i) => i.quantity > 99)) {
    return { ok: false, error: "상품당 최대 99개까지 주문할 수 있습니다." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("place_order", {
    p_region_id: input.regionId,
    p_customer_name: name,
    p_address: address,
    p_phone: phone,
    p_promo_code: input.promoCode?.trim() || null,
    p_items: items,
  })

  if (error) {
    console.error("[v0] place_order error:", error.message)
    return { ok: false, error: "주문 처리 중 오류가 발생했습니다. 재고를 확인해 주세요." }
  }
  return { ok: true, orderId: data as string }
}
