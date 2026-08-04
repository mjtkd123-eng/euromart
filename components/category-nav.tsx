import Link from "next/link"

const NAV_LINKS = [
  { label: "신규입고", href: "/" },
  { label: "세일상품", href: "/" },
  { label: "인기상품", href: "/" },
  { label: "한독푸드", href: "/" },
  { label: "한독캐쉬", href: "/" },
  { label: "라면/면류", href: "/" },
  { label: "김치/반찬", href: "/" },
  { label: "신선/채소", href: "/" },
  { label: "냉동식품", href: "/" },
]

export function CategoryNav() {
  return (
    <nav aria-label="상품 카테고리" className="w-full bg-brand-orange text-brand-orange-foreground">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_LINKS.map((link, i) => (
          <Link
            key={`${link.label}-${i}`}
            href={link.href}
            className="shrink-0 whitespace-nowrap rounded-md px-3.5 py-3 text-sm font-bold transition-colors hover:bg-black/10"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
