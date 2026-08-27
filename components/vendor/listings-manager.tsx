"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  AlertTriangle,
  Boxes,
  CircleSlash,
  Loader2,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { deleteListing, upsertListing } from "@/app/actions/vendor"
import type { CatalogOption, VendorListing, VendorStore } from "@/lib/vendor-server"
import { categories, formatPrice } from "@/lib/storesData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormNotice } from "./form-notice"

/** 재고 10개 이하를 "품절 임박"으로 간주합니다. (상위 대시보드 기준과 통일) */
const LOW_STOCK_THRESHOLD = 10

const CATEGORY_LABEL = new Map(categories.map((c) => [c.id, c.nameKo]))

interface Props {
  store: VendorStore
  listings: VendorListing[]
  catalog: CatalogOption[]
}

type StockLevel = "out" | "low" | "ok"

function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return "out"
  if (stock <= LOW_STOCK_THRESHOLD) return "low"
  return "ok"
}

export function ListingsManager({ store, listings, catalog }: Props) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const summary = useMemo(() => {
    const total = listings.length
    const active = listings.filter((l) => l.active).length
    const low = listings.filter((l) => l.active && l.stock <= LOW_STOCK_THRESHOLD).length
    return { total, active, low }
  }, [listings])

  return (
    <div className="flex flex-col gap-5">
      {/* --- 재고 현황 요약 카드 --- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<Package className="size-5" aria-hidden="true" />}
          label="총 등록 상품"
          value={summary.total}
          unit="개"
        />
        <SummaryCard
          icon={<ShoppingBag className="size-5" aria-hidden="true" />}
          label="판매 중"
          value={summary.active}
          unit="개"
          tone="active"
        />
        <SummaryCard
          icon={<AlertTriangle className="size-5" aria-hidden="true" />}
          label={`품절 임박 (재고 ${LOW_STOCK_THRESHOLD}개 이하)`}
          value={summary.low}
          unit="개"
          tone={summary.low > 0 ? "alert" : "muted"}
        />
      </div>

      {/* --- 툴바 --- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-black text-foreground">
            <Boxes className="size-4 text-primary" aria-hidden="true" />
            상품 · 재고 관리
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            가격·재고를 수정하면 스토어에 즉시 반영됩니다. 재고 {LOW_STOCK_THRESHOLD}개 이하는 강조 표시됩니다.
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
        <AddListingRow store={store} catalog={catalog} onDone={() => setAdding(false)} onError={setError} />
      )}

      {listings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          아직 등록된 판매 상품이 없습니다. 카탈로그에서 상품을 추가해보세요.
        </p>
      ) : (
        <>
          {/* --- 데스크톱: 테이블 --- */}
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th scope="col" className="px-4 py-2.5 font-bold text-muted-foreground">
                    상품
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold text-muted-foreground">
                    카테고리
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-bold text-muted-foreground">
                    판매가
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-bold text-muted-foreground">
                    재고
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center font-bold text-muted-foreground">
                    판매 상태
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold text-muted-foreground">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <ProductTableRow key={listing.id} store={store} listing={listing} onError={setError} />
                ))}
              </tbody>
            </table>
          </div>

          {/* --- 모바일: 카드 리스트 --- */}
          <ul className="flex flex-col gap-2.5 md:hidden">
            {listings.map((listing) => (
              <ProductMobileCard key={listing.id} store={store} listing={listing} onError={setError} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/* --------------------------- 요약 카드 --------------------------- */

function SummaryCard({
  icon,
  label,
  value,
  unit,
  tone = "default",
}: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  tone?: "default" | "active" | "alert" | "muted"
}) {
  const toneStyles: Record<string, string> = {
    default: "border-border bg-card text-foreground [&_.icon]:bg-muted [&_.icon]:text-foreground",
    active: "border-primary/25 bg-primary/5 text-foreground [&_.icon]:bg-primary/10 [&_.icon]:text-primary",
    alert: "border-destructive/30 bg-destructive/5 text-foreground [&_.icon]:bg-destructive/10 [&_.icon]:text-destructive",
    muted: "border-border bg-card text-muted-foreground [&_.icon]:bg-muted [&_.icon]:text-muted-foreground",
  }
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${toneStyles[tone]}`}>
      <span className="icon flex size-10 shrink-0 items-center justify-center rounded-lg">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-black tabular-nums">
          {value}
          <span className="ml-0.5 text-sm font-bold text-muted-foreground">{unit}</span>
        </p>
      </div>
    </div>
  )
}

/* --------------------------- 재고 상태 뱃지 --------------------------- */

function StockBadge({ stock }: { stock: number }) {
  const level = stockLevel(stock)
  if (level === "out") {
    return (
      <Badge className="gap-1 border-transparent bg-destructive/12 text-destructive hover:bg-destructive/12">
        <CircleSlash className="size-3" aria-hidden="true" />
        품절
      </Badge>
    )
  }
  if (level === "low") {
    return (
      <Badge className="gap-1 border-transparent bg-chart-2/15 text-chart-2 hover:bg-chart-2/15">
        <AlertTriangle className="size-3" aria-hidden="true" />
        임박
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      정상
    </Badge>
  )
}

/* --------------------------- 공용 행 로직 --------------------------- */

function useListingRow(
  store: VendorStore,
  listing: VendorListing,
  onError: (m: string | null) => void,
) {
  const [active, setActive] = useState(listing.active)
  const [statusBusy, setStatusBusy] = useState(false)

  // 판매 상태 토글: 낙관적 업데이트 후 실패 시 되돌립니다.
  async function toggleActive(next: boolean) {
    setActive(next)
    setStatusBusy(true)
    onError(null)
    const result = await upsertListing({
      regionId: store.id,
      productId: listing.productId,
      price: listing.price,
      stock: listing.stock,
      featured: listing.featured,
      active: next,
    })
    setStatusBusy(false)
    if (!result.ok) {
      setActive(!next)
      onError(result.error ?? "판매 상태 변경에 실패했습니다.")
    }
  }

  return { active, statusBusy, toggleActive }
}

/* --------------------------- 테이블 행 (데스크톱) --------------------------- */

function ProductTableRow({
  store,
  listing,
  onError,
}: {
  store: VendorStore
  listing: VendorListing
  onError: (m: string | null) => void
}) {
  const { active, statusBusy, toggleActive } = useListingRow(store, listing, onError)
  const [editing, setEditing] = useState(false)
  const level = stockLevel(listing.stock)

  const rowTint =
    level === "out" ? "bg-destructive/[0.04]" : level === "low" ? "bg-chart-2/[0.06]" : ""

  return (
    <tr className={`border-b border-border last:border-0 transition-colors hover:bg-muted/40 ${rowTint}`}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
            {listing.image && (
              <Image src={listing.image || "/placeholder.svg"} alt="" fill sizes="40px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="truncate font-bold text-foreground">{listing.nameKo}</span>
              {listing.featured && (
                <Star className="size-3 shrink-0 fill-primary text-primary" aria-label="추천 상품" />
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {listing.brand} · {listing.unit}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span className="text-xs text-muted-foreground">
          {CATEGORY_LABEL.get(listing.category) ?? listing.category}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
        {formatPrice(listing.price, store.currency)}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-2">
          <span
            className={`font-mono text-sm font-bold tabular-nums ${
              level === "out" ? "text-destructive" : level === "low" ? "text-chart-2" : "text-foreground"
            }`}
          >
            {listing.stock}
          </span>
          <StockBadge stock={listing.stock} />
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-center gap-2">
          {statusBusy ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <Switch
              checked={active}
              onCheckedChange={toggleActive}
              aria-label={`${listing.nameKo} 판매 상태`}
            />
          )}
          <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
            {active ? "판매 중" : "숨김"}
          </span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-right">
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" aria-hidden="true" />
          재고 수정
        </Button>
      </td>

      {editing && (
        <EditStockDialog
          store={store}
          listing={listing}
          open={editing}
          onOpenChange={setEditing}
          onError={onError}
        />
      )}
    </tr>
  )
}

/* --------------------------- 카드 (모바일) --------------------------- */

function ProductMobileCard({
  store,
  listing,
  onError,
}: {
  store: VendorStore
  listing: VendorListing
  onError: (m: string | null) => void
}) {
  const { active, statusBusy, toggleActive } = useListingRow(store, listing, onError)
  const [editing, setEditing] = useState(false)
  const level = stockLevel(listing.stock)

  const cardTint =
    level === "out"
      ? "border-destructive/30 bg-destructive/[0.04]"
      : level === "low"
        ? "border-chart-2/30 bg-chart-2/[0.06]"
        : "border-border bg-card"

  return (
    <li className={`rounded-xl border p-3 ${cardTint}`}>
      <div className="flex items-start gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          {listing.image && (
            <Image src={listing.image || "/placeholder.svg"} alt="" fill sizes="48px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate font-bold text-foreground">{listing.nameKo}</span>
            {listing.featured && (
              <Star className="size-3 shrink-0 fill-primary text-primary" aria-label="추천 상품" />
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {CATEGORY_LABEL.get(listing.category) ?? listing.category} · {listing.brand} · {listing.unit}
          </p>
          <p className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
            {formatPrice(listing.price, store.currency)}
          </p>
        </div>
        <StockBadge stock={listing.stock} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 pt-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">재고</span>
          <span
            className={`font-mono text-sm font-bold tabular-nums ${
              level === "out" ? "text-destructive" : level === "low" ? "text-chart-2" : "text-foreground"
            }`}
          >
            {listing.stock}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {statusBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Switch
                checked={active}
                onCheckedChange={toggleActive}
                aria-label={`${listing.nameKo} 판매 상태`}
              />
            )}
            {active ? "판매 중" : "숨김"}
          </label>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" aria-hidden="true" />
            수정
          </Button>
        </div>
      </div>

      {editing && (
        <EditStockDialog
          store={store}
          listing={listing}
          open={editing}
          onOpenChange={setEditing}
          onError={onError}
        />
      )}
    </li>
  )
}

/* --------------------------- 재고/가격 수정 다이얼로그 --------------------------- */

function EditStockDialog({
  store,
  listing,
  open,
  onOpenChange,
  onError,
}: {
  store: VendorStore
  listing: VendorListing
  open: boolean
  onOpenChange: (v: boolean) => void
  onError: (m: string | null) => void
}) {
  const [price, setPrice] = useState(String(listing.price))
  const [stock, setStock] = useState(String(listing.stock))
  const [featured, setFeatured] = useState(listing.featured)
  const [active, setActive] = useState(listing.active)
  const [busy, setBusy] = useState<"save" | "delete" | null>(null)

  const previewLevel = stockLevel(Number(stock) || 0)

  async function save(e: React.FormEvent) {
    e.preventDefault()
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
    if (!result.ok) {
      onError(result.error ?? "저장에 실패했습니다.")
      return
    }
    onOpenChange(false)
  }

  async function remove() {
    setBusy("delete")
    onError(null)
    const result = await deleteListing(store.id, listing.id)
    setBusy(null)
    if (!result.ok) {
      onError(result.error ?? "삭제에 실패했습니다.")
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="relative size-8 overflow-hidden rounded-md bg-muted">
              {listing.image && (
                <Image src={listing.image || "/placeholder.svg"} alt="" fill sizes="32px" className="object-cover" />
              )}
            </span>
            {listing.nameKo}
          </DialogTitle>
          <DialogDescription>
            {CATEGORY_LABEL.get(listing.category) ?? listing.category} · {listing.unit} · 가격과 재고를 수정하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`edit-price-${listing.id}`}>판매가 ({store.currency.code})</Label>
              <Input
                id={`edit-price-${listing.id}`}
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono tabular-nums"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`edit-stock-${listing.id}`}>재고 수량</Label>
              <Input
                id={`edit-stock-${listing.id}`}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={`font-mono tabular-nums ${
                  previewLevel === "out"
                    ? "text-destructive"
                    : previewLevel === "low"
                      ? "text-chart-2"
                      : ""
                }`}
              />
            </div>
          </div>

          {previewLevel !== "ok" && (
            <p
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
                previewLevel === "out"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-chart-2/12 text-chart-2"
              }`}
            >
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              {previewLevel === "out"
                ? "재고가 0입니다. 고객에게 품절로 표시됩니다."
                : `재고가 ${LOW_STOCK_THRESHOLD}개 이하입니다. 곧 품절될 수 있습니다.`}
            </p>
          )}

          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
            <label className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-foreground">
              판매 중 (스토어 노출)
              <Switch checked={active} onCheckedChange={setActive} aria-label="판매 중" />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-foreground">
              추천 상품으로 강조
              <Switch checked={featured} onCheckedChange={setFeatured} aria-label="추천 상품" />
            </label>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              disabled={busy !== null}
              className="text-muted-foreground hover:text-destructive"
            >
              {busy === "delete" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              판매 중단
            </Button>
            <Button type="submit" disabled={busy !== null} className="rounded-full">
              {busy === "save" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    <form
      onSubmit={add}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-primary/30 bg-accent/40 p-3"
    >
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
