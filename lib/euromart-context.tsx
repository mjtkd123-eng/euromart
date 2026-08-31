"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getRegion, getRegionProducts, type Region, type ResolvedProduct } from "./storesData"
import type { FxRateMap } from "./fx-shared"
import {
  cityName as localizedCityName,
  detectLocale,
  localLangFor,
  resolveLang,
  translate,
  type Lang,
  type Locale,
  type TransKey,
} from "./i18n"

export interface CurrentUser {
  id: string
  email: string | null
  fullName: string | null
  role: "customer" | "vendor" | "admin"
}

/** 장바구니 라인 — 지역이 바뀌면 통화가 달라지므로 지역별로 분리 저장 */
interface CartLine {
  productId: string
  quantity: number
}

export interface CartLineView extends ResolvedProduct {
  quantity: number
  lineTotal: number
}

export type BrowseMode = "stores" | "products"

export interface CountryOption {
  code: string
  name: string
  storeCount: number
}

interface EuromartContextValue {
  /* 세션 */
  user: CurrentUser | null

  /* 지역 / 국가 */
  regions: Region[]
  region: Region
  regionId: string
  setRegionId: (id: string) => void
  countryCode: string
  countries: CountryOption[]
  /** 네비에서 국가 선택 → 해당 국가 매장 목록 */
  selectCountry: (code: string) => void
  /** 매장 카드 선택 → 상품 카탈로그 */
  openStore: (regionId: string) => void
  /** 상품 보기에서 매장 목록으로 돌아가기 */
  backToStores: () => void
  storesInCountry: Region[]
  browseMode: BrowseMode

  /** EUR 기준 환율 캐시 — 표시용 환산가에 사용 */
  fxRates: FxRateMap

  /* 언어 */
  /** 사용자가 선택한 표시 언어 ("local"은 매장 국가에 따라 달라짐) */
  locale: Locale
  setLocale: (locale: Locale) => void
  /** locale을 실제 사전 언어로 해석한 결과 */
  lang: Lang
  /** 현재 매장 국가의 현지 언어 이름 (없으면 null) */
  localLangLabel: string | null
  /** 번역 헬퍼 */
  t: (key: TransKey, params?: Record<string, string | number>) => string
  /** 상품명을 현재 언어로 — 한국어일 때만 한글명을 사용 */
  productName: (product: { nameKo: string; nameEn: string }) => string
  /** 매장명을 현재 언어로 */
  storeName: (region: Region) => string
  /** 도시명을 현재 언어로 — 예) "Budapest" → "부다페스트" */
  cityName: (region: Region) => string

  /* 인증 안내 모달 */
  authPromptOpen: boolean
  setAuthPromptOpen: (open: boolean) => void
  /* 회원가입 모달 (GDPR 약관 동의 포함) */
  signUpOpen: boolean
  setSignUpOpen: (open: boolean) => void

