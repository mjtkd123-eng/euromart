"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, Search, User, Heart, ShoppingBag, ChevronDown, MapPin, Store, X } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useLanguage } from "@/lib/language-context"
import { LANGUAGES, localizeCategory } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { getCategories } from "@/lib/queries"
import { CategoryIcon } from "@/components/category-icon"

export function SiteHeader() {
  const { itemCount } = useCart()
  const { lang, setLang, t } = useLanguage()
  const [searchOpen, setSearchOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const categories = getCategories()
  const activeLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        {/* 왼쪽: 햄버거 + 로고 */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t.header.menuOpen}
                  className="text-primary hover:bg-primary/10 hover:text-primary"
                />
              }
            >
              <Menu className="size-6" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="w-80 gap-0 p-0">
              <SheetHeader className="border-b border-border">
                <SheetTitle className="flex items-center gap-2 text-lg font-black">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <ShoppingBag className="size-4" aria-hidden="true" />
                  </span>
                  {t.header.brandFirst}
                  {lang !== "KR" && " "}
                  {t.header.brandSecond}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 overflow-y-auto p-3">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {t.header.category}
                </p>
                {categories.map((cat) => (
                  <SheetClose
                    key={cat.id}
                    render={
                      <Link
                        href="/"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      />
                    }
                  >
                    <CategoryIcon icon={cat.icon} className="size-5 text-primary" />
                    <span>{localizeCategory(cat, lang)}</span>
                    {lang !== "HU" && (
                      <span className="ml-auto text-xs text-muted-foreground">{cat.nameHu}</span>
                    )}
                  </SheetClose>
                ))}
                <div className="my-2 h-px bg-border" />
                <SheetClose
                  render={
                    <Link
                      href="/vendor"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    />
                  }
                >
                  <Store className="size-5 text-primary" aria-hidden="true" />
                  {t.header.vendorCenter}
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-black tracking-tight">
              {t.header.brandFirst}
              {lang !== "KR" && " "}
              <span className="text-primary">{t.header.brandSecond}</span>
            </span>
          </Link>
        </div>

        {/* 위치 (데스크톱) */}
        <div className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground lg:flex">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          <span className="font-medium text-foreground">VI. kerület</span>
          <span className="text-xs">· {t.header.streetNote}</span>
        </div>

        {/* 오른쪽: 아이콘 그룹 */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.header.searchAria}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="size-5" aria-hidden="true" />
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label={t.header.myPage}>
            <Link href="/vendor">
              <User className="size-5" aria-hidden="true" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label={t.header.wishlist} className="hidden sm:inline-flex">
            <Heart className="size-5" aria-hidden="true" />
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative" aria-label={t.header.cartAria}>
            <Link href="/cart">
              <ShoppingBag className="size-5" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>

          {/* 언어 선택 */}
          <div className="relative ml-1">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
              aria-haspopup="menu"
              aria-expanded={langOpen}
              aria-label={t.header.langSelect}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {activeLang.flag}
              </span>
              <span className="hidden sm:inline">{activeLang.code}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </button>
            {langOpen && (
              <>
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setLangOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      role="menuitem"
                      onClick={() => {
                        setLang(l.code)
                        setLangOpen(false)
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                        l.code === lang ? "font-bold text-primary" : "text-foreground"
                      }`}
                    >
                      <span className="text-base leading-none" aria-hidden="true">
                        {l.flag}
                      </span>
                      {l.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 검색 바 (토글) */}
      {searchOpen && (
        <div className="border-t border-border bg-background">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                autoFocus
                placeholder={t.header.searchPlaceholder}
                className="h-11 rounded-full pl-10"
                aria-label={t.header.searchPlaceholder}
              />
            </div>
            <Button variant="ghost" size="icon" aria-label={t.header.searchClose} onClick={() => setSearchOpen(false)}>
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
