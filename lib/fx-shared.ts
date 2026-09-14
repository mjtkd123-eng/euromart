/** 모든 환율의 기준 통화. ECB 피드가 EUR 기준으로 제공됩니다. */
export const FX_BASE = "EUR"

/** EUR 기준 환율 맵 (통화코드 → 1 EUR 당 금액). */
export type FxRateMap = Record<string, number>

/**
 * 두 통화 간 금액을 환산합니다. 환율 정보가 없으면 null을 반환합니다.
 * 표시용 참고 지표이며, 실제 결제 금액은 각 매장의 현지 통화 가격을 사용합니다.
 */
export function convert(amount: number, from: string, to: string, rates: FxRateMap): number | null {
  if (from === to) return amount
  const fromRate = rates[from]
  const toRate = rates[to]
  if (!fromRate || !toRate) return null
  // EUR 기준 환율이므로 base로 되돌린 뒤 목표 통화로 변환합니다.
  return (amount / fromRate) * toRate
}

/**
 * 환산가를 "≈ €12.34" 형태로 표시합니다.
 * 통화가 같거나(환산 불필요) 환율 정보가 없으면 null을 반환합니다.
 */
export function formatConverted(
  amount: number,
  from: string,
  to: string,
  rates: FxRateMap,
  locale = "en-IE",
): string | null {
  if (from === to) return null
  const converted = convert(amount, from, to, rates)
  if (converted === null) return null
  return `≈ ${new Intl.NumberFormat(locale, {
    style: "currency",
    currency: to,
    maximumFractionDigits: 2,
  }).format(converted)}`
}
