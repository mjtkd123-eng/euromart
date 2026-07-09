"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Check, Package, Pencil, Store as StoreIcon, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getVendors, getStoreById, getStoreProducts } from "@/lib/queries"
import { formatFt } from "@/lib/format"
import type { StoreProductView } from "@/lib/types"

/** 편집 가능한 로컬 상품 상태 */
interface EditableRow {
  storeProductId: string
  nameKo: string
  nameHu: string
  imageUrl: string
  unit: string
  price: number
  inStock: boolean
  /** 원래 가격 (변경 감지용) */
  originalPrice: number
  originalInStock: boolean
}

export function VendorView() {
  const vendors = useMemo(() => getVendors(), [])
  const [activeVendorId, setActiveVendorId] = useState(vendors[0]?.id ?? "")

  const vendor = vendors.find((v) => v.id === activeVendorId)
  const store = vendor ? getStoreById(vendor.storeId) : undefined

  const initialRows = useMemo<EditableRow[]>(() => {
    if (!store) return []
    return getStoreProducts(store.id).map((p: StoreProductView) => ({
      storeProductId: p.storeProductId,
      nameKo: p.nameKo,
      nameHu: p.nameHu,
      imageUrl: p.imageUrl,
      unit: p.unit,
      price: p.price,
      inStock: p.inStock,
      originalPrice: p.price,
      originalInStock: p.inStock,
    }))
  }, [store])

  const [rows, setRows] = useState<EditableRow[]>(initialRows)
  const [savedId, setSavedId] = useState<string | null>(null)

  // 벤더 전환 시 행 초기화
  const [lastVendor, setLastVendor] = useState(activeVendorId)
  if (lastVendor !== activeVendorId) {
    setLastVendor(activeVendorId)
    setRows(initialRows)
  }

  function updatePrice(id: string, value: string) {
    const num = Number.parseInt(value.replace(/\D/g, ""), 10)
    setRows((prev) =>
      prev.map((r) => (r.storeProductId === id ? { ...r, price: Number.isNaN(num) ? 0 : num } : r)),
    )
  }

  function toggleStock(id: string, next: boolean) {
    setRows((prev) => prev.map((r) => (r.storeProductId === id ? { ...r, inStock: next } : r)))
  }

  function saveRow(id: string) {
    // 실제 앱에서는 여기서 UPDATE store_products SET price=... WHERE id=... AND store_id=vendor.storeId
    setRows((prev) =>
      prev.map((r) =>
        r.storeProductId === id ? { ...r, originalPrice: r.price, originalInStock: r.inStock } : r,
      ),
    )
    setSavedId(id)
    setTimeout(() => setSavedId((cur) => (cur === id ? null : cur)), 1500)
  }

  const changedCount = rows.filter(
    (r) => r.price !== r.originalPrice || r.inStock !== r.originalInStock,
  ).length

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/" aria-label="홈으로">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <StoreIcon className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold leading-tight">입점업체 대시보드</h1>
              <p className="text-xs text-muted-foreground">Vendor · 가격 관리 데모</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* 벤더(사장님) 계정 전환 */}
        <div className="mb-6">
          <Label className="mb-2 block text-sm text-muted-foreground">로그인 계정 (데모용 전환)</Label>
          <div className="flex flex-wrap gap-2">
            {vendors.map((v) => {
              const vStore = getStoreById(v.storeId)
              const active = v.id === activeVendorId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveVendorId(v.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="block font-medium">{v.name}</span>
                  <span className="block text-xs">{vStore?.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {store && (
          <>
            <Card className="mb-6 flex items-center gap-4 overflow-hidden p-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                <Image src={store.logo || "/placeholder.svg"} alt={store.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{store.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {store.district} · {rows.length}개 상품 취급
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 gap-1">
                <TrendingUp className="size-3.5" />
                {changedCount > 0 ? `${changedCount}건 변경됨` : "동기화됨"}
              </Badge>
            </Card>

            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="size-4" />
              <span>이 매장의 가격과 재고만 수정할 수 있습니다.</span>
            </div>

            <div className="space-y-3">
              {rows.map((row) => {
                const changed = row.price !== row.originalPrice || row.inStock !== row.originalInStock
                const justSaved = savedId === row.storeProductId
                return (
                  <Card key={row.storeProductId} className="flex items-center gap-3 p-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={row.imageUrl || "/placeholder.svg"}
                        alt={row.nameKo}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-tight">{row.nameKo}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.nameHu} · {row.unit}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-md border border-input bg-background">
                          <Input
                            inputMode="numeric"
                            value={row.price ? row.price.toLocaleString("hu-HU") : ""}
                            onChange={(e) => updatePrice(row.storeProductId, e.target.value)}
                            className="h-8 w-24 border-0 text-right font-semibold tabular-nums focus-visible:ring-0"
                            aria-label={`${row.nameKo} 가격`}
                          />
                          <span className="pr-2 text-sm text-muted-foreground">Ft</span>
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Switch
                            checked={row.inStock}
                            onCheckedChange={(v) => toggleStock(row.storeProductId, v)}
                            aria-label="재고 여부"
                          />
                          {row.inStock ? "판매중" : "품절"}
                        </label>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={changed ? "default" : "ghost"}
                      disabled={!changed && !justSaved}
                      onClick={() => saveRow(row.storeProductId)}
                      className="shrink-0"
                    >
                      {justSaved ? (
                        <>
                          <Check className="size-4" /> 저장됨
                        </>
                      ) : (
                        <>
                          <Pencil className="size-4" /> 저장
                        </>
                      )}
                    </Button>
                  </Card>
                )
              })}
            </div>

            <p className="mt-6 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              데모 안내: 여기서 수정한 가격은 <code className="text-foreground">store_products</code> 테이블의 해당
              매장 레코드만 업데이트합니다. 실제 서비스에서는 벤더 인증 후 본인 매장 상품만 접근하도록 서버에서
              <code className="text-foreground"> store_id</code> 기준으로 권한을 검증합니다.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
