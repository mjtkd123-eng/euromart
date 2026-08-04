import type { Category, Store, CatalogProduct, Vendor, CartItem } from "./types"

/* ------------------------------------------------------------------ *
 * 다국어(i18n) 설정
 * 지원 언어: 한국어(KR) · 헝가리어(HU) · 영어(EN)
 * ------------------------------------------------------------------ */

export type Lang = "KR" | "HU" | "EN"

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "KR", label: "한국어", flag: "🇰🇷" },
  { code: "HU", label: "Magyar", flag: "🇭🇺" },
  { code: "EN", label: "English", flag: "🇬🇧" },
]

/* ----------------------------- UI 사전 ----------------------------- */

export interface Dict {
  header: {
    brandFirst: string
    brandSecond: string
    menuOpen: string
    category: string
    vendorCenter: string
    streetNote: string
    searchAria: string
    myPage: string
    wishlist: string
    cartAria: string
    langSelect: string
    searchPlaceholder: string
    searchClose: string
  }
  nav: string[]
  hero: {
    slides: { eyebrow: string; title: string; subtitle: string }[]
    bannerLabel: string
    prev: string
    next: string
    goTo: (n: number) => string
  }
  home: {
    searchPlaceholder: string
    searchAria: string
    availableMarts: string
    empty: string
  }
  common: {
    all: string
    open: string
    closed: string
    popular: string
    soldOut: string
    add: string
    deliveryFee: string
    minOrder: string
    minShort: string
    minutes: (n: number) => string
  }
  store: {
    homeAria: string
    logoAlt: (name: string) => string
    coverAlt: (name: string) => string
    switchTitle: string
    switchBody: string
    cancel: string
    clearAndAdd: string
  }
  product: {
    decreaseAria: (name: string) => string
    increaseAria: (name: string) => string
  }
  cart: {
    emptyTitle: string
    emptyBody: string
    browse: string
    title: string
    backToMart: string
    estimate: (n: number) => string
    clear: string
    subtotal: string
    total: string
    remaining: (amount: string) => string
    minOrderBtn: (amount: string) => string
    orderBtn: (amount: string) => string
    decreaseAria: string
    increaseAria: string
  }
  checkout: {
    successTitle: string
    orderNoLabel: string
    receivedLead: string
    receivedTrail: string
    estDelivery: string
    aboutMinutes: (n: number) => string
    paymentMethod: string
    payAtDoor: string
    homeReturn: string
    noItemsTitle: string
    browse: string
    toCart: string
    deliveryInfo: string
    nameLabel: string
    namePlaceholder: string
    phoneLabel: string
    addressLabel: string
    memoLabel: string
    memoPlaceholder: string
    grandTotal: string
    footerNote: string
    confirmBtn: (amount: string) => string
  }
  vendor: {
    homeAria: string
    dashboard: string
    subtitle: string
    loginAccount: string
    productsCount: (n: number) => string
    changedCount: (n: number) => string
    synced: string
    editNote: string
    onSale: string
    saved: string
    save: string
    priceAria: (name: string) => string
    stockAria: string
    demoNote1: string
    demoNote2: string
    demoNote3: string
  }
  cookie: {
    aria: string
    body: string
    decline: string
    configure: string
    acceptAll: string
  }
  cartBar: {
    viewCart: string
  }
}

