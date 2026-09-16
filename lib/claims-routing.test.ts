import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  amountBand,
  applyMerchantPenalty,
  classifyClaim,
  isSlaBreached,
  maskName,
  maskPhone,
  nextFdsAction,
  penaltyLevel,
  piiPurgeAt,
  routeClaim,
  slaDeadline,
  SLA_MS,
} from "./claims-routing.ts"

const cleanFds = {
  blacklisted: false,
  refundRate90d: 0.1,
  orderCount90d: 10,
  warningCount: 0,
}

describe("amountBand", () => {
  it("EU micro ≤ €20, medium ≤ €50, else high", () => {
    assert.equal(amountBand(20, "EU"), "micro")
    assert.equal(amountBand(20.01, "EU"), "medium")
    assert.equal(amountBand(50, "EU"), "medium")
    assert.equal(amountBand(50.01, "EU"), "high")
  })

  it("KR micro ≤ ₩30,000, medium ≤ ₩100,000", () => {
    assert.equal(amountBand(30_000, "KR"), "micro")
    assert.equal(amountBand(30_001, "KR"), "medium")
    assert.equal(amountBand(100_000, "KR"), "medium")
    assert.equal(amountBand(100_001, "KR"), "high")
  })
})

describe("routeClaim", () => {
  it("auto-pays EU micro freshness with photo, no retrieval", () => {
    const r = classifyClaim({
      issue: "freshness",
      amount: 18,
      market: "EU",
      photoCount: 1,
      fxStale: false,
      fds: cleanFds,
    })
    assert.equal(r.decision, "TIER1_AUTO_PAY")
    assert.equal(r.reason, "MICRO_NO_RETRIEVAL")
    assert.equal(r.retrievalRequired, false)
    assert.equal(r.lifecycle, "auto_refunded")
  })

  it("holds micro without a photo", () => {
    const r = routeClaim({
      issue: "omission",
      band: "micro",
      photoCount: 0,
      fxStale: false,
      fds: cleanFds,
    })
    assert.equal(r.decision, "TIER1_WAIT")
    assert.equal(r.reason, "PHOTO_REQUIRED")
  })

  it("platform auto-pays medium misdelivery", () => {
    const r = classifyClaim({
      issue: "full_misdelivery",
      amount: 35,
      market: "EU",
      photoCount: 0,
      fxStale: false,
      fds: cleanFds,
    })
    assert.equal(r.decision, "PLATFORM_AUTO_PAY")
    assert.equal(r.band, "medium")
  })

  it("sends high amount and food poisoning to Tier 2", () => {
    const amount = classifyClaim({
      issue: "omission",
      amount: 80,
      market: "EU",
      photoCount: 1,
      fxStale: false,
      fds: cleanFds,
    })
    assert.equal(amount.decision, "TIER2")
    assert.equal(amount.reason, "AMOUNT")

    const poison = classifyClaim({
      issue: "food_poisoning",
      amount: 5,
      market: "EU",
      photoCount: 0,
      fxStale: false,
      fds: cleanFds,
    })
    assert.equal(poison.decision, "TIER2")
    assert.equal(poison.reason, "HIGH_RISK")
    assert.equal(poison.lifecycle, "escalated")
  })

  it("blocks Tier 1 auto-approval when refund rate > 30% (min 5 orders)", () => {
    const r = routeClaim({
      issue: "freshness",
      band: "micro",
      photoCount: 2,
      fxStale: false,
      fds: { blacklisted: false, refundRate90d: 0.31, orderCount90d: 5, warningCount: 0 },
    })
    assert.equal(r.decision, "TIER2")
    assert.equal(r.reason, "FDS")
  })

  it("rejects change of mind on chilled food", () => {
    const r = classifyClaim({
      issue: "change_of_mind",
      amount: 12,
      market: "EU",
      photoCount: 0,
      fxStale: false,
      storage: "chilled",
      fds: cleanFds,
    })
    assert.equal(r.decision, "REJECT")
    assert.equal(r.returnWindowDays, 14)
  })
})

describe("SLA and penalties", () => {
  it("2h deadline and breach check", () => {
    const from = new Date("2026-09-16T12:00:00.000Z")
    const d = slaDeadline(from)
    assert.equal(d.getTime() - from.getTime(), SLA_MS)
    assert.equal(isSlaBreached(d, new Date("2026-09-16T13:59:59.000Z")), false)
    assert.equal(isSlaBreached(d, new Date("2026-09-16T14:00:00.000Z")), true)
  })

  it("penalty points: timeout 1, dispute 3, safety 10 → suspend", () => {
    const a = applyMerchantPenalty(0, "sla_timeout")
    assert.equal(a.added, 1)
    assert.equal(penaltyLevel(a.score), "warning")
    const b = applyMerchantPenalty(1, "dispute_lost")
    assert.equal(b.score, 4)
    assert.equal(b.level, "rank_down")
    const c = applyMerchantPenalty(4, "safety_incident")
    assert.equal(c.score, 14)
    assert.equal(c.level, "suspension")
  })

  it("FDS: block auto, then warn, then force disconnect after 3 warnings", () => {
    assert.equal(
      nextFdsAction({ blacklisted: false, refundRate90d: 0.4, orderCount90d: 8, warningCount: 0 }),
      "block_auto",
    )
    assert.equal(
      nextFdsAction({ blacklisted: false, refundRate90d: 0.4, orderCount90d: 8, warningCount: 1 }),
      "warning",
    )
    assert.equal(
      nextFdsAction({ blacklisted: false, refundRate90d: 0.4, orderCount90d: 8, warningCount: 3 }),
      "force_disconnect",
    )
  })
})

describe("GDPR masking", () => {
  it("masks names and phones", () => {
    assert.equal(maskName("김준호"), "김*호")
    assert.equal(maskPhone("+36 20 123 4567"), "3620 *** 67")
  })

  it("keeps medical cases 36 months, others 24", () => {
    const closed = new Date("2024-01-15T00:00:00.000Z")
    assert.equal(piiPurgeAt(closed, "food_poisoning").getMonth(), 0) // Jan + 36m → Jan
    assert.equal(piiPurgeAt(closed, "food_poisoning").getFullYear(), 2027)
    assert.equal(piiPurgeAt(closed, "freshness").getFullYear(), 2026)
  })
})
