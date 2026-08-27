"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Check, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FormNotice } from "@/components/vendor/form-notice"
import { deleteProduct, upsertProduct } from "@/app/actions/admin"
import type { AdminCategory, AdminProduct } from "@/lib/admin-server"

const BLANK = {
  id: "",
  nameKo: "",
  nameEn: "",
  categoryId: "",
  unit: "",
  brand: "",
  image: "",
}

type Draft = typeof BLANK

export function ProductsManager({
  products,
  categories,
}: {
  products: AdminProduct[]
  categories: AdminCategory[]
}) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.nameKo ?? id

  function startNew() {
    setEditingId(null)
    setDraft({ ...BLANK, categoryId: categories[0]?.id ?? "" })
    setNotice(null)
  }

  function startEdit(p: AdminProduct) {
    setEditingId(p.id)
    setDraft({
      id: p.id,
      nameKo: p.nameKo,
      nameEn: p.nameEn,
      categoryId: p.categoryId,
      unit: p.unit,
      brand: p.brand,
      image: p.image,
    })
    setNotice(null)
  }

  function save() {
    if (!draft) return
    setNotice(null)
    startTransition(async () => {
      const res = await upsertProduct({ ...draft, isNew: editingId === null })
      if (res.ok) {
        setNotice({ tone: "success", text: "저장되었습니다." })
        setDraft(null)
        setEditingId(null)
      } else {
        setNotice({ tone: "error", text: res.error ?? "저장에 실패했습니다." })
      }
    })
  }

  function remove(id: string) {
    setNotice(null)
    startTransition(async () => {
      const res = await deleteProduct(id)
      if (res.ok) setNotice({ tone: "success", text: "삭제되었습니다." })
      else setNotice({ tone: "error", text: res.error ?? "삭제에 실패했습니다." })
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          전 매장이 공유하는 마스터 상품 목록입니다. 가격과 재고는 각 매장에서 설정합니다.
        </p>
        <Button size="sm" onClick={startNew} className="shrink-0 rounded-full">
          <Plus className="size-4" aria-hidden="true" />
          상품 추가
        </Button>
      </div>

      {notice && <FormNotice tone={notice.tone}>{notice.text}</FormNotice>}

      {draft && (
        <div className="rounded-xl border border-primary/40 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">
              {editingId ? `${editingId} 수정` : "새 상품 등록"}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">취소</span>
            </Button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">상품 ID</Label>
              <Input
                value={draft.id}
                disabled={editingId !== null}
                placeholder="gochujang"
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">상품명 (한글)</Label>
              <Input
                value={draft.nameKo}
                placeholder="고추장"
                onChange={(e) => setDraft({ ...draft, nameKo: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">상품명 (영문)</Label>
              <Input
                value={draft.nameEn}
                placeholder="Gochujang"
                onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">카테고리</Label>
              <select
                value={draft.categoryId}
                onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameKo}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">단위</Label>
              <Input
                value={draft.unit}
                placeholder="500g"
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">브랜드</Label>
              <Input
                value={draft.brand}
                placeholder="해찬들"
                onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
              <Label className="text-xs">이미지 경로</Label>
              <Input
                value={draft.image}
                placeholder="/products/gochujang.jpg"
                onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={save} disabled={pending} className="rounded-full">
              <Check className="size-4" aria-hidden="true" />
              {pending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
              {p.image && (
                <Image src={p.image || "/placeholder.svg"} alt="" fill sizes="44px" className="object-cover" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{p.nameKo}</p>
              <p className="truncate text-xs text-muted-foreground">
                {categoryName(p.categoryId)}
                {p.unit && ` · ${p.unit}`}
              </p>
            </div>

            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {p.regionCount}개 매장
            </Badge>

            <div className="flex shrink-0 gap-1">
              <Button variant="outline" size="sm" onClick={() => startEdit(p)} className="text-xs">
                수정
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending || p.regionCount > 0}
                onClick={() => remove(p.id)}
                className="text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                <span className="sr-only">{p.nameKo} 삭제</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
