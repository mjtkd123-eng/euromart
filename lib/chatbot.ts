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
  questionEn: string
  /** 같은 의도를 나타내는 유사 표현 — 의도 매칭/검색 확장용 */
  intents: string[]
  /**
   * 자동 응답 초안. 플랫폼 정책 확정 후 채워집니다.
   * 비어 있으면(status: "draft") 챗봇은 상담 안내로 폴백합니다.
   */
  answerDraft: string
  answerDraftEn: string
  status: FaqStatus
  /** 관련 도움말/정책 링크 (있으면 답변에 함께 노출) */
  link?: string
}

export interface FaqCategory {
  id: FaqCategoryId
  /** 표시용 라벨 (한/영 병기) */
  label: string
  labelEn: string
  /** 카테고리 한 줄 설명 */
  description: string
  descriptionEn: string
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
/**
 * 한인 마트 × Bolt 통합 딜리버리 CS 상담원 시스템 프롬프트.
 * LLM 파이프라인에 그대로 주입하거나, 규칙 엔진의 정책 원문으로 사용합니다.
 */
export const SYSTEM_PROMPT = `당신은 '한인 마트 x 볼트(Bolt) 통합 딜리버리' 서비스(${PLATFORM_FACTS.name})의 친절하고 스마트한 1:1 CS AI 상담원입니다.
고객(마트 이용자) 및 볼트 배달 기사(Rider)의 문의에 실시간 데이터를 기반으로 정확하고 신속하게 답변해야 합니다.

## 핵심 응답 원칙
1. 톤앤매너: 친절하고 정중한 존댓말. 핵심 위주로 명확하게 (문장당 2~3줄 이내).
2. 실시간 조회(배송 상태, 주문 내역)는 반드시 get_order_status(order_id)를 호출한 뒤 답변한다.
3. 아래 운영 정책 및 FAQ에 근거해서만 답변한다. 모르는 내용은 지어내지 않는다.
4. 개인정보 수정, 시스템 오류, 복잡한 환불/분쟁은 [상담원 연결]을 안내한다.
5. 한국어가 기본. 영어/현지 언어로 질문하면 해당 언어로 답한다.

## 플랫폼 사실
- ${PLATFORM_FACTS.summary}
- 매장/통화: ${PLATFORM_FACTS.currency}
- 배송: ${PLATFORM_FACTS.delivery}
- 신선도: ${PLATFORM_FACTS.freshness}
- 결제: ${PLATFORM_FACTS.payment}
- 교환·환불: ${PLATFORM_FACTS.returns}
- 고객센터: ${PLATFORM_FACTS.support}

## 운영 정책
1. 배송 시간: 주문 완료 후 평균 30분~1시간 (볼트 라이더 배정에 따라 변동).
2. 배송 가능 지역: 볼트 앱 내 서비스 가능 구역과 동일.
3. 주문 변경·취소: '상품 준비 중'은 앱에서 즉시 취소 가능. '배송 중'은 취소 불가(변심 반품 시 왕복 배송비 고객 부담).
4. 결제: 마트 앱/웹은 연동 카드 선결제. 볼트 앱 주문은 볼트 결제 시스템.
5. 품절: 사전 동의된 대체 상품 또는 해당 금액 자동 부분 취소. 누락·파손은 주문번호와 사진 확인 후 상담원 연결.
6. 라이더: 픽업은 마트 내 '볼트 전용 픽업 카운터'. 고객 부재 시 전화 2회 → 미수신이면 문 앞 두고 볼트 앱에 사진 등록 후 완료.

## Function calling
주문 상태·배송 위치·주문 내역을 물으면 주문번호를 확인한 뒤 get_order_status(order_id)를 호출한다.
상태 값: 상품 준비 중 / 라이더 배정 완료 / 배송 중 / 완료.

## 퀵 리플라이
대화 시작과 답변 마무리에 제시한다:
[1. 실시간 배송 조회] [2. 주문 취소/변경] [3. 상품 누락/품절 안내] [4. 볼트 기사 전용 문의] [5. 상담원 연결]

## 예시
- 주문 상태: "주문번호 [12345]의 현재 상태는 **[배송 중]**입니다. 볼트 라이더님이 이동 중이며, 약 10분 후 도착 예정입니다."
- 상담원: "해당 문의는 상세 확인이 필요합니다. 아래 [상담원 연결] 버튼을 눌러 주시거나 주문번호를 입력해 주시면 담당자에게 연결해 드리겠습니다."`

/* ------------------------------------------------------------------ */
/* 2) FAQ 구조 (4개 카테고리 · 질문 템플릿)                             */
/*    answerDraft는 초안이며 status로 준비 상태를 관리합니다.           */
/* ------------------------------------------------------------------ */

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "shipping",
    label: "배송 · Shipping",
    labelEn: "Shipping",
    description: "배송 방식, 소요 시간, 배송비, 주문 추적",
    descriptionEn: "Delivery method, timing, fees, and tracking",
    items: [
      {
        id: "shipping-areas",
        question: "어디까지 배송되나요?",
        questionEn: "Where do you deliver?",
        intents: ["배송 지역", "배송 가능 도시", "우리 동네도 배송되나요", "delivery area"],
        answerDraft:
          "배송 가능 지역은 볼트 앱 내 서비스 가능 구역과 동일합니다. 매장 도시 안은 Bolt 배달, 권역 밖은 지역 택배 파트너를 이용합니다.",
        answerDraftEn:
          "We deliver wherever the Bolt app operates. In-city orders use Bolt; outside that zone we use a regional carrier.",
        status: "ready",
      },
      {
        id: "shipping-time",
        question: "배송은 얼마나 걸리나요?",
        questionEn: "How long does delivery take?",
        intents: ["배송 시간", "언제 도착", "당일 배송", "delivery time", "how long"],
        answerDraft:
          "주문 완료 후 평균 30분~1시간 안에 도착합니다. 볼트 라이더 배정 상황에 따라 달라질 수 있습니다.",
        answerDraftEn:
          "Most orders arrive within 30–60 minutes after checkout. Timing depends on Bolt rider availability.",
        status: "ready",
      },
      {
        id: "shipping-fee",
        question: "배송비와 무료배송 기준은 어떻게 되나요?",
        questionEn: "What are the delivery fees and free-delivery threshold?",
        intents: ["배송비", "무료배송", "free delivery", "얼마 이상 무료"],
        answerDraft: "",
        answerDraftEn: "",
        status: "draft",
      },
      {
        id: "shipping-track",
        question: "주문한 상품은 어떻게 추적하나요?",
        questionEn: "How do I track my order?",
        intents: ["배송 조회", "주문 추적", "지금 어디", "track order", "Bolt"],
        answerDraft:
          "'내 주문'에서 상태를 확인할 수 있습니다. 상태는 주문 접수 → 포장 완료 → Bolt 배달 호출 대기 → 배달중 → 배달 완료 순으로 갱신됩니다.",
        answerDraftEn:
          "You can check status under My orders. It updates as: received → packed → waiting for Bolt courier → out for delivery → delivered.",
        status: "ready",
      },
      {
        id: "shipping-missed",
        question: "배송을 못 받았어요 / 부재중이었어요",
        questionEn: "I missed the delivery / wasn’t home",
        intents: ["배송 실패", "부재중", "못 받음", "missed delivery"],
        answerDraft:
          "라이더는 고객에게 전화 2회를 시도합니다. 미수신이면 문 앞에 두고 볼트 앱에 사진을 등록한 뒤 완료 처리합니다.",
        answerDraftEn:
          "The rider calls twice. If there’s no answer they leave the bag at the door, upload a photo in the Bolt app, and mark the job complete.",
        status: "ready",
      },
    ],
  },
  {
    id: "products",
    label: "상품 · 신선도 · Products & Freshness",
    labelEn: "Products & freshness",
    description: "재고, 원산지, 보관 방법, 신선식품 품질",
    descriptionEn: "Stock, origin, storage, and fresh-food quality",
    items: [
      {
        id: "products-freshness",
        question: "신선식품의 신선도는 어떻게 보장되나요?",
        questionEn: "How do you keep fresh food fresh?",
        intents: ["신선도", "냉장 배송", "콜드체인", "freshness", "신선식품 품질"],
        answerDraft:
          "상품은 실온·냉장·냉동으로 구분해 보관·배송하며, 냉장·냉동 식품은 콜드체인으로 관리됩니다.",
        answerDraftEn:
          "Items are stored and shipped at ambient, chilled, or frozen temperature. Chilled and frozen food stays on a cold chain.",
        status: "ready",
      },
      {
        id: "products-storage",
        question: "상품 보관 방법(실온/냉장/냉동)은 어디서 확인하나요?",
        questionEn: "Where can I see storage instructions (ambient / chilled / frozen)?",
        intents: ["보관 방법", "냉동인가요", "냉장 보관", "storage", "실온"],
        answerDraft:
          "각 상품 상세 페이지에 보관 방법(실온/냉장/냉동)과 원산지, 용량 등이 표시됩니다.",
        answerDraftEn:
          "Each product page shows storage (ambient / chilled / frozen), origin, and pack size.",
        status: "ready",
      },
      {
        id: "products-origin",
        question: "원산지나 원재료·알레르기 정보를 알고 싶어요",
        questionEn: "Where can I find origin, ingredients, and allergen info?",
        intents: ["원산지", "원재료", "알레르기", "성분", "origin", "allergen"],
        answerDraft:
          "상품 상세 페이지에서 원산지와 원재료·알레르기 정보를 확인할 수 있습니다. EU 식품 표시 규정을 따릅니다.",
        answerDraftEn:
          "Origin, ingredients, and allergen information are on the product page. We follow EU food-labelling rules.",
        status: "ready",
      },
      {
        id: "products-stock",
        question: "품절된 상품은 언제 다시 입고되나요?",
        questionEn: "When will a sold-out item be back in stock?",
        intents: ["재입고", "품절", "언제 들어와요", "restock", "out of stock"],
        answerDraft:
          "품절이 발생하면 사전 동의된 대체 상품을 보내거나, 해당 금액을 자동 부분 취소합니다.",
        answerDraftEn:
          "If an item is out of stock we send an agreed substitute or automatically refund that line.",
        status: "ready",
      },
      {
        id: "products-quality-issue",
        question: "받은 상품의 품질에 문제가 있어요 (파손/상함)",
        questionEn: "The item I received is damaged or spoiled",
        intents: ["파손", "상했어요", "품질 불량", "damaged", "spoiled"],
        answerDraft:
          "누락·파손 건은 주문번호와 사진을 확인한 뒤 상담원이 접수합니다. [상담원 연결]로 남겨 주세요.",
        answerDraftEn:
          "For missing or damaged items we need the order number and photos, then a human agent files the claim. Use Connect to an agent.",
        status: "ready",
        link: "/help/contact",
      },
    ],
  },
  {
    id: "payment",
    label: "결제 · 주문 · Payment & Orders",
    labelEn: "Payment & orders",
    description: "결제 수단, 결제 오류, 통화·환율, 주문 변경",
    descriptionEn: "Payment methods, checkout errors, currency, and order changes",
    items: [
      {
        id: "payment-methods",
        question: "어떤 결제 수단을 사용할 수 있나요?",
        questionEn: "Which payment methods can I use?",
        intents: ["결제 수단", "카드 종류", "간편결제", "payment method"],
        answerDraft:
          "마트 앱·웹 주문은 연동된 카드로 선결제됩니다. 볼트 앱에서 주문하면 볼트 앱 결제 시스템을 이용합니다.",
        answerDraftEn:
          "Mart app/web orders are prepaid with the linked card. Orders placed in the Bolt app use Bolt checkout.",
        status: "ready",
      },
      {
        id: "payment-declined",
        question: "결제가 거절되었어요",
        questionEn: "My payment was declined",
        intents: ["결제 거절", "결제 안 됨", "카드 오류", "declined", "3D Secure"],
        answerDraft:
          "잔액·해외결제 차단·3D Secure 인증 실패가 흔한 원인입니다. 결제 도움말 센터에서 단계별 해결 방법을 안내합니다.",
        answerDraftEn:
          "Common causes are insufficient funds, overseas payments blocked, or a failed 3D Secure check. The payment help pages walk through each step.",
        status: "ready",
        link: "/help/payment",
      },
      {
        id: "payment-currency",
        question: "결제 통화와 환산 금액이 왜 다른가요?",
        questionEn: "Why doesn’t the converted amount match the charge?",
        intents: ["통화", "환율", "환산 금액", "currency", "exchange rate"],
        answerDraft:
          "결제는 매장의 현지 통화로 청구되며, 다른 통화 표시는 참고용 환산가입니다. 카드사 환전 수수료가 더해질 수 있습니다.",
        answerDraftEn:
          "You are charged in the store’s local currency. Other currencies are estimates, and your bank may add FX fees.",
        status: "ready",
        link: "/help/payment",
      },
      {
        id: "payment-double",
        question: "결제가 이중으로 청구된 것 같아요",
        questionEn: "I think I was charged twice",
        intents: ["이중 결제", "중복 청구", "두 번 결제", "double charge"],
        answerDraft:
          "대부분 실제 청구가 아닌 임시 승인(가승인)으로, 보통 며칠 내 자동 취소됩니다. 유지되면 주문번호와 함께 고객센터로 문의해 주세요.",
        answerDraftEn:
          "Most duplicate lines are temporary authorizations and drop off within a few days. If they remain, contact support with your order number.",
        status: "ready",
        link: "/help/payment",
      },
      {
        id: "order-change",
        question: "주문을 변경하거나 취소할 수 있나요?",
        questionEn: "Can I change or cancel an order?",
        intents: ["주문 변경", "주문 취소", "수량 변경", "cancel order", "modify"],
        answerDraft:
          "'상품 준비 중' 단계는 앱에서 즉시 취소할 수 있습니다. '배송 중'은 취소할 수 없으며, 변심 반품 시 왕복 배송비는 고객 부담입니다.",
        answerDraftEn:
          "You can cancel in the app while the store is still preparing. Once out for delivery, cancellation is not possible; a change-of-mind return is charged both ways.",
        status: "ready",
      },
    ],
  },
  {
    id: "returns",
    label: "교환 · 환불 · Returns & Refunds",
    labelEn: "Returns & refunds",
    description: "청약철회, 환불 절차·기간, 신선식품 예외, 분쟁",
    descriptionEn: "Withdrawal rights, refund timing, fresh-food exceptions, and disputes",
    items: [
      {
        id: "returns-policy",
        question: "교환·환불 정책이 어떻게 되나요?",
        questionEn: "What is the exchange and refund policy?",
        intents: ["환불 정책", "교환", "반품", "청약철회", "return policy"],
        answerDraft:
          "EU 규정에 따라 수령일로부터 14일 이내 청약철회가 원칙이나, 개봉했거나 상하기 쉬운 신선·냉장·냉동 식품은 예외가 적용될 수 있습니다.",
        answerDraftEn:
          "EU rules give a 14-day right of withdrawal from delivery, with exceptions for opened or perishable fresh, chilled, and frozen food.",
        status: "ready",
      },
      {
        id: "returns-how",
        question: "환불은 어떻게 신청하나요?",
        questionEn: "How do I request a refund?",
        intents: ["환불 신청", "반품 방법", "환불 요청", "how to refund"],
        answerDraft:
          "품질·누락 건은 주문번호와 사진을 남겨 주시면 상담원이 접수합니다. 복잡한 환불·분쟁은 [상담원 연결]을 이용해 주세요.",
        answerDraftEn:
          "For quality or missing-item issues, send the order number and photos. Complex refunds or disputes go to a human agent.",
        status: "ready",
        link: "/help/contact",
      },
      {
        id: "returns-time",
        question: "환불은 언제 처리되나요?",
        questionEn: "When will I get my refund?",
        intents: ["환불 기간", "언제 돌려받나요", "환불 소요일", "refund time"],
        answerDraft:
          "결제 완료 전 취소된 건은 청구 자체가 없습니다. 이미 청구된 주문의 환불 반영 기간은 카드사 정산 주기를 따릅니다.",
        answerDraftEn:
          "Cancellations before payment completes are never charged. Refunds of captured payments follow your card issuer’s settlement cycle.",
        status: "ready",
        link: "/help/payment",
      },
      {
        id: "returns-fresh",
        question: "신선식품도 환불되나요?",
        questionEn: "Can I get a refund on fresh food?",
        intents: ["신선식품 환불", "냉장 환불", "식품 반품", "fresh food refund"],
        answerDraft:
          "신선·냉장·냉동 식품은 특성상 개봉 시 환불이 제한될 수 있습니다. 품질 문제라면 사진과 주문번호로 문의해 주세요.",
        answerDraftEn:
          "Opened fresh, chilled, or frozen food may not be refundable. For quality issues, contact us with photos and your order number.",
        status: "ready",
      },
      {
        id: "returns-dispute",
        question: "환불이 거절됐어요 / 판매자와 분쟁이 있어요",
        questionEn: "My refund was refused / I have a dispute with the seller",
        intents: ["환불 거절", "분쟁", "이의 제기", "중재", "dispute", "claim"],
        answerDraft:
          "복잡한 환불·분쟁은 상담원이 확인합니다. 아래 [상담원 연결]을 눌러 주시거나 주문번호를 남겨 주세요.",
        answerDraftEn:
          "Complex refunds and disputes need a human agent. Tap Connect to an agent or send your order number.",
        status: "ready",
        link: "/help/contact",
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
      const haystack = [item.question, item.questionEn, ...item.intents].map((s) => s.toLowerCase())
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
export function buildFaqReply(item: FaqItem, lang: "ko" | "en" = "ko"): string {
  const answer = lang === "en" ? item.answerDraftEn : item.answerDraft
  const ready = item.status === "ready" && answer.trim() !== ""
  if (ready) {
    const more = lang === "en" ? "Learn more" : "자세히 보기"
    return item.link ? `${answer}\n\n${more}: ${item.link}` : answer
  }
  return lang === "en"
    ? `This depends on the store and current policy — we’ll confirm and get back to you. For urgent cases, include your order number: ${PLATFORM_FACTS.support}`
    : `해당 문의는 매장·정책에 따라 다를 수 있어 확인 후 정확히 안내드리겠습니다. 급하시면 주문번호와 함께 ${PLATFORM_FACTS.support}`
}
