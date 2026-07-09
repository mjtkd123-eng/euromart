/** 헝가리 포린트(Ft) 통화 포맷 — 예: 3990 -> "3,990 Ft" */
export function formatFt(amount: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(amount))} Ft`
}