const KR: Dict = {
  header: {
    brandFirst: "부다페스트",
    brandSecond: "마트",
    menuOpen: "메뉴 열기",
    category: "카테고리",
    vendorCenter: "사장님 센터",
    streetNote: "안드라시 거리",
    searchAria: "검색",
    myPage: "마이페이지",
    wishlist: "찜한 상품",
    cartAria: "장바구니",
    langSelect: "언어 선택",
    searchPlaceholder: "상품이나 마트를 검색하세요 (예: 라면, 김치)",
    searchClose: "검색 닫기",
  },
  nav: ["신규입고", "세일상품", "인기상품", "세트메뉴", "라면/면류", "김치/반찬", "신선/채소", "냉동식품"],
  hero: {
    slides: [
      { eyebrow: "신선하게 배달", title: "한 포기 안에 담긴 정성", subtitle: "비비고 포기김치" },
      { eyebrow: "베스트셀러", title: "얼큰한 국물 한 그릇", subtitle: "인기 라면 모음전" },
      { eyebrow: "매일 준비하는", title: "집밥이 그리울 때", subtitle: "정성 가득 밑반찬" },
    ],
    bannerLabel: "추천 상품 배너",
    prev: "이전 배너",
    next: "다음 배너",
    goTo: (n) => `${n}번째 배너로 이동`,
  },
  home: {
    searchPlaceholder: "마트 이름이나 상품을 검색하세요 (예: 라면, 김치)",
    searchAria: "마트 검색",
    availableMarts: "배달 가능한 마트",
    empty: "조건에 맞는 마트가 없습니다. 다른 검색어나 카테고리를 시도해 보세요.",
  },
  common: {
    all: "전체",
    open: "영업중",
    closed: "영업종료",
    popular: "인기",
    soldOut: "품절",
    add: "담기",
    deliveryFee: "배달비",
    minOrder: "최소주문",
    minShort: "최소",
    minutes: (n) => `${n}분`,
  },
  store: {
    homeAria: "홈으로",
    logoAlt: (name) => `${name} 로고`,
    coverAlt: (name) => `${name} 매장 사진`,
    switchTitle: "장바구니를 비울까요?",
    switchBody:
      "장바구니에는 한 번에 한 마트의 상품만 담을 수 있어요. 새 상품을 담으면 기존 장바구니가 비워집니다.",
    cancel: "취소",
    clearAndAdd: "비우고 담기",
  },
  product: {
    decreaseAria: (name) => `${name} 수량 줄이기`,
    increaseAria: (name) => `${name} 수량 늘리기`,
  },
  cart: {
    emptyTitle: "장바구니가 비어 있어요",
    emptyBody: "마음에 드는 마트에서 상품을 담아보세요.",
    browse: "마트 둘러보기",
    title: "장바구니",
    backToMart: "마트로 돌아가기",
    estimate: (n) => `예상 ${n}분`,
    clear: "비우기",
    subtotal: "상품 금액",
    total: "결제 예정 금액",
    remaining: (amount) => `최소 주문금액까지 ${amount} 남았어요`,
    minOrderBtn: (amount) => `최소 주문금액 ${amount}`,
    orderBtn: (amount) => `${amount} 주문하기`,
    decreaseAria: "수량 줄이기",
    increaseAria: "수량 늘리기",
  },
  checkout: {
    successTitle: "주문이 접수되었어요!",
    orderNoLabel: "주문번호",
    receivedLead: "주문번호 ",
    receivedTrail: " 로 접수되었습니다. 마트에서 상품을 준비하는 대로 배달을 시작합니다.",
    estDelivery: "예상 배달 시간",
    aboutMinutes: (n) => `약 ${n}분`,
    paymentMethod: "결제 방식",
    payAtDoor: "문 앞 현금/카드 결제",
    homeReturn: "홈으로 돌아가기",
    noItemsTitle: "주문할 상품이 없어요",
    browse: "마트 둘러보기",
    toCart: "장바구니로",
    deliveryInfo: "주문/배달 정보",
    nameLabel: "받는 분",
    namePlaceholder: "홍길동",
    phoneLabel: "연락처",
    addressLabel: "배달 주소",
    memoLabel: "요청사항 (선택)",
    memoPlaceholder: "예: 문 앞에 놓아주세요, 벨 눌러주세요",
    grandTotal: "총 결제 금액",
    footerNote: "결제는 배달 시 문 앞에서 현금 또는 카드로 진행됩니다. (온라인 결제 연동은 향후 추가 예정)",
    confirmBtn: (amount) => `${amount} 주문 확정하기`,
  },
  vendor: {
    homeAria: "홈으로",
    dashboard: "입점업체 대시보드",
    subtitle: "Vendor · 가격 관리 데모",
    loginAccount: "로그인 계정 (데모용 전환)",
    productsCount: (n) => `${n}개 상품 취급`,
    changedCount: (n) => `${n}건 변경됨`,
    synced: "동기화됨",
    editNote: "이 매장의 가격과 재고만 수정할 수 있습니다.",
    onSale: "판매중",
    saved: "저장됨",
    save: "저장",
    priceAria: (name) => `${name} 가격`,
    stockAria: "재고 여부",
    demoNote1: "데모 안내: 여기서 수정한 가격은 ",
    demoNote2: " 테이블의 해당 매장 레코드만 업데이트합니다. 실제 서비스에서는 벤더 인증 후 본인 매장 상품만 접근하도록 서버에서 ",
    demoNote3: " 기준으로 권한을 검증합니다.",
  },
  cookie: {
    aria: "쿠키 사용 동의",
    body: "이 웹사이트는 최상의 경험을 보장하기 위해 쿠키를 사용합니다. 계속 이용하시면 쿠키 사용에 동의하는 것으로 간주됩니다.",
    decline: "거부",
    configure: "구성",
    acceptAll: "모든 쿠키 허용",
  },
  cartBar: {
    viewCart: "장바구니 보기",
  },
}

