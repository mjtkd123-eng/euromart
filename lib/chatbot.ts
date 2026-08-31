/**
 * K-EuroMart AI 상담 챗봇 — 기본 시스템 프롬프트 & FAQ 구조
 * ------------------------------------------------------------------
 * 이 파일은 챗봇의 "기본 골격"만 정의합니다.
 *   1) SYSTEM_PROMPT      — 모델에게 주입할 역할/정책/톤 지침
 *   2) FAQ_CATEGORIES     — 배송 / 상품·신선도 / 결제·주문 / 교환·환불 4개 카테고리
 *   3) 각 질문의 answerDraft — 초안(미정). 실제 자동 응답 문구는 플랫폼 정책 확정 후 업데이트.
 *
 * 답변 확정 전에도 챗봇이 동작할 수 있도록, answerDraft가 비어 있으면
 * 상담 채널(고객센터/도움말 센터)로 안내하도록 설계되어 있습니다.
 */

/* ------------------------------------------------------------------ */
/* 타입                                                                */
/* ------------------------------------------------------------------ */

export type FaqCategoryId = "shipping" | "products" | "payment" | "returns"

/** 답변 준비 상태 — 정책 확정 여부를 추적 */
export type FaqStatus = "draft" | "ready"

export interface FaqItem {
  /** 안정적인 참조용 키 (분석/딥링크에 사용) */
  id: string
  /** 사용자가 실제로 물어볼 법한 대표 질문 */
  question: string
  /** 같은 의도를 나타내는 유사 표현 — 의도 매칭/검색 확장용 */
  intents: string[]
  /**
   * 자동 응답 초안. 플랫폼 정책 확정 후 채워집니다.
   * 비어 있으면(status: "draft") 챗봇은 상담 안내로 폴백합니다.
   */
  answerDraft: string
  status: FaqStatus
  /** 관련 도움말/정책 링크 (있으면 답변에 함께 노출) */
  link?: string
}

export interface FaqCategory {
  id: FaqCategoryId
  /** 표시용 라벨 (한/영 병기) */
  label: string
  /** 카테고리 한 줄 설명 */
  description: string
  items: FaqItem[]
}

/* ------------------------------------------------------------------ */
/* 1) 기본 시스템 프롬프트                                              */
/* ------------------------------------------------------------------ */

/**
 * 플랫폼의 사실 관계(도메인 지식). 시스템 프롬프트에 삽입되며,
 * 정책이 바뀌면 이 상수만 갱신하면 됩니다.
 */
export const PLATFORM_FACTS = {
  name: "K-EuroMart",
  summary:
    "유럽 여러 도시의 한인 마트를 한곳에서 이용하는 온라인 장보기 플랫폼입니다. 고객은 국가를 고른 뒤 도시별 매장을 선택해 상품을 주문합니다.",
  currency:
    "결제는 매장의 현지 통화(예: 부다페스트=HUF, 파리·빈=EUR, 프라하=CZK)로 청구됩니다. 다른 통화 표시는 참고용 환산가이며, 카드사 환전 수수료가 더해질 수 있습니다.",
  delivery:
    "배송은 Bolt 배달로 연동됩니다. 주문 상태는 '주문 접수 → 포장 완료 → Bolt 배달 호출 대기 → 배달중 → 배달 완료' 순으로 진행됩니다. 무료배송 기준 금액은 매장별로 다르며 매장 현지 통화 기준입니다.",
  freshness:
    "상품은 실온·냉장·냉동으로 구분되어 보관·배송됩니다. 신선/냉장/냉동 식품은 품질 유지를 위해 빠른 배송과 콜드체인으로 관리됩니다.",
  returns:
    "EU 소비자 보호 규정에 따라 수령일로부터 14일 이내 청약철회가 원칙입니다. 단, 개봉했거나 상하기 쉬운 신선·냉장·냉동 식품은 예외가 적용될 수 있습니다.",
  payment:
    "유럽 결제 규정(PSD2/SCA)에 따라 대부분의 카드 결제에 3D Secure 추가 인증이 필요합니다. 결제 문제는 /help/payment 결제 도움말 센터에서 자세히 안내합니다.",
  support:
    "해결되지 않는 문제는 주문번호와 함께 고객센터(support@k-euromart.com, 평일 09:00–18:00 CET)로 안내합니다.",
} as const

