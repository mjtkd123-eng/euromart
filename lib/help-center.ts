/**
 * K-EuroMart 통합 고객 센터 — 내비게이션 & 구조화된 콘텐츠
 * ====================================================================
 * 고객 센터의 7개 섹션 메뉴 구조와 각 섹션의 안내 초안 문구를 정의합니다.
 * 페이지 컴포넌트는 이 데이터를 렌더링만 하며, 정책/문구가 바뀌면 이 파일만 갱신합니다.
 *
 * FAQ 데이터는 챗봇과 공유하기 위해 `lib/chatbot.ts`의 FAQ_CATEGORIES를 재사용합니다.
 */

import type { Lang } from "./i18n"
import { type HelpCopy, helpText } from "./help-i18n"

/* ------------------------------------------------------------------ */
/* 1) 섹션 내비게이션                                                   */
/* ------------------------------------------------------------------ */

export type HelpSectionId =
  | "faq"
  | "shipping"
  | "payment"
  | "returns"
  | "legal"
  | "notice"
  | "contact"

export interface HelpSection {
  id: HelpSectionId
  label: string
  labelEn: string
  description: string
  descriptionEn: string
  pageDescKey:
    | "faqPageDesc"
    | "shippingPageDesc"
    | "paymentPageDesc"
    | "returnsPageDesc"
    | "legalPageDesc"
    | "noticePageDesc"
    | "contactPageDesc"
  icon: string
  href: string
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "faq",
    label: "자주 묻는 질문",
    labelEn: "FAQ",
    description: "배송·신선식품·결제·취소 등 가장 많이 찾는 질문을 키워드로 검색하세요.",
    descriptionEn: "Search the most common questions about shipping, fresh food, payments, and cancellations.",
    pageDescKey: "faqPageDesc",
    icon: "help-circle",
    href: "/help/faq",
  },
  {
    id: "shipping",
    label: "배송 안내",
    labelEn: "Shipping",
    description: "국가별 배송 기간·택배사와 무료배송 기준을 확인하세요.",
    descriptionEn: "Check delivery times, carriers, and free-shipping thresholds by country.",
    pageDescKey: "shippingPageDesc",
    icon: "truck",
    href: "/help/shipping",
  },
  {
    id: "payment",
    label: "결제 안내",
    labelEn: "Payment",
    description: "지원 결제 수단, 결제 오류 대처법, 인보이스(영수증) 발급.",
    descriptionEn: "Supported payment methods, what to do if a payment fails, and invoices.",
    pageDescKey: "paymentPageDesc",
    icon: "credit-card",
    href: "/help/payment",
  },
  {
    id: "returns",
    label: "취소 · 환불 · 교환",
    labelEn: "Returns",
    description: "EU 청약철회권과 신선식품 예외, 파손·변질 상품 보상 기준.",
    descriptionEn: "EU withdrawal rights, fresh-food exceptions, and damaged or spoiled item compensation.",
    pageDescKey: "returnsPageDesc",
    icon: "rotate-ccw",
    href: "/help/returns",
  },
  {
    id: "notice",
    label: "공지사항",
    labelEn: "Notice",
    description: "이벤트, 배송 지연, 휴무일 등 최신 소식을 안내합니다.",
    descriptionEn: "Events, delivery delays, holidays, and other latest updates.",
    pageDescKey: "noticePageDesc",
    icon: "megaphone",
    href: "/help/notice",
  },
  {
    id: "legal",
    label: "약관 · 개인정보",
    labelEn: "Legal",
    description: "이용약관과 개인정보 처리방침(EU GDPR 준수)을 확인하세요.",
    descriptionEn: "Read our terms of service and privacy policy (EU GDPR).",
    pageDescKey: "legalPageDesc",
    icon: "scale",
    href: "/help/legal",
  },
  {
    id: "contact",
    label: "1:1 문의 · 상담",
    labelEn: "Contact",
    description: "1:1 문의 접수와 실시간 채팅·챗봇 상담을 이용하세요.",
    descriptionEn: "Submit a 1:1 inquiry or chat with our bot for live help.",
    pageDescKey: "contactPageDesc",
    icon: "message-circle",
    href: "/help/contact",
  },
]

export function getHelpSection(id: HelpSectionId): HelpSection | undefined {
  return HELP_SECTIONS.find((s) => s.id === id)
}

export function sectionLabel(section: HelpSection, lang: Lang): string {
  return lang === "ko" ? section.label : section.labelEn
}

export function sectionDescription(section: HelpSection, lang: Lang): string {
  return lang === "ko" ? section.description : section.descriptionEn
}

/* ------------------------------------------------------------------ */
/* 2) 배송 안내 — 국가별                                                */
/* ------------------------------------------------------------------ */

export interface CountryShipping {
  country: string
  countryEn: string
  code: string
  cities: string[]
  citiesEn: string[]
  carriers: HelpCopy
  localTime: HelpCopy
  standardTime: HelpCopy
  freeOver: string
  baseFee: string
}

