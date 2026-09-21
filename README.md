# K-EuroMart

유럽 주요 도시에서 한국 식료품을 현지 통화로 주문하는 배달 스토어프론트입니다.

Official domain: [k-euromart.com](https://k-euromart.com) (Spaceship 등록됨. 앱에 연결하려면 DNS를 배포 호스트로 바꿔야 합니다.)  
Source: [cursor.com/codebase/mjtkd123/euromart](https://cursor.com/codebase/mjtkd123/euromart)

Shoppers pick a city and store (Budapest, Berlin, Paris, Vienna, Prague, and more), browse Korean groceries, and check out with dual-currency prices (store currency + EUR). Vendors manage listings and orders. Admins manage regions, users, FX rates, and claims.

Supabase가 설정되지 않으면 `lib/demo-regions.ts` 카탈로그로 동작합니다. 결제·로그인 없이 매장과 상품을 둘러볼 수 있습니다.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, shadcn/ui
- Supabase (auth + Postgres) — optional for demo
- Stripe Payment Intents — optional for demo
- Frankfurter / ECB FX sync

## Run locally

```bash
pnpm install
pnpm dev -- --hostname 127.0.0.1 --port 43147
```

또는:

```bash
npm install
npx next dev --hostname 127.0.0.1 --port 43147
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

## Optional environment

Copy these only if you want live auth, catalog, and checkout. Without them the demo catalog still loads.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://k-euromart.com
RESEND_API_KEY=
MAIL_FROM=K-EuroMart <noreply@k-euromart.com>
```

FX and payment flow is documented in `docs/architecture-fx-payments.md`.

## CS chatbot (Bolt delivery)

The Help Center and storefront include a 1:1 CS chat that follows the mart × Bolt support policy. It looks up demo orders with `get_order_status` (try **KEM-12345**) and hands complex refunds to a human form.

Open `/help/contact` or the **상담하기** button on the shop.

## Accounts (customer / owner / admin)

Login and signup are **fully separated by role**. See `docs/auth-roles.md`.

| Who | Signup | Login | Home |
|---|---|---|---|
| 일반 회원 (`customer`) | `/auth/sign-up` | `/auth/login` | `/account` |
| 업주 파트너 (`owner`) | `/owner` 랜딩 · `/owner/signup` (승인 전까지 pending) | `/owner/login` | `/owner/dashboard` |
| 플랫폼 관리자 (`admin`) | 없음 (시드 전용) | `/admin/login` | `/admin/dashboard` |

Demo passwords (bcrypt in `.data/tenant-auth.json`):

- 회원 `customer@k-euromart.demo` / `EuroMart-Customer-2026!`
- 업주 `owner.vienna@k-euromart.demo` / `EuroMart-Owner-2026!` (비엔나 1호점만)
- 본부 `admin@k-euromart.demo` / `EuroMart-Admin-2026!`

First login with a HQ-issued temp password must change it at `/auth/change-password`.
Old `/vendor/login` URLs redirect to `/owner/login`.


## Hybrid CS, claims & insurance

Claim routing (micro / medium / high, 2-hour merchant SLA, food-safety Tier 2, FDS, GDPR retention) is specified in `docs/prd-hybrid-cs-claims.md`.

- Schema: `supabase/migrations/20260916_hybrid_cs_claims.sql` (`claims`, `escalations`, `settlements`, `fds_logs`)
- Engine: `lib/claims-routing.ts`
- Preview (staff only): `/ops/claims` — owner and admin. Hidden from the customer Help Center. Unauthenticated visits redirect to `/owner/login`.
- Crons (Bearer `CRON_SECRET`): `/api/cron/sweep-claim-sla` every 5 minutes, `/api/cron/gdpr-retention` daily 05:00 UTC

```bash
pnpm test:claims
```