/**
 * 챗봇 기본 시스템 프롬프트.
 * 모델·언어에 독립적인 순수 텍스트로, 어떤 LLM 파이프라인에도 그대로 주입할 수 있습니다.
 */
export const SYSTEM_PROMPT = `당신은 "${PLATFORM_FACTS.name}"의 고객 상담 AI 어시스턴트입니다.

## 역할
- ${PLATFORM_FACTS.summary}
- 배송, 상품·신선도, 결제·주문, 교환·환불 문의를 돕습니다.
- 정확하고 간결하며 친절하게, 실행 가능한 단계로 안내합니다.

## 언어
- 고객이 사용한 언어로 답변합니다. 지원 언어: 한국어, English, Deutsch, Čeština, Français, Magyar.
- 고객 언어를 알 수 없으면 한국어와 영어를 함께 제공합니다.

## 플랫폼 사실 (반드시 준수)
- 매장/통화: ${PLATFORM_FACTS.currency}
- 배송: ${PLATFORM_FACTS.delivery}
- 신선도: ${PLATFORM_FACTS.freshness}
- 결제: ${PLATFORM_FACTS.payment}
- 교환·환불: ${PLATFORM_FACTS.returns}

## 행동 원칙
1. 개인정보(카드번호, CVC, 비밀번호)는 절대 요구하지 않습니다. 고객이 입력하려 하면 즉시 중단시킵니다.
2. 결제·환불 금액이나 처리 시점은 단정하지 말고, 확인된 정책 범위 안에서만 안내합니다.
3. 주문별 확인이 필요하면 주문번호를 요청하고, 해결이 어려우면 고객센터로 연결합니다: ${PLATFORM_FACTS.support}
4. 모르는 내용은 지어내지 말고, 도움말 센터나 상담원 연결을 안내합니다.
5. 답변은 핵심 요약 → 단계별 안내 순서로, 불릿과 번호를 활용해 읽기 쉽게 구성합니다.

## 미확정 정책
- 세부 수치(수수료율, 처리 소요일, 무료배송 기준 금액 등)가 확정되지 않은 항목은 임의로 답하지 말고,
  "매장/정책에 따라 다를 수 있어 확인 후 안내드리겠습니다"라고 답한 뒤 고객센터로 연결합니다.`

