/** 헝가리 포린트(Ft) 통화 포맷 — 예: 3990 -> "3,990 Ft" */
export function formatFt(amount: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(amount))} Ft`
}

/** ISO 통화 코드별 표시 로케일 (소수 자릿수는 Intl이 통화 규칙에 맞게 자동 처리) */
const CURRENCY_LOCALES: Record<string, string> = {
  EUR: "de-DE",
  HUF: "hu-HU",
  CZK: "cs-CZ",
  PLN: "pl-PL",
  GBP: "en-GB",
}

/** 통화 코드 기준 금액 포맷 — 예: (26.86,"EUR") → "26,86 €", (11480,"HUF") → "11 480 Ft" */
export function formatMoney(amount: number, currencyCode: string): string {
  const locale = CURRENCY_LOCALES[currencyCode] ?? "en-US"
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode }).format(amount)
  } catch {
    return `${new Intl.NumberFormat(locale).format(amount)} ${currencyCode}`
  }
}

/** 날짜/시간 포맷 (한국어 로케일, 유럽 도시 기준) */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

/** 남은 시간(마감까지)을 사람이 읽는 문자열로 — 예: "2일 5시간 남음" / "기한 초과" */
export function formatDeadline(iso: string): { text: string; overdue: boolean } {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return { text: "기한 초과 · Overdue", overdue: true }
  const hours = Math.floor(ms / 3_600_000)
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  if (days > 0) return { text: `${days}일 ${remHours}시간 남음`, overdue: false }
  return { text: `${hours}시간 남음`, overdue: false }
}