export const SHIPPING_GUIDE: CountryShipping[] = [
  {
    country: "헝가리",
    countryEn: "Hungary",
    code: "HU",
    cities: ["부다페스트", "데브레첸"],
    citiesEn: ["Budapest", "Debrecen"],
    carriers: { ko: "도시 내 Bolt 배달 · 지역 외 GLS", en: "In-city Bolt delivery · regional GLS" },
    localTime: { ko: "당일 (주문 후 1–3시간)", en: "Same day (1–3 hours after order)" },
    standardTime: { ko: "1–2 영업일", en: "1–2 business days" },
    freeOver: "15,000 Ft 이상",
    baseFee: "990 Ft",
  },
  {
    country: "독일",
    countryEn: "Germany",
    code: "DE",
    cities: ["베를린", "뮌헨"],
    citiesEn: ["Berlin", "Munich"],
    carriers: { ko: "도시 내 Bolt 배달 · 지역 외 DHL", en: "In-city Bolt delivery · regional DHL" },
    localTime: { ko: "당일 (주문 후 1–3시간)", en: "Same day (1–3 hours after order)" },
    standardTime: { ko: "1–3 영업일", en: "1–3 business days" },
    freeOver: "39 € 이상",
    baseFee: "3,90 €",
  },
  {
    country: "프랑스",
    countryEn: "France",
    code: "FR",
    cities: ["파리", "리옹"],
    citiesEn: ["Paris", "Lyon"],
    carriers: { ko: "도시 내 Bolt 배달 · 지역 외 Colissimo", en: "In-city Bolt delivery · regional Colissimo" },
    localTime: { ko: "당일 (주문 후 1–3시간)", en: "Same day (1–3 hours after order)" },
    standardTime: { ko: "2–3 영업일", en: "2–3 business days" },
    freeOver: "45 € 이상",
    baseFee: "4,90 €",
  },
  {
    country: "오스트리아",
    countryEn: "Austria",
    code: "AT",
    cities: ["빈", "그라츠"],
    citiesEn: ["Vienna", "Graz"],
    carriers: {
      ko: "도시 내 Bolt 배달 · 지역 외 Österreichische Post",
      en: "In-city Bolt delivery · regional Österreichische Post",
    },
    localTime: { ko: "당일 (주문 후 1–3시간)", en: "Same day (1–3 hours after order)" },
    standardTime: { ko: "1–2 영업일", en: "1–2 business days" },
    freeOver: "39 € 이상",
    baseFee: "3,90 €",
  },
  {
    country: "체코",
    countryEn: "Czechia",
    code: "CZ",
    cities: ["프라하", "브르노"],
    citiesEn: ["Prague", "Brno"],
    carriers: { ko: "도시 내 Bolt 배달 · 지역 외 Zásilkovna", en: "In-city Bolt delivery · regional Zásilkovna" },
    localTime: { ko: "당일 (주문 후 1–3시간)", en: "Same day (1–3 hours after order)" },
    standardTime: { ko: "1–2 영업일", en: "1–2 business days" },
    freeOver: "990 Kč 이상",
    baseFee: "79 Kč",
  },
]

export const SHIPPING_NOTES: HelpCopy[] = [
  {
    ko: "배송 소요 시간은 주문 시각, 재고, 교통·기상 상황에 따라 달라질 수 있습니다.",
    en: "Delivery times can vary with order time, stock, traffic, and weather.",
  },
  {
    ko: "냉장·냉동 등 신선식품은 콜드체인 유지를 위해 도시 내 당일 배달을 우선 제공합니다.",
    en: "Chilled and frozen foods are prioritized for same-day in-city delivery to keep the cold chain.",
  },
  {
    ko: "무료배송 기준과 배송비는 매장의 현지 통화 기준이며, 매장별로 다를 수 있습니다.",
    en: "Free-delivery thresholds and fees use the store’s local currency and may differ by store.",
  },
  {
    ko: "주문 상태는 '주문 접수 → 포장 완료 → Bolt 배달 호출 대기 → 배달중 → 배달 완료' 순으로 갱신됩니다.",
    en: "Order status updates as: received → packed → waiting for Bolt courier → out for delivery → delivered.",
  },
]

/* ------------------------------------------------------------------ */
/* 3) 결제 안내                                                         */
/* ------------------------------------------------------------------ */

export interface PaymentTopic {
  title: HelpCopy
  body: HelpCopy
  points?: HelpCopy[]
}

export const PAYMENT_GUIDE: PaymentTopic[] = [
  {
    title: { ko: "지원 결제 수단", en: "Accepted payment methods" },
    body: {
      ko: "국제 신용·체크카드와 유럽 주요 간편결제를 지원합니다. 결제는 매장의 현지 통화로 청구됩니다.",
      en: "We accept major international credit/debit cards and popular European wallets. You are charged in the store’s local currency.",
    },
    points: [
      { ko: "Visa · Mastercard · American Express 신용/체크카드", en: "Visa, Mastercard, and American Express credit/debit cards" },
      { ko: "Apple Pay · Google Pay (지원 기기)", en: "Apple Pay and Google Pay (supported devices)" },
      { ko: "일부 국가의 현지 간편결제 (지역별 상이)", en: "Selected local payment methods (varies by country)" },
    ],
  },
  {
    title: { ko: "결제 오류가 날 때", en: "If a payment fails" },
    body: {
      ko: "대부분 카드사 승인 거절 또는 3D Secure(SCA) 인증 문제입니다. 결제 도움말 센터에서 원인별 단계 해결법을 안내합니다.",
      en: "Most failures are a bank decline or 3D Secure (SCA) authentication. The payment help pages walk through each cause step by step.",
    },
    points: [
      { ko: "카드번호·유효기간·CVC·청구지 우편번호 재확인", en: "Recheck card number, expiry, CVC, and billing postcode" },
      { ko: "카드사 앱에서 해외/온라인 결제 차단 여부 확인", en: "Check that overseas/online payments are not blocked in your banking app" },
      { ko: "3D Secure 인증(은행 앱 승인 또는 SMS)을 끝까지 완료", en: "Complete 3D Secure (bank-app approval or SMS) all the way through" },
      { ko: "문제가 지속되면 다른 카드로 재시도", en: "If it keeps failing, try another card" },
    ],
  },
  {
    title: { ko: "인보이스(영수증) 발급", en: "Invoices & receipts" },
    body: {
      ko: "결제가 완료되면 주문 확인서가 제공되며, 세금계산서/인보이스가 필요하면 상호·주소·VAT 번호와 함께 요청할 수 있습니다.",
      en: "You’ll get an order confirmation after payment. For a VAT invoice, request one with your company name, address, and VAT number.",
    },
    points: [
      { ko: "'내 주문'에서 주문 확인서를 확인할 수 있습니다.", en: "You can view the order confirmation under My orders." },
      {
        ko: "사업자용 VAT 인보이스는 주문번호와 사업자 정보로 고객센터에 요청하세요.",
        en: "Ask support for a business VAT invoice with your order number and company details.",
      },
      {
        ko: "EU 부가가치세(VAT)는 매장 소재 국가 기준으로 적용됩니다.",
        en: "EU VAT is applied based on the store’s country.",
      },
    ],
  },
]

