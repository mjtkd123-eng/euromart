/**
 * Hybrid CS routing, 2h SLA, and merchant penalty math.
 * Spec: docs/prd-hybrid-cs-claims.md
 */

export type ClaimMarket = "EU" | "KR"
export type ClaimBand = "micro" | "medium" | "high"
export type ClaimIssue =
  | "omission"
  | "partial_damage"
  | "freshness"
  | "full_misdelivery"
  | "batch_freshness"
  | "food_poisoning"
  | "unlabeled_allergen"
  | "legal_threat"
  | "change_of_mind"

export type RouteDecision =
  | "TIER1_AUTO_PAY"
  | "PLATFORM_AUTO_PAY"
  | "TIER1_WAIT"
  | "TIER2"
  | "REJECT"

export type ClaimLifecycle =
  | "received"
  | "merchant_review"
  | "auto_refunded"
  | "platform_review"
  | "escalated"
  | "refunded"
  | "rejected"
  | "legal_hold"

export type ClaimTier = "system" | "tier1_merchant" | "tier2_platform"

export const SLA_MS = 2 * 60 * 60 * 1000
export const FDS_REFUND_RATE_BLOCK = 0.3
export const FDS_MIN_ORDERS = 5
export const FDS_MAX_WARNINGS = 3

const MICRO_EUR = 20
const MEDIUM_EUR = 50
const MICRO_KRW = 30_000
const MEDIUM_KRW = 100_000

const HIGH_RISK: ClaimIssue[] = ["food_poisoning", "unlabeled_allergen", "legal_threat"]

export interface FdsSnapshot {
  blacklisted: boolean
  refundRate90d: number
  orderCount90d: number
  warningCount: number
}

export function amountBand(
  amount: number,
  market: ClaimMarket,
  amountEur?: number | null,
): ClaimBand {
  if (market === "KR") {
    if (amount <= MICRO_KRW) return "micro"
    if (amount <= MEDIUM_KRW) return "medium"
    return "high"
  }
  const eur = amountEur ?? amount
  if (eur <= MICRO_EUR) return "micro"
  if (eur <= MEDIUM_EUR) return "medium"
  return "high"
}

/** Micro never retrieved (logistics > value). Medium is optional, never blocking. */
export function retrievalRequired(_band: ClaimBand, _issue: ClaimIssue): boolean {
  return false
}

export function retrievalSuggested(band: ClaimBand, issue: ClaimIssue): boolean {
  if (HIGH_RISK.includes(issue)) return false
  return band === "medium" || band === "high"
}

export function slaDeadline(from = new Date()): Date {
  return new Date(from.getTime() + SLA_MS)
}

export function piiPurgeAt(closedAt: Date, issue: ClaimIssue): Date {
  const months = issue === "food_poisoning" ? 36 : 24
  const d = new Date(closedAt)
  d.setMonth(d.getMonth() + months)
  return d
}

export function routeClaim(input: {
  issue: ClaimIssue
  band: ClaimBand
  photoCount: number
  fxStale: boolean
  storage?: "fresh" | "chilled" | "frozen" | "ambient"
  fds: FdsSnapshot
}): { decision: RouteDecision; reason: string } {
  if (input.issue === "change_of_mind") {
    if (input.storage && input.storage !== "ambient") {
      return { decision: "REJECT", reason: "CHANGE_OF_MIND_PERISHABLE" }
    }
    return { decision: "TIER1_WAIT", reason: "CHANGE_OF_MIND_RETURN" }
  }

  if (input.fds.blacklisted) {
    return { decision: "TIER2", reason: "FDS_BLACKLIST" }
  }
  if (input.fds.orderCount90d >= FDS_MIN_ORDERS && input.fds.refundRate90d > FDS_REFUND_RATE_BLOCK) {
    return { decision: "TIER2", reason: "FDS" }
  }
  if (HIGH_RISK.includes(input.issue)) {
    return { decision: "TIER2", reason: "HIGH_RISK" }
  }
  if (input.band === "high" || input.fxStale) {
    return { decision: "TIER2", reason: "AMOUNT" }
  }

  const photoOk = input.photoCount > 0
  if (input.band === "micro" && photoOk) {
    return { decision: "TIER1_AUTO_PAY", reason: "MICRO_NO_RETRIEVAL" }
  }
  if (input.band === "medium") {
    return { decision: "PLATFORM_AUTO_PAY", reason: "MEDIUM_AUTO" }
  }
  if (input.band === "micro" && !photoOk) {
    return { decision: "TIER1_WAIT", reason: "PHOTO_REQUIRED" }
  }
  return { decision: "TIER1_WAIT", reason: "MERCHANT_SLA" }
}

