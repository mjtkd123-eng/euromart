"use client"

import { useState, useTransition } from "react"
import { Check, AlertCircle } from "lucide-react"
import { updateStoreSettings } from "@/app/actions/vendor"
import type { VendorRegion } from "@/lib/vendor-server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function StoreSettingsForm({ region }: { region: VendorRegion }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateStoreSettings(formData)
      setMessage(
        result.ok
          ? { ok: true, text: "저장되었습니다. 스토어에 즉시 반영됩니다." }
          : { ok: false, text: result.error ?? "저장에 실패했습니다." },
      )
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="regionId" value={region.id} />

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-bold text-foreground">매장 브랜딩</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {region.city}, {region.country} · 통화 {region.currency.code}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="storeKo">매장명 (한국어)</Label>
            <Input id="storeKo" name="storeKo" defaultValue={region.storeKo} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="storeEn">매장명 (영어)</Label>
            <Input id="storeEn" name="storeEn" defaultValue={region.storeEn} required />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="announcementKo">공지 배너 (한국어)</Label>
            <Textarea id="announcementKo" name="announcementKo" rows={2} defaultValue={region.announcementKo} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="announcementEn">공지 배너 (영어)</Label>
            <Textarea id="announcementEn" name="announcementEn" rows={2} defaultValue={region.announcementEn} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-bold text-foreground">히어로 섹션</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="heroTitleKo">제목 (한국어)</Label>
            <Input id="heroTitleKo" name="heroTitleKo" defaultValue={region.heroTitleKo} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="heroTitleEn">제목 (영어)</Label>
            <Input id="heroTitleEn" name="heroTitleEn" defaultValue={region.heroTitleEn} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="heroSubtitleKo">부제 (한국어)</Label>
            <Input id="heroSubtitleKo" name="heroSubtitleKo" defaultValue={region.heroSubtitleKo} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="heroSubtitleEn">부제 (영어)</Label>
            <Input id="heroSubtitleEn" name="heroSubtitleEn" defaultValue={region.heroSubtitleEn} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-bold text-foreground">배송 정책</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          금액은 현지 통화({region.currency.code}) 기준으로 입력하세요.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="deliveryFee">배송비</Label>
            <Input
              id="deliveryFee"
              name="deliveryFee"
              type="number"
              min={0}
              step="0.01"
              defaultValue={region.deliveryFee}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="freeDeliveryOver">무료배송 기준 금액</Label>
            <Input
              id="freeDeliveryOver"
              name="freeDeliveryOver"
              type="number"
              min={0}
              step="0.01"
              defaultValue={region.freeDeliveryOver}
              required
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중..." : "변경사항 저장"}
        </Button>
        {message && (
          <p
            className={`flex items-center gap-1.5 text-xs font-medium ${
              message.ok ? "text-foreground" : "text-destructive"
            }`}
            role="status"
          >
            {message.ok ? (
              <Check className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            )}
            {message.text}
          </p>
        )}
      </div>
    </form>
  )
}
