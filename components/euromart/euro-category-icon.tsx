import { Soup, Snowflake, Milk, Salad, Cookie, CupSoda, Carrot, Wheat, ShoppingBasket } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  soup: Soup,
  snowflake: Snowflake,
  milk: Milk,
  salad: Salad,
  cookie: Cookie,
  "cup-soda": CupSoda,
  carrot: Carrot,
  wheat: Wheat,
}

export function EuroCategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? ShoppingBasket
  return <Icon className={className} aria-hidden="true" />
}