export type PaymentFaqCategoryId = "declined" | "charge" | "pending" | "promo" | "currency" | "refund"

export interface PaymentFaqItem {
  id: string
  category: PaymentFaqCategoryId
  question: HelpCopy
  summary: HelpCopy
  cause: HelpCopy
  steps: HelpCopy[]
  tip?: HelpCopy
}

export const PAYMENT_FAQS: PaymentFaqItem[] = [
  {
    id: "declined",
    category: "declined",
    question: {
      ko: "카드 결제가 거절되었어요 (Payment declined)",
      en: "My card payment was declined",
    },
    summary: {
      ko: "카드사에서 승인을 거절해 결제가 완료되지 않았습니다.",
      en: "Your bank declined the charge, so the payment did not go through.",
    },
    cause: {
      ko: "잔액 부족, 해외/온라인 결제 차단, 카드 한도 초과, 3D Secure 인증 실패, 또는 카드 정보 오입력이 가장 흔한 원인입니다.",
      en: "The usual causes are insufficient funds, overseas/online payments blocked, a limit exceeded, a failed 3D Secure check, or mistyped card details.",
    },
    steps: [
      { ko: "카드번호·유효기간·CVC·청구지 우편번호를 다시 확인하세요.", en: "Recheck the card number, expiry, CVC, and billing postcode." },
      {
        ko: "카드사 앱이나 고객센터에서 '해외 결제' 또는 '온라인 결제'가 차단되어 있지 않은지 확인하세요.",
        en: "In your banking app, confirm overseas or online payments are not blocked.",
      },
      {
        ko: "결제 중 뜨는 3D Secure(인증 문자/앱 승인) 화면을 끝까지 완료하세요.",
        en: "Complete the 3D Secure screen (SMS code or app approval) all the way through.",
      },
      { ko: "다른 카드나 결제 수단으로 다시 시도해 보세요.", en: "Try another card or payment method." },
    ],
    tip: {
      ko: "장바구니 내용은 유지되므로, 원인을 해결한 뒤 다시 결제하시면 됩니다.",
      en: "Your cart is saved, so you can pay again once the issue is fixed.",
    },
  },
  {
    id: "3ds",
    category: "declined",
    question: {
      ko: "결제 중 인증(3D Secure) 화면에서 멈춰요",
      en: "Checkout gets stuck on 3D Secure",
    },
    summary: {
      ko: "유럽 결제 규정(PSD2/SCA)에 따라 추가 본인 인증이 필요합니다.",
      en: "Extra identity checks are required under European payment rules (PSD2/SCA).",
    },
    cause: {
      ko: "EU 강화된 고객 인증(SCA) 규정상 대부분의 카드 결제에 은행 앱 승인 또는 SMS 인증이 요구됩니다. 팝업 차단이나 앱 미설치 시 인증이 중단됩니다.",
      en: "SCA requires a bank-app approval or SMS code for most card payments. Pop-up blockers or a missing bank app can stop the check.",
    },
    steps: [
      { ko: "브라우저의 팝업 차단을 해제하고 인증 창이 뜨도록 허용하세요.", en: "Allow pop-ups so the authentication window can open." },
      {
        ko: "은행 앱의 푸시 알림 승인 또는 SMS 인증번호 입력을 완료하세요.",
        en: "Approve the push in your bank app or enter the SMS code.",
      },
      {
        ko: "인증이 계속 실패하면 은행 앱을 최신 버전으로 업데이트하세요.",
        en: "If it keeps failing, update your banking app to the latest version.",
      },
    ],
  },
  {
    id: "double-charge",
    category: "charge",
    question: {
      ko: "결제 금액이 이중으로 청구된 것 같아요",
      en: "I think I was charged twice",
    },
    summary: {
      ko: "대부분은 실제 청구가 아닌 '임시 승인(가승인)'입니다.",
      en: "In most cases this is a temporary authorization, not a real charge.",
    },
    cause: {
      ko: "결제 재시도 시 카드사에 임시 승인 내역이 여러 건 남을 수 있습니다. 이 가승인은 실제 출금이 아니며 보통 3~7영업일 내 자동 취소됩니다.",
      en: "Retrying checkout can leave several pending authorizations. They are not withdrawals and usually drop off in 3–7 business days.",
    },
    steps: [
      { ko: "주문 내역에서 실제 '결제 완료'된 주문이 1건인지 확인하세요.", en: "In My orders, check that only one order is marked paid." },
      {
        ko: "카드 명세서의 '가승인/보류(pending)' 항목은 자동 소멸되니 기다려 주세요.",
        en: "Pending/hold lines on your statement usually disappear on their own — please wait.",
      },
      {
        ko: "7영업일이 지나도 중복 출금이 유지되면 주문번호와 함께 고객센터로 문의하세요.",
        en: "If a duplicate charge remains after 7 business days, contact support with your order number.",
      },
    ],
    tip: {
      ko: "문의 시 카드 명세서 캡처와 주문번호를 함께 보내주시면 확인이 빠릅니다.",
      en: "A statement screenshot plus your order number speeds up the review.",
    },
  },
  {
    id: "pending",
    category: "pending",
    question: {
      ko: "주문은 됐는데 결제 확인이 안 돼요",
      en: "I placed an order but payment isn’t confirmed",
    },
    summary: {
      ko: "결제 승인과 주문 반영 사이에 짧은 지연이 있을 수 있습니다.",
      en: "There can be a short delay between bank approval and the order updating.",
    },
    cause: {
      ko: "은행 승인 응답이 지연되면 주문이 잠시 '결제 확인 중' 상태로 표시됩니다. 보통 몇 분 내 '결제 완료'로 바뀝니다.",
      en: "A slow bank response can leave the order on “confirming payment.” It usually switches to paid within a few minutes.",
    },
    steps: [
      { ko: "페이지를 새로고침하거나 '내 주문'에서 상태를 다시 확인하세요.", en: "Refresh the page or check the status under My orders." },
      { ko: "결제 완료 이메일이 왔는지 확인하세요 (스팸함 포함).", en: "Look for a payment confirmation email (including spam)." },
      {
        ko: "10분이 지나도 '확인 중'이면 중복 결제 방지를 위해 재결제하지 말고 고객센터로 문의하세요.",
        en: "If it’s still confirming after 10 minutes, don’t pay again — contact support instead.",
      },
    ],
  },
  {
    id: "out-of-stock",
    category: "pending",
    question: {
      ko: "재고 부족으로 결제가 취소되었다고 나와요",
      en: "Checkout was cancelled because an item sold out",
    },
    summary: {
      ko: "결제 직전 해당 매장의 상품 재고가 소진되면 주문이 자동 취소됩니다.",
      en: "If stock hits zero just before payment, the order is cancelled automatically.",
    },
    cause: {
      ko: "각 도시 매장은 실시간 재고로 운영됩니다. 결제 처리 순간 재고가 0이 되면 과청구를 막기 위해 주문이 진행되지 않습니다.",
      en: "Each city store runs on live stock. If an item reaches zero during payment, we stop the order so you aren’t charged.",
    },
    steps: [
      { ko: "장바구니에서 품절된 상품을 빼거나 수량을 줄이세요.", en: "Remove the sold-out item or lower the quantity." },
      { ko: "같은 상품이 다른 도시 매장에 있는지 확인하세요.", en: "Check whether another city store still has it." },
      { ko: "재입고 알림이 필요하면 상품 페이지에서 문의해 주세요.", en: "Ask on the product page if you want a restock notice." },
    ],
    tip: {
      ko: "결제가 취소된 경우 실제 청구는 발생하지 않습니다.",
      en: "A cancelled checkout does not create a real charge.",
    },
  },
  {
    id: "promo",
    category: "promo",
    question: {
      ko: "프로모션 코드가 적용되지 않아요",
      en: "My promo code isn’t applying",
    },
    summary: {
      ko: "코드가 만료됐거나 현재 매장·조건에 맞지 않을 수 있습니다.",
      en: "The code may be expired or not valid for this store or cart.",
    },
    cause: {
      ko: "프로모션은 매장(도시)별·기간별로 다르게 운영됩니다. 최소 주문 금액 미달, 기간 만료, 대소문자 오입력, 또는 해당 매장 미적용이 원인입니다.",
      en: "Promos differ by store and dates. Common issues: minimum spend, expiry, a typo, or the code not applying to this store.",
    },
    steps: [
      { ko: "코드를 공백 없이 정확히 입력했는지 확인하세요 (예: WELCOME10).", en: "Enter the code exactly, with no spaces (e.g. WELCOME10)." },
      { ko: "현재 선택한 도시 매장에서 사용 가능한 코드인지 확인하세요.", en: "Confirm the code is valid for the city store you selected." },
      { ko: "최소 주문 금액 조건을 충족했는지 장바구니 합계를 확인하세요.", en: "Check that your cart meets any minimum order amount." },
    ],
  },
  {
    id: "currency",
    category: "currency",
    question: {
      ko: "결제 통화나 환산 금액이 예상과 달라요",
      en: "The charge currency or converted amount looks wrong",
    },
    summary: {
      ko: "결제는 매장의 현지 통화로 청구됩니다.",
      en: "You are charged in the store’s local currency.",
    },
    cause: {
      ko: "상품 옆 다른 통화 표시는 참고용 환산가입니다. 실제 청구는 매장의 현지 통화(예: 부다페스트=HUF, 파리=EUR)로 이루어지며, 카드사 환전 수수료가 더해질 수 있습니다.",
      en: "Other currencies shown next to prices are estimates. The real charge is in the store currency (e.g. Budapest = HUF, Paris = EUR), and your bank may add FX fees.",
    },
    steps: [
      { ko: "체크아웃 화면에 표시된 '결제 통화'와 최종 금액을 확인하세요.", en: "Check the charge currency and final amount on the checkout screen." },
      {
        ko: "카드사 환율·해외 이용 수수료로 청구액이 소폭 달라질 수 있습니다.",
        en: "Your bank’s rate and foreign-transaction fees can change the amount slightly.",
      },
      { ko: "원하는 통화의 매장을 상단 도시 선택에서 바꿀 수 있습니다.", en: "You can switch stores (and currencies) from the city picker in the header." },
    ],
    tip: {
      ko: "무료배송 기준(예: 49유로 이상)도 매장 통화 기준으로 적용됩니다.",
      en: "Free-delivery thresholds (e.g. €49) also use the store’s currency.",
    },
  },
  {
    id: "method",
    category: "declined",
    question: {
      ko: "사용하려는 결제 수단이 보이지 않아요",
      en: "I don’t see the payment method I want",
    },
    summary: {
      ko: "지원 결제 수단은 매장 국가에 따라 다를 수 있습니다.",
      en: "Available methods can differ by the store’s country.",
    },
    cause: {
      ko: "국가별로 지원되는 카드/간편결제가 다릅니다. 일부 선불카드나 특정 지역 전용 카드는 온라인 결제가 제한될 수 있습니다.",
      en: "Cards and wallets vary by country. Some prepaid or region-only cards block online checkout.",
    },
    steps: [
      { ko: "Visa·Mastercard 등 주요 신용/체크카드로 시도해 보세요.", en: "Try a major Visa or Mastercard credit/debit card." },
      { ko: "선불·기프트 카드는 온라인 결제가 막혀 있는 경우가 많습니다.", en: "Prepaid and gift cards often block online payments." },
      { ko: "필요한 결제 수단이 있다면 고객센터로 알려주세요.", en: "Tell support if you need a specific payment method." },
    ],
  },
  {
    id: "refund",
    category: "refund",
    question: {
      ko: "환불은 언제, 어떻게 처리되나요?",
      en: "When and how are refunds processed?",
    },
    summary: {
      ko: "승인 취소는 즉시, 실제 환불은 카드사에 따라 며칠 소요됩니다.",
      en: "Authorizations can drop immediately; a refunded charge follows your bank’s timeline.",
    },
    cause: {
      ko: "결제가 완료되기 전 취소된 건은 청구 자체가 발생하지 않습니다. 이미 청구된 주문의 환불은 카드사 정산 주기를 따릅니다.",
      en: "Cancellations before payment completes never become a charge. Refunds of captured payments follow the card issuer’s settlement cycle.",
    },
    steps: [
      { ko: "'내 주문'에서 환불 가능 여부와 상태를 확인하세요.", en: "Check refund eligibility and status under My orders." },
      {
        ko: "신선·냉장·냉동 식품은 특성상 개봉 시 환불이 제한될 수 있습니다.",
        en: "Opened fresh, chilled, or frozen food may not be refundable.",
      },
      {
        ko: "환불 승인 후 카드 계좌 반영까지 보통 3~10영업일이 걸립니다.",
        en: "After we approve a refund, it usually takes 3–10 business days to appear on your card.",
      },
    ],
    tip: {
      ko: "수령일로부터 14일 이내 청약철회가 원칙이며, 신선식품 예외 규정이 적용됩니다.",
      en: "The 14-day withdrawal right applies from delivery, with statutory exceptions for fresh food.",
    },
  },
]

