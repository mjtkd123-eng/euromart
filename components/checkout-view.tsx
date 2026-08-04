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
import { useLanguage } from "@/lib/language-context"
import { localizeStoreName, localizeCartItemName } from "@/lib/i18n"

export function CheckoutView() {
  const { items, storeId, subtotal, clear } = useCart()
  const store = storeId ? getStoreById(storeId) : undefined
  const [placed, setPlaced] = useState(false)
  const [orderNo] = useState(() => `BM${Math.floor(100000 + Math.random() * 900000)}`)
  const { lang, t } = useLanguage()

  // 주문 완료 화면
  if (placed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-chart-3/15 text-chart-3">
          <CheckCircle2 className="size-12" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-black">{t.checkout.successTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          {t.checkout.receivedLead}
          <span className="font-bold text-foreground">{orderNo}</span>
          {t.checkout.receivedTrail}
        </p>
        <div className="mt-6 w-full rounded-2xl border border-border bg-card p-4 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.checkout.estDelivery}</span>
            <span className="font-semibold">{t.checkout.aboutMinutes(store?.deliveryTimeMin ?? 35)}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">{t.checkout.paymentMethod}</span>
            <span className="font-semibold">{t.checkout.payAtDoor}</span>
          </div>
        </div>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/">{t.checkout.homeReturn}</Link>
        </Button>
      </div>
    )
  }

  if (items.length === 0 || !store) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <h1 className="text-xl font-bold">{t.checkout.noItemsTitle}</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/">{t.checkout.browse}</Link>
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
          <Link href="/cart" aria-label={t.checkout.toCart}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-xl font-black">{t.checkout.deliveryInfo}</h1>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-2">
          <Label htmlFor="name">{t.checkout.nameLabel}</Label>
          <Input id="name" required placeholder={t.checkout.namePlaceholder} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">{t.checkout.phoneLabel}</Label>
          <Input id="phone" type="tel" required placeholder="+36 30 123 4567" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">{t.checkout.addressLabel}</Label>
          <Input id="address" required placeholder="Andrássy út 12, 1061 Budapest" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="memo">{t.checkout.memoLabel}</Label>
          <Textarea id="memo" placeholder={t.checkout.memoPlaceholder} rows={2} />
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
