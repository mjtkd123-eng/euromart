"use client"

import { useState, useTransition } from "react"
import { Check, MapPin, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FormNotice } from "@/components/vendor/form-notice"
import { assignVendor, upsertRegion } from "@/app/actions/admin"
import type { AdminRegion, AdminUser } from "@/lib/admin-server"

const BLANK = {
  id: "",
  city: "",
  country: "",
  countryCode: "",
  storeKo: "",
  currencyCode: "EUR",
  deliveryFee: 0,
  freeDeliveryOver: 0,
  sort: 99,
  active: true,
}

type Draft = typeof BLANK

export function RegionsManager({
  regions,
  users,
}: {
  regions: AdminRegion[]
  users: AdminUser[]
}) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const vendorOptions = users.filter((u) => u.role === "vendor" || u.role === "admin")

  function startNew() {
    setEditingId(null)
    setDraft({ ...BLANK })
    setNotice(null)
  }

  function startEdit(r: AdminRegion) {
    setEditingId(r.id)
    setDraft({
      id: r.id,
      city: r.city,
      country: r.country,
      countryCode: r.countryCode,
      storeKo: r.storeKo,
      currencyCode: r.currencyCode,
      deliveryFee: r.deliveryFee,
      freeDeliveryOver: r.freeDeliveryOver,
      sort: r.sort,
      active: r.active,
    })
    setNotice(null)
  }

  function save() {
    if (!draft) return
    setNotice(null)
    startTransition(async () => {
      const res = await upsertRegion({ ...draft, isNew: editingId === null })
      if (res.ok) {
        setNotice({ tone: "success", text: "저장되었습니다." })
        setDraft(null)
        setEditingId(null)
      } else {
        setNotice({ tone: "error", text: res.error ?? "저장에 실패했습니다." })
      }
    })
  }

  function changeVendor(regionId: string, vendorId: string) {
    setNotice(null)
    startTransition(async () => {
      const res = await assignVendor(regionId, vendorId || null)
      if (!res.ok) setNotice({ tone: "error", text: res.error ?? "배정에 실패했습니다." })
      else setNotice({ tone: "success", text: "담당자가 변경되었습니다." })
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          도시별 매장을 등록하고 담당 판매자를 배정합니다.
        </p>
        <Button size="sm" onClick={startNew} className="shrink-0 rounded-full">
          <Plus className="size-4" aria-hidden="true" />
          지역 추가
        </Button>
      </div>

      {notice && <FormNotice tone={notice.tone}>{notice.text}</FormNotice>}

      {draft && (
        <div className="rounded-xl border border-primary/40 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">
              {editingId ? `${editingId} 수정` : "새 지역 등록"}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">취소</span>
            </Button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="지역 ID">
              <Input
                value={draft.id}
                disabled={editingId !== null}
                placeholder="budapest"
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              />
            </Field>
            <Field label="도시">
              <Input
                value={draft.city}
                placeholder="부다페스트"
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </Field>
            <Field label="국가">
              <Input
                value={draft.country}
                placeholder="헝가리"
                onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              />
            </Field>
            <Field label="국가 코드">
              <Input
                value={draft.countryCode}
                placeholder="HU"
                maxLength={2}
                className="uppercase"
                onChange={(e) => setDraft({ ...draft, countryCode: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="매장명">
              <Input
                value={draft.storeKo}
                placeholder="K-EuroMart 부다페스트"
                onChange={(e) => setDraft({ ...draft, storeKo: e.target.value })}
              />
            </Field>
            <Field label="통화 코드">
              <Input
                value={draft.currencyCode}
                maxLength={3}
                className="uppercase"
                onChange={(e) => setDraft({ ...draft, currencyCode: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="배송비">
              <Input
                type="number"
                min={0}
                step="any"
                value={draft.deliveryFee}
                onChange={(e) => setDraft({ ...draft, deliveryFee: Number(e.target.value) })}
              />
            </Field>
            <Field label="무료배송 기준">
              <Input
                type="number"
                min={0}
                step="any"
                value={draft.freeDeliveryOver}
                onChange={(e) => setDraft({ ...draft, freeDeliveryOver: Number(e.target.value) })}
              />
            </Field>
            <Field label="정렬 순서">
              <Input
                type="number"
                min={0}
                value={draft.sort}
                onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                className="size-4 accent-primary"
              />
              스토어에 공개
            </label>
            <Button size="sm" onClick={save} disabled={pending} className="rounded-full">
              <Check className="size-4" aria-hidden="true" />
              {pending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {regions.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <MapPin className="size-4" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-bold text-foreground">
                    {r.city} · {r.countryCode}
                  </p>
                  <Badge variant={r.active ? "default" : "secondary"} className="text-[10px]">
                    {r.active ? "공개" : "비공개"}
                  </Badge>
                  {!r.vendorId && (
                    <Badge variant="destructive" className="text-[10px]">
                      담당자 없음
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {r.storeKo} · {r.currencyCode} · 상품 {r.listingCount}개 · 주문 {r.orderCount}건
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label={`${r.city} 담당 판매자`}
                  value={r.vendorId ?? ""}
                  disabled={pending}
                  onChange={(e) => changeVendor(r.id, e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground"
                >
                  <option value="">담당자 미지정</option>
                  {vendorOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.email}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={() => startEdit(r)} className="text-xs">
                  수정
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}
