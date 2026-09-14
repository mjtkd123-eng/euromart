/**
 * K-EuroMart 환불/분쟁 중재 시스템 — 공유 타입 & 라벨
 * ====================================================
 * 클라이언트/서버가 함께 사용하는 "모양(shape)"과 표시용 라벨만 정의합니다.
 */

export type ClaimReason = "expired" | "spoiled"
export type ClaimStatus = "pending_vendor" | "mediation" | "refunded" | "rejected"
export type ResolutionType = "vendor_approved" | "auto_forced" | "admin_refund" | "admin_denied"
export type PenaltyType = "none" | "warning" | "rank_down" | "suspension"

/** 신고 대상 주문 아이템 */
export interface OrderItemView {
  id: string
  productId: string
  nameKo: string
  nameEn: string
  price: number
  quantity: number
  lineTotal: number
}

/** 주문 (고객 주문 내역용) */
export interface OrderView {
  id: string
  regionId: string
  regionCity: string
  status: string
  currencyCode: string
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  createdAt: string
  address: string
  items: OrderItemView[]
}

/** 클레임 증빙 (서명 URL 포함) */
export interface EvidenceView {
  id: string
  url: string | null
}

/** 클레임 (모든 관점에서 공유) */
export interface ClaimView {
  id: string
  orderId: string
  orderItemId: string | null
  reason: ClaimReason
  description: string | null
  refundAmount: number
  currencyCode: string
  status: ClaimStatus
  resolutionType: ResolutionType | null
  vendorResponse: string | null
  resolutionNote: string | null
  deadlineAt: string
  refundedAt: string | null
  createdAt: string
  regionCity: string
  /** 신고 대상 상품명 (특정 상품 신고 시) 또는 null (주문 전체) */
  targetName: string | null
  /** 관리자/판매자용: 신고 고객 이름 */
  customerName?: string | null
  /** 관리자용: 판매자(지역) 표시 */
  vendorLabel?: string | null
  /** 증빙 목록 */
  evidence: EvidenceView[]
}

/* --------------------------- 라벨 (KO · EN) --------------------------- */

export const REASON_LABELS: Record<ClaimReason, string> = {
  expired: "유통기한 경과 · Expired",
  spoiled: "상품 변질/파손 · Spoiled or damaged",
}

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  pending_vendor: "판매자 확인 대기 · Awaiting vendor",
  mediation: "관리자 중재 중 · In mediation",
  refunded: "환불 완료 · Refunded",
  rejected: "기각됨 · Rejected",
}

/** 상태별 배지 색상 (shadcn Badge variant 또는 커스텀 클래스) */
export const STATUS_TONE: Record<ClaimStatus, string> = {
  pending_vendor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  mediation: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  refunded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
}

export const RESOLUTION_LABELS: Record<ResolutionType, string> = {
  vendor_approved: "판매자 승인 환불",
  auto_forced: "미응답 자동 환불",
  admin_refund: "관리자 중재 환불",
  admin_denied: "관리자 기각",
}

export const PENALTY_LABELS: Record<PenaltyType, string> = {
  none: "페널티 없음",
  warning: "경고 (1점)",
  rank_down: "검색 순위 하락 (3점)",
  suspension: "판매 정지 (10점)",
}
