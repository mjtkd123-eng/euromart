/**
 * NaviBar — 다국어(i18n) 지원
 * ============================
 *
 * 세 가지 표시 언어를 지원합니다.
 *  - "ko"    : 한국어
 *  - "en"    : English
 *  - "local" : 현재 선택된 매장이 위치한 국가의 현지 언어
 *
 * "local"은 고정된 언어가 아니라 매장 국가에 따라 달라집니다.
 * 예) 부다페스트 매장 → 헝가리어, 프라하 매장 → 체코어.
 */

/** 사용자가 선택할 수 있는 표시 언어 */
export type Locale = "ko" | "en" | "local"

/** 사전에 실제로 존재하는 언어 코드 */
export type Lang = "ko" | "en" | "de" | "cs" | "fr" | "hu"

/** 현지 언어(국가별로 매핑되는 언어) */
export type LocalLang = Exclude<Lang, "ko" | "en">

interface LocalLangInfo {
  lang: LocalLang
  /** 해당 언어의 자칭(endonym) — 선택기에 표시 */
  label: string
}

/**
 * ISO 국가 코드 → 현지 언어.
 * 새로운 국가의 매장을 추가하면 여기에 함께 등록하세요.
 * 매핑이 없으면 "local" 선택 시 영어로 대체됩니다.
 */
export const LOCAL_LANG_BY_COUNTRY: Record<string, LocalLangInfo> = {
  AT: { lang: "de", label: "Deutsch" },
  DE: { lang: "de", label: "Deutsch" },
  CZ: { lang: "cs", label: "Čeština" },
  FR: { lang: "fr", label: "Français" },
  HU: { lang: "hu", label: "Magyar" },
}

/** 국가 코드에 대응하는 현지 언어 정보 (없으면 null) */
export function localLangFor(countryCode: string): LocalLangInfo | null {
  return LOCAL_LANG_BY_COUNTRY[countryCode.toUpperCase()] ?? null
}

/* --------------------------- 사전 --------------------------- */

/**
 * ko/en은 필수, 현지 언어는 선택입니다.
 * 현지 번역이 없는 키는 영어로 자연스럽게 대체됩니다.
 */
type Entry = { ko: string; en: string } & Partial<Record<LocalLang, string>>

