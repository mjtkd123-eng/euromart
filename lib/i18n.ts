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

  /* --- 도시명 --- */
  /**
   * 도시명은 언어별 표기가 다르므로 사전에서 관리합니다.
   * (DB의 `city` 컬럼은 라틴 표기 하나만 저장합니다.)
   * 새 매장을 추가하면 `city.<region id>` 키를 함께 등록하세요.
   */
  "city.vienna": { ko: "비엔나", en: "Vienna", de: "Wien", cs: "Vídeň", fr: "Vienne", hu: "Bécs" },
  "city.prague": { ko: "프라하", en: "Prague", de: "Prag", cs: "Praha", fr: "Prague", hu: "Prága" },
  "city.paris": { ko: "파리", en: "Paris", de: "Paris", cs: "Paříž", fr: "Paris", hu: "Párizs" },
  "city.berlin": { ko: "베를린", en: "Berlin", de: "Berlin", cs: "Berlín", fr: "Berlin", hu: "Berlin" },
  "city.budapest": {
    ko: "부다페스트",
    en: "Budapest",
    de: "Budapest",
    cs: "Budapešť",
    fr: "Budapest",
    hu: "Budapest",
  },

  /* --- 히어로 배너 --- */
  heroTitle: {
    ko: "유럽 속 한국의 맛, {city}",
    en: "Taste of Korea in Europe, {city}",
    de: "Koreas Geschmack in Europa, {city}",
    cs: "Chuť Koreje v Evropě, {city}",
    fr: "Le goût de la Corée en Europe, {city}",
    hu: "Korea íze Európában, {city}",
  },
  heroSubtitle: {
    ko: "{store}에서 신선한 한국 식료품을 현지 통화로 간편하게 주문하세요.",
    en: "Order fresh Korean groceries from {store}, priced in your local currency.",
    de: "Frische koreanische Lebensmittel von {store} — in Ihrer Landeswährung.",
    cs: "Čerstvé korejské potraviny z {store} — v místní valutě.",
    fr: "Des produits coréens frais de {store}, dans votre devise locale.",
    hu: "Friss koreai élelmiszer a(z) {store} kínálatából, helyi valutában.",
  },

  /* --- 로그인 / 회원가입 모달 --- */
  signInOrRegister: {
    ko: "로그인 / 회원가입",
    en: "Sign In / Register",
    de: "Anmelden / Registrieren",
    cs: "Přihlásit se / Registrovat",
    fr: "Connexion / Inscription",
    hu: "Bejelentkezés / Regisztráció",
  },
  authModalTitle: {
    ko: "{store} 계정으로 더 편하게",
    en: "Get more from {store}",
    de: "Mehr aus {store} machen",
    cs: "Získejte více z {store}",
    fr: "Profitez pleinement de {store}",
    hu: "Hozza ki a legtöbbet a(z) {store}-ból",
  },
  authModalSubtitle: {
    ko: "계정을 만들면 주문 내역과 배송 정보를 저장하고, 장바구니를 어디서나 이어서 사용할 수 있습니다.",
    en: "Create an account to save your orders and delivery details, and pick up your cart on any device.",
    de: "Erstellen Sie ein Konto, um Bestellungen und Lieferdaten zu speichern und Ihren Warenkorb überall fortzusetzen.",
    cs: "Vytvořte si účet, uložte si objednávky a doručovací údaje a pokračujte v košíku na jakémkoli zařízení.",
    fr: "Créez un compte pour enregistrer vos commandes et vos adresses, et retrouver votre panier partout.",
    hu: "Hozzon létre fiókot, hogy elmentse rendeléseit és szállítási adatait, és bárhol folytathassa a kosarát.",
  },
  authPerkOrders: {
    ko: "주문 내역과 재주문",
    en: "Order history & one-tap reorder",
    de: "Bestellverlauf & Nachbestellung",
    cs: "Historie objednávek a opakování",
    fr: "Historique et recommande rapide",
    hu: "Rendelési előzmények és újrarendelés",
  },
  authPerkAddress: {
    ko: "배송지 저장으로 빠른 결제",
    en: "Saved addresses for faster checkout",
    de: "Gespeicherte Adressen für schnelleres Bezahlen",
    cs: "Uložené adresy pro rychlejší platbu",
    fr: "Adresses enregistrées pour payer plus vite",
    hu: "Mentett címek a gyorsabb fizetéshez",
  },
  authPerkCart: {
    ko: "모든 기기에서 장바구니 동기화",
    en: "Your cart synced across devices",
    de: "Warenkorb auf allen Geräten",
    cs: "Košík na všech zařízeních",
    fr: "Panier synchronisé sur tous vos appareils",
    hu: "Kosár minden eszközön",
  },
  createAccount: {
    ko: "무료로 회원가입",
    en: "Create a free account",
    de: "Kostenloses Konto erstellen",
    cs: "Vytvořit účet zdarma",
    fr: "Créer un compte gratuit",
    hu: "Ingyenes fiók létrehozása",
  },
  alreadyMember: {
    ko: "이미 계정이 있으신가요?",
    en: "Already have an account?",
    de: "Sie haben bereits ein Konto?",
    cs: "Už máte účet?",
    fr: "Vous avez déjà un compte ?",
    hu: "Már van fiókja?",
  },
  continueAsGuest: {
    ko: "비회원으로 계속 둘러보기",
    en: "Continue browsing as a guest",
    de: "Als Gast weiterstöbern",
    cs: "Pokračovat jako návštěvník",
    fr: "Continuer en tant qu'invité",
    hu: "Folytatás vendégként",
  },
  closeDialog: {
    ko: "닫기",
    en: "Close",
    de: "Schließen",
    cs: "Zavřít",
    fr: "Fermer",
    hu: "Bezárás",
  },

  /* --- 인증 페이지 --- */
  loginTitle: {
    ko: "로그인",
    en: "Sign in",
    de: "Anmelden",
    cs: "Přihlášení",
    fr: "Connexion",
    hu: "Bejelentkezés",
  },
  loginSubtitle: {
    ko: "계정에 로그인하여 주문을 이어가세요.",
    en: "Sign in to continue your order.",
    de: "Melden Sie sich an, um fortzufahren.",
    cs: "Přihlaste se a pokračujte v objednávce.",
    fr: "Connectez-vous pour continuer votre commande.",
    hu: "Jelentkezzen be a rendelés folytatásához.",
  },
  signUpTitle: {
    ko: "회원가입",
    en: "Create account",
    de: "Konto erstellen",
    cs: "Registrace",
    fr: "Créer un compte",
    hu: "Regisztráció",
  },
  signUpSubtitle: {
    ko: "새 계정을 만들어 유럽 어디서나 한국 식료품을 주문하세요.",
    en: "Create an account to order Korean groceries anywhere in Europe.",
    de: "Erstellen Sie ein Konto und bestellen Sie koreanische Lebensmittel europaweit.",
    cs: "Vytvořte si účet a objednávejte korejské potraviny po celé Evropě.",
    fr: "Créez un compte pour commander des produits coréens partout en Europe.",
    hu: "Hozzon létre fiókot, és rendeljen koreai élelmiszert Európa bármely pontján.",
  },
  emailLabel: { ko: "이메일", en: "Email", de: "E-Mail", cs: "E-mail", fr: "E-mail", hu: "E-mail" },
  passwordLabel: {
    ko: "비밀번호",
    en: "Password",
    de: "Passwort",
    cs: "Heslo",
    fr: "Mot de passe",
    hu: "Jelszó",
  },
  repeatPasswordLabel: {
    ko: "비밀번호 확인",
    en: "Repeat password",
    de: "Passwort wiederholen",
    cs: "Heslo znovu",
    fr: "Confirmer le mot de passe",
    hu: "Jelszó megerősítése",
  },
  nameLabel: { ko: "이름", en: "Name", de: "Name", cs: "Jméno", fr: "Nom", hu: "Név" },
  signingIn: {
    ko: "로그인 중...",
    en: "Signing in...",
    de: "Anmeldung...",
    cs: "Přihlašování...",
    fr: "Connexion...",
    hu: "Bejelentkezés...",
  },
  creatingAccount: {
    ko: "계정 생성 중...",
    en: "Creating account...",
    de: "Konto wird erstellt...",
    cs: "Vytváření účtu...",
    fr: "Création du compte...",
    hu: "Fiók létrehozása...",
  },
  noAccountYet: {
    ko: "계정이 없으신가요?",
    en: "Don't have an account?",
    de: "Noch kein Konto?",
    cs: "Nemáte účet?",
    fr: "Vous n'avez pas de compte ?",
    hu: "Még nincs fiókja?",
  },
  signUpAction: {
    ko: "회원가입",
    en: "Sign up",
    de: "Registrieren",
    cs: "Registrovat",
    fr: "S'inscrire",
    hu: "Regisztráció",
  },
  homeLink: {
    ko: "K-EuroMart 홈으로",
    en: "Back to K-EuroMart home",
    de: "Zur K-EuroMart Startseite",
    cs: "Na domovskou stránku K-EuroMart",
    fr: "Retour à l'accueil K-EuroMart",
    hu: "Vissza a K-EuroMart főoldalára",
  },
  passwordMismatch: {
    ko: "비밀번호가 일치하지 않습니다.",
    en: "Passwords do not match.",
    de: "Passwörter stimmen nicht überein.",
    cs: "Hesla se neshodují.",
    fr: "Les mots de passe ne correspondent pas.",
    hu: "A jelszavak nem egyeznek.",
  },

  /* --- 회원가입 모달 & GDPR 동의 --- */
  signUpModalTitle: {
    ko: "회원가입",
    en: "Create your account",
    de: "Konto erstellen",
    cs: "Vytvořit účet",
    fr: "Créer votre compte",
    hu: "Fiók létrehozása",
  },
  signUpModalSubtitle: {
    ko: "이메일로 몇 초 만에 가입하고 주문을 시작하세요.",
    en: "Sign up with your email in seconds and start ordering.",
    de: "Registrieren Sie sich in Sekunden per E-Mail und bestellen Sie los.",
    cs: "Zaregistrujte se e-mailem za pár sekund a začněte nakupovat.",
    fr: "Inscrivez-vous par e-mail en quelques secondes et commandez.",
    hu: "Regisztráljon e-mailben pár másodperc alatt, és kezdjen rendelni.",
  },
  agreeAll: {
    ko: "아래의 이용약관 및 개인정보 처리방침에 모두 동의합니다.",
    en: "I agree to all of the terms of service and the privacy policy below.",
    de: "Ich stimme allen unten genannten AGB und der Datenschutzerklärung zu.",
    cs: "Souhlasím se všemi níže uvedenými podmínkami a zásadami ochrany osobních údajů.",
    fr: "J'accepte l'ensemble des conditions et la politique de confidentialité ci-dessous.",
    hu: "Elfogadom az alábbi felhasználási feltételeket és adatvédelmi szabályzatot.",
  },
  requiredTag: {
    ko: "필수",
    en: "Required",
    de: "Erforderlich",
    cs: "Povinné",
    fr: "Requis",
    hu: "Kötelező",
  },
  termsConsentLabel: {
    ko: "K-EuroMart 이용약관 및 개인정보 처리방침 동의",
    en: "Agree to the K-EuroMart terms of service and privacy policy",
    de: "K-EuroMart AGB und Datenschutzerklärung zustimmen",
    cs: "Souhlas s podmínkami a ochranou osobních údajů K-EuroMart",
    fr: "Accepter les conditions et la politique de confidentialité K-EuroMart",
    hu: "A K-EuroMart feltételeinek és adatvédelmi szabályzatának elfogadása",
  },
  termsConsentHint: {
    ko: "쿠키 활용 및 14일 철회권 등을 포함합니다.",
    en: "Includes cookie usage and the 14-day right of withdrawal.",
    de: "Enthält Cookie-Nutzung und das 14-tägige Widerrufsrecht.",
    cs: "Zahrnuje používání cookies a 14denní právo na odstoupení.",
    fr: "Inclut l'usage des cookies et le droit de rétractation de 14 jours.",
    hu: "Tartalmazza a cookie-k használatát és a 14 napos elállási jogot.",
  },
  viewTerms: { ko: "보기", en: "View", de: "Ansehen", cs: "Zobrazit", fr: "Voir", hu: "Megnyitás" },
  hideTerms: { ko: "닫기", en: "Hide", de: "Ausblenden", cs: "Skrýt", fr: "Masquer", hu: "Elrejtés" },
  termsRequiredError: {
    ko: "필수 약관에 동의해야 가입할 수 있습니다.",
    en: "You must accept the required terms to sign up.",
    de: "Sie müssen die erforderlichen Bedingungen akzeptieren.",
    cs: "Pro registraci musíte přijmout povinné podmínky.",
    fr: "Vous devez accepter les conditions requises pour vous inscrire.",
    hu: "A regisztrációhoz el kell fogadnia a kötelező feltételeket.",
  },

  /* 약관 상세 — 본문은 ko/en만 관리하고 현지 언어에서는 영어로 대체됩니다. */
  termsDocTitle: {
    ko: "이용약관 및 개인정보 처리방침",
    en: "Terms of Service & Privacy Policy",
  },
  termsArt1Title: { ko: "제1조 (목적)", en: "Article 1 (Purpose)" },
  termsArt1Body: {
    ko: "본 약관은 K-EuroMart가 제공하는 서비스 이용과 관련하여 회사와 회원의 권리와 의무를 규정합니다.",
    en: "These terms define the rights and obligations of K-EuroMart and its members in relation to the use of the service.",
  },
  termsArt2Title: { ko: "제2조 (사업자 정보)", en: "Article 2 (Business information)" },
  termsArt2Body: {
    ko: "상호: K-EuroMart (테스트 단계).",
    en: "Trade name: K-EuroMart (test phase).",
  },
  termsArt3Title: {
    ko: "제3조 (회원가입 및 개인정보 보호)",
    en: "Article 3 (Registration and data protection)",
  },
  termsArt3Body: {
    ko: "회사는 EU 일반 개인정보 보호법(GDPR)을 준수합니다. 수집한 개인정보는 주문·배송 처리 및 장바구니 동기화 목적으로만 사용되며, 회원은 언제든지 개인정보의 열람·정정·삭제를 요청하거나 동의를 철회할 수 있습니다.",
    en: "We comply with the EU General Data Protection Regulation (GDPR). Personal data is used only to process orders and deliveries and to sync your cart. You may request access, correction, or deletion of your data, or withdraw your consent, at any time.",
  },
  termsArt4Title: { ko: "제4조 (쿠키 운용)", en: "Article 4 (Use of cookies)" },
  termsArt4Body: {
    ko: "회사는 맞춤형 서비스 제공과 이용 분석을 위해 쿠키를 사용합니다. 회원은 쿠키 저장을 거부할 권리가 있으며, 거부 시 일부 기능이 제한될 수 있습니다.",
    en: "We use cookies to personalise the service and analyse usage. You have the right to refuse cookies; some features may be limited if you do.",
  },
  termsArt5Title: { ko: "제5조 (배송)", en: "Article 5 (Delivery)" },
  termsArt5Body: {
    ko: "49유로 이상 주문 시 무료 배송이 적용됩니다.",
    en: "Free delivery applies to orders of 49 EUR or more.",
  },
  termsArt6Title: { ko: "제6조 (청약철회)", en: "Article 6 (Right of withdrawal)" },
  termsArt6Body: {
    ko: "EU 소비자 보호 지침에 따라 상품 수령일로부터 14일 이내에 청약을 철회할 수 있습니다. 다만 신선식품 등 성질상 철회가 제한되는 상품에는 예외가 적용됩니다.",
    en: "Under EU consumer protection directives you may withdraw within 14 days of receiving your goods. Exceptions apply to items such as fresh food where withdrawal is restricted by their nature.",
  },

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
 * 도시명을 현재 언어로 표기합니다.
 * 사전에 등록되지 않은 도시는 DB의 라틴 표기를 그대로 사용합니다.
 */
export function cityName(regionId: string, fallback: string, lang: Lang): string {
  const key = `city.${regionId}`
  if (!(key in dict)) return fallback
  return translate(key as TransKey, lang)
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
