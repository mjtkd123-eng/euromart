import { jsonError, jsonOk } from "@/lib/api"
import {
  classifyClaim,
  type ClaimIssue,
  type ClaimMarket,
  type ClassifyInput,
} from "@/lib/claims-routing"
import { customerRouteCopy } from "@/lib/claims-copy"

export const dynamic = "force-dynamic"

const ISSUES: ClaimIssue[] = [
  "omission",
  "partial_damage",
  "freshness",
  "full_misdelivery",
  "batch_freshness",
  "food_poisoning",
  "unlabeled_allergen",
  "legal_threat",
  "change_of_mind",
]

const MARKETS: ClaimMarket[] = ["EU", "KR"]
const STORAGE = ["fresh", "chilled", "frozen", "ambient"] as const

type Body = {
  issue?: string
  amount?: number
  market?: string
  amountEur?: number | null
  photoCount?: number
  fxStale?: boolean
  storage?: string
  blacklisted?: boolean
  refundRate90d?: number
  orderCount90d?: number
  warningCount?: number
}

function parse(body: Body): ClassifyInput | string {
  if (!body.issue || !ISSUES.includes(body.issue as ClaimIssue)) {
    return "Unknown issue code"
  }
  if (!body.market || !MARKETS.includes(body.market as ClaimMarket)) {
    return "Market must be EU or KR"
  }
  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount < 0) return "Amount must be a non-negative number"

  const storage = body.storage
    ? STORAGE.includes(body.storage as (typeof STORAGE)[number])
      ? (body.storage as ClassifyInput["storage"])
      : undefined
    : undefined
  if (body.storage && !storage) return "Storage must be fresh, chilled, frozen, or ambient"

  return {
    issue: body.issue as ClaimIssue,
    amount,
    market: body.market as ClaimMarket,
    amountEur: body.amountEur ?? null,
    photoCount: Math.max(0, Number(body.photoCount ?? 0) || 0),
    fxStale: Boolean(body.fxStale),
    storage,
    fds: {
      blacklisted: Boolean(body.blacklisted),
      refundRate90d: Number(body.refundRate90d ?? 0) || 0,
      orderCount90d: Math.max(0, Number(body.orderCount90d ?? 0) || 0),
      warningCount: Math.max(0, Number(body.warningCount ?? 0) || 0),
    },
  }
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parsed = parse(body)
  if (typeof parsed === "string") return jsonError(parsed)

  const result = classifyClaim(parsed)
  return jsonOk({
    ...result,
    copy: customerRouteCopy(result.decision, result.reason, parsed.market),
  })
}