const dict = {
  /* --- 내비게이션 / 헤더 --- */
  searchProducts: {
    ko: "상품 검색",
    en: "Search products",
    de: "Produkte suchen",
    cs: "Hledat produkty",
    fr: "Rechercher des produits",
    hu: "Termékek keresése",
  },
  clearSearch: { ko: "검색어 지우기", en: "Clear search" },
  openCart: { ko: "장바구니 열기", en: "Open cart" },
  language: {
    ko: "언어",
    en: "Language",
    de: "Sprache",
    cs: "Jazyk",
    fr: "Langue",
    hu: "Nyelv",
  },
  selectLanguage: { ko: "언어 선택", en: "Select language" },
  localLanguage: {
    ko: "현지 언어",
    en: "Local language",
    de: "Landessprache",
    cs: "Místní jazyk",
    fr: "Langue locale",
    hu: "Helyi nyelv",
  },

  /* --- 매장/국가 선택 --- */
  selectStore: { ko: "매장 지역 선택", en: "Select store location" },
  selectCountry: {
    ko: "국가 선택",
    en: "Select a country",
    de: "Land auswählen",
    cs: "Vyberte zemi",
    fr: "Choisir un pays",
    hu: "Válasszon országot",
  },
  koreanStoresIn: {
    ko: "{country}의 한국 식료품점",
    en: "Korean supermarkets in {country}",
    de: "Koreanische Supermärkte in {country}",
    cs: "Korejské supermarkety v {country}",
    fr: "Supermarchés coréens en {country}",
    hu: "Koreai szupermarketek — {country}",
  },
  storeCount: {
    ko: "{count}개 매장",
    en: "{count} stores",
    de: "{count} Filialen",
    cs: "{count} prodejen",
    fr: "{count} magasins",
    hu: "{count} üzlet",
  },
  storeCountOne: {
    ko: "1개 매장",
    en: "1 store",
    de: "1 Filiale",
    cs: "1 prodejna",
    fr: "1 magasin",
    hu: "1 üzlet",
  },
  backToCountries: {
    ko: "국가 목록으로",
    en: "All countries",
    de: "Alle Länder",
    cs: "Všechny země",
    fr: "Tous les pays",
    hu: "Összes ország",
  },

  /* --- 계정 --- */
  login: {
    ko: "로그인",
    en: "Sign in",
    de: "Anmelden",
    cs: "Přihlásit se",
    fr: "Connexion",
    hu: "Bejelentkezés",
  },
  myAccount: { ko: "내 계정", en: "My account" },
  accountMenu: { ko: "계정 메뉴", en: "Account menu" },
  roleAdmin: { ko: "관리자", en: "Administrator" },
  roleVendor: { ko: "판매자", en: "Store owner" },
  roleCustomer: { ko: "고객", en: "Customer" },
  vendorDashboard: { ko: "판매자 대시보드", en: "Store dashboard" },
  adminConsole: { ko: "관리자 콘솔", en: "Admin console" },
  signOut: {
    ko: "로그아웃",
    en: "Sign out",
    de: "Abmelden",
    cs: "Odhlásit se",
    fr: "Déconnexion",
    hu: "Kijelentkezés",
  },

  /* --- 히어로 --- */
  freeDeliveryOver: {
    ko: "{amount} 이상 무료배송",
    en: "Free delivery over {amount}",
    de: "Gratislieferung ab {amount}",
    cs: "Doprava zdarma nad {amount}",
    fr: "Livraison gratuite dès {amount}",
    hu: "Ingyenes szállítás {amount} felett",
  },
  baseDeliveryFee: {
    ko: "기본 배송비 {amount}",
    en: "Standard delivery {amount}",
    de: "Standardlieferung {amount}",
    cs: "Základní doprava {amount}",
    fr: "Livraison standard {amount}",
    hu: "Alap szállítási díj {amount}",
  },

  /* --- 카테고리 --- */
  categoryFilter: { ko: "카테고리 필터", en: "Category filter" },
  allCategories: {
    ko: "전체",
    en: "All",
    de: "Alle",
    cs: "Vše",
    fr: "Tout",
    hu: "Összes",
  },
  "cat.ramen": {
    ko: "라면/면류",
    en: "Ramen & Noodles",
    de: "Ramen & Nudeln",
    cs: "Ramen a nudle",
    fr: "Ramen et nouilles",
    hu: "Ramen és tészta",
  },
  "cat.frozen": {
    ko: "냉동식품",
    en: "Frozen",
    de: "Tiefkühlkost",
    cs: "Mražené",
    fr: "Surgelés",
    hu: "Fagyasztott",
  },
  "cat.sauce": {
    ko: "소스/장류",
    en: "Sauces & Pastes",
    de: "Saucen & Pasten",
    cs: "Omáčky a pasty",
    fr: "Sauces et pâtes",
    hu: "Szószok és pászták",
  },
  "cat.kimchi": {
    ko: "김치/반찬",
    en: "Kimchi & Banchan",
    de: "Kimchi & Banchan",
    cs: "Kimchi a banchan",
    fr: "Kimchi et banchan",
    hu: "Kimchi és banchan",
  },
  "cat.snack": {
    ko: "과자",
    en: "Snacks",
    de: "Snacks",
    cs: "Snacky",
    fr: "Snacks",
    hu: "Snackek",
  },
  "cat.drink": {
    ko: "음료",
    en: "Drinks",
    de: "Getränke",
    cs: "Nápoje",
    fr: "Boissons",
    hu: "Italok",
  },
  "cat.fresh": {
    ko: "신선식품",
    en: "Fresh Produce",
    de: "Frischware",
    cs: "Čerstvé produkty",
    fr: "Produits frais",
    hu: "Friss termékek",
  },
  "cat.rice": {
    ko: "쌀/즉석밥",
    en: "Rice",
    de: "Reis",
    cs: "Rýže",
    fr: "Riz",
    hu: "Rizs",
  },

  /* --- 상품 --- */
  featured: {
    ko: "추천 BEST",
    en: "Top pick",
    de: "Empfehlung",
    cs: "Doporučeno",
    fr: "Coup de cœur",
    hu: "Ajánlott",
  },
  soldOut: {
    ko: "품절",
    en: "Sold out",
    de: "Ausverkauft",
    cs: "Vyprodáno",
    fr: "Épuisé",
    hu: "Elfogyott",
  },
  addToCart: {
    ko: "담기",
    en: "Add",
    de: "Hinzufügen",
    cs: "Přidat",
    fr: "Ajouter",
    hu: "Kosárba",
  },
  addNamedToCart: { ko: "{name} 장바구니에 담기", en: "Add {name} to cart" },
  decreaseQty: { ko: "수량 줄이기", en: "Decrease quantity" },
  increaseQty: { ko: "수량 늘리기", en: "Increase quantity" },

  /* --- 상품 목록 --- */
  searchResultsFor: {
    ko: "\u0022{query}\u0022 검색 결과",
    en: "Results for \u0022{query}\u0022",
    de: "Ergebnisse für \u0022{query}\u0022",
    cs: "Výsledky pro \u0022{query}\u0022",
    fr: "Résultats pour \u0022{query}\u0022",
    hu: "Találatok: \u0022{query}\u0022",
  },
  storeProducts: {
    ko: "{city} 매장 상품",
    en: "Products in {city}",
    de: "Produkte in {city}",
    cs: "Produkty v {city}",
    fr: "Produits à {city}",
    hu: "Termékek — {city}",
  },
  products: { ko: "상품", en: "Products" },
  productCount: {
    ko: "{count}개 상품",
    en: "{count} products",
    de: "{count} Produkte",
    cs: "{count} produktů",
    fr: "{count} produits",
    hu: "{count} termék",
  },
  noProducts: {
    ko: "해당하는 상품이 없습니다",
    en: "No matching products",
    de: "Keine passenden Produkte",
    cs: "Žádné odpovídající produkty",
    fr: "Aucun produit correspondant",
    hu: "Nincs találat",
  },
  noProductsHint: {
    ko: "다른 검색어나 카테고리를 선택해 보세요.",
    en: "Try a different search term or category.",
    de: "Versuchen Sie einen anderen Suchbegriff oder eine andere Kategorie.",
    cs: "Zkuste jiný výraz nebo kategorii.",
    fr: "Essayez un autre terme ou une autre catégorie.",
    hu: "Próbáljon másik keresőszót vagy kategóriát.",
  },

  /* --- 장바구니 / 결제 --- */
  cartWithCount: {
    ko: "장바구니 ({count})",
    en: "Cart ({count})",
    de: "Warenkorb ({count})",
    cs: "Košík ({count})",
    fr: "Panier ({count})",
    hu: "Kosár ({count})",
  },
  viewCart: {
    ko: "장바구니 보기",
    en: "View cart",
    de: "Warenkorb ansehen",
    cs: "Zobrazit košík",
    fr: "Voir le panier",
    hu: "Kosár megtekintése",
  },
  checkout: {
    ko: "결제하기",
    en: "Checkout",
    de: "Zur Kasse",
    cs: "K pokladně",
    fr: "Commander",
    hu: "Fizetés",
  },
  orderComplete: {
    ko: "주문 완료",
    en: "Order complete",
    de: "Bestellung abgeschlossen",
    cs: "Objednávka dokončena",
    fr: "Commande terminée",
    hu: "Megrendelés kész",
  },
  backToCart: { ko: "장바구니로 돌아가기", en: "Back to cart" },
  orderPlaced: {
    ko: "주문이 접수되었습니다!",
    en: "Your order is confirmed!",
    de: "Ihre Bestellung ist bestätigt!",
    cs: "Vaše objednávka je potvrzena!",
    fr: "Votre commande est confirmée !",
    hu: "Megrendelését rögzítettük!",
  },
  preparingDelivery: {
    ko: "{store}에서 곧 배송을 준비합니다.",
    en: "{store} will prepare your delivery shortly.",
    de: "{store} bereitet Ihre Lieferung in Kürze vor.",
    cs: "{store} brzy připraví vaši zásilku.",
    fr: "{store} prépare votre livraison sous peu.",
    hu: "A(z) {store} hamarosan előkészíti a szállítást.",
  },
  orderNumber: {
    ko: "주문번호",
    en: "Order number",
    de: "Bestellnummer",
    cs: "Číslo objednávky",
    fr: "Numéro de commande",
    hu: "Megrendelésszám",
  },
  continueShopping: {
    ko: "쇼핑 계속하기",
    en: "Continue shopping",
    de: "Weiter einkaufen",
    cs: "Pokračovat v nákupu",
    fr: "Continuer les achats",
    hu: "Vásárlás folytatása",
  },
  emptyCart: {
    ko: "장바구니가 비어 있습니다",
    en: "Your cart is empty",
    de: "Ihr Warenkorb ist leer",
    cs: "Váš košík je prázdný",
    fr: "Votre panier est vide",
    hu: "A kosara üres",
  },
  browseProducts: {
    ko: "상품 보러가기",
    en: "Browse products",
    de: "Produkte ansehen",
    cs: "Prohlédnout produkty",
    fr: "Voir les produits",
    hu: "Termékek böngészése",
  },
  addMoreForFree: {
    ko: "{amount} 더 담으면 무료배송!",
    en: "Add {amount} more for free delivery!",
    de: "Noch {amount} für Gratislieferung!",
    cs: "Přidejte {amount} pro dopravu zdarma!",
    fr: "Encore {amount} pour la livraison gratuite !",
    hu: "Még {amount} az ingyenes szállításhoz!",
  },
  freeDeliveryApplied: {
    ko: "무료배송 혜택이 적용되었습니다",
    en: "Free delivery applied",
    de: "Gratislieferung aktiviert",
    cs: "Doprava zdarma aktivována",
    fr: "Livraison gratuite appliquée",
    hu: "Ingyenes szállítás érvényes",
  },
  deliveryInfo: {
    ko: "배송 정보",
    en: "Delivery details",
    de: "Lieferdetails",
    cs: "Údaje o doručení",
    fr: "Informations de livraison",
    hu: "Szállítási adatok",
  },
  recipient: {
    ko: "받는 분",
    en: "Recipient",
    de: "Empfänger",
    cs: "Příjemce",
    fr: "Destinataire",
    hu: "Címzett",
  },
  recipientPlaceholder: {
    ko: "홍길동",
    en: "Full name",
    de: "Vollständiger Name",
    cs: "Celé jméno",
    fr: "Nom complet",
    hu: "Teljes név",
  },
  address: {
    ko: "주소",
    en: "Address",
    de: "Adresse",
    cs: "Adresa",
    fr: "Adresse",
    hu: "Cím",
  },
  phone: {
    ko: "연락처",
    en: "Phone",
    de: "Telefon",
    cs: "Telefon",
    fr: "Téléphone",
    hu: "Telefon",
  },
  promoOptional: {
    ko: "프로모션 코드 (선택)",
    en: "Promo code (optional)",
    de: "Aktionscode (optional)",
    cs: "Promo kód (nepovinné)",
    fr: "Code promo (facultatif)",
    hu: "Promóciós kód (opcionális)",
  },
  subtotal: {
    ko: "상품 금액",
    en: "Subtotal",
    de: "Zwischensumme",
    cs: "Mezisoučet",
    fr: "Sous-total",
    hu: "Részösszeg",
  },
  deliveryFee: {
    ko: "배송비",
    en: "Delivery",
    de: "Lieferung",
    cs: "Doprava",
    fr: "Livraison",
    hu: "Szállítás",
  },
  freeLabel: {
    ko: "무료",
    en: "Free",
    de: "Gratis",
    cs: "Zdarma",
    fr: "Gratuit",
    hu: "Ingyenes",
  },
  totalLabel: {
    ko: "합계",
    en: "Total",
    de: "Gesamt",
    cs: "Celkem",
    fr: "Total",
    hu: "Összesen",
  },
  placingOrder: {
    ko: "주문 처리 중...",
    en: "Placing order...",
    de: "Bestellung läuft...",
    cs: "Zpracování objednávky...",
    fr: "Commande en cours...",
    hu: "Megrendelés folyamatban...",
  },
  placeOrderAmount: {
    ko: "{amount} 주문하기",
    en: "Place order · {amount}",
    de: "Bestellen · {amount}",
    cs: "Objednat · {amount}",
    fr: "Commander · {amount}",
    hu: "Megrendelés · {amount}",
  },
  deleteNamed: { ko: "{name} 삭제", en: "Remove {name}" },
  orderFailed: { ko: "주문에 실패했습니다.", en: "Could not place the order." },

  /* --- 푸터 --- */
  ourStores: {
    ko: "매장 위치",
    en: "Our stores",
    de: "Unsere Filialen",
    cs: "Naše prodejny",
    fr: "Nos magasins",
    hu: "Üzleteink",
  },
  footerTagline: {
    ko: "유럽 전역의 한국 식료품 배달",
    en: "Korean groceries delivered across Europe",
    de: "Koreanische Lebensmittel europaweit geliefert",
    cs: "Korejské potraviny s doručením po Evropě",
    fr: "Épicerie coréenne livrée partout en Europe",
    hu: "Koreai élelmiszer házhoz, Európa-szerte",
  },
} satisfies Record<string, Entry>

