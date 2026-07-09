"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronLeft } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { getStoreById } from "@/lib/queries"
import { formatFt } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export function CheckoutView() {
  const { items, storeId, subtotal, clear } = useCart()
  const store = storeId ? getStoreById(storeId) : undefined
  const [placed, setPlaced] = useState(false)
  const [orderNo] = useState(() => `BM${Math.floor(100000 + Math.random() * 900000)}`)

  // 주문 완료 화면
  if (placed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-chart-3/15 text-chart-3">
          <CheckCircle2 className="size-12" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-black">주문이 접수되었어요!</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          주문번호 <span className="font-bold text-foreground">{orderNo}</span> 로 접수되었습니다.
          마트에서 상품을 준비하는 대로 배달을 시작합니다.
        </p>
        <div className="mt-6 w-full rounded-2xl border border-border bg-card p-4 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">예상 배달 시간</span>
            <span className="font-semibold">약 {store?.deliveryTimeMin ?? 35}분</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">결제 방식</span>
            <span className="font-semibold">문 앞 현금/카드 결제</span>
          </div>
        </div>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  if (items.length === 0 || !store) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <h1 className="text-xl font-bold">주문할 상품이 없어요</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/">마트 둘러보기</Link>
        </Button>
      </div>
    )
  }

  const total = subtotal + store.deliveryFee

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // 향후 확장: 실제 결제(Stripe) 및 주문 DB 저장 자리
    clear()
    setPlaced(true)
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Button asChild size="icon" variant="ghost" className="rounded-full" type="button">
          <Link href="/cart" aria-label="장바구니로">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-xl font-black">주문/배달 정보</h1>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-2">
          <Label htmlFor="name">받는 분</Label>
          <Input id="name" required placeholder="홍길동" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">연락처</Label>
          <Input id="phone" type="tel" required placeholder="+36 30 123 4567" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">배달 주소</Label>
          <Input id="address" required placeholder="Andrássy út 12, 1061 Budapest" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="memo">요청사항 (선택)</Label>
          <Textarea id="memo" placeholder="예: 문 앞에 놓아주세요, 벨 눌러주세요" rows={2} />
        </div>
      </div>

      {/* 요약 */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-bold">{store.name}</p>
        <div className="space-y-1.5 text-sm">
          {items.map((item) => (
            <div key={item.storeProductId} className="flex justify-between">
              <span className="text-muted-foreground">
                {item.nameKo} <span className="text-xs">x{item.quantity}</span>
              </span>
              <span className="font-medium">{formatFt(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">배달비</span>
          <span className="font-medium">{formatFt(store.deliveryFee)}</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-bold">총 결제 금액</span>
          <span className="text-lg font-black">{formatFt(total)}</span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        결제는 배달 시 문 앞에서 현금 또는 카드로 진행됩니다. (온라인 결제 연동은 향후 추가 예정)
      </p>

      <Button type="submit" className="mt-4 h-12 w-full rounded-full text-base font-bold">
        {formatFt(total)} 주문 확정하기
      </Button>
    </form>
  )
}