const HU: Dict = {
  header: {
    brandFirst: "Budapest",
    brandSecond: "Mart",
    menuOpen: "Menü megnyitása",
    category: "Kategóriák",
    vendorCenter: "Eladói központ",
    streetNote: "Andrássy út",
    searchAria: "Keresés",
    myPage: "Fiókom",
    wishlist: "Kedvencek",
    cartAria: "Kosár",
    langSelect: "Nyelv választása",
    searchPlaceholder: "Keress terméket vagy boltot (pl. ramen, kimchi)",
    searchClose: "Keresés bezárása",
  },
  nav: ["Új termékek", "Akció", "Népszerű", "Menük", "Ramen/Tészta", "Kimchi/Köret", "Friss/Zöldség", "Fagyasztott"],
  hero: {
    slides: [
      { eyebrow: "Frissen szállítva", title: "Gondoskodás egy fejben", subtitle: "Bibigo egész kimchi" },
      { eyebrow: "Bestseller", title: "Egy tál csípős leves", subtitle: "Népszerű ramen válogatás" },
      { eyebrow: "Naponta készül", title: "Amikor hiányzik az otthoni íz", subtitle: "Gondosan készített köretek" },
    ],
    bannerLabel: "Ajánlott termékek banner",
    prev: "Előző banner",
    next: "Következő banner",
    goTo: (n) => `Ugrás a(z) ${n}. bannerre`,
  },
  home: {
    searchPlaceholder: "Keress bolt nevet vagy terméket (pl. ramen, kimchi)",
    searchAria: "Boltok keresése",
    availableMarts: "Elérhető boltok",
    empty: "Nincs a feltételeknek megfelelő bolt. Próbálj másik keresést vagy kategóriát.",
  },
  common: {
    all: "Összes",
    open: "Nyitva",
    closed: "Zárva",
    popular: "Népszerű",
    soldOut: "Elfogyott",
    add: "Kosárba",
    deliveryFee: "Szállítás",
    minOrder: "Min. rendelés",
    minShort: "Min.",
    minutes: (n) => `${n} perc`,
  },
  store: {
    homeAria: "Főoldal",
    logoAlt: (name) => `${name} logó`,
    coverAlt: (name) => `${name} bolt fotó`,
    switchTitle: "Ürítsük a kosarat?",
    switchBody:
      "A kosár egyszerre csak egy bolt termékeit tartalmazhatja. Új termék hozzáadásakor a meglévő kosár kiürül.",
    cancel: "Mégse",
    clearAndAdd: "Ürítés és hozzáadás",
  },
  product: {
    decreaseAria: (name) => `${name} mennyiség csökkentése`,
    increaseAria: (name) => `${name} mennyiség növelése`,
  },
  cart: {
    emptyTitle: "A kosár üres",
    emptyBody: "Válassz terméket a kedvenc boltodból.",
    browse: "Boltok böngészése",
    title: "Kosár",
    backToMart: "Vissza a bolthoz",
    estimate: (n) => `kb. ${n} perc`,
    clear: "Ürítés",
    subtotal: "Részösszeg",
    total: "Várható összeg",
    remaining: (amount) => `Még ${amount} a minimális rendelésig`,
    minOrderBtn: (amount) => `Min. rendelés ${amount}`,
    orderBtn: (amount) => `Rendelés ${amount}`,
    decreaseAria: "Mennyiség csökkentése",
    increaseAria: "Mennyiség növelése",
  },
  checkout: {
    successTitle: "Rendelésedet megkaptuk!",
    orderNoLabel: "Rendelésszám",
    receivedLead: "A(z) ",
    receivedTrail:
      " rendelésedet megkaptuk. A kiszállítás azonnal indul, amint a bolt előkészítette a termékeket.",
    estDelivery: "Várható kiszállítás",
    aboutMinutes: (n) => `kb. ${n} perc`,
    paymentMethod: "Fizetési mód",
    payAtDoor: "Készpénz/kártya az ajtónál",
    homeReturn: "Vissza a főoldalra",
    noItemsTitle: "Nincs rendelhető termék",
    browse: "Boltok böngészése",
    toCart: "A kosárhoz",
    deliveryInfo: "Rendelési és szállítási adatok",
    nameLabel: "Címzett",
    namePlaceholder: "Kovács János",
    phoneLabel: "Telefonszám",
    addressLabel: "Szállítási cím",
    memoLabel: "Megjegyzés (opcionális)",
    memoPlaceholder: "pl. Hagyja az ajtó előtt, csengessen",
    grandTotal: "Végösszeg",
    footerNote:
      "A fizetés kiszállításkor, az ajtónál készpénzzel vagy kártyával történik. (Online fizetés hamarosan.)",
    confirmBtn: (amount) => `Rendelés megerősítése ${amount}`,
  },
  vendor: {
    homeAria: "Főoldal",
    dashboard: "Eladói irányítópult",
    subtitle: "Eladó · árkezelési demó",
    loginAccount: "Bejelentkezett fiók (demó váltás)",
    productsCount: (n) => `${n} termék`,
    changedCount: (n) => `${n} módosítva`,
    synced: "Szinkronizálva",
    editNote: "Csak ennek a boltnak az árait és készletét szerkesztheted.",
    onSale: "Elérhető",
    saved: "Mentve",
    save: "Mentés",
    priceAria: (name) => `${name} ára`,
    stockAria: "Készlet állapota",
    demoNote1: "Demó megjegyzés: az itt módosított árak csak a ",
    demoNote2:
      " tábla adott boltra vonatkozó rekordját frissítik. Éles rendszerben az eladó hitelesítése után a szerver a ",
    demoNote3: " alapján ellenőrzi, hogy csak a saját bolt termékeihez fér hozzá.",
  },
  cookie: {
    aria: "Sütik elfogadása",
    body: "Ez a weboldal sütiket használ a legjobb élmény érdekében. A böngészés folytatásával elfogadod a sütik használatát.",
    decline: "Elutasítás",
    configure: "Beállítás",
    acceptAll: "Összes elfogadása",
  },
  cartBar: {
    viewCart: "Kosár megtekintése",
  },
}

