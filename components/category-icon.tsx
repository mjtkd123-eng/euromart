import { Soup, Snowflake, Milk, Cookie, CupSoda, Carrot, Salad, Wheat, Store, type LucideIcon } from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  soup: Soup,
  snowflake: Snowflake,
  milk: Milk,
  cookie: Cookie,
  "cup-soda": CupSoda,
  carrot: Carrot,
  salad: Salad,
  wheat: Wheat,
}

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Store
  return <Icon className={className} aria-hidden="true" />
}
