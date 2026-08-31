/**
 * K-EuroMart 통합 고객 센터 — 내비게이션 & 구조화된 콘텐츠
 * ====================================================================
 * 고객 센터의 7개 섹션 메뉴 구조와 각 섹션의 안내 초안 문구를 정의합니다.
 * 페이지 컴포넌트는 이 데이터를 렌더링만 하며, 정책/문구가 바뀌면 이 파일만 갱신합니다.
 *
 *   1) HELP_SECTIONS   — 상단/사이드 내비게이션에 쓰는 7개 섹션 메타데이터
 *   2) SHIPPING_GUIDE  — 국가별(헝가리·독일·프랑스·오스트리아·체코) 배송 안내
 *   3) PAYMENT_GUIDE   — 결제 수단 / 오류 대처 / 인보이스
 *   4) RETURNS_POLICY  — EU 청약철회권 + 식품 예외 + 파손·변질 기준
 *   5) LEGAL_DOCS      — 이용약관 / 개인정보 처리방침(GDPR)
 *   6) NOTICES         — 공지사항(이벤트·배송지연·휴무)
 *   7) CONTACT         — 1:1 문의 / 실시간 채팅·챗봇 안내
 *
 * FAQ 데이터는 챗봇과 공유하기 위해 `lib/chatbot.ts`의 FAQ_CATEGORIES를 재사용합니다.
 */

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
  /** 짧고 명확한 한글 라벨 */
  label: string
  /** 영문 병기 라벨 */
  labelEn: string
  /** 카드/목록용 한 줄 설명 */
  description: string
  /** lucide-react 아이콘 이름 */
  icon: string
  href: string
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "faq",
    label: "자주 묻는 질문",
    labelEn: "FAQ",
    description: "배송·신선식품·결제·취소 등 가장 많이 찾는 질문을 키워드로 검색하세요.",
    icon: "help-circle",
    href: "/help/faq",
  },
  {
    id: "shipping",
    label: "배송 안내",
    labelEn: "Shipping",
    description: "국가별 배송 기간·택배사와 무료배송 기준을 확인하세요.",
    icon: "truck",
    href: "/help/shipping",
  },
  {
    id: "payment",
    label: "결제 안내",
    labelEn: "Payment",
    description: "지원 결제 수단, 결제 오류 대처법, 인보이스(영수증) 발급.",
    icon: "credit-card",
    href: "/help/payment",
  },
  {
    id: "returns",
    label: "취소 · 환불 · 교환",
    labelEn: "Returns",
    description: "EU 청약철회권과 신선식품 예외, 파손·변질 상품 보상 기준.",
    icon: "rotate-ccw",
    href: "/help/returns",
  },
  {
    id: "notice",
    label: "공지사항",
    labelEn: "Notice",
    description: "이벤트, 배송 지연, 휴무일 등 최신 소식을 안내합니다.",
    icon: "megaphone",
    href: "/help/notice",
  },
  {
    id: "legal",
    label: "약관 · 개인정보",
    labelEn: "Legal",
    description: "이용약관과 개인정보 처리방침(EU GDPR 준수)을 확인하세요.",
    icon: "scale",
    href: "/help/legal",
  },
  {
    id: "contact",
    label: "1:1 문의 · 상담",
    labelEn: "Contact",
    description: "1:1 문의 접수와 실시간 채팅·챗봇 상담을 이용하세요.",
    icon: "message-circle",
    href: "/help/contact",
  },
]

export function getHelpSection(id: HelpSectionId): HelpSection | undefined {
  return HELP_SECTIONS.find((s) => s.id === id)
}

/* ------------------------------------------------------------------ */
/* 2) 배송 안내 — 국가별                                                */
/* ------------------------------------------------------------------ */

export interface CountryShipping {
  country: string
  countryEn: string
  /** ISO 국가 코드 (뱃지 표시용) */
  code: string
  /** 대표 도시(현재 운영 매장 기준) */
  cities: string[]
  /** 지역 배송 파트너 */
  carriers: string
  /** 도시 내 배달(Bolt) 소요 시간 */
  localTime: string
  /** 지역 간/외곽 배송 소요 시간 */
  standardTime: string
  /** 무료배송 기준 (현지 통화 표기 문자열) */
  freeOver: string
  /** 기본 배송비 (현지 통화 표기 문자열) */
  baseFee: string
}