/* ------------------------------------------------------------------ */
/* 4) 취소 · 환불 · 교환 정책 (EU 소비자 권리)                          */
/* ------------------------------------------------------------------ */

export interface PolicyBlock {
  heading: HelpCopy
  body: HelpCopy
  points?: HelpCopy[]
  emphasis?: boolean
}

export const RETURNS_POLICY: PolicyBlock[] = [
  {
    heading: { ko: "주문 취소 · 변경", en: "Cancel or change an order" },
    body: {
      ko: "포장이 시작되기 전(‘주문 접수’ 단계)에는 주문을 무료로 취소하거나 변경할 수 있습니다. 포장이 완료된 뒤에는 배달 특성상 취소가 제한될 수 있습니다.",
      en: "You can cancel or change an order for free while it is still in “received” (before packing). After packing, cancellations may be limited because delivery has already started.",
    },
    points: [
      {
        ko: "취소·변경은 '내 주문'에서 요청하거나 고객센터로 문의하세요.",
        en: "Request a change under My orders, or contact support.",
      },
      {
        ko: "결제 완료 전 취소된 건은 실제 청구가 발생하지 않습니다.",
        en: "Orders cancelled before payment completes are not charged.",
      },
    ],
  },
  {
    heading: { ko: "EU 법정 청약철회권 (Right of Withdrawal)", en: "EU right of withdrawal" },
    body: {
      ko: "EU 소비자권리지침(2011/83/EU)에 따라, 소비자는 별도의 사유 없이 상품 수령일로부터 14일 이내에 계약을 철회할 수 있습니다. 철회 의사를 통지한 뒤 14일 이내에 상품을 반송하며, 사업자는 반환 확인 후 대금을 환급합니다.",
      en: "Under the EU Consumer Rights Directive (2011/83/EU), you may withdraw from the contract within 14 days of receiving the goods, without giving a reason. After you notify us, return the goods within 14 days; we refund once we confirm the return.",
    },
    points: [
      {
        ko: "단순 변심에 의한 철회 시 반송 비용은 소비자가 부담할 수 있습니다.",
        en: "If you withdraw because you changed your mind, you may need to cover return shipping.",
      },
      {
        ko: "철회를 원하면 주문번호와 함께 고객센터로 통지하면 안내해 드립니다.",
        en: "To withdraw, contact support with your order number and we’ll guide you.",
      },
    ],
  },
  {
    heading: {
      ko: "청약철회 예외 — 식품 및 신선·냉동식품",
      en: "Withdrawal exceptions — food, fresh & frozen items",
    },
    emphasis: true,
    body: {
      ko: "EU 소비자권리지침 제16조에 따라, 빠르게 변질·부패할 수 있는 상품과 위생·건강상 이유로 개봉 후 반품이 부적합한 상품은 단순 변심에 의한 14일 청약철회 대상에서 제외됩니다. K-EuroMart의 신선·냉장·냉동식품 및 개봉된 식품이 이에 해당합니다.",
      en: "Under Article 16 of the Directive, goods that spoil quickly, and goods that cannot be returned after opening for health or hygiene reasons, are excluded from the 14-day cooling-off right. That includes K-EuroMart fresh, chilled, and frozen food, and opened food.",
    },
    points: [
      {
        ko: "신선·냉장·냉동식품, 개봉된 식품·음료는 단순 변심 반품이 제한됩니다.",
        en: "Fresh, chilled, frozen, and opened food or drinks cannot be returned just because you changed your mind.",
      },
      {
        ko: "단, 아래의 '파손·변질 상품' 기준에 해당하면 교환·환불이 가능합니다.",
        en: "Damaged or spoiled items can still be exchanged or refunded under the rules below.",
      },
      {
        ko: "이 예외는 소비자의 법적 권리를 배제하지 않으며, 상품 하자에 대한 권리는 그대로 유지됩니다.",
        en: "This exception does not remove your legal rights for defective goods.",
      },
    ],
  },
  {
    heading: { ko: "파손 · 변질 상품 교환 · 환불", en: "Damaged or spoiled items" },
    body: {
      ko: "배송 중 파손되었거나 수령 시 이미 변질된 상품은 신선식품 여부와 관계없이 교환 또는 환불해 드립니다. 품질 문제는 신속한 확인을 위해 증빙과 함께 접수해 주세요.",
      en: "Items damaged in transit or already spoiled on arrival can be exchanged or refunded — including fresh food. Please include evidence so we can review quickly.",
    },
    points: [
      {
        ko: "수령 후 가능한 한 빨리(원칙적으로 24시간 이내) 사진과 주문번호로 접수해 주세요.",
        en: "Please report as soon as possible (ideally within 24 hours) with photos and your order number.",
      },
      {
        ko: "파손·변질·오배송·수량 부족은 교환 또는 전액 환불 대상입니다.",
        en: "Damage, spoilage, wrong items, and missing quantities are eligible for exchange or a full refund.",
      },
      {
        ko: "확인 후 재배송 또는 환불 중 원하시는 방식으로 처리해 드립니다.",
        en: "After we confirm, you can choose a replacement delivery or a refund.",
      },
    ],
  },
  {
    heading: { ko: "환불 처리 기간", en: "Refund timing" },
    body: {
      ko: "환불은 원 결제 수단으로 이루어집니다. 승인 취소는 보통 수일 내 반영되며, 이미 청구된 결제의 환불 반영 시점은 카드사·은행 정산 주기를 따릅니다.",
      en: "Refunds go back to the original payment method. Authorizations usually drop within a few days; captured charges follow your bank’s settlement cycle.",
    },
  },
]

