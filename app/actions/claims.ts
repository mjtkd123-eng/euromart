"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface ActionResult {
  ok: boolean
  error?: string
  claimId?: string
}

/** RPC 에러 메시지를 사용자용 한국어 문구로 정규화 */
function friendly(message: string | undefined): string {
  const m = (message ?? "").toLowerCase()
  if (m.includes("only delivered")) return "배송 완료된 주문만 신고할 수 있습니다."
  if (m.includes("already in progress")) return "이미 처리 중인 신고가 있습니다."
  if (m.includes("not your order")) return "본인의 주문만 신고할 수 있습니다."
  if (m.includes("not authenticated")) return "로그인이 필요합니다."
  if (m.includes("not your claim")) return "권한이 없습니다."
  if (m.includes("not actionable") || m.includes("not in mediation")) return "이미 처리된 신고입니다."
  if (m.includes("response required")) return "이의 제기 사유를 입력해 주세요."
  if (m.includes("admin only")) return "관리자만 처리할 수 있습니다."
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
}

/**
 * 고객이 클레임(환불 신고) 제기.
 * 증빙 파일은 클라이언트가 Storage(claim-evidence/<uid>/...)에 업로드한 뒤,
 * 그 경로 배열을 넘겨줍니다. file_claim RPC가 소유권을 재검증합니다.
 */
export async function fileClaim(input: {
  orderId: string
  orderItemId: string | null
  reason: "expired" | "spoiled"
  description: string
  evidencePaths: string[]
}): Promise<ActionResult> {
  if (input.reason !== "expired" && input.reason !== "spoiled") {
    return { ok: false, error: "신고 사유를 선택해 주세요." }
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("file_claim", {
    p_order_id: input.orderId,
    p_order_item_id: input.orderItemId,
    p_reason: input.reason,
    p_description: input.description?.trim() || "",
    p_evidence_paths: input.evidencePaths ?? [],
  })

  if (error) {
    console.log("[v0] file_claim error:", error.message)
    return { ok: false, error: friendly(error.message) }
  }
  revalidatePath("/orders")
  return { ok: true, claimId: data as string }
}

/** 판매자: 클레임 승인(즉시 환불) */
export async function vendorApproveClaim(claimId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("vendor_approve_claim", { p_claim_id: claimId })
  if (error) {
    console.log("[v0] vendor_approve_claim error:", error.message)
    return { ok: false, error: friendly(error.message) }
  }
  revalidatePath("/vendor/claims")
  return { ok: true }
}

/** 판매자: 이의 제기 → 관리자 중재로 이관 */
export async function vendorDisputeClaim(claimId: string, response: string): Promise<ActionResult> {
  if (!response?.trim()) return { ok: false, error: "이의 제기 사유를 입력해 주세요." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("vendor_dispute_claim", {
    p_claim_id: claimId,
    p_response: response.trim(),
  })
  if (error) {
    console.log("[v0] vendor_dispute_claim error:", error.message)
    return { ok: false, error: friendly(error.message) }
  }
  revalidatePath("/vendor/claims")
  return { ok: true }
}

/** 관리자: 중재 결정(환불/기각) + 판매자 페널티 */
export async function adminResolveClaim(input: {
  claimId: string
  decision: "refund" | "deny"
  note: string
  penalty: "none" | "warning" | "rank_down" | "suspension"
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_resolve_claim", {
    p_claim_id: input.claimId,
    p_decision: input.decision,
    p_note: input.note?.trim() || "",
    p_penalty: input.penalty,
  })
  if (error) {
    console.log("[v0] admin_resolve_claim error:", error.message)
    return { ok: false, error: friendly(error.message) }
  }
  revalidatePath("/admin")
  return { ok: true }
}
