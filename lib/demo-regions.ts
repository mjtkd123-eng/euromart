import type { Currency, Region, ResolvedProduct } from "./storesData"

/**
 * Local/v0 preview catalog used when Supabase is not configured.
 * Matches the K-EuroMart UI: cities, hero photos, and product cards.
 */

const EUR: Currency = { code: "EUR", locale: "de-DE", decimals: 2 }
const EUR_FR: Currency = { code: "EUR", locale: "fr-FR", decimals: 2 }
const EUR_AT: Currency = { code: "EUR", locale: "de-AT", decimals: 2 }
const HUF: Currency = { code: "HUF", locale: "hu-HU", decimals: 0 }
const CZK: Currency = { code: "CZK", locale: "cs-CZ", decimals: 0 }

type CatalogItem = Omit<ResolvedProduct, "id" | "price" | "featured" | "outOfStock">

const catalog: Record<string, CatalogItem> = {
  shin: {
    nameKo: "신라면 (5개입)",
    nameEn: "Shin Ramyun (5-pack)",
    category: "ramen",
    image: "/products/shin-ramyun.png",
    unit: "120g × 5",
    brand: "농심 Nongshim",
  },
  jin: {
    nameKo: "진라면 매운맛 (5개입)",
    nameEn: "Jin Ramen Spicy (5-pack)",
    category: "ramen",
    image: "/products/jin-ramen.png",
    unit: "120g × 5",
    brand: "오뚜기 Ottogi",
  },
  buldak: {
    nameKo: "불닭볶음면",
    nameEn: "Buldak Hot Chicken Noodles",
    category: "ramen",
    image: "/products/buldak.png",
    unit: "140g",
    brand: "삼양 Samyang",
  },
  noodle: {
    nameKo: "소면",
    nameEn: "Somyeon Thin Noodles",
    category: "ramen",
    image: "/products/somyeon.png",
    unit: "900g",
    brand: "풀무원 Pulmuone",
  },
  mandu: {
    nameKo: "비비고 왕교자 만두",
    nameEn: "Bibigo Dumplings",
    category: "frozen",
    image: "/products/mandu.png",
    unit: "525g",
    brand: "CJ",
  },
  tteok: {
    nameKo: "떡볶이 떡",
    nameEn: "Tteokbokki Rice Cakes",
    category: "frozen",
    image: "/products/tteok.png",
    unit: "1kg",
    brand: "대상 Daesang",
  },
  gochujang: {
    nameKo: "고추장",
    nameEn: "Gochujang Chili Paste",
    category: "sauce",
    image: "/products/gochujang.png",
    unit: "500g",
    brand: "해찬들 Haechandle",
  },
  doenjang: {
    nameKo: "된장",
    nameEn: "Doenjang Soybean Paste",
    category: "sauce",
    image: "/products/doenjang.png",
    unit: "500g",
    brand: "해찬들 Haechandle",
  },
  soysauce: {
    nameKo: "양조간장",
    nameEn: "Brewed Soy Sauce",
    category: "sauce",
    image: "/products/soy-sauce.png",
    unit: "1L",
    brand: "샘표 Sempio",
  },
  kimchi: {
    nameKo: "포기김치",
    nameEn: "Whole Cabbage Kimchi",
    category: "kimchi",
    image: "/products/kimchi.png",
    unit: "1kg",
    brand: "종가집 Jongga",
  },
  myeolchi: {
    nameKo: "멸치볶음",
    nameEn: "Stir-fried Anchovies",
    category: "kimchi",
    image: "/products/myeolchi.png",
    unit: "200g",
    brand: "수제반찬 Homemade",
  },
  choco: {
    nameKo: "초코파이 (12개입)",
    nameEn: "Choco Pie (12-pack)",
    category: "snack",
    image: "/products/choco-pie.png",
    unit: "39g × 12",
    brand: "오리온 Orion",
  },
  shrimp: {
    nameKo: "새우깡",
    nameEn: "Shrimp Crackers",
    category: "snack",
    image: "/products/saewookkang.png",
    unit: "90g",
    brand: "농심 Nongshim",
  },
  banana: {
    nameKo: "바나나맛 우유",
    nameEn: "Banana Milk",
    category: "drink",
    image: "/products/banana-milk.png",
    unit: "240ml",
    brand: "빙그레 Binggrae",
  },
  sikhye: {
    nameKo: "식혜",
    nameEn: "Sikhye Rice Drink",
    category: "drink",
    image: "/products/sikhye.png",
    unit: "500ml",
    brand: "비락 Birak",
  },
  napa: {
    nameKo: "배추 (1포기)",
    nameEn: "Napa Cabbage (1 head)",
    category: "fresh",
    image: "/products/napa-cabbage.png",
    unit: "≈ 2kg",
    brand: "산지직송 Farm-fresh",
  },
  radish: {
    nameKo: "무 (1개)",
    nameEn: "Korean Radish (1 pc)",
    category: "fresh",
    image: "/products/radish.png",
    unit: "≈ 1kg",
    brand: "산지직송 Farm-fresh",
  },
  rice: {
    nameKo: "햇반 (12개입)",
    nameEn: "Instant Rice (12-pack)",
    category: "rice",
    image: "/products/hetban.png",
    unit: "210g × 12",
    brand: "CJ",
  },
}