/**
 * 무료배송 기준·배송비는 매장별로 상이할 수 있어 대표값(초안)입니다.
 * 실제 값은 각 매장 설정 및 정책 확정 후 업데이트합니다.
 */
export const SHIPPING_GUIDE: CountryShipping[] = [
  {
    country: "헝가리",
    countryEn: "Hungary",
    code: "HU",
    cities: ["부다페스트", "데브레첸"],
    carriers: "도시 내 Bolt 배달 · 지역 외 GLS",
    localTime: "당일 (주문 후 1–3시간)",
    standardTime: "1–2 영업일",
    freeOver: "15,000 Ft 이상",
    baseFee: "990 Ft",
  },
  {
    country: "독일",
    countryEn: "Germany",
    code: "DE",
    cities: ["베를린", "뮌헨"],
    carriers: "도시 내 Bolt 배달 · 지역 외 DHL",
    localTime: "당일 (주문 후 1–3시간)",
    standardTime: "1–3 영업일",
    freeOver: "39 € 이상",
    baseFee: "3,90 €",
  },
  {
    country: "프랑스",
    countryEn: "France",
    code: "FR",
    cities: ["파리", "리옹"],
    carriers: "도시 내 Bolt 배달 · 지역 외 Colissimo",
    localTime: "당일 (주문 후 1–3시간)",
    standardTime: "2–3 영업일",
    freeOver: "45 € 이상",
    baseFee: "4,90 €",
  },
  {
    country: "오스트리아",
    countryEn: "Austria",
    code: "AT",
    cities: ["빈", "그라츠"],
    carriers: "도시 내 Bolt 배달 · 지역 외 Österreichische Post",
    localTime: "당일 (주문 후 1–3시간)",
    standardTime: "1–2 영업일",
    freeOver: "39 € 이상",
    baseFee: "3,90 €",
  },
  {
    country: "체코",
    countryEn: "Czechia",
    code: "CZ",
    cities: ["프라하", "브르노"],
    carriers: "도시 내 Bolt 배달 · 지역 외 Zásilkovna",
    localTime: "당일 (주문 후 1–3시간)",
    standardTime: "1–2 영업일",
    freeOver: "990 Kč 이상",
    baseFee: "79 Kč",
  },
]

/** 배송 관련 공통 유의사항 */
export const SHIPPING_NOTES: string[] = [
  "배송 소요 시간은 주문 시각, 재고, 교통·기상 상황에 따라 달라질 수 있습니다.",
  "냉장·냉동 등 신선식품은 콜드체인 유지를 위해 도시 내 당일 배달을 우선 제공합니다.",
  "무료배송 기준과 배송비는 매장의 현지 통화 기준이며, 매장별로 다를 수 있습니다.",
  "주문 상태는 '주문 접수 → 포장 완료 → Bolt 배달 호출 대기 → 배달중 → 배달 완료' 순으로 갱신됩니다.",
]

/* ------------------------------------------------------------------ */
/* 3) 결제 안내                                                         */
/* ------------------------------------------------------------------ */

export interface PaymentTopic {
  title: string
  body: string
  points?: string[]
}

export const PAYMENT_GUIDE: PaymentTopic[] = [
  {
    title: "지원 결제 수단",
    body: "국제 신용·체크카드와 유럽 주요 간편결제를 지원합니다. 결제는 매장의 현지 통화로 청구됩니다.",
    points: [
      "Visa · Mastercard · American Express 신용/체크카드",
      "Apple Pay · Google Pay (지원 기기)",
      "일부 국가의 현지 간편결제 (지역별 상이)",
    ],
  },
  {
    title: "결제 오류가 날 때",
    body: "대부분 카드사 승인 거절 또는 3D Secure(SCA) 인증 문제입니다. 결제 도움말 센터에서 원인별 단계 해결법을 안내합니다.",
    points: [
      "카드번호·유효기간·CVC·청구지 우편번호 재확인",
      "카드사 앱에서 해외/온라인 결제 차단 여부 확인",
      "3D Secure 인증(은행 앱 승인 또는 SMS)을 끝까지 완료",
      "문제가 지속되면 다른 카드로 재시도",
    ],
  },
  {
    title: "인보이스(영수증) 발급",
    body: "결제가 완료되면 주문 확인서가 제공되며, 세금계산서/인보이스가 필요하면 상호·주소·VAT 번호와 함께 요청할 수 있습니다.",
    points: [
      "'내 주문'에서 주문 확인서를 확인할 수 있습니다.",
      "사업자용 VAT 인보이스는 주문번호와 사업자 정보로 고객센터에 요청하세요.",
      "EU 부가가치세(VAT)는 매장 소재 국가 기준으로 적용됩니다.",
    ],
  },
]

