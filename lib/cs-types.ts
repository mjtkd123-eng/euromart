import type { Lang } from "@/lib/i18n"

export type CsLang = Lang
export type QuickReplyId = "track" | "cancel" | "missing" | "rider" | "human"

export type BoltOrderPhase = "preparing" | "rider_assigned" | "delivering" | "completed"

export interface OrderStatusResult {
  found: boolean
  orderId: string
  status?: BoltOrderPhase
  riderName?: string
  etaMinutes?: number
  lastLocation?: string
  storeName?: string
}

export interface CsQuickReply {
  id: QuickReplyId
  label: string
}

export interface CsChatTurn {
  reply: string
  lang: CsLang
  quickReplies: CsQuickReply[]
  escalate: boolean
  waitingForOrderId: boolean
  lastOrderId: string | null
  order?: OrderStatusResult
}
