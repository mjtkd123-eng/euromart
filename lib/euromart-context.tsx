"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getRegion, getRegionProducts, type Region, type ResolvedProduct } from "./storesData"
import type { FxRateMap } from "./fx-shared"

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

interface EuromartContextValue {
  /* 세션 */
  user: CurrentUser | null

  /* 지역 */
  regions: Region[]
  region: Region
  regionId: string
  setRegionId: (id: string) => void

  /** EUR 기준 환율 캐시 — 표시용 환산가에 사용 */
  fxRates: FxRateMap

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
}

const EuromartContext = createContext<EuromartContextValue | null>(null)

const REGION_KEY = "k-euromart-region"
const CART_KEY = "k-euromart-carts"

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
  const [carts, setCarts] = useState<CartsByRegion>({})
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartOpen, setCartOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // localStorage 복원
  useEffect(() => {
    try {
      const savedRegion = localStorage.getItem(REGION_KEY)
      if (savedRegion && regions.some((r) => r.id === savedRegion)) {
        setRegionIdState(savedRegion)
      }
      const savedCarts = localStorage.getItem(CART_KEY)
      if (savedCarts) setCarts(JSON.parse(savedCarts))
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [regions])

  // localStorage 저장
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(REGION_KEY, regionId)
      localStorage.setItem(CART_KEY, JSON.stringify(carts))
    } catch {
      // ignore
    }
  }, [regionId, carts, hydrated])

  function setRegionId(id: string) {
    setRegionIdState(id)
    setActiveCategory(null)
    setSearchQuery("")
  }

  const value = useMemo<EuromartContextValue>(() => {
    const region = getRegion(regions, regionId)
    const products = getRegionProducts(region)
    const currentCart = carts[region.id] ?? []

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

    return {
      user,
      regions,
      region,
      regionId: region.id,
      setRegionId,
      fxRates,
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, regionId, carts, activeCategory, searchQuery, cartOpen, user, fxRates])

  return <EuromartContext.Provider value={value}>{children}</EuromartContext.Provider>
}

export function useEuromart() {
  const ctx = useContext(EuromartContext)
  if (!ctx) throw new Error("useEuromart must be used within EuromartProvider")
  return ctx
}