function item(id: string, price: number, featured = false): ResolvedProduct {
  const base = catalog[id]
  if (!base) throw new Error(`Unknown demo product: ${id}`)
  return { ...base, id, price, featured, outOfStock: false }
}

export const DEMO_FX_RATES = { EUR: 1, HUF: 390, CZK: 24.5, PLN: 4.3, USD: 1.08, GBP: 0.85 }

export const DEMO_REGIONS: Region[] = [
  {
    id: "budapest",
    city: "Budapest",
    country: "Hungary",
    countryCode: "HU",
    store: { ko: "부다페스트 K마트", en: "K-EuroMart Budapest" },
    announcement: {
      ko: "15,000 Ft 이상 주문 시 무료 배송 · 신선 반찬 매일 입고 · Free delivery over 15,000 Ft · Fresh banchan daily",
      en: "Free delivery over 15,000 Ft · Fresh banchan daily",
    },
    hero: {
      title: { ko: "유럽 속 한국의 맛, 부다페스트", en: "A Taste of Korea in Budapest" },
      subtitle: {
        ko: "다뉴브강 도시로 신선한 한국 식료품을 배달합니다.",
        en: "Fresh Korean groceries delivered across the Danube city.",
      },
      image: "/hero-banchan.png",
    },
    currency: HUF,
    deliveryFee: 990,
    freeDeliveryOver: 15000,
    products: [
      item("shin", 3990, true),
      item("jin", 3790),
      item("buldak", 990, true),
      item("mandu", 2490),
      item("tteok", 1890),
      item("gochujang", 2290),
      item("kimchi", 3490, true),
      item("myeolchi", 2790),
      item("choco", 2990),
      item("banana", 690),
      item("napa", 1490),
      item("rice", 4990),
    ],
  },
  {
    id: "berlin",
    city: "Berlin",
    country: "Germany",
    countryCode: "DE",
    store: { ko: "독일 베를린 K마트", en: "K-EuroMart Berlin" },
    announcement: {
      ko: "49€ 이상 주문 시 무료 배송 · 독일 전역 발송",
      en: "Free delivery over 49€ · Ships across Germany",
    },
    hero: {
      title: { ko: "베를린의 한국 식료품점", en: "Your Korean Grocer in Berlin" },
      subtitle: {
        ko: "라면부터 김치까지, 독일 어디서나 받아보세요.",
        en: "From ramyun to kimchi, delivered anywhere in Germany.",
      },
      image: "/hero-ramen.png",
    },
    currency: EUR,
    deliveryFee: 4.9,
    freeDeliveryOver: 49,
    products: [
      item("shin", 6.99, true),
      item("buldak", 2.49, true),
      item("mandu", 5.49),
      item("gochujang", 4.99),
      item("soysauce", 3.99),
      item("kimchi", 7.99, true),
      item("choco", 4.49),
      item("banana", 1.29),
      item("sikhye", 1.99),
      item("rice", 8.99),
    ],
  },
  {
    id: "paris",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    store: { ko: "파리 한인마트", en: "K-EuroMart Paris" },
    announcement: {
      ko: "59€ 이상 주문 시 무료 배송 · 파리 당일 배송",
      en: "Free delivery over 59€ · Same-day in Paris",
    },
    hero: {
      title: { ko: "파리에서 만나는 한국의 맛", en: "Korean Flavors in Paris" },
      subtitle: {
        ko: "한식의 모든 것을 파리 집앞까지.",
        en: "Everything Korean, delivered to your Paris door.",
      },
      image: "/hero-kimchi.png",
    },
    currency: EUR_FR,
    deliveryFee: 5.9,
    freeDeliveryOver: 59,
    products: [
      item("shin", 7.49, true),
      item("jin", 6.99),
      item("buldak", 2.79, true),
      item("mandu", 5.99),
      item("tteok", 3.99),
      item("gochujang", 5.49),
      item("kimchi", 8.49, true),
      item("noodle", 3.49),
      item("choco", 4.99),
      item("banana", 1.49),
    ],
  },
  {
    id: "vienna",
    city: "Vienna",
    country: "Austria",
    countryCode: "AT",
    store: { ko: "비엔나 K마트", en: "K-EuroMart Wien" },
    announcement: {
      ko: "49€ 이상 주문 시 무료 배송 · 오스트리아 전역",
      en: "Free delivery over 49€ · Across Austria",
    },
    hero: {
      title: { ko: "비엔나의 한국 식료품점", en: "Korean Grocery in Vienna" },
      subtitle: {
        ko: "정통 한국 식자재를 비엔나에서 편리하게.",
        en: "Authentic Korean staples, conveniently in Vienna.",
      },
      image: "/hero-ramen.png",
    },
    currency: EUR_AT,
    deliveryFee: 4.9,
    freeDeliveryOver: 49,
    products: [
      item("shin", 6.89),
      item("buldak", 2.39, true),
      item("mandu", 5.29),
      item("doenjang", 4.79),
      item("kimchi", 7.79, true),
      item("shrimp", 2.29),
      item("choco", 4.29),
      item("banana", 1.19),
      item("sikhye", 1.89),
      item("rice", 8.49, true),
    ],
  },
  {
    id: "prague",
    city: "Prague",
    country: "Czechia",
    countryCode: "CZ",
    store: { ko: "프라하 K마트", en: "K-EuroMart Praha" },
    announcement: {
      ko: "990 Kč 이상 주문 시 무료 배송 · 프라하 & 근교",
      en: "Free delivery over 990 Kč · Prague & suburbs",
    },
    hero: {
      title: { ko: "프라하의 한국 식료품점", en: "Korean Grocery in Prague" },
      subtitle: {
        ko: "체코에서 즐기는 진짜 한국의 맛.",
        en: "Genuine Korean taste, now in Czechia.",
      },
      image: "/hero-kimchi.png",
    },
    currency: CZK,
    deliveryFee: 89,
    freeDeliveryOver: 990,
    products: [
      item("shin", 169, true),
      item("jin", 159),
      item("buldak", 59, true),
      item("mandu", 129),
      item("gochujang", 119),
      item("kimchi", 199, true),
      item("noodle", 79),
      item("shrimp", 55),
      item("choco", 109),
      item("banana", 35),
      item("rice", 219),
    ],
  },
]
