"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { CartItem, StoreProductView } from "./types"

interface PendingItem {
  product: StoreProductView
}

interface CartState {
  storeId: string | null
  items: CartItem[]
}

interface CartContextValue {
  storeId: string | null
  items: CartItem[]
  itemCount: number
  subtotal: number
  /**
   * 상품을 담습니다.
   * 다른 마트의 상품을 담으려 하면 담기지 않고 pending으로 반환됩니다.
   * (호출부에서 "장바구니를 비우고 새 마트로 담을지" 확인 후 confirmSwitch 호출)
   */
  addItem: (product: StoreProductView) => { needsSwitch: boolean }
  removeItem: (storeProductId: string) => void
  setQuantity: (storeProductId: string, quantity: number) => void
  clear: () => void
  /** 장바구니를 비우고 새 마트의 상품으로 시작 */
  confirmSwitch: (product: StoreProductView) => void
  getQuantity: (storeProductId: string) => number
  pending: PendingItem | null
  setPending: (p: PendingItem | null) => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = "budapest-mart-cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({ storeId: null, items: [] })
  const [pending, setPending] = useState<PendingItem | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // localStorage 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState(JSON.parse(raw))
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  // localStorage 저장
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state, hydrated])

  const toCartItem = (product: StoreProductView): CartItem => ({
    storeProductId: product.storeProductId,
    catalogProductId: product.id,
    storeId: product.storeId,
    nameKo: product.nameKo,
    nameHu: product.nameHu,
    nameEn: product.nameEn,
    imageUrl: product.imageUrl,
    unit: product.unit,
    price: product.price,
    quantity: 1,
  })

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

    function addItem(product: StoreProductView) {
      // 다른 마트 상품이면 전환 확인 필요
      if (state.storeId && state.storeId !== product.storeId && state.items.length > 0) {
        return { needsSwitch: true }
      }
      setState((prev) => {
        const existing = prev.items.find((i) => i.storeProductId === product.storeProductId)
        if (existing) {
          return {
            storeId: product.storeId,
            items: prev.items.map((i) =>
              i.storeProductId === product.storeProductId ? { ...i, quantity: i.quantity + 1 } : i,
            ),
          }
        }
        return {
          storeId: product.storeId,
          items: [...prev.items, toCartItem(product)],
        }
      })
      return { needsSwitch: false }
    }

    function confirmSwitch(product: StoreProductView) {
      setState({ storeId: product.storeId, items: [toCartItem(product)] })
      setPending(null)
    }

    function removeItem(storeProductId: string) {
      setState((prev) => {
        const items = prev.items.filter((i) => i.storeProductId !== storeProductId)
        return { storeId: items.length ? prev.storeId : null, items }
      })
    }

    function setQuantity(storeProductId: string, quantity: number) {
      setState((prev) => {
        if (quantity <= 0) {
          const items = prev.items.filter((i) => i.storeProductId !== storeProductId)
          return { storeId: items.length ? prev.storeId : null, items }
        }
        return {
          ...prev,
          items: prev.items.map((i) => (i.storeProductId === storeProductId ? { ...i, quantity } : i)),
        }
      })
    }

    function clear() {
      setState({ storeId: null, items: [] })
    }

    function getQuantity(storeProductId: string) {
      return state.items.find((i) => i.storeProductId === storeProductId)?.quantity ?? 0
    }

    return {
      storeId: state.storeId,
      items: state.items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clear,
      confirmSwitch,
      getQuantity,
      pending,
      setPending,
    }
  }, [state, pending])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
