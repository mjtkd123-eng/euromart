"use client"

import Link from "next/link"
import { ShoppingBag, MapPin, Store } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const { itemCount } = useCart()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-black tracking-tight">
            부다페스트<span className="text-primary">마트</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground sm:flex">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          <span className="font-medium text-foreground">부다페스트 VI. kerület</span>
          <span className="text-xs">· 안드라시 거리</span>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/vendor">
              <Store className="size-4" aria-hidden="true" />
              사장님 센터
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="relative">
            <Link href="/cart" aria-label="장바구니">
              <ShoppingBag className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">장바구니</span>
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
