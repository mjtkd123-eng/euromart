import type {
  ClaimBand,
  ClaimIssue,
  ClaimMarket,
  RouteDecision,
} from "./claims-routing"

export const ISSUE_LABELS: Record<ClaimIssue, { ko: string; en: string }> = {
  omission: { ko: "누락 · 수량 부족", en: "Omission / short quantity" },
  partial_damage: { ko: "일부 파손", en: "Partial damage" },
  freshness: { ko: "신선도 불만", en: "Freshness complaint" },
  full_misdelivery: { ko: "완전 오배송", en: "Full misdelivery" },
  batch_freshness: { ko: "배치 신선도 이슈", en: "Batch freshness issue" },
  food_poisoning: { ko: "식중독 · 식품 안전", en: "Food poisoning / safety" },
  unlabeled_allergen: { ko: "알레르기 미표시", en: "Unlabeled allergen" },
  legal_threat: { ko: "법적 분쟁 · 고지", en: "Legal dispute" },
  change_of_mind: { ko: "단순 변심", en: "Change of mind" },
}

export const BAND_LABELS: Record<ClaimBand, { ko: string; en: string }> = {
  micro: { ko: "마이크로", en: "Micro" },
  medium: { ko: "미디엄", en: "Medium" },
  high: { ko: "하이 / 메이저", en: "High / major" },
}

export const DECISION_LABELS: Record<RouteDecision, { ko: string; en: string }> = {
  TIER1_AUTO_PAY: {
    ko: "즉시 환불 (회수 없음)",
    en: "Instant refund (no retrieval)",
  },
  PLATFORM_AUTO_PAY: {
    ko: "플랫폼 자동 승인",
    en: "Platform auto-approve",
  },
  TIER1_WAIT: {
    ko: "매장 2시간 SLA",
    en: "Merchant 2-hour SLA",
  },
  TIER2: {
    ko: "플랫폼 CS · 법무 (Tier 2)",
    en: "Platform CS & Legal (Tier 2)",
  },
  REJECT: {
    ko: "정책상 반려",
    en: "Rejected by policy",
  },
}

export function customerRouteCopy(
  decision: RouteDecision,
  reason: string,
  market: ClaimMarket,
): { ko: string; en: string } {
  if (decision === "TIER1_AUTO_PAY") {
    return {
      ko: "€20 / ₩30,000 이하 신선·누락·부분파손은 사진이 있으면 회수 없이 바로 환불됩니다.",
      en: "Micro claims (≤ €20 / ₩30,000) with a photo are refunded immediately — we do not collect the bag.",
    }
  }
  if (decision === "PLATFORM_AUTO_PAY") {
    return {
      ko: "미디엄 클레임은 플랫폼이 자동 승인합니다. 매장에 통지되며, 고객 지급은 회수를 기다리지 않습니다.",
      en: "Medium claims are auto-approved by the platform. The store is notified; payout does not wait for retrieval.",
    }
  }
  if (reason === "CHANGE_OF_MIND_PERISHABLE") {
    return {
      ko: "신선·냉장·냉동식품은 단순 변심으로 환불되지 않습니다. 파손·변질이면 다른 사유로 접수해 주세요.",
      en: "Fresh, chilled, and frozen foods are not refundable for change of mind. File under damage or spoilage instead.",
    }
  }
  if (reason === "CHANGE_OF_MIND_RETURN") {
    const days = market === "KR" ? 7 : 14
    return {
      ko: `미개봉 일반상품은 수령 후 ${days}일 이내 변심 반품이 가능합니다. 반송비는 고객 부담입니다.`,
      en: `Unopened general goods can be returned within ${days} days. You pay return shipping.`,
    }
  }
  if (reason === "PHOTO_REQUIRED") {
    return {
      ko: "마이크로 클레임은 사진이 있어야 즉시 환불됩니다. 사진을 올리면 매장 대기 없이 처리됩니다.",
      en: "Micro claims need a photo for instant refund. Add a photo to skip the merchant wait.",
    }
  }
  if (reason === "FDS" || reason === "FDS_BLACKLIST") {
    return {
      ko: "반복 환불 패턴으로 자동 승인이 제한되었습니다. 플랫폼이 직접 검토합니다.",
      en: "Auto-approval is blocked because of a high refund rate. Platform CS will review.",
    }
  }
  if (reason === "HIGH_RISK") {
    return {
      ko: "식중독·알레르기 미표시는 플랫폼이 바로 접수합니다. 진단서 또는 라벨 사진을 올려 주세요.",
      en: "Food-safety and unlabeled-allergen cases skip the store. Please upload a medical certificate or label photo.",
    }
  }
  if (decision === "TIER2") {
    return {
      ko: "고액·고위험 클레임은 매장을 건너뛰고 플랫폼 CS·법무가 처리합니다.",
      en: "High-amount and high-risk claims go straight to platform CS & Legal.",
    }
  }
  return {
    ko: "매장이 2시간 안에 응답합니다. 응답이 없으면 플랫폼으로 자동 이관됩니다.",
    en: "The store has 2 hours to respond. If they miss the SLA, the case escalates to the platform.",
  }
}