/* ------------------------------------------------------------------ */
/* 4) 취소 · 환불 · 교환 정책 (EU 소비자 권리)                          */
/* ------------------------------------------------------------------ */

export interface PolicyBlock {
  heading: string
  body: string
  points?: string[]
  /** 강조/주의 블록 여부 */
  emphasis?: boolean
}

export const RETURNS_POLICY: PolicyBlock[] = [
  {
    heading: "주문 취소 · 변경",
    body: "포장이 시작되기 전(‘주문 접수’ 단계)에는 주문을 무료로 취소하거나 변경할 수 있습니다. 포장이 완료된 뒤에는 배달 특성상 취소가 제한될 수 있습니다.",
    points: [
      "취소·변경은 '내 주문'에서 요청하거나 고객센터로 문의하세요.",
      "결제 완료 전 취소된 건은 실제 청구가 발생하지 않습니다.",
    ],
  },
  {
    heading: "EU 법정 청약철회권 (Right of Withdrawal)",
    body: "EU 소비자권리지침(2011/83/EU)에 따라, 소비자는 별도의 사유 없이 상품 수령일로부터 14일 이내에 계약을 철회할 수 있습니다. 철회 의사를 통지한 뒤 14일 이내에 상품을 반송하며, 사업자는 반환 확인 후 대금을 환급합니다.",
    points: [
      "단순 변심에 의한 철회 시 반송 비용은 소비자가 부담할 수 있습니다.",
      "철회를 원하면 주문번호와 함께 고객센터로 통지하면 안내해 드립니다.",
    ],
  },
  {
    heading: "청약철회 예외 — 식품 및 신선·냉동식품",
    emphasis: true,
    body: "EU 소비자권리지침 제16조에 따라, 빠르게 변질·부패할 수 있는 상품과 위생·건강상 이유로 개봉 후 반품이 부적합한 상품은 단순 변심에 의한 14일 청약철회 대상에서 제외됩니다. K-EuroMart의 신선·냉장·냉동식품 및 개봉된 식품이 이에 해당합니다.",
    points: [
      "신선·냉장·냉동식품, 개봉된 식품·음료는 단순 변심 반품이 제한됩니다.",
      "단, 아래의 '파손·변질 상품' 기준에 해당하면 교환·환불이 가능합니다.",
      "이 예외는 소비자의 법적 권리를 배제하지 않으며, 상품 하자에 대한 권리는 그대로 유지됩니다.",
    ],
  },
  {
    heading: "파손 · 변질 상품 교환 · 환불",
    body: "배송 중 파손되었거나 수령 시 이미 변질된 상품은 신선식품 여부와 관계없이 교환 또는 환불해 드립니다. 품질 문제는 신속한 확인을 위해 증빙과 함께 접수해 주세요.",
    points: [
      "수령 후 가능한 한 빨리(원칙적으로 24시간 이내) 사진과 주문번호로 접수해 주세요.",
      "파손·변질·오배송·수량 부족은 교환 또는 전액 환불 대상입니다.",
      "확인 후 재배송 또는 환불 중 원하시는 방식으로 처리해 드립니다.",
    ],
  },
  {
    heading: "환불 처리 기간",
    body: "환불은 원 결제 수단으로 이루어집니다. 승인 취소는 보통 수일 내 반영되며, 이미 청구된 결제의 환불 반영 시점은 카드사·은행 정산 주기를 따릅니다.",
  },
]

/* ------------------------------------------------------------------ */
/* 5) 약관 · 개인정보 처리방침 (GDPR)                                   */
/* ------------------------------------------------------------------ */

export interface LegalSection {
  heading: string
  body: string
  points?: string[]
}

