import "server-only"

import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import type { BoltOrderPhase, OrderStatusResult } from "@/lib/cs-types"

export type { BoltOrderPhase, OrderStatusResult }

const DEMO_ORDERS: Record<string, Omit<OrderStatusResult, "found" | "orderId">> = {
  "12345": {
    status: "delivering",
    riderName: "Bence K.",
    etaMinutes: 10,
    lastLocation: "Budapest VII",
    storeName: "K-EuroMart Budapest",
  },
  "KEM-12345": {
    status: "delivering",
    riderName: "Bence K.",
    etaMinutes: 10,
    lastLocation: "Budapest VII",
    storeName: "K-EuroMart Budapest",
  },
  "KEM-8888": {
    status: "preparing",
    storeName: "K-EuroMart Berlin",
  },
  "KEM-7777": {
    status: "rider_assigned",
    riderName: "Anna S.",
    etaMinutes: 18,
    lastLocation: "Berlin Mitte pickup counter",
    storeName: "K-EuroMart Berlin",
  },
  "KEM-1001": {
    status: "completed",
    storeName: "K-EuroMart Paris",
  },
}

export function normalizeOrderId(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "")
}

/** 메시지에서 주문번호 후보를 뽑습니다. */
export function extractOrderId(text: string): string | null {
  const upper = text.toUpperCase()
  const tagged = upper.match(/\bKEM[-–]?\d{3,}\b/)
  if (tagged) return tagged[0].replace("–", "-")
  const digits = text.match(/\b\d{4,6}\b/)
  if (digits) return digits[0]
  return null
}

function mapDbStatus(status: string): BoltOrderPhase | null {
  switch (status) {
    case "paid":
    case "accepted":
    case "preparing":
    case "ready":
    case "awaiting_payment":
      return "preparing"
    case "awaiting_courier":
      return "rider_assigned"
    case "delivering":
      return "delivering"
    case "completed":
      return "completed"
    default:
      return null
  }
}

/**
 * get_order_status(order_id)
 * 데모 카탈로그를 먼저 조회하고, Supabase가 있으면 실제 주문도 확인합니다.
 */
export async function getOrderStatus(orderId: string): Promise<OrderStatusResult> {
  const id = normalizeOrderId(orderId)
  if (!/^[A-Z0-9-]{3,40}$/.test(id)) {
    return { found: false, orderId: id }
  }
  const demo = DEMO_ORDERS[id] ?? DEMO_ORDERS[`KEM-${id}`]
  if (demo) {
    return { found: true, orderId: DEMO_ORDERS[id] ? id : `KEM-${id}`, ...demo }
  }

  if (!isSupabaseConfigured()) {
    return { found: false, orderId: id }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, stores(name)")
      .or(`id.eq.${id},id.ilike.%${id}%`)
      .limit(1)
      .maybeSingle()

    if (error || !data) return { found: false, orderId: id }

    const phase = mapDbStatus(String((data as { status: string }).status))
    if (!phase) return { found: false, orderId: id }

    const store = (data as { stores?: { name?: string } | { name?: string }[] }).stores
    const storeName = Array.isArray(store) ? store[0]?.name : store?.name

    return {
      found: true,
      orderId: String((data as { id: string }).id),
      status: phase,
      storeName,
    }
  } catch {
    return { found: false, orderId: id }
  }
}