const EN: Dict = {
  header: {
    brandFirst: "Budapest",
    brandSecond: "Mart",
    menuOpen: "Open menu",
    category: "Categories",
    vendorCenter: "Vendor Center",
    streetNote: "Andrássy Ave.",
    searchAria: "Search",
    myPage: "My page",
    wishlist: "Wishlist",
    cartAria: "Cart",
    langSelect: "Select language",
    searchPlaceholder: "Search products or marts (e.g. ramen, kimchi)",
    searchClose: "Close search",
  },
  nav: ["New arrivals", "Sale", "Popular", "Set menu", "Ramen/Noodles", "Kimchi/Sides", "Fresh/Veggies", "Frozen"],
  hero: {
    slides: [
      { eyebrow: "Delivered fresh", title: "Care packed into every head", subtitle: "Bibigo whole cabbage kimchi" },
      { eyebrow: "Bestseller", title: "A bowl of spicy broth", subtitle: "Popular ramen collection" },
      { eyebrow: "Prepared daily", title: "When you miss home cooking", subtitle: "Lovingly made side dishes" },
    ],
    bannerLabel: "Featured products banner",
    prev: "Previous banner",
    next: "Next banner",
    goTo: (n) => `Go to banner ${n}`,
  },
  home: {
    searchPlaceholder: "Search a mart name or product (e.g. ramen, kimchi)",
    searchAria: "Search marts",
    availableMarts: "Marts available",
    empty: "No marts match your filters. Try a different search or category.",
  },
  common: {
    all: "All",
    open: "Open",
    closed: "Closed",
    popular: "Popular",
    soldOut: "Sold out",
    add: "Add",
    deliveryFee: "Delivery",
    minOrder: "Min. order",
    minShort: "Min",
    minutes: (n) => `${n} min`,
  },
  store: {
    homeAria: "Home",
    logoAlt: (name) => `${name} logo`,
    coverAlt: (name) => `${name} storefront photo`,
    switchTitle: "Empty your cart?",
    switchBody:
      "Your cart can hold items from only one mart at a time. Adding a new item will clear your current cart.",
    cancel: "Cancel",
    clearAndAdd: "Clear & add",
  },
  product: {
    decreaseAria: (name) => `Decrease ${name} quantity`,
    increaseAria: (name) => `Increase ${name} quantity`,
  },
  cart: {
    emptyTitle: "Your cart is empty",
    emptyBody: "Add items from a mart you like.",
    browse: "Browse marts",
    title: "Cart",
    backToMart: "Back to mart",
    estimate: (n) => `Est. ${n} min`,
    clear: "Clear",
    subtotal: "Subtotal",
    total: "Estimated total",
    remaining: (amount) => `${amount} left to reach the minimum order`,
    minOrderBtn: (amount) => `Min. order ${amount}`,
    orderBtn: (amount) => `Order ${amount}`,
    decreaseAria: "Decrease quantity",
    increaseAria: "Increase quantity",
  },
  checkout: {
    successTitle: "Your order has been placed!",
    orderNoLabel: "Order no.",
    receivedLead: "Order ",
    receivedTrail:
      " has been received. Delivery will start as soon as the mart prepares your items.",
    estDelivery: "Estimated delivery",
    aboutMinutes: (n) => `About ${n} min`,
    paymentMethod: "Payment method",
    payAtDoor: "Cash/card at the door",
    homeReturn: "Back to home",
    noItemsTitle: "No items to order",
    browse: "Browse marts",
    toCart: "To cart",
    deliveryInfo: "Order & delivery info",
    nameLabel: "Recipient",
    namePlaceholder: "John Doe",
    phoneLabel: "Phone",
    addressLabel: "Delivery address",
    memoLabel: "Notes (optional)",
    memoPlaceholder: "e.g. Leave at the door, ring the bell",
    grandTotal: "Total",
    footerNote: "Payment is made at the door on delivery, by cash or card. (Online payment coming soon.)",
    confirmBtn: (amount) => `Confirm order ${amount}`,
  },
  vendor: {
    homeAria: "Home",
    dashboard: "Vendor Dashboard",
    subtitle: "Vendor · price management demo",
    loginAccount: "Logged-in account (demo switch)",
    productsCount: (n) => `${n} products`,
    changedCount: (n) => `${n} changed`,
    synced: "Synced",
    editNote: "You can only edit the prices and stock for this store.",
    onSale: "On sale",
    saved: "Saved",
    save: "Save",
    priceAria: (name) => `${name} price`,
    stockAria: "Stock status",
    demoNote1: "Demo note: prices edited here only update the ",
    demoNote2:
      " record for this store in the table. In a real service, after vendor authentication the server verifies access by ",
    demoNote3: " so vendors can only reach their own store's products.",
  },
  cookie: {
    aria: "Cookie consent",
    body: "This website uses cookies to ensure the best experience. By continuing to browse, you agree to our use of cookies.",
    decline: "Decline",
    configure: "Configure",
    acceptAll: "Accept all cookies",
  },
  cartBar: {
    viewCart: "View cart",
  },
}

