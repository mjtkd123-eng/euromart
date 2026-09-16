# PRD: Hybrid CS, Claims, Legal & Insurance

**Product:** K-EuroMart (한인 마트 × Bolt 배달)  
**Audience:** PO, CS ops, Legal, Backend  
**Status:** Design v1 — extends the current vendor-first claim flow (`pending_vendor` → 2h SLA → mediation)

This document is the source of truth for claim routing, thresholds, legal SOP, insurance recourse, and GDPR retention. Implementation artifacts:

- Schema: `supabase/migrations/20260916_hybrid_cs_claims.sql`
- Routing: `lib/claims-routing.ts`
- Simulator (staff only): `/ops/claims` — vendor and admin. Not in the customer Help Center.
- Crons: `/api/cron/sweep-claim-sla` (every 5 min), `/api/cron/gdpr-retention` (daily 05:00 UTC)

---

## 1. Problem and goals

Today a claim is either waiting on the merchant or in admin mediation. That is too coarse for:

- Micro freshness/omission refunds (should not wait 2 hours or retrieve the bag)
- Food-safety and allergen events (must skip the merchant)
- Repeat refund abuse (FDS)
- EU Product Liability insurance recourse after the platform pays the customer

**Goals**

1. Route every claim to the right tier in one pass.
2. Merchant (Tier 1) owns low-claim CS with a **2-hour** response SLA.
3. Platform CS & Legal (Tier 2) auto-takes high-risk, high-amount, or timed-out claims.
4. Pay the customer first; recover from merchant PL insurance via settlements.
5. Mask and auto-delete PII after the retention window (GDPR).

**Non-goals (v1)**

- Live phone/ARS (warning ARS is specified as a state + webhook, not a telephony build)
- Health-authority filing automation (Tier 2 checklist + audit trail only)

---

## 2. Personas and tiers

| Tier | Owner | Owns | SLA |
|---|---|---|---|
| 0 System | Platform jobs | Amount/risk classify, auto-approve micro/medium, FDS gate | Instant |
| 1 Store / Merchant | Vendor dashboard | Micro & medium quality claims | **2 hours** to approve or dispute |
| 2 Platform CS & Legal | Admin + designated CR agent | High/major, safety, legal, FDS, Tier 1 timeout | 1 business day first response |

Bolt rider issues stay in CS chat (policy answers) unless they become a customer claim with money attached.

---

## 3. Claim authorization thresholds

Amounts are compared in **store charge currency**, then converted to EUR (and KRW for KR stores) with the **locked order FX snapshot**.

| Band | KR | EU | Typical issues | Who decides | Retrieval |
|---|---|---|---|---|---|
| **Micro** | ≤ ₩30,000 | ≤ €20 | Omission, partial damage, freshness (photo required) | Instant auto **or** merchant one-click | **No retrieval** (logistics cost > value) |
| **Medium** | ₩30,000–₩100,000 | €20–€50 | Full misdelivery, batch freshness | Platform auto-approve, merchant notified | Optional, not blocking refund |
| **High / Major** | > ₩100,000 | > €50 | Food poisoning, unlabeled allergen, legal threat, FDS blacklist | **Direct Tier 2** | Case-by-case; never auto-close safety cases |

**Market** = store country: `KR` vs `EU` (all current K-EuroMart cities are EU).  
If FX is stale (>24h) treat as High and send to Tier 2.

---

## 4. Issue taxonomy

| `issue_code` | Band hint | Photo | Skip Tier 1 |
|---|---|---|---|
| `omission` | Micro | Required | No |
| `partial_damage` | Micro | Required | No |
| `freshness` | Micro / Medium | Required | No |
| `full_misdelivery` | Medium | Recommended | No |
| `batch_freshness` | Medium | Required | No |
| `food_poisoning` | High | Medical certificate | **Yes** |
| `unlabeled_allergen` | High | Label photo | **Yes** |
| `legal_threat` | High | Optional | **Yes** |
| `change_of_mind` | N/A | Unopened proof | Policy reject if fresh/chilled/frozen |

Change-of-mind: **not refundable** for fresh/chilled/frozen. General goods: 7 days KR / **14 days EU**, unopened, **customer pays return shipping**.

---

## 5. Hybrid CS & escalation

```
file claim
  → FDS check (refund rate, blacklist)
  → classify band + issue
  → if high-risk or FDS-blocked → Tier 2 (escalations)
  → if micro/medium and FDS clean
        → if micro + photo OK → auto refund (no retrieval) AND notify merchant
        → if medium → platform auto-approve, notify merchant
        → merchant still has 2h to attach a dispute note (does not block customer payout)
  → if merchant silent 2h on a still-open Tier 1 item → escalate (timeout)
```

**Timeout:** `deadline_at = created_at + 2 hours`. Cron every 5 minutes (`sweep_claim_sla`).  
Timeout **does not reverse** a micro auto-refund already paid; it only escalates unpaid / disputed remainder and applies merchant penalty.

---

## 6. High-risk SOP (Tier 2)

### Food poisoning / safety
1. Halt SKU (`products.active = false`, all stores sharing barcode/SKU).
2. Require medical certificate (private storage, extra retention).
3. Pay customer from platform CGL; open settlement vs merchant PL.
4. Checklist: notify health authority (manual, logged).

### Unlabeled allergens
1. Emergency push + email recall to purchasers of that SKU (last 14 days).
2. 100% refund (order + delivery).
3. Audit merchant product DB (label, ingredients).

### Legal disputes
1. Single CR agent assignment (`escalations.assignee_id`).
2. Collect audit trail: claim logs, photos, chat, call metadata.
3. Settle with standard NDA / release agreement (PDF on settlement).

