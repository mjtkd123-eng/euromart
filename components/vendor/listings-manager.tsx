"use client"

import { useState } from "react"
import Image from "next/image"
import { Loader2, Plus, Save, Star, Trash2, X } from "lucide-react"
import { deleteListing, upsertListing } from "@/app/actions/vendor"
import type { CatalogOption, VendorListing, VendorStore } from "@/lib/vendor-server"
import { formatPrice } from "@/lib/storesData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { FormNotice } from "./form-notice"

interface Props {
  store: VendorStore
  listings: VendorListing[]
  catalog: CatalogOption[]
}

export function ListingsManager({ store, listings, catalog }: Props) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-foreground">판매 상품 {listings.length}개</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            가격·재고를 수정하면 스토어에 즉시 반영됩니다. 재고 10개 이하는 강조 표시됩니다.
          </p>
        </div>
        {catalog.length > 0 && (
          <Button size="sm" className="rounded-full" onClick={() => setAdding((v) => !v)}>
            {adding ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {adding ? "닫기" : "상품 추가"}
          </Button>
        )}
      </div>

      {error && <FormNotice>{error}</FormNotice>}

      {adding && (
        <AddListingRow
          store={store}
          catalog={catalog}
          onDone={() => setAdding(false)}
          onError={setError}
        />
      )}

      {listings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          아직 등록된 판매 상품이 없습니다. 카탈로그에서 상품을 추가해보세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {listings.map((listing) => (
            <ListingRow key={listing.id} store={store} listing={listing} onError={setError} />
          ))}
        </ul>
      )}
    </div>
  )
}

/* --------------------------- 기존 상품 행 --------------------------- */

function ListingRow({
  store,
  listing,
  onError,
}: {
  store: VendorStore
  listing: VendorListing
  onError: (m: string | null) => void
}) {
  const [price, setPrice] = useState(String(listing.price))
  const [stock, setStock] = useState(String(listing.stock))
  const [featured, setFeatured] = useState(listing.featured)
  const [active, setActive] = useState(listing.active)
  const [busy, setBusy] = useState<"save" | "delete" | null>(null)

  const dirty =
    Number(price) !== listing.price ||
    Number(stock) !== listing.stock ||
    featured !== listing.featured ||
    active !== listing.active

  async function save() {
    setBusy("save")
    onError(null)
    const result = await upsertListing({
      regionId: store.id,
      productId: listing.productId,
      price: Number(price),
      stock: Number(stock),
      featured,
      active,
    })
    setBusy(null)
    if (!result.ok) onError(result.error ?? "저장에 실패했습니다.")
  }

  async function remove() {
    setBusy("delete")
    onError(null)
    const result = await deleteListing(store.id, listing.id)
    setBusy(null)
    if (!result.ok) onError(result.error ?? "삭제에 실패했습니다.")
  }

  const lowStock = Number(stock) <= 10

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
          {listing.image && (
            <Image src={listing.image || "/placeholder.svg"} alt="" fill sizes="44px" className="object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-foreground">{listing.nameKo}</p>
            {featured && <Star className="size-3.5 shrink-0 fill-primary text-primary" aria-label="추천 상품" />}
            {!active && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                숨김
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {listing.brand} · {listing.unit} · 현재 {formatPrice(listing.price, store.currency)}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <div className="grid gap-1">
            <Label htmlFor={`price-${listing.id}`} className="text-[10px] uppercase text-muted-foreground">
              가격
            </Label>
            <Input
              id={`price-${listing.id}`}
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-9 w-24 font-mono tabular-nums"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor={`stock-${listing.id}`} className="text-[10px] uppercase text-muted-foreground">
              재고
            </Label>
            <Input
              id={`stock-${listing.id}`}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={`h-9 w-20 font-mono tabular-nums ${lowStock ? "text-destructive" : ""}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Switch checked={featured} onCheckedChange={setFeatured} aria-label="추천 상품" />
            추천
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Switch checked={active} onCheckedChange={setActive} aria-label="판매중" />
            판매중
          </label>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" onClick={save} disabled={!dirty || busy !== null} className="rounded-full">
            {busy === "save" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            저장
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={remove}
            disabled={busy !== null}
            aria-label={`${listing.nameKo} 판매 중단`}
            className="text-muted-foreground hover:text-destructive"
          >
            {busy === "delete" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </li>
  )
}

/* --------------------------- 상품 추가 행 --------------------------- */

function AddListingRow({
  store,
  catalog,
  onDone,
  onError,
}: {
  store: VendorStore
  catalog: CatalogOption[]
  onDone: () => void
  onError: (m: string | null) => void
}) {
  const [productId, setProductId] = useState(catalog[0]?.id ?? "")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("0")
  const [busy, setBusy] = useState(false)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    onError(null)
    const result = await upsertListing({
      regionId: store.id,
      productId,
      price: Number(price),
      stock: Number(stock),
      featured: false,
      active: true,
    })
    setBusy(false)
    if (!result.ok) {
      onError(result.error ?? "추가에 실패했습니다.")
      return
    }
    onDone()
  }

  return (
    <form onSubmit={add} className="flex flex-wrap items-end gap-3 rounded-xl border border-primary/30 bg-accent/40 p-3">
      <div className="grid min-w-[180px] flex-1 gap-1">
        <Label htmlFor="new-product" className="text-[10px] uppercase text-muted-foreground">
          카탈로그 상품
        </Label>
        <select
          id="new-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          {catalog.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameKo}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="new-price" className="text-[10px] uppercase text-muted-foreground">
          가격 ({store.currency.code})
        </Label>
        <Input
          id="new-price"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-9 w-28 font-mono tabular-nums"
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="new-stock" className="text-[10px] uppercase text-muted-foreground">
          재고
        </Label>
        <Input
          id="new-stock"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          required
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="h-9 w-20 font-mono tabular-nums"
        />
      </div>
      <Button type="submit" size="sm" disabled={busy} className="rounded-full">
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        추가
      </Button>
    </form>
  )
}