export function isSlaBreached(deadlineAt: Date, now = new Date()): boolean {
  return now.getTime() >= deadlineAt.getTime()
}

export type PenaltyEvent = "sla_timeout" | "safety_incident" | "allergen" | "dispute_lost"

const PENALTY_POINTS: Record<PenaltyEvent, number> = {
  sla_timeout: 1,
  dispute_lost: 3,
  safety_incident: 10,
  allergen: 10,
}

export type PenaltyLevel = "none" | "warning" | "rank_down" | "suspension"

export function penaltyLevel(score: number): PenaltyLevel {
  if (score >= 10) return "suspension"
  if (score >= 3) return "rank_down"
  if (score >= 1) return "warning"
  return "none"
}

export function applyMerchantPenalty(currentScore: number, event: PenaltyEvent) {
  const score = currentScore + PENALTY_POINTS[event]
  return { score, level: penaltyLevel(score), added: PENALTY_POINTS[event] }
}

export function nextFdsAction(fds: FdsSnapshot): "block_auto" | "warning" | "force_disconnect" | null {
  if (fds.orderCount90d < FDS_MIN_ORDERS) return null
  if (fds.refundRate90d <= FDS_REFUND_RATE_BLOCK) return null
  if (fds.warningCount >= FDS_MAX_WARNINGS) return "force_disconnect"
  if (fds.warningCount >= 1) return "warning"
  return "block_auto"
}

/** Keep first (and last when length > 2). Example: 김준호 → 김*호 */
export function maskName(name: string | null | undefined): string {
  const n = (name ?? "").trim()
  if (!n) return "—"
  if (n.length === 1) return "*"
  if (n.length === 2) return `${n[0]}*`
  const stars = "*".repeat(Math.min(n.length - 2, 4))
  return `${n[0]}${stars}${n[n.length - 1]}`
}

export function maskPhone(phone: string | null | undefined): string {
  const d = (phone ?? "").replace(/\D/g, "")
  if (d.length < 6) return "***"
  return `${d.slice(0, 4)} *** ${d.slice(-2)}`
}

export function returnWindowDays(market: ClaimMarket): number {
  return market === "KR" ? 7 : 14
}

export function lifecycleFor(
  decision: RouteDecision,
  issue: ClaimIssue,
): { tier: ClaimTier; lifecycle: ClaimLifecycle } {
  if (decision === "REJECT") return { tier: "system", lifecycle: "rejected" }
  if (decision === "TIER1_AUTO_PAY" || decision === "PLATFORM_AUTO_PAY") {
    return { tier: "system", lifecycle: "auto_refunded" }
  }
  if (decision === "TIER1_WAIT") return { tier: "tier1_merchant", lifecycle: "merchant_review" }
  if (issue === "legal_threat") return { tier: "tier2_platform", lifecycle: "legal_hold" }
  if (HIGH_RISK.includes(issue)) return { tier: "tier2_platform", lifecycle: "escalated" }
  return { tier: "tier2_platform", lifecycle: "platform_review" }
}

export interface ClassifyInput {
  issue: ClaimIssue
  amount: number
  market: ClaimMarket
  amountEur?: number | null
  photoCount: number
  fxStale: boolean
  storage?: "fresh" | "chilled" | "frozen" | "ambient"
  fds: FdsSnapshot
  filedAt?: Date
}

export interface ClassifyResult {
  band: ClaimBand
  decision: RouteDecision
  reason: string
  retrievalRequired: boolean
  retrievalSuggested: boolean
  slaDeadlineAt: string
  returnWindowDays: number
  fdsAction: ReturnType<typeof nextFdsAction>
  timeoutPenalty: ReturnType<typeof applyMerchantPenalty>
  tier: ClaimTier
  lifecycle: ClaimLifecycle
}

export function classifyClaim(input: ClassifyInput): ClassifyResult {
  const band = amountBand(input.amount, input.market, input.amountEur)
  const { decision, reason } = routeClaim({ ...input, band })
  const { tier, lifecycle } = lifecycleFor(decision, input.issue)
  const filedAt = input.filedAt ?? new Date()
  return {
    band,
    decision,
    reason,
    retrievalRequired: retrievalRequired(band, input.issue),
    retrievalSuggested: retrievalSuggested(band, input.issue),
    slaDeadlineAt: slaDeadline(filedAt).toISOString(),
    returnWindowDays: returnWindowDays(input.market),
    fdsAction: nextFdsAction(input.fds),
    timeoutPenalty: applyMerchantPenalty(0, "sla_timeout"),
    tier,
    lifecycle,
  }
}
