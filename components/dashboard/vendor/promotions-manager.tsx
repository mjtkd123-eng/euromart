"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2, AlertCircle, Tag } from "lucide-react"
import { upsertPromotion, deletePromotion } from "@/app/actions/vendor"
import type { VendorPromotion } from "@/lib/vendor-server"
import { formatPrice, type Currency } from "@/lib/storesData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Props {
  regionId: string
  currency: Currency
  promotions: VendorPromotion[]
}

export function PromotionsManager({ regionId, currency, promotions }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <NewPromotionForm regionId={regionId} currency={currency} />

      <div className="flex flex-col gap-3">
        {promotions.map((p) => (
          <PromotionRow key={p.id} promotion={p} regionId={regionId} currency={currency} />
        ))}
        {promotions.length === 0 && (
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
            등록된 프로모션이 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}

function PromotionRow({
  promotion,
  regionId,
  currency,
}: {
  promotion: VendorPromotion
  regionId: string
  currency: Currency
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(active: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await upsertPromotion({
        id: promotion.id,
        regionId,
        code: promotion.code,
        descriptionKo: promotion.descriptionKo,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        minOrder: promotion.minOrder,
        active,
      })
      if (!result.ok) setError(result.error ?? "변경 실패")
    })
  }

  function remove() {
    setError(null)
    startTransition(async () => {
      const result = await deletePromotion(promotion.id)
      if (!result.ok) setError(result.error ?? "삭제 실패")
    })
  }

  const discountLabel =
    promotion.discountType === "percent"
      ? `${promotion.discountValue}% 할인`
      : `${formatPrice(promotion.discountValue, currency)} 할인`

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <Tag className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-foreground">{promotion.code}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {discountLabel}
          </span>
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {promotion.descriptionKo || "설명 없음"} · 최소 주문 {formatPrice(promotion.minOrder, currency)}
        </p>
        {error && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive" role="alert">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={promotion.active}
            onCheckedChange={toggle}
            disabled={pending}
            aria-label={`${promotion.code} 활성화`}
          />
          <span className="text-xs text-muted-foreground">{promotion.active ? "활성" : "비활성"}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={remove}
          disabled={pending}
          aria-label={`${promotion.code} 삭제`}
        >
          <Trash2 className="size-4 text-destructive" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

function NewPromotionForm({ regionId, currency }: { regionId: string; currency: Currency }) {
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent")
  const [discountValue, setDiscountValue] = useState("")
  const [minOrder, setMinOrder] = useState("0")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await upsertPromotion({
        regionId,
        code,
        descriptionKo: description,
        discountType,
        discountValue: Number(discountValue),
        minOrder: Number(minOrder),
        active: true,
      })
      if (result.ok) {
        setCode("")
        setDescription("")
        setDiscountValue("")
        setMinOrder("0")
      } else {
        setError(result.error ?? "생성 실패")
      }
    })
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-background p-4">
      <h2 className="text-sm font-bold text-foreground">새 프로모션</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="grid w-36 gap-1.5">
          <Label htmlFor="promo-code">코드</Label>
          <Input
            id="promo-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME10"
            className="font-mono uppercase"
            required
          />
        </div>
        <div className="grid min-w-44 flex-1 gap-1.5">
          <Label htmlFor="promo-desc">설명</Label>
          <Input
            id="promo-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="신규 고객 10% 할인"
          />
        </div>
        <div className="grid w-32 gap-1.5">
          <Label htmlFor="promo-type">유형</Label>
          <select
            id="promo-type"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="percent">퍼센트 (%)</option>
            <option value="fixed">정액 ({currency.code})</option>
          </select>
        </div>
        <div className="grid w-24 gap-1.5">
          <Label htmlFor="promo-value">할인값</Label>
          <Input
            id="promo-value"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            required
          />
        </div>
        <div className="grid w-32 gap-1.5">
          <Label htmlFor="promo-min">최소 주문</Label>
          <Input
            id="promo-min"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" aria-hidden="true" />
          {pending ? "생성 중..." : "생성"}
        </Button>
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </form>
  )
}
