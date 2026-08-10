"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  regions,
  getRegion,
  getRegionProducts,
  type Region,
  type ResolvedProduct,
} from "./storesData"

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
  /* 지역 */
  region: Region
  regionId: string
  setRegionId: (id: string) => void

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

export function EuromartProvider({ children }: { children: ReactNode }) {
  const [regionId, setRegionIdState] = useState<string>(regions[0].id)
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
  }, [])

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
    // 지역이 바뀌면 카테고리/검색 필터는 초기화 (상품 구성이 달라지므로)
    setActiveCategory(null)
    setSearchQuery("")
  }

  const value = useMemo<EuromartContextValue>(() => {
    const region = getRegion(regionId)
    const products = getRegionProducts(region)
    const currentCart = carts[regionId] ?? []

    // 필터링
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

    // 장바구니 뷰 (상품 정보 결합)
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
      setCarts((prev) => ({ ...prev, [regionId]: fn(prev[regionId] ?? []) }))
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
      setCarts((prev) => ({ ...prev, [regionId]: [] }))
    }

    return {
      region,
      regionId,
      setRegionId,
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
  }, [regionId, carts, activeCategory, searchQuery, cartOpen])

  return <EuromartContext.Provider value={value}>{children}</EuromartContext.Provider>
}

export function useEuromart() {
  const ctx = useContext(EuromartContext)
  if (!ctx) throw new Error("useEuromart must be used within EuromartProvider")
  return ctx
}