export const translations: Record<Lang, Dict> = { KR, HU, EN }

/* --------------------- 데이터(콘텐츠) 지역화 --------------------- */

/** 브랜드명 지역화 (한국어 원문 -> 로마자) */
const BRANDS: Record<string, { HU: string; EN: string }> = {
  농심: { HU: "Nongshim", EN: "Nongshim" },
  오뚜기: { HU: "Ottogi", EN: "Ottogi" },
  삼양: { HU: "Samyang", EN: "Samyang" },
  CJ: { HU: "CJ", EN: "CJ" },
  대상: { HU: "Daesang", EN: "Daesang" },
  해찬들: { HU: "Haechandle", EN: "Haechandle" },
  샘표: { HU: "Sempio", EN: "Sempio" },
  오리온: { HU: "Orion", EN: "Orion" },
  빙그레: { HU: "Binggrae", EN: "Binggrae" },
  비락: { HU: "Birak", EN: "Birak" },
  산지직송: { HU: "Helyi farm", EN: "Local farm" },
  종가집: { HU: "Jongga", EN: "Jongga" },
  수제반찬: { HU: "Házi köret", EN: "Homemade" },
  풀무원: { HU: "Pulmuone", EN: "Pulmuone" },
}

/** 태그 지역화 (한국어 원문 -> 각 언어) */
const TAGS: Record<string, { HU: string; EN: string }> = {
  한식: { HU: "Koreai", EN: "Korean" },
  신선식품: { HU: "Friss", EN: "Fresh" },
  반찬: { HU: "Köretek", EN: "Side dishes" },
  라면: { HU: "Ramen", EN: "Ramen" },
  간편식: { HU: "Készételek", EN: "Ready meals" },
  야간배달: { HU: "Éjszakai kiszállítás", EN: "Night delivery" },
  대용량: { HU: "Nagy kiszerelés", EN: "Bulk" },
  아시안: { HU: "Ázsiai", EN: "Asian" },
  저가: { HU: "Alacsony ár", EN: "Low price" },
  김치: { HU: "Kimchi", EN: "Kimchi" },
  장류: { HU: "Szószok", EN: "Pastes" },
  수제반찬: { HU: "Házi köretek", EN: "Homemade" },
  일식: { HU: "Japán", EN: "Japanese" },
  인기상품: { HU: "Népszerű", EN: "Popular" },
}