export interface LegalDoc {
  id: "terms" | "privacy"
  title: string
  titleEn: string
  /** 최종 개정 표기(초안) */
  updated: string
  intro: string
  sections: LegalSection[]
}

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "terms",
    title: "이용약관",
    titleEn: "Terms of Service",
    updated: "초안 · 최종 개정일 추후 확정",
    intro:
      "본 약관은 K-EuroMart(이하 ‘회사’)가 제공하는 온라인 장보기 서비스의 이용 조건과 회사·이용자의 권리·의무를 규정합니다. 서비스 이용 시 본 약관에 동의한 것으로 봅니다.",
    sections: [
      {
        heading: "제1조 (목적 및 정의)",
        body: "본 약관은 회사가 운영하는 웹사이트를 통해 제공되는 한국 식료품 주문·배달 서비스의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.",
      },
      {
        heading: "제2조 (서비스의 제공)",
        body: "회사는 유럽 각 도시의 제휴 매장을 통해 상품 정보 제공, 주문 접수, 결제, 배달 연계 서비스를 제공합니다. 상품의 가격·재고·배송비는 매장 및 지역에 따라 다를 수 있습니다.",
        points: [
          "상품은 매장 소재지의 현지 통화로 청구됩니다.",
          "배달은 Bolt 등 배달 파트너를 통해 이루어질 수 있습니다.",
        ],
      },
      {
        heading: "제3조 (주문 및 계약의 성립)",
        body: "이용자의 주문에 대해 회사가 결제 승인 및 주문 확인을 통지한 시점에 매매계약이 성립합니다. 재고 부족·가격 오류 등의 사유가 있는 경우 회사는 주문을 거절하거나 취소할 수 있습니다.",
      },
      {
        heading: "제4조 (청약철회 및 환불)",
        body: "이용자의 청약철회 및 환불에 관한 사항은 EU 소비자보호 법령과 회사의 ‘취소·환불·교환 정책’을 따릅니다. 신선·냉동식품 등 변질 우려 상품에는 법정 예외가 적용됩니다.",
      },
      {
        heading: "제5조 (이용자의 의무)",
        body: "이용자는 정확한 배송·결제 정보를 제공해야 하며, 타인의 결제수단을 무단 사용하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.",
      },
      {
        heading: "제6조 (책임의 제한 및 준거법)",
        body: "회사는 천재지변, 배달 파트너의 사정 등 불가항력으로 인한 배송 지연에 대해 책임이 제한될 수 있습니다. 본 약관은 관련 EU 및 매장 소재 국가의 법령을 준거법으로 합니다.",
      },
    ],
  },
  {
    id: "privacy",
    title: "개인정보 처리방침",
    titleEn: "Privacy Policy (GDPR)",
    updated: "초안 · 최종 개정일 추후 확정",
    intro:
      "K-EuroMart는 EU 일반 개인정보보호법(GDPR, 2016/679)을 준수하여 이용자의 개인정보를 처리합니다. 본 방침은 수집 항목, 이용 목적, 보관 기간, 이용자의 권리를 안내합니다.",
    sections: [
      {
        heading: "1. 개인정보처리자 (Controller)",
        body: "회사는 개인정보처리자로서 이용자의 개인정보를 보호할 책임이 있습니다. 개인정보 관련 문의는 개인정보 담당자(privacy@k-euromart.com)에게 연락할 수 있습니다.",
      },
      {
        heading: "2. 수집하는 개인정보 항목",
        body: "서비스 제공에 필요한 최소한의 정보를 수집합니다.",
        points: [
          "계정 정보: 이메일, 비밀번호(암호화 저장)",
          "주문·배송 정보: 수령인 이름, 주소, 연락처",
          "결제 정보: 결제 처리사(PSP)를 통해 처리되며 카드 전체 번호는 회사가 저장하지 않습니다.",
          "이용 기록: 접속 로그, 기기·브라우저 정보, 쿠키",
        ],
      },
      {
        heading: "3. 이용 목적 및 법적 근거",
        body: "GDPR 제6조에 근거하여 아래 목적으로 개인정보를 처리합니다.",
        points: [
          "계약 이행: 주문 처리, 결제, 배송 (제6조 1항 b호)",
          "법적 의무: 세금·회계 기록 보관 (제6조 1항 c호)",
          "정당한 이익: 서비스 개선, 부정 이용 방지 (제6조 1항 f호)",
          "동의: 마케팅 수신, 선택적 쿠키 (제6조 1항 a호)",
        ],
      },
      {
        heading: "4. 보관 기간",
        body: "개인정보는 수집·이용 목적이 달성되면 지체 없이 파기합니다. 단, 관련 법령이 정한 기간(예: 전자상거래·세무 기록) 동안은 보관합니다.",
      },
      {
        heading: "5. 정보주체의 권리 (Your Rights)",
        body: "이용자는 GDPR에 따라 아래 권리를 행사할 수 있으며, 요청은 담당자에게 접수할 수 있습니다.",
        points: [
          "열람권 · 정정권 · 삭제권(잊힐 권리)",
          "처리 제한권 · 반대권",
          "개인정보 이동권 (Data Portability)",
          "동의 철회 및 감독기관에 민원을 제기할 권리",
        ],
      },
      {
        heading: "6. 쿠키 및 제3자 제공",
        body: "서비스 운영에 필요한 필수 쿠키와, 동의에 기반한 분석·마케팅 쿠키를 사용합니다. 결제·배달 등 서비스 제공에 필요한 범위에서 처리사·배달 파트너에게 최소한의 정보를 제공합니다.",
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
  title: string
  body: string
  /** 표시용 날짜 문자열 */
  date: string
  /** 상단 고정 여부 */
  pinned?: boolean
}

export const NOTICE_TAG_LABELS: Record<NoticeTag, string> = {
  event: "이벤트",
  delay: "배송 지연",
  holiday: "휴무",
  service: "서비스",
}

/** 공지 예시(초안). 실제 공지는 운영 중 등록됩니다. */
export const NOTICES: Notice[] = [
  {
    id: "free-shipping-week",
    tag: "event",
    title: "무료배송 위크 — 기간 한정 무료배송 기준 인하",
    body: "행사 기간 동안 일부 매장에서 무료배송 기준 금액이 낮아집니다. 매장별 적용 금액은 결제 화면에서 확인하실 수 있습니다.",
    date: "2026-08-25",
    pinned: true,
  },
  {
    id: "heatwave-delay",
    tag: "delay",
    title: "폭염으로 인한 일부 지역 배송 지연 안내",
    body: "폭염 시 냉장·냉동 상품의 품질 보호를 위해 배송이 조정될 수 있습니다. 지연이 예상되면 주문 상태와 알림으로 안내드립니다.",
    date: "2026-08-18",
  },
  {
    id: "national-holiday",
    tag: "holiday",
    title: "현지 공휴일 매장 휴무 안내",
    body: "국가별 공휴일에는 일부 매장이 휴무하거나 배송이 다음 영업일로 이월될 수 있습니다. 자세한 일정은 각 매장 공지를 참고하세요.",
    date: "2026-08-10",
  },
  {
    id: "app-improvement",
    tag: "service",
    title: "주문 상태 실시간 추적 기능 개선",
    body: "‘내 주문’에서 포장 완료·Bolt 배달 호출·배달중 상태를 더 정확하게 확인할 수 있도록 개선했습니다.",
    date: "2026-07-30",
  },
]

/* ------------------------------------------------------------------ */
/* 7) 고객 지원 연락처                                                  */
/* ------------------------------------------------------------------ */

export const CONTACT = {
  email: "support@k-euromart.com",
  privacyEmail: "privacy@k-euromart.com",
  hours: "평일 09:00 – 18:00 (CET)",
  responseTime: "1:1 문의는 보통 1 영업일 이내에 답변드립니다.",
  languages: "한국어 · English · Deutsch · Čeština · Français · Magyar",
} as const

/** 1:1 문의 카테고리 */
export const INQUIRY_TOPICS: { value: string; label: string }[] = [
  { value: "order", label: "주문 · 결제" },
  { value: "shipping", label: "배송 · 추적" },
  { value: "product", label: "상품 · 재고" },
  { value: "returns", label: "취소 · 환불 · 교환" },
  { value: "account", label: "계정 · 개인정보" },
  { value: "etc", label: "기타 문의" },
]