  /* 상품 / 필터 */
  products: ResolvedProduct[]
  filteredProducts: ResolvedProduct[]
  activeCategory: string | null
  setActiveCategory: (id: string | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void

  /* 장바구니 */
  cart: CartLineView[]
  itemCount: number
  subtotal: number
  deliveryFee: number
  freeDeliveryProgress: number
  total: number
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  getQuantity: (productId: string) => number
  clearCart: () => void

  /* 드로어 */
  cartOpen: boolean
  setCartOpen: (open: boolean) => void

  /* 상품 상세 오버레이 */
  detailProduct: ResolvedProduct | null
  openProductDetail: (productId: string) => void
  closeProductDetail: () => void
}

const EuromartContext = createContext<EuromartContextValue | null>(null)

const REGION_KEY = "k-euromart-region"
const CART_KEY = "k-euromart-carts"
const LOCALE_KEY = "k-euromart-locale"

type CartsByRegion = Record<string, CartLine[]>

export function EuromartProvider({
  initialRegions,
  user = null,
  fxRates = {},
  children,
}: {
  initialRegions: Region[]
  user?: CurrentUser | null
  fxRates?: FxRateMap
  children: ReactNode
}) {
  const regions = initialRegions
  const [regionId, setRegionIdState] = useState<string>(regions[0]?.id ?? "")
  const [countryCode, setCountryCode] = useState<string>(regions[0]?.countryCode ?? "")
  const [browseMode, setBrowseMode] = useState<BrowseMode>("stores")
  const [carts, setCarts] = useState<CartsByRegion>({})
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartOpen, setCartOpen] = useState(false)
  const [detailProductId, setDetailProductId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  // 서버 렌더 시점에는 접속 환경을 알 수 없으므로 "en"으로 시작하고,
  // 마운트 후 저장된 선택 또는 접속 환경 감지 결과로 교체합니다.
  const [locale, setLocale] = useState<Locale>("en")
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [signUpOpen, setSignUpOpen] = useState(false)

  // localStorage 복원
  useEffect(() => {
    try {
      const savedRegion = localStorage.getItem(REGION_KEY)
      if (savedRegion && regions.some((r) => r.id === savedRegion)) {
        const saved = regions.find((r) => r.id === savedRegion)!
        setRegionIdState(saved.id)
        setCountryCode(saved.countryCode)
      }
      const savedCarts = localStorage.getItem(CART_KEY)
      if (savedCarts) setCarts(JSON.parse(savedCarts))

      // 사용자가 직접 고른 언어가 있으면 존중하고, 없으면 접속 환경으로 판단합니다.
      const savedLocale = localStorage.getItem(LOCALE_KEY)
      if (savedLocale === "ko" || savedLocale === "en" || savedLocale === "local") {
        setLocale(savedLocale)
      } else {
        setLocale(detectLocale())
      }
    } catch {
      setLocale(detectLocale())
    }
    setHydrated(true)
  }, [regions])

  // localStorage 저장
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(REGION_KEY, regionId)
      localStorage.setItem(CART_KEY, JSON.stringify(carts))
      localStorage.setItem(LOCALE_KEY, locale)
    } catch {
      // ignore
    }
  }, [regionId, carts, locale, hydrated])

  function setRegionId(id: string) {
    const next = regions.find((r) => r.id === id)
    setRegionIdState(id)
    if (next) setCountryCode(next.countryCode)
    setActiveCategory(null)
    setSearchQuery("")
  }

  function selectCountry(code: string) {
    const inCountry = regions.filter((r) => r.countryCode === code)
    if (!inCountry.length) return
    setCountryCode(code)
    setRegionIdState(inCountry[0].id)
    setBrowseMode("stores")
    setActiveCategory(null)
    setSearchQuery("")
  }

  function openStore(id: string) {
    const next = regions.find((r) => r.id === id)
    if (!next) return
    setRegionIdState(next.id)
    setCountryCode(next.countryCode)
    setBrowseMode("products")
    setActiveCategory(null)
    setSearchQuery("")
  }

  function backToStores() {
    setBrowseMode("stores")
    setActiveCategory(null)
    setSearchQuery("")
  }

  const value = useMemo<EuromartContextValue>(() => {
    const region = getRegion(regions, regionId)
    const activeCountry = countryCode || region.countryCode
    const storesInCountry = regions.filter((r) => r.countryCode === activeCountry)
    const countries: CountryOption[] = []
    for (const r of regions) {
      const existing = countries.find((c) => c.code === r.countryCode)
      if (existing) existing.storeCount += 1
      else countries.push({ code: r.countryCode, name: r.country, storeCount: 1 })
    }

    const products = getRegionProducts(region)
    const currentCart = carts[region.id] ?? []

    // 표시 언어 해석 — "local"은 현재 매장 국가의 언어로 결정됩니다.
    const lang = resolveLang(locale, region.countryCode)
    const localLangLabel = localLangFor(region.countryCode)?.label ?? null
    const t = (key: TransKey, params?: Record<string, string | number>) =>
      translate(key, lang, params)
    const productName = (product: { nameKo: string; nameEn: string }) =>
      lang === "ko" ? product.nameKo : product.nameEn
    const storeName = (r: Region) => (lang === "ko" ? r.store.ko : r.store.en)
    const cityName = (r: Region) => localizedCityName(r.id, r.city, lang)

    const q = searchQuery.trim().toLowerCase()
    const filteredProducts = products.filter((p) => {
      const matchCat = !activeCategory || p.category === activeCategory
      const matchQuery =
        !q ||
        p.nameKo.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      return matchCat && matchQuery
    })

    const cart: CartLineView[] = currentCart
      .map((line) => {
        const product = products.find((p) => p.id === line.productId)
        if (!product) return null
        return { ...product, quantity: line.quantity, lineTotal: product.price * line.quantity }
      })
      .filter((l): l is CartLineView => l !== null)

    const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0)
    const subtotal = cart.reduce((sum, l) => sum + l.lineTotal, 0)
    const qualifiesFree = subtotal >= region.freeDeliveryOver
    const deliveryFee = subtotal === 0 || qualifiesFree ? 0 : region.deliveryFee
    const freeDeliveryProgress = Math.min(1, region.freeDeliveryOver === 0 ? 1 : subtotal / region.freeDeliveryOver)
    const total = subtotal + deliveryFee

    function mutate(fn: (lines: CartLine[]) => CartLine[]) {
      setCarts((prev) => ({ ...prev, [region.id]: fn(prev[region.id] ?? []) }))
    }

    function addItem(productId: string) {
      mutate((lines) => {
        const existing = lines.find((l) => l.productId === productId)
        if (existing) {
          return lines.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l))
        }
        return [...lines, { productId, quantity: 1 }]
      })
    }

    function removeItem(productId: string) {
      mutate((lines) => lines.filter((l) => l.productId !== productId))
    }

    function setQuantity(productId: string, quantity: number) {
      mutate((lines) => {
        if (quantity <= 0) return lines.filter((l) => l.productId !== productId)
        return lines.map((l) => (l.productId === productId ? { ...l, quantity } : l))
      })
    }

    function getQuantity(productId: string) {
      return currentCart.find((l) => l.productId === productId)?.quantity ?? 0
    }

    function clearCart() {
      setCarts((prev) => ({ ...prev, [region.id]: [] }))
    }

    // 상세 오버레이 대상 — 현재 지역 상품 목록에서 찾습니다.
    // 지역이 바뀌어 해당 상품이 없으면 자연스럽게 null이 됩니다.
    const detailProduct = detailProductId
      ? (products.find((p) => p.id === detailProductId) ?? null)
      : null

    function openProductDetail(productId: string) {
      setDetailProductId(productId)
    }

    function closeProductDetail() {
      setDetailProductId(null)
    }

    return {
      user,
      regions,
      region,
      regionId: region.id,
      setRegionId,
      countryCode: activeCountry,
      countries,
      selectCountry,
      openStore,
      backToStores,
      storesInCountry,
      browseMode,
      fxRates,
      locale,
      setLocale,
      lang,
      localLangLabel,
      t,
      productName,
      storeName,
      cityName,
      authPromptOpen,
      setAuthPromptOpen,
      signUpOpen,
      setSignUpOpen,
      products,
      filteredProducts,
      activeCategory,
      setActiveCategory,
      searchQuery,
      setSearchQuery,
      cart,
      itemCount,
      subtotal,
      deliveryFee,
      freeDeliveryProgress,
      total,
      addItem,
      removeItem,
      setQuantity,
      getQuantity,
      clearCart,
      cartOpen,
      setCartOpen,
      detailProduct,
      openProductDetail,
      closeProductDetail,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    regions,
    regionId,
    countryCode,
    browseMode,
    carts,
    activeCategory,
    searchQuery,
    cartOpen,
    user,
    fxRates,
    locale,
    authPromptOpen,
    signUpOpen,
    detailProductId,
  ])

  return <EuromartContext.Provider value={value}>{children}</EuromartContext.Provider>
}

export function useEuromart() {
  const ctx = useContext(EuromartContext)
  if (!ctx) throw new Error("useEuromart must be used within EuromartProvider")
  return ctx
}
