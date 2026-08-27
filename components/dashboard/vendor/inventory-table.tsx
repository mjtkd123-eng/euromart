"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Check, Plus, Star, AlertCircle } from "lucide-react"
import { addProductToStore, updateRegionProduct } from "@/app/actions/vendor"
import type { VendorProductRow } from "@/lib/vendor-server"
import { formatPrice, type Currency } from "@/lib/storesData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export interface CatalogOption {
  id: string
  nameKo: string
  unit: string
}

interface Props {
  regionId: string
  currency: Currency
  products: VendorProductRow[]
  catalog: CatalogOption[]
}

export function InventoryTable({ regionId, currency, products, catalog }: Props) {
  const available = catalog.filter((c) => !products.some((p) => p.productId === c.id))

  return (
    <div className="flex flex-col gap-6">
      <AddProductCard regionId={regionId} currency={currency} options={available} />

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="hidden grid-cols-[minmax(0,2fr)_120px_100px_88px_88px_80px] items-center gap-3 border-b border-border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>상품</span>
          <span>가격 ({currency.code})</span>
          <span>재고</span>
          <span>추천</span>
          <span>판매중</span>
          <span className="sr-only">저장</span>
        </div>
        <ul>
          {products.map((p) => (
            <InventoryRow key={p.id} product={p} currency={currency} />
          ))}
          {products.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              등록된 상품이 없습니다. 위에서 상품을 추가하세요.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function InventoryRow({ product, currency }: { product: VendorProductRow; currency: Currency }) {
  const [price, setPrice] = useState(String(product.price))
  const [stock, setStock] = useState(String(product.stock))
  const [featured, setFeatured] = useState(product.featured)
  const [active, setActive] = useState(product.active)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    price !== String(product.price) ||
    stock !== String(product.stock) ||
    featured !== product.featured ||
    active !== product.active

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateRegionProduct({
        rowId: product.id,
        price: Number(price),
        stock: Number.parseInt(stock, 10),
        featured,
        active,
      })
      if (result.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(result.error ?? "저장 실패")
      }
    })
  }

  const stockNum = Number.parseInt(stock, 10)
  const stockTone =
    stockNum <= 0 ? "border-destructive text-destructive" : stockNum <= 10 ? "border-primary" : ""

  return (
    <li className="grid grid-cols-2 items-center gap-3 border-b border-border px-4 py-3 last:border-0 md:grid-cols-[minmax(0,2fr)_120px_100px_88px_88px_80px]">
      <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
        <Image
          src={product.image || "/placeholder.svg"}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-lg bg-muted object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{product.nameKo}</p>
          <p className="truncate text-xs text-muted-foreground">
            {product.unit} · 현재 {formatPrice(product.price, currency)}
          </p>
        </div>
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground md:hidden">가격</Label>
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          min={0}
          step="0.01"
          className="h-9"
          aria-label={`${product.nameKo} 가격`}
        />
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground md:hidden">재고</Label>
        <Input
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          type="number"
          min={0}
          step={1}
          className={`h-9 ${stockTone}`}
          aria-label={`${product.nameKo} 재고`}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={featured} onCheckedChange={setFeatured} aria-label={`${product.nameKo} 추천 상품`} />
        <Star
          className={`size-3.5 ${featured ? "fill-primary text-primary" : "text-muted-foreground"}`}
          aria-hidden="true"
        />
      </div>

      <div>
        <Switch checked={active} onCheckedChange={setActive} aria-label={`${product.nameKo} 판매중`} />
      </div>

      <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-1">
        {error && (
          <span className="text-[11px] font-medium text-destructive" role="alert">
            {error}
          </span>
        )}
        {saved && !dirty && <Check className="size-4 text-foreground" aria-label="저장됨" />}
        <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || pending} onClick={save}>
          {pending ? "..." : "저장"}
        </Button>
      </div>
    </li>
  )
}

function AddProductCard({
  regionId,
  currency,
  options,
}: {
  regionId: string
  currency: Currency
  options: CatalogOption[]
}) {
  const [productId, setProductId] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("0")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await addProductToStore({
        regionId,
        productId,
        price: Number(price),
        stock: Number.parseInt(stock, 10),
      })
      if (result.ok) {
        setProductId("")
        setPrice("")
        setStock("0")
      } else {
        setError(result.error ?? "추가 실패")
      }
    })
  }

  if (options.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-xs text-muted-foreground">
        마스터 카탈로그의 모든 상품이 이미 매장에 등록되어 있습니다.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-background p-4">
      <h2 className="text-sm font-bold text-foreground">상품 추가</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="grid min-w-48 flex-1 gap-1.5">
          <Label htmlFor="add-product">마스터 카탈로그</Label>
          <select
            id="add-product"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="">상품 선택...</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nameKo} ({o.unit})
              </option>
            ))}
          </select>
        </div>
        <div className="grid w-32 gap-1.5">
          <Label htmlFor="add-price">가격 ({currency.code})</Label>
          <Input
            id="add-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            required
          />
        </div>
        <div className="grid w-28 gap-1.5">
          <Label htmlFor="add-stock">재고</Label>
          <Input
            id="add-stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            type="number"
            min={0}
            step={1}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" aria-hidden="true" />
          {pending ? "추가 중..." : "추가"}
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