/* ------------------------------------------------------------------ */
/* 2) FAQ 구조 (4개 카테고리 · 질문 템플릿)                             */
/*    answerDraft는 초안이며 status로 준비 상태를 관리합니다.           */
/* ------------------------------------------------------------------ */

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "shipping",
    label: "배송 · Shipping",
    description: "배송 방식, 소요 시간, 배송비, 주문 추적",
    items: [
      {
        id: "shipping-areas",
        question: "어디까지 배송되나요?",
        intents: ["배송 지역", "배송 가능 도시", "우리 동네도 배송되나요", "delivery area"],
        answerDraft: "",
        status: "draft",
      },
      {
        id: "shipping-time",
        question: "배송은 얼마나 걸리나요?",
        intents: ["배송 시간", "언제 도착", "당일 배송", "delivery time", "how long"],
        answerDraft: "",
        status: "draft",
      },
      {
        id: "shipping-fee",
        question: "배송비와 무료배송 기준은 어떻게 되나요?",
        intents: ["배송비", "무료배송", "free delivery", "얼마 이상 무료"],
        answerDraft: "",
        status: "draft",
      },
      {
        id: "shipping-track",
        question: "주문한 상품은 어떻게 추적하나요?",
        intents: ["배송 조회", "주문 추적", "지금 어디", "track order", "Bolt"],
        answerDraft:
          "'내 주문'에서 상태를 확인할 수 있습니다. 상태는 주문 접수 → 포장 완료 → Bolt 배달 호출 대기 → 배달중 → 배달 완료 순으로 갱신됩니다.",
        status: "ready",
      },
      {
        id: "shipping-missed",
        question: "배송을 못 받았어요 / 부재중이었어요",
        intents: ["배송 실패", "부재중", "못 받음", "missed delivery"],
        answerDraft: "",
        status: "draft",
      },
    ],
  },
  {
    id: "products",
    label: "상품 · 신선도 · Products & Freshness",
    description: "재고, 원산지, 보관 방법, 신선식품 품질",
    items: [
      {
        id: "products-freshness",
        question: "신선식품의 신선도는 어떻게 보장되나요?",
        intents: ["신선도", "냉장 배송", "콜드체인", "freshness", "신선식품 품질"],
        answerDraft:
          "상품은 실온·냉장·냉동으로 구분해 보관·배송하며, 냉장·냉동 식품은 콜드체인으로 관리됩니다.",
        status: "ready",
      },
      {
        id: "products-storage",
        question: "상품 보관 방법(실온/냉장/냉동)은 어디서 확인하나요?",
        intents: ["보관 방법", "냉동인가요", "냉장 보관", "storage", "실온"],
        answerDraft:
          "각 상품 상세 페이지에 보관 방법(실온/냉장/냉동)과 원산지, 용량 등이 표시됩니다.",
        status: "ready",
      },
      {
        id: "products-origin",
        question: "원산지나 원재료·알레르기 정보를 알고 싶어요",
        intents: ["원산지", "원재료", "알레르기", "성분", "origin", "allergen"],
        answerDraft:
          "상품 상세 페이지에서 원산지와 원재료·알레르기 정보를 확인할 수 있습니다. EU 식품 표시 규정을 따릅니다.",
        status: "ready",
      },
      {
        id: "products-stock",
        question: "품절된 상품은 언제 다시 입고되나요?",
        intents: ["재입고", "품절", "언제 들어와요", "restock", "out of stock"],
        answerDraft: "",
        status: "draft",
      },
      {
        id: "products-quality-issue",
        question: "받은 상품의 품질에 문제가 있어요 (파손/상함)",
        intents: ["파손", "상했어요", "품질 불량", "damaged", "spoiled"],
        answerDraft: "",
        status: "draft",
        link: "/help/payment",
      },
    ],
  },
  {
    id: "payment",
    label: "결제 · 주문 · Payment & Orders",
    description: "결제 수단, 결제 오류, 통화·환율, 주문 변경",
    items: [
      {
        id: "payment-methods",
        question: "어떤 결제 수단을 사용할 수 있나요?",
        intents: ["결제 수단", "카드 종류", "간편결제", "payment method"],
        answerDraft: "",
        status: "draft",
      },
      {
        id: "payment-declined",
        question: "결제가 거절되었어요",
        intents: ["결제 거절", "결제 안 됨", "카드 오류", "declined", "3D Secure"],
        answerDraft:
          "잔액·해외결제 차단·3D Secure 인증 실패가 흔한 원인입니다. 결제 도움말 센터에서 단계별 해결 방법을 안내합니다.",
        status: "ready",
        link: "/help/payment",
      },
      {
        id: "payment-currency",
        question: "결제 통화와 환산 금액이 왜 다른가요?",
        intents: ["통화", "환율", "환산 금액", "currency", "exchange rate"],
        answerDraft:
          "결제는 매장의 현지 통화로 청구되며, 다른 통화 표시는 참고용 환산가입니다. 카드사 환전 수수료가 더해질 수 있습니다.",
        status: "ready",
        link: "/help/payment",
      },
      {
        id: "payment-double",
        question: "결제가 이중으로 청구된 것 같아요",
        intents: ["이중 결제", "중복 청구", "두 번 결제", "double charge"],
        answerDraft:
          "대부분 실제 청구가 아닌 임시 승인(가승인)으로, 보통 며칠 내 자동 취소됩니다. 유지되면 주문번호와 함께 고객센터로 문의해 주세요.",
        status: "ready",
        link: "/help/payment",
      },
      {
        id: "order-change",
        question: "주문을 변경하거나 취소할 수 있나요?",
        intents: ["주문 변경", "주문 취소", "수량 변경", "cancel order", "modify"],
        answerDraft: "",
        status: "draft",
      },
    ],
  },
  {
    id: "returns",
    label: "교환 · 환불 · Returns & Refunds",
    description: "청약철회, 환불 절차·기간, 신선식품 예외, 분쟁",
    items: [
      {
        id: "returns-policy",
        question: "교환·환불 정책이 어떻게 되나요?",
        intents: ["환불 정책", "교환", "반품", "청약철회", "return policy"],
        answerDraft:
          "EU 규정에 따라 수령일로부터 14일 이내 청약철회가 원칙이나, 개봉했거나 상하기 쉬운 신선·냉장·냉동 식품은 예외가 적용될 수 있습니다.",
        status: "ready",
      },
      {
        id: "returns-how",
        question: "환불은 어떻게 신청하나요?",
        intents: ["환불 신청", "반품 방법", "환불 요청", "how to refund"],
        answerDraft: "",
        status: "draft",
      },
      {
        id: "returns-time",
        question: "환불은 언제 처리되나요?",
        intents: ["환불 기간", "언제 돌려받나요", "환불 소요일", "refund time"],
        answerDraft:
          "결제 완료 전 취소된 건은 청구 자체가 없습니다. 이미 청구된 주문의 환불 반영 기간은 카드사 정산 주기를 따릅니다.",
        status: "ready",
        link: "/help/payment",
      },
      {
        id: "returns-fresh",
        question: "신선식품도 환불되나요?",
        intents: ["신선식품 환불", "냉장 환불", "식품 반품", "fresh food refund"],
        answerDraft:
          "신선·냉장·냉동 식품은 특성상 개봉 시 환불이 제한될 수 있습니다. 품질 문제라면 사진과 주문번호로 문의해 주세요.",
        status: "ready",
      },
      {
        id: "returns-dispute",
        question: "환불이 거절됐어요 / 판매자와 분쟁이 있어요",
        intents: ["환불 거절", "분쟁", "이의 제기", "중재", "dispute", "claim"],
        answerDraft: "",
        status: "draft",
      },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* 헬퍼                                                                */
/* ------------------------------------------------------------------ */

/** 카테고리 조회 */
export function getFaqCategory(id: FaqCategoryId): FaqCategory | undefined {
  return FAQ_CATEGORIES.find((c) => c.id === id)
}

/** id로 개별 FAQ 조회 (카테고리 교차) */
export function getFaqItem(id: string): FaqItem | undefined {
  for (const category of FAQ_CATEGORIES) {
    const found = category.items.find((i) => i.id === id)
    if (found) return found
  }
  return undefined
}

/** 아직 정책이 확정되지 않아 답변 초안이 비어 있는 항목들 */
export function getDraftFaqs(): FaqItem[] {
  return FAQ_CATEGORIES.flatMap((c) => c.items).filter(
    (i) => i.status === "draft" || i.answerDraft.trim() === "",
  )
}

/**
 * 질문 의도에 가장 근접한 FAQ를 찾는 아주 단순한 키워드 매처.
 * (실제 배포 시에는 임베딩/LLM 기반 라우팅으로 교체 예정)
 */
export function matchFaq(userText: string): FaqItem | undefined {
  const text = userText.toLowerCase()
  let best: { item: FaqItem; score: number } | undefined
  for (const category of FAQ_CATEGORIES) {
    for (const item of category.items) {
      const haystack = [item.question, ...item.intents].map((s) => s.toLowerCase())
      const score = haystack.reduce((acc, phrase) => {
        return acc + (text.includes(phrase) || phrase.includes(text) ? phrase.length : 0)
      }, 0)
      if (score > 0 && (!best || score > best.score)) best = { item, score }
    }
  }
  return best?.item
}

/**
 * 매칭된 FAQ로부터 챗봇 응답 문자열을 구성합니다.
 * 답변 초안이 없으면 상담 폴백 메시지를 반환합니다.
 */
export function buildFaqReply(item: FaqItem): string {
  if (item.status === "ready" && item.answerDraft.trim() !== "") {
    return item.link ? `${item.answerDraft}\n\n자세히 보기: ${item.link}` : item.answerDraft
  }
  return `해당 문의는 매장·정책에 따라 다를 수 있어 확인 후 정확히 안내드리겠습니다. 급하시면 주문번호와 함께 ${PLATFORM_FACTS.support}`
}
