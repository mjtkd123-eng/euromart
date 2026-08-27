"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { updateStore } from "@/app/actions/vendor"
import type { VendorStore } from "@/lib/vendor-server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormNotice } from "./form-notice"

export function StoreSettingsForm({ store }: { store: VendorStore }) {
  const [form, setForm] = useState({
    storeKo: store.storeKo,
    storeEn: store.storeEn,
    announcementKo: store.announcementKo,
    announcementEn: store.announcementEn,
    heroTitleKo: store.heroTitleKo,
    heroTitleEn: store.heroTitleEn,
    heroSubtitleKo: store.heroSubtitleKo,
    heroSubtitleEn: store.heroSubtitleEn,
    deliveryFee: String(store.deliveryFee),
    freeDeliveryOver: String(store.freeDeliveryOver),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const result = await updateStore({
      regionId: store.id,
      storeKo: form.storeKo,
      storeEn: form.storeEn,
      announcementKo: form.announcementKo,
      announcementEn: form.announcementEn,
      heroTitleKo: form.heroTitleKo,
      heroTitleEn: form.heroTitleEn,
      heroSubtitleKo: form.heroSubtitleKo,
      heroSubtitleEn: form.heroSubtitleEn,
      deliveryFee: Number(form.deliveryFee),
      freeDeliveryOver: Number(form.freeDeliveryOver),
    })

    setSaving(false)
    if (!result.ok) {
      setError(result.error ?? "저장에 실패했습니다.")
      return
    }
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-black text-foreground">매장 정보</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {store.city}, {store.country} · 통화 {store.currency.code}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="매장명 (한글)" htmlFor="storeKo">
            <Input id="storeKo" value={form.storeKo} onChange={(e) => set("storeKo", e.target.value)} required />
          </Field>
          <Field label="매장명 (영문)" htmlFor="storeEn">
            <Input id="storeEn" value={form.storeEn} onChange={(e) => set("storeEn", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-black text-foreground">스토어 표시 문구</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">고객 스토어의 공지 배너와 히어로 영역에 표시됩니다.</p>
        <div className="mt-4 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="공지 (한글)" htmlFor="announcementKo">
              <Textarea
                id="announcementKo"
                rows={2}
                value={form.announcementKo}
                onChange={(e) => set("announcementKo", e.target.value)}
              />
            </Field>
            <Field label="공지 (영문)" htmlFor="announcementEn">
              <Textarea
                id="announcementEn"
                rows={2}
                value={form.announcementEn}
                onChange={(e) => set("announcementEn", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="히어로 제목 (한글)" htmlFor="heroTitleKo">
              <Input id="heroTitleKo" value={form.heroTitleKo} onChange={(e) => set("heroTitleKo", e.target.value)} />
            </Field>
            <Field label="히어로 제목 (영문)" htmlFor="heroTitleEn">
              <Input id="heroTitleEn" value={form.heroTitleEn} onChange={(e) => set("heroTitleEn", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="히어로 부제 (한글)" htmlFor="heroSubtitleKo">
              <Input
                id="heroSubtitleKo"
                value={form.heroSubtitleKo}
                onChange={(e) => set("heroSubtitleKo", e.target.value)}
              />
            </Field>
            <Field label="히어로 부제 (영문)" htmlFor="heroSubtitleEn">
              <Input
                id="heroSubtitleEn"
                value={form.heroSubtitleEn}
                onChange={(e) => set("heroSubtitleEn", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-black text-foreground">배송 정책</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          금액은 현지 통화({store.currency.code}) 기준으로 입력하세요.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="배송비" htmlFor="deliveryFee">
            <Input
              id="deliveryFee"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              className="font-mono tabular-nums"
              value={form.deliveryFee}
              onChange={(e) => set("deliveryFee", e.target.value)}
              required
            />
          </Field>
          <Field label="무료배송 기준 금액" htmlFor="freeDeliveryOver">
            <Input
              id="freeDeliveryOver"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              className="font-mono tabular-nums"
              value={form.freeDeliveryOver}
              onChange={(e) => set("freeDeliveryOver", e.target.value)}
              required
            />
          </Field>
        </div>
      </section>

      {error && <FormNotice tone="error">{error}</FormNotice>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving} className="rounded-full">
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {saving ? "저장 중..." : "변경사항 저장"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
            <Check className="size-4" aria-hidden="true" />
            저장되었습니다
          </span>
        )}
      </div>
    </form>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  )
}