### Malicious abuse (FDS)
1. Detect **>30% refund rate** over 90 days (min 5 orders).
2. Block Tier 1 auto-approval for that user.
3. Show warning ARS / in-app warning (count `fds_logs.warning_count`).
4. After **3 warnings**: force disconnect (account hold), legal queue.

---

## 7. Insurance & money movement

| Party | Cover | Rule |
|---|---|---|
| Merchant | Product Liability, EU min **€1M–€2M** per directive | Must be `valid` to stay `store_status = active` |
| Platform | Commercial General Liability | **Pays customer first** |
| Recourse | `settlements` | Platform invoices merchant PL after payout |

Settlement states: `draft → invoiced → recovered → written_off`.

---

## 8. UI / UX specs

### 8.1 Customer (Orders + CS chat)

- Claim sheet: issue chips, amount preview, **photo required** for micro freshness/omission/damage.
- Copy: “€20 이하 신선/누락은 회수 없이 바로 환불됩니다.”
- High-risk: “식중독·알레르기 미표시는 플랫폼이 바로 접수합니다. 진단서/라벨 사진을 올려 주세요.”
- Change-of-mind on kimchi/frozen: hard stop, link to returns policy.
- GDPR: evidence download expiry 10 minutes (existing signed URLs); “we delete photos 24 months after the case closes.”

### 8.2 Merchant Tier 1 (`/vendor/claims`)

- Queue: **SLA countdown** (2:00:00 → 0). Red under 15 minutes.
- Micro already paid: banner “고객 환불 완료 — 이의를 남기면 정산에 반영됩니다.”
- Actions: Approve (ack), Dispute (note, not blocking if already paid), Upload counter-evidence.
- Cannot see medical certificates (Tier 2 only).
- Full routing playbook (bands, FDS, SOP): **`/ops/claims`** — vendor and admin only, not in customer Help Center.

### 8.3 Platform Tier 2 (`/admin` → Claims / Legal)

Tabs: **SLA breaches | High-risk | FDS | Settlements | Insurance**

- High-risk card: Halt SKU, Recall, Assign CR, Open settlement.
- FDS: refund rate, warnings 1/2/3, hold account.
- Masked customer: `김*호`, phone `+36 20 *** 12 34` unless CR role `legal_unmask` with reason log.

### 8.4 States (customer-visible)

`received` → `merchant_review` → `auto_refunded` | `platform_review` | `escalated` → `refunded` | `rejected` | `legal_hold`

---

## 9. Backend architecture

```
[App Router]
  fileClaim() ──► classifyClaim() ──► get_order_status / order FX
                      │
                      ├─ FDS gate
                      ├─ insert claims + claim_events
                      ├─ maybe insert escalations
                      └─ payout job → settlements
[Cron]
  /api/cron/sweep-claim-sla   every 5 min
  /api/cron/gdpr-retention    daily 05:00 UTC
```

**PII stores:** `claims` (description), `claim_evidence` (paths), `escalations.medical_cert_path`, chat transcripts.  
**Non-PII:** amounts, SKUs, routing decisions, penalty scores.

---

## 10. GDPR

| Data | Retention after case **closed** | Then |
|---|---|---|
| Claim description, address snapshot | 24 months | Mask to `redacted` |
| Evidence photos | 24 months | Delete storage object |
| Medical certificate | 36 months | Delete storage object |
| Call metadata | 6 months | Delete |
| FDS features (rates, not raw chat) | 24 months | Keep aggregated |
| Settlement / tax | 7 years | Keep, no customer photos |

- Lawful basis: contract + legal obligation (EU consumer / product liability).
- Right to access: export pack for the data subject (CR ticket).
- Unmask requires `legal_unmask` + `fds_logs`/`claim_events` reason.

---

## 11. Pseudocode (normative — see also `lib/claims-routing.ts`)

### Routing

```
function routeClaim(claim, userFds, fx):
  if claim.issue == change_of_mind and perishable:
    return REJECT, reason=CHANGE_OF_MIND_PERISHABLE
  if userFds.blacklisted or userFds.refundRate90d > 0.30:
    return TIER2, reason=FDS
  if claim.issue in {food_poisoning, unlabeled_allergen, legal_threat}:
    return TIER2, reason=HIGH_RISK
  band = amountBand(claim.amount, claim.currency, claim.market, fx)
  if band == HIGH or fxStale:
    return TIER2, reason=AMOUNT
  if band == MICRO and hasPhoto(claim):
    return TIER1_AUTO_PAY  # no retrieval
  if band == MEDIUM:
    return PLATFORM_AUTO_PAY
  return TIER1_WAIT  # merchant 2h
```

### SLA 2h timeout

```
every 5 minutes:
  for claim in open_tier1 where now() >= deadline_at:
    escalate(claim, reason=SLA_TIMEOUT)
    applyMerchantPenalty(claim.store, type=warning)
    notify Tier2 queue
```

### Penalty

```
function applyMerchantPenalty(store, event):
  points = { sla_timeout: 1, safety_incident: 10, allergen: 10, dispute_lost: 3 }
  store.penalty_score += points[event]
  if score >= 10: suspend listings
  elif score >= 3: rank_down
  else: warning
  # auto-refund already paid is NOT reversed
```

---

## 12. Acceptance criteria

- Micro EU ≤ €20 with photo refunds without waiting for merchant; bag is not collected.
- Merchant dashboard shows 2h countdown; at 0:00 claim appears in Tier 2 if still open.
- Food poisoning never lands in merchant queue.
- User with >30% refund rate cannot receive Tier 1 auto-approval.
- Photo files gone 24 months after close (job idempotent).
- Platform payout creates a `settlements` row in `draft`.
