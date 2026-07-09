"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Plus, Minus, Trash2, ShoppingBag, ChevronLeft, Store as StoreIcon } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { getStoreById } from "@/lib/queries"
import { formatFt } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function CartView() {
  const router = useRouter()
  const { items, storeId, subtotal, setQuantity, removeItem, clear } = useCart()
  const store = storeId ? getStoreById(storeId) : undefined

  if (items.length === 0 || !store) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBag className="size-8" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold">장바구니가 비어 있어요</h1>
        <p className="mt-1 text-sm text-muted-foreground">마음에 드는 마트에서 상품을 담아보세요.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/">마트 둘러보기</Link>
        </Button>
      </div>
    )
  }

  const deliveryFee = store.deliveryFee
  const belowMin = subtotal < store.minOrder
  const total = subtotal + deliveryFee
  const remaining = store.minOrder - subtotal

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Button asChild size="icon" variant="ghost" className="rounded-full">
          <Link href={`/store/${store.slug}`} aria-label="마트로 돌아가기">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-xl font-black">장바구니</h1>
      </div>

      {/* 마트 정보 */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image src={store.logo || "/placeholder.svg"} alt={`${store.name} 로고`} fill sizes="44px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-bold">
            <StoreIcon className="size-3.5 text-primary" aria-hidden="true" />
            {store.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{store.district} · 예상 {store.deliveryTimeMin}분</p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clear}>
          <Trash2 className="size-4" aria-hidden="true" />
          비우기
        </Button>
      </div>

      {/* 상품 목록 */}
      <div className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
        {items.map((item) => (
          <div key={item.storeProductId} className="flex items-center gap-3 py-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image src={item.imageUrl || "/placeholder.svg"} alt={item.nameKo} fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold leading-tight">{item.nameKo}</h3>
              <p className="text-xs text-muted-foreground">{item.unit}</p>
              <p className="mt-1 font-bold">{formatFt(item.price)}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border p-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-full"
                onClick={() => setQuantity(item.storeProductId, item.quantity - 1)}
                aria-label="수량 줄이기"
              >
                {item.quantity === 1 ? <Trash2 className="size-4" aria-hidden="true" /> : <Minus className="size-4" aria-hidden="true" />}
              </Button>
              <span className="w-5 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-full"
                onClick={() => setQuantity(item.storeProductId, item.quantity + 1)}
                aria-label="수량 늘리기"
              >
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 결제 요약 */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">상품 금액</span>
          <span className="font-medium">{formatFt(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted-foreground">배달비</span>
          <span className="font-medium">{formatFt(deliveryFee)}</span>
        </div>
        <Separator className="my-3" />
        <div className="flex items-baseline justify-between">
          <span className="font-bold">결제 예정 금액</span>
          <span className="text-lg font-black">{formatFt(total)}</span>
        </div>
      </div>

      {belowMin && (
        <p className="mt-3 rounded-xl bg-accent px-4 py-3 text-center text-sm font-medium text-accent-foreground">
          최소 주문금액까지 {formatFt(remaining)} 남았어요
        </p>
      )}

      <Button
        className="mt-4 h-12 w-full rounded-full text-base font-bold"
        disabled={belowMin}
        onClick={() => router.push("/checkout")}
      >
        {belowMin ? `최소 주문금액 ${formatFt(store.minOrder)}` : `${formatFt(total)} 주문하기`}
      </Button>
    </div>
  )
}
