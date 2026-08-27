"use client"

import { useState } from "react"
import { ShoppingBag, Plus, Minus, Trash2, Truck, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { formatPrice } from "@/lib/storesData"
import { placeOrder } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"

type Step = "cart" | "checkout" | "done"

export function CartDrawer() {
  const {
    region,
    regionId,
    user,
    cart,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryProgress,
    setQuantity,
    removeItem,
    clearCart,
    cartOpen,
    setCartOpen,
    t,
    productName,
    storeName,
  } = useEuromart()
  const [step, setStep] = useState<Step>("cart")
  const [form, setForm] = useState({ name: "", address: "", phone: "", promo: "" })
  const [submitting, setSubmitting] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  const currency = region.currency
  const remainingForFree = Math.max(0, region.freeDeliveryOver - subtotal)

  function goToCheckout() {
    setForm((f) => ({ ...f, name: f.name || user?.fullName || "" }))
    setStep("checkout")
  }

  function handleClose(open: boolean) {
    setCartOpen(open)
    if (!open)
      setTimeout(() => {
        setStep("cart")
        setOrderError(null)
      }, 200)
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setOrderError(null)

    const result = await placeOrder({
      regionId,
      customerName: form.name,
      address: form.address,
      phone: form.phone,
      promoCode: form.promo,
      items: cart.map((l) => ({ productId: l.id, quantity: l.quantity })),
    })

    setSubmitting(false)
    if (!result.ok) {
      setOrderError(result.error ?? t("orderFailed"))
      return
    }
    setOrderId(result.orderId ?? null)
    setStep("done")
    clearCart()
  }

  return (
    <Sheet open={cartOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-lg font-black">
            {step === "checkout" && (
              <button onClick={() => setStep("cart")} aria-label={t("backToCart")}>
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
            )}
            <ShoppingBag className="size-5 text-primary" aria-hidden="true" />
            {step === "cart" && t("cartWithCount", { count: itemCount })}
            {step === "checkout" && t("checkout")}
            {step === "done" && t("orderComplete")}
          </SheetTitle>
          <SheetDescription>
            {storeName(region)} · {region.city} · {currency.code}
          </SheetDescription>
        </SheetHeader>

        {/* 완료 화면 */}
        {step === "done" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <CheckCircle2 className="size-16 text-primary" aria-hidden="true" />
            <div>
              <p className="text-lg font-black text-foreground">주문이 접수되었습니다!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {region.store.ko}에서 곧 배송을 준비합니다.
              </p>
              {orderId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  주문번호 · <span className="font-mono font-semibold">{orderId.slice(0, 8).toUpperCase()}</span>
                </p>
              )}
            </div>
            <Button className="mt-2 rounded-full" onClick={() => handleClose(false)}>
              쇼핑 계속하기
            </Button>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="size-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">장바구니가 비어 있습니다</p>
            <Button variant="secondary" className="rounded-full" onClick={() => handleClose(false)}>
              상품 보러가기
            </Button>
          </div>
        ) : (
          <>
            {/* 무료배송 진행 바 */}
            <div className="border-b border-border bg-muted/50 px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Truck className="size-4 text-primary" aria-hidden="true" />
                {remainingForFree > 0 ? (
                  <span>
                    {formatPrice(remainingForFree, currency)} 더 담으면 <b>무료배송!</b>
                  </span>
                ) : (
                  <span className="font-bold text-primary">무료배송 혜택이 적용되었습니다</span>
                )}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${freeDeliveryProgress * 100}%` }}
                />
              </div>
            </div>

            {/* 상품 리스트 */}
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="flex flex-col gap-3">
                {cart.map((line) => (
                  <li key={line.id} className="flex gap-3 rounded-xl border border-border bg-card p-2.5">
                    <img
                      src={line.image || "/placeholder.svg"}
                      alt={line.nameEn}
                      className="size-16 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-bold text-foreground">{line.nameKo}</p>
                      <p className="truncate text-xs text-muted-foreground">{line.unit}</p>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 rounded-full"
                            onClick={() => setQuantity(line.id, line.quantity - 1)}
                            aria-label="수량 줄이기"
                          >
                            <Minus className="size-3" aria-hidden="true" />
                          </Button>
                          <span className="min-w-5 text-center text-xs font-bold tabular-nums">{line.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 rounded-full"
                            onClick={() => setQuantity(line.id, line.quantity + 1)}
                            aria-label="수량 늘리기"
                          >
                            <Plus className="size-3" aria-hidden="true" />
                          </Button>
                        </div>
                        <span className="text-sm font-black text-foreground">
                          {formatPrice(line.lineTotal, currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(line.id)}
                      className="self-start text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`${line.nameKo} 삭제`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>

              {/* 결제 폼 */}
              {step === "checkout" && (
                <form id="checkout-form" onSubmit={handlePlaceOrder} className="mt-5 flex flex-col gap-3">
                  <p className="text-sm font-bold text-foreground">배송 정보</p>
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">받는 분 · Name</Label>
                    <Input
                      id="name"
                      required
                      placeholder="홍길동"
                      className="h-11"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="address">주소 · Address ({region.city})</Label>
                    <Input
                      id="address"
                      required
                      placeholder={`${region.city}, ${region.country}`}
                      className="h-11"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="phone">연락처 · Phone</Label>
                    <Input
                      id="phone"
                      required
                      type="tel"
                      placeholder="+00 000 000 000"
                      className="h-11"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="promo">프로모션 코드 · Promo (선택)</Label>
                    <Input
                      id="promo"
                      placeholder="WELCOME10"
                      className="h-11 uppercase"
                      value={form.promo}
                      onChange={(e) => setForm((f) => ({ ...f, promo: e.target.value }))}
                    />
                  </div>
                  {orderError && (
                    <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                      {orderError}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* 요약 + 액션 */}
            <div className="border-t border-border p-4">
              <dl className="mb-3 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">상품 금액</dt>
                  <dd className="font-semibold text-foreground">{formatPrice(subtotal, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">배송비</dt>
                  <dd className="font-semibold text-foreground">
                    {deliveryFee === 0 ? "무료" : formatPrice(deliveryFee, currency)}
                  </dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-border pt-2 text-base">
                  <dt className="font-black text-foreground">합계</dt>
                  <dd className="font-black text-primary">{formatPrice(total, currency)}</dd>
                </div>
              </dl>

              {step === "cart" ? (
                <Button className="h-12 w-full rounded-full text-base" onClick={goToCheckout}>
                  결제하기 · Checkout
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="h-12 w-full rounded-full text-base"
                >
                  {submitting ? "주문 처리 중..." : `${formatPrice(total, currency)} 주문하기`}
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