export function localizeCategory(cat: Category, lang: Lang): string {
  return lang === "KR" ? cat.name : lang === "HU" ? cat.nameHu : cat.nameEn
}

export function localizeStoreName(store: Store, lang: Lang): string {
  return lang === "KR" ? store.name : lang === "HU" ? store.nameHu : store.nameEn
}

export function localizeStoreDesc(store: Store, lang: Lang): string {
  return lang === "KR" ? store.description : lang === "HU" ? store.descriptionHu : store.descriptionEn
}

export function localizeProductName(
  p: Pick<CatalogProduct, "nameKo" | "nameHu" | "nameEn">,
  lang: Lang,
): string {
  return lang === "KR" ? p.nameKo : lang === "HU" ? p.nameHu : p.nameEn
}

export function localizeProductDesc(p: CatalogProduct, lang: Lang): string {
  return lang === "KR" ? p.description : lang === "HU" ? p.descriptionHu : p.descriptionEn
}

export function localizeBrand(brand: string, lang: Lang): string {
  if (lang === "KR") return brand
  return BRANDS[brand]?.[lang] ?? brand
}

export function localizeTag(tag: string, lang: Lang): string {
  if (lang === "KR") return tag
  return TAGS[tag]?.[lang] ?? tag
}

export function localizeVendorName(v: Vendor, lang: Lang): string {
  return lang === "KR" ? v.name : v.nameEn
}

export function localizeCartItemName(item: CartItem, lang: Lang): string {
  return lang === "KR" ? item.nameKo : lang === "HU" ? item.nameHu : item.nameEn
}