export type TransKey = keyof typeof dict

/**
 * 키를 지정된 언어로 변환합니다.
 * 현지 번역이 없으면 영어로 대체됩니다.
 * `{name}` 형태의 자리표시자는 params 값으로 치환됩니다.
 */
export function translate(
  key: TransKey,
  lang: Lang,
  params?: Record<string, string | number>,
): string {
  const entry = dict[key] as Entry | undefined

  // 사전에 없는 키는 앱을 중단시키지 않고 키 이름을 그대로 노출합니다.
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[v0] 사전에 없는 번역 키: "${key}"`)
    }
    return key
  }

  const template = entry[lang] ?? entry.en

  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/**
 * 선택된 표시 언어와 매장 국가를 실제 사전 언어로 해석합니다.
 * "local"이지만 해당 국가의 현지 언어 매핑이 없으면 영어로 대체됩니다.
 */
export function resolveLang(locale: Locale, countryCode: string): Lang {
  if (locale !== "local") return locale
  return localLangFor(countryCode)?.lang ?? "en"
}

/**
 * 접속 환경으로 기본 표시 언어를 판단합니다.
 *
 * 규칙: 접속 위치와 브라우저 언어가 모두 한국일 때만 한국어를 사용하고,
 * 그 밖의 모든 경우(해외 접속 또는 외국어 브라우저)에는 영어를 사용합니다.
 */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en"

  const language = (navigator.language ?? "").toLowerCase()
  let timeZone = ""
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""
  } catch {
    timeZone = ""
  }

  const koreanLanguage = language.startsWith("ko")
  // 접속 위치 추정: 브라우저 시간대가 한국인지 확인합니다.
  const koreanLocation = timeZone === "Asia/Seoul"

  return koreanLanguage && koreanLocation ? "ko" : "en"
}
