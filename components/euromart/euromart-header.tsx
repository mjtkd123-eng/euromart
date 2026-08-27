"use client"

import { Search, ShoppingBag, X } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RegionSwitcher } from "./region-switcher"
import { AccountMenu } from "./account-menu"

export function EuromartHeader() {
  const { region, itemCount, setCartOpen, searchQuery, setSearchQuery, browseMode } = useEuromart()
  const searchPlaceholder =
    browseMode === "stores" ? "매장 검색 · Search stores" : "상품 검색 · Search products"
  const searchLabel = browseMode === "stores" ? "매장 검색" : "상품 검색"

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* 공지 바 */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-1.5 text-center text-xs font-medium">
          <span>{region.announcement.ko}</span>
          <span className="mx-2 opacity-50">·</span>
          <span className="opacity-90">{region.announcement.en}</span>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {/* 로고 + 지역 브랜드 */}
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-black tracking-tight">
              K<span className="text-primary">EuroMart</span>
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              {browseMode === "stores" ? `${region.country} 매장` : region.store.ko}
            </span>
          </div>
        </div>

        {/* 지역 선택 */}
        <div className="ml-1">
          <RegionSwitcher />
        </div>

        {/* 검색 (데스크톱) */}
        <div className="relative mx-auto hidden max-w-md flex-1 md:block">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-full pl-10 pr-9"
            aria-label={searchLabel}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="검색어 지우기"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* 장바구니 + 계정 */}
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="장바구니 열기"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Button>
          <AccountMenu />
        </div>
      </div>

      {/* 검색 (모바일) */}
      <div className="border-t border-border px-4 py-2.5 md:hidden">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-full pl-10"
            aria-label={searchLabel}
          />
        </div>
      </div>
    </header>
  )
}
