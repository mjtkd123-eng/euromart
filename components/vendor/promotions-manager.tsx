"use client"

import { useState } from "react"
import { Loader2, Plus, Trash2, X } from "lucide-react"
import { deletePromotion, upsertPromotion } from "@/app/actions/vendor"
import type { VendorPromotion, VendorStore } from "@/lib/vendor-server"
import { formatPrice } from "@/lib/storesData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { FormNotice } from "./form-notice"

interface Props {
  store: VendorStore
  promotions: VendorPromotion[]
}

export function PromotionsManager({ store, promotions }: Props) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-foreground">프로모션 코드 {promotions.length}개</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            결제 시 고객이 입력하는 코드입니다. 할인은 서버에서 다시 계산되어 적용됩니다.
          </p>
        </div>
        <Button size="sm" className="rounded-full" onClick={() => setCreating((v) => !v)}>
          {creating ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          {creating ? "닫기" : "코드 만들기"}
        </Button>
      </div>

      {error && <FormNotice>{error}</FormNotice>}

      {creating && <PromotionForm store={store} onDone={() => setCreating(false)} onError={setError} />}

      {promotions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          등록된 프로모션이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {promotions.map((promo) => (
            <PromotionRow key={promo.id} store={store} promo={promo} onError={setError} />
          ))}
        </ul>
      )}
    </div>
  )
}

function PromotionRow({
  store,
  promo,
  onError,
}: {
  store: VendorStore
  promo: VendorPromotion
  onError: (m: string | null) => void
}) {
  const [active, setActive] = useState(promo.active)
  const [busy, setBusy] = useState<"toggle" | "delete" | null>(null)

  async function toggle(next: boolean) {
    setActive(next)
    setBusy("toggle")
    onError(null)
    const result = await upsertPromotion({
      regionId: store.id,
      id: promo.id,
      code: promo.code,
      descriptionKo: promo.descriptionKo,
      descriptionEn: promo.descriptionEn,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrder: promo.minOrder,
      active: next,
    })
    setBusy(null)
    if (!result.ok) {
      setActive(!next)
      onError(result.error ?? "변경에 실패했습니다.")
    }
  }

  async function remove() {
    setBusy("delete")
    onError(null)
    const result = await deletePromotion(store.id, promo.id)
    setBusy(null)
    if (!result.ok) onError(result.error ?? "삭제에 실패했습니다.")
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
      <code className="rounded-md bg-foreground px-2 py-1 font-mono text-xs font-bold tracking-wider text-background">
        {promo.code}
      </code>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{promo.descriptionKo || "설명 없음"}</p>
        <p className="text-xs text-muted-foreground">
          {promo.discountType === "percent"
            ? `${promo.discountValue}% 할인`
            : `${formatPrice(promo.discountValue, store.currency)} 할인`}
          {promo.minOrder > 0 && ` · 최소 ${formatPrice(promo.minOrder, store.currency)}`}
        </p>
      </div>
      <Badge variant={active ? "default" : "secondary"} className="text-[10px]">
        {active ? "활성" : "비활성"}
      </Badge>
      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Switch checked={active} onCheckedChange={toggle} disabled={busy !== null} aria-label={`${promo.code} 활성화`} />
        사용
      </label>
      <Button
        size="icon"
        variant="ghost"
        onClick={remove}
        disabled={busy !== null}
        aria-label={`${promo.code} 삭제`}
        className="text-muted-foreground hover:text-destructive"
      >
        {busy === "delete" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="size-4" aria-hidden="true" />
        )}
      </Button>
    </li>
  )
}

function PromotionForm({
  store,
  onDone,
  onError,
}: {
  store: VendorStore
  onDone: () => void
  onError: (m: string | null) => void
}) {
  const [form, setForm] = useState({
    code: "",
    descriptionKo: "",
    descriptionEn: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    minOrder: "0",
  })
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    onError(null)
    const result = await upsertPromotion({
      regionId: store.id,
      code: form.code,
      descriptionKo: form.descriptionKo,
      descriptionEn: form.descriptionEn,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrder: Number(form.minOrder),
      active: true,
    })
    setBusy(false)
    if (!result.ok) {
      onError(result.error ?? "생성에 실패했습니다.")
      return
    }
    onDone()
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-primary/30 bg-accent/40 p-4 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="promo-code" className="text-xs">
          코드
        </Label>
        <Input
          id="promo-code"
          required
          placeholder="WELCOME10"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
          className="font-mono uppercase"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="promo-type" className="text-xs">
          할인 방식
        </Label>
        <select
          id="promo-type"
          value={form.discountType}
          onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "percent" | "fixed" }))}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          <option value="percent">퍼센트 (%)</option>
          <option value="fixed">정액 ({store.currency.code})</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="promo-value" className="text-xs">
          할인값
        </Label>
        <Input
          id="promo-value"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          required
          value={form.discountValue}
          onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
          className="font-mono tabular-nums"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="promo-min" className="text-xs">
          최소 주문금액
        </Label>
        <Input
          id="promo-min"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          required
          value={form.minOrder}
          onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
          className="font-mono tabular-nums"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="promo-desc-ko" className="text-xs">
          설명 (한글)
        </Label>
        <Input
          id="promo-desc-ko"
          value={form.descriptionKo}
          onChange={(e) => setForm((f) => ({ ...f, descriptionKo: e.target.value }))}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="promo-desc-en" className="text-xs">
          설명 (영문)
        </Label>
        <Input
          id="promo-desc-en"
          value={form.descriptionEn}
          onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={busy} className="rounded-full">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          프로모션 만들기
        </Button>
      </div>
    </form>
  )
}