/* ------------------------------------------------------------------ */
/* 5) 약관 · 개인정보 처리방침 (GDPR)                                   */
/* ------------------------------------------------------------------ */

export interface LegalSection {
  heading: HelpCopy
  body: HelpCopy
  points?: HelpCopy[]
}

export interface LegalDoc {
  id: "terms" | "privacy"
  title: HelpCopy
  titleEn: string
  updated: HelpCopy
  intro: HelpCopy
  sections: LegalSection[]
}

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "terms",
    title: { ko: "이용약관", en: "Terms of Service" },
    titleEn: "Terms of Service",
    updated: { ko: "초안 · 최종 개정일 추후 확정", en: "Draft · final revision date to be confirmed" },
    intro: {
      ko: "본 약관은 K-EuroMart(이하 ‘회사’)가 제공하는 온라인 장보기 서비스의 이용 조건과 회사·이용자의 권리·의무를 규정합니다. 서비스 이용 시 본 약관에 동의한 것으로 봅니다.",
      en: "These terms set the conditions for using K-EuroMart’s online grocery service and the rights and duties of the company and users. Using the service means you agree to these terms.",
    },
    sections: [
      {
        heading: { ko: "제1조 (목적 및 정의)", en: "1. Purpose and definitions" },
        body: {
          ko: "본 약관은 회사가 운영하는 웹사이트를 통해 제공되는 한국 식료품 주문·배달 서비스의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.",
          en: "These terms govern the ordering and delivery of Korean groceries through our website, including the rights, duties, and responsibilities of the company and users.",
        },
      },
      {
        heading: { ko: "제2조 (서비스의 제공)", en: "2. The service" },
        body: {
          ko: "회사는 유럽 각 도시의 제휴 매장을 통해 상품 정보 제공, 주문 접수, 결제, 배달 연계 서비스를 제공합니다. 상품의 가격·재고·배송비는 매장 및 지역에 따라 다를 수 있습니다.",
          en: "We provide product information, ordering, payment, and delivery through partner stores in European cities. Prices, stock, and delivery fees can differ by store and region.",
        },
        points: [
          { ko: "상품은 매장 소재지의 현지 통화로 청구됩니다.", en: "You are charged in the store’s local currency." },
          { ko: "배달은 Bolt 등 배달 파트너를 통해 이루어질 수 있습니다.", en: "Delivery may be carried out by partners such as Bolt." },
        ],
      },
      {
        heading: { ko: "제3조 (주문 및 계약의 성립)", en: "3. Orders and contract formation" },
        body: {
          ko: "이용자의 주문에 대해 회사가 결제 승인 및 주문 확인을 통지한 시점에 매매계약이 성립합니다. 재고 부족·가격 오류 등의 사유가 있는 경우 회사는 주문을 거절하거나 취소할 수 있습니다.",
          en: "A sales contract is formed when we confirm payment and the order. We may refuse or cancel an order in cases such as stock shortages or pricing errors.",
        },
      },
      {
        heading: { ko: "제4조 (청약철회 및 환불)", en: "4. Withdrawal and refunds" },
        body: {
          ko: "이용자의 청약철회 및 환불에 관한 사항은 EU 소비자보호 법령과 회사의 ‘취소·환불·교환 정책’을 따릅니다. 신선·냉동식품 등 변질 우려 상품에는 법정 예외가 적용됩니다.",
          en: "Withdrawal and refunds follow EU consumer law and our cancellation, refund, and exchange policy. Statutory exceptions apply to goods that spoil, such as fresh and frozen food.",
        },
      },
      {
        heading: { ko: "제5조 (이용자의 의무)", en: "5. User obligations" },
        body: {
          ko: "이용자는 정확한 배송·결제 정보를 제공해야 하며, 타인의 결제수단을 무단 사용하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.",
          en: "You must provide accurate delivery and payment details, and must not use someone else’s payment method or interfere with the service.",
        },
      },
      {
        heading: { ko: "제6조 (책임의 제한 및 준거법)", en: "6. Limitation of liability and governing law" },
        body: {
          ko: "회사는 천재지변, 배달 파트너의 사정 등 불가항력으로 인한 배송 지연에 대해 책임이 제한될 수 있습니다. 본 약관은 관련 EU 및 매장 소재 국가의 법령을 준거법으로 합니다.",
          en: "Our liability may be limited for delays caused by force majeure, including weather and courier issues. These terms are governed by applicable EU law and the law of the store’s country.",
        },
      },
    ],
  },
  {
    id: "privacy",
    title: { ko: "개인정보 처리방침", en: "Privacy Policy (GDPR)" },
    titleEn: "Privacy Policy (GDPR)",
    updated: { ko: "초안 · 최종 개정일 추후 확정", en: "Draft · final revision date to be confirmed" },
    intro: {
      ko: "K-EuroMart는 EU 일반 개인정보보호법(GDPR, 2016/679)을 준수하여 이용자의 개인정보를 처리합니다. 본 방침은 수집 항목, 이용 목적, 보관 기간, 이용자의 권리를 안내합니다.",
      en: "K-EuroMart processes personal data in line with the EU GDPR (2016/679). This policy explains what we collect, why, how long we keep it, and your rights.",
    },
    sections: [
      {
        heading: { ko: "1. 개인정보처리자 (Controller)", en: "1. Controller" },
        body: {
          ko: "회사는 개인정보처리자로서 이용자의 개인정보를 보호할 책임이 있습니다. 개인정보 관련 문의는 개인정보 담당자(privacy@k-euromart.com)에게 연락할 수 있습니다.",
          en: "The company is the controller and is responsible for protecting your personal data. Privacy questions can be sent to privacy@k-euromart.com.",
        },
      },
      {
        heading: { ko: "2. 수집하는 개인정보 항목", en: "2. Personal data we collect" },
        body: {
          ko: "서비스 제공에 필요한 최소한의 정보를 수집합니다.",
          en: "We collect only what we need to provide the service.",
        },
        points: [
          { ko: "계정 정보: 이메일, 비밀번호(암호화 저장)", en: "Account: email and password (stored encrypted)" },
          { ko: "주문·배송 정보: 수령인 이름, 주소, 연락처", en: "Orders and delivery: recipient name, address, contact details" },
          {
            ko: "결제 정보: 결제 처리사(PSP)를 통해 처리되며 카드 전체 번호는 회사가 저장하지 않습니다.",
            en: "Payments: handled by a payment processor; we do not store full card numbers.",
          },
          { ko: "이용 기록: 접속 로그, 기기·브라우저 정보, 쿠키", en: "Usage: access logs, device/browser data, and cookies" },
        ],
      },
      {
        heading: { ko: "3. 이용 목적 및 법적 근거", en: "3. Purposes and legal bases" },
        body: {
          ko: "GDPR 제6조에 근거하여 아래 목적으로 개인정보를 처리합니다.",
          en: "We process personal data under GDPR Article 6 for the following purposes.",
        },
        points: [
          { ko: "계약 이행: 주문 처리, 결제, 배송 (제6조 1항 b호)", en: "Contract: orders, payment, and delivery (Art. 6(1)(b))" },
          { ko: "법적 의무: 세금·회계 기록 보관 (제6조 1항 c호)", en: "Legal obligation: tax and accounting records (Art. 6(1)(c))" },
          { ko: "정당한 이익: 서비스 개선, 부정 이용 방지 (제6조 1항 f호)", en: "Legitimate interests: service improvement and fraud prevention (Art. 6(1)(f))" },
          { ko: "동의: 마케팅 수신, 선택적 쿠키 (제6조 1항 a호)", en: "Consent: marketing and optional cookies (Art. 6(1)(a))" },
        ],
      },
      {
        heading: { ko: "4. 보관 기간", en: "4. Retention" },
        body: {
          ko: "개인정보는 수집·이용 목적이 달성되면 지체 없이 파기합니다. 단, 관련 법령이 정한 기간(예: 전자상거래·세무 기록) 동안은 보관합니다.",
          en: "We delete personal data when the purpose is fulfilled, except where law requires longer retention (for example e-commerce or tax records).",
        },
      },
      {
        heading: { ko: "5. 정보주체의 권리 (Your Rights)", en: "5. Your rights" },
        body: {
          ko: "이용자는 GDPR에 따라 아래 권리를 행사할 수 있으며, 요청은 담당자에게 접수할 수 있습니다.",
          en: "You can exercise the following GDPR rights by contacting our privacy team.",
        },
        points: [
          { ko: "열람권 · 정정권 · 삭제권(잊힐 권리)", en: "Access, rectification, and erasure (right to be forgotten)" },
          { ko: "처리 제한권 · 반대권", en: "Restriction of processing and objection" },
          { ko: "개인정보 이동권 (Data Portability)", en: "Data portability" },
          { ko: "동의 철회 및 감독기관에 민원을 제기할 권리", en: "Withdraw consent and lodge a complaint with a supervisory authority" },
        ],
      },
      {
        heading: { ko: "6. 쿠키 및 제3자 제공", en: "6. Cookies and third parties" },
        body: {
          ko: "서비스 운영에 필요한 필수 쿠키와, 동의에 기반한 분석·마케팅 쿠키를 사용합니다. 결제·배달 등 서비스 제공에 필요한 범위에서 처리사·배달 파트너에게 최소한의 정보를 제공합니다.",
          en: "We use essential cookies to run the service, plus analytics/marketing cookies with consent. We share the minimum data needed with payment and delivery partners.",
        },
      },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* 6) 공지사항                                                          */
/* ------------------------------------------------------------------ */

export type NoticeTag = "event" | "delay" | "holiday" | "service"

export interface Notice {
  id: string
  tag: NoticeTag
  title: HelpCopy
  body: HelpCopy
  date: string
  pinned?: boolean
}

export const NOTICE_TAG_LABELS: Record<NoticeTag, HelpCopy> = {
  event: { ko: "이벤트", en: "Event" },
  delay: { ko: "배송 지연", en: "Delay" },
  holiday: { ko: "휴무", en: "Holiday" },
  service: { ko: "서비스", en: "Service" },
}

export const NOTICES: Notice[] = [
  {
    id: "free-shipping-week",
    tag: "event",
    title: {
      ko: "무료배송 위크 — 기간 한정 무료배송 기준 인하",
      en: "Free-delivery week — lower threshold for a limited time",
    },
    body: {
      ko: "행사 기간 동안 일부 매장에서 무료배송 기준 금액이 낮아집니다. 매장별 적용 금액은 결제 화면에서 확인하실 수 있습니다.",
      en: "During the promotion, some stores lower the free-delivery threshold. Check checkout for the amount that applies to your store.",
    },
    date: "2026-08-25",
    pinned: true,
  },
  {
    id: "heatwave-delay",
    tag: "delay",
    title: {
      ko: "폭염으로 인한 일부 지역 배송 지연 안내",
      en: "Heatwave delivery delays in some areas",
    },
    body: {
      ko: "폭염 시 냉장·냉동 상품의 품질 보호를 위해 배송이 조정될 수 있습니다. 지연이 예상되면 주문 상태와 알림으로 안내드립니다.",
      en: "In a heatwave we may adjust delivery to protect chilled and frozen food. If a delay is likely, we’ll update your order status and notify you.",
    },
    date: "2026-08-18",
  },
  {
    id: "national-holiday",
    tag: "holiday",
    title: {
      ko: "현지 공휴일 매장 휴무 안내",
      en: "Store closures on local public holidays",
    },
    body: {
      ko: "국가별 공휴일에는 일부 매장이 휴무하거나 배송이 다음 영업일로 이월될 수 있습니다. 자세한 일정은 각 매장 공지를 참고하세요.",
      en: "On national holidays some stores close or delivery moves to the next business day. See each store’s notice for dates.",
    },
    date: "2026-08-10",
  },
  {
    id: "app-improvement",
    tag: "service",
    title: {
      ko: "주문 상태 실시간 추적 기능 개선",
      en: "Clearer live order tracking",
    },
    body: {
      ko: "‘내 주문’에서 포장 완료·Bolt 배달 호출·배달중 상태를 더 정확하게 확인할 수 있도록 개선했습니다.",
      en: "My orders now shows packed, waiting for Bolt, and out-for-delivery status more accurately.",
    },
    date: "2026-07-30",
  },
]

/* ------------------------------------------------------------------ */
/* 7) 고객 지원 연락처                                                  */
/* ------------------------------------------------------------------ */

export const CONTACT = {
  email: "support@k-euromart.com",
  privacyEmail: "privacy@k-euromart.com",
  hours: { ko: "평일 09:00 – 18:00 (CET)", en: "Weekdays 09:00 – 18:00 (CET)" } satisfies HelpCopy,
  responseTime: {
    ko: "1:1 문의는 보통 1 영업일 이내에 답변드립니다.",
    en: "We usually reply to 1:1 inquiries within 1 business day.",
  } satisfies HelpCopy,
  languages: "한국어 · English · Deutsch · Čeština · Français · Magyar",
} as const

export const INQUIRY_TOPICS: { value: string; label: HelpCopy }[] = [
  { value: "order", label: { ko: "주문 · 결제", en: "Orders & payment" } },
  { value: "shipping", label: { ko: "배송 · 추적", en: "Delivery & tracking" } },
  { value: "product", label: { ko: "상품 · 재고", en: "Products & stock" } },
  { value: "returns", label: { ko: "취소 · 환불 · 교환", en: "Cancel, refund & exchange" } },
  { value: "account", label: { ko: "계정 · 개인정보", en: "Account & privacy" } },
  { value: "etc", label: { ko: "기타 문의", en: "Other" } },
]

export { helpText }
export type { HelpCopy }
