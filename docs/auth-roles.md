# Split auth: customer · owner · admin

K-EuroMart keeps **three isolated login/signup systems**. A role on `profiles.role` (or the demo directory) is one of:

| Role | Who | Public signup | Login | After login |
|---|---|---|---|---|
| `customer` | Shopper | Yes — `/auth/sign-up` | `/auth/login` | `/account` (mypage) |
| `owner` | Store partner | Yes — `/owner` landing + `/owner/signup`. Status is **`pending` until Super Admin approves** | `/owner/login` or landing modal | `/owner/dashboard` |
| `admin` | Platform HQ | **No.** Seed / Super Admin issuance only | `/admin/login` | `/admin/dashboard` |

Legacy DB value `vendor` is treated as `owner`.

## Middleware

`middleware.ts` plus `requireCustomer` / `requireStoreOwner` / `requireSuperAdmin`:

- Unauthenticated visits to a gated area go to **that group’s login**.
- The wrong role hitting another group’s page is sent to `/forbidden` (403 UI).
- `/owner` is a public partner landing (login + apply CTAs). `/owner/dashboard` stays gated.
- Pending owners cannot open `/owner/dashboard`; they stay on `/owner/pending`.
- `/vendor/*` URLs redirect to `/owner/*` so old bookmarks keep working.

## Demo accounts (no Supabase)

| Portal | Email | Password |
|---|---|---|
| Customer | `customer@k-euromart.demo` | `EuroMart-Customer-2026!` |
| Owner (Vienna 1호점) | `owner.vienna@k-euromart.demo` | `EuroMart-Owner-2026!` |
| Admin (seed only) | `admin@k-euromart.demo` | `EuroMart-Admin-2026!` |

Passwords are stored as bcrypt hashes in `.data/tenant-auth.json`. The HQ UI never reads plaintext.

## APIs

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login` | Body `{ email, password, portal: "customer" \| "owner" \| "admin" }` |
| POST | `/api/auth/customer/signup` | Forces `role=customer` |
| POST | `/api/auth/owner/signup` | Creates owner + application, `accountStatus=pending` |
| POST | `/api/admin/applications/:id/approve` | Super Admin — activate a self-signup owner |
| POST | `/api/admin/applications/:id/reject` | Super Admin |
| POST | `/api/admin/stores/create` | Super Admin — offline issuance + one-time temp password |

There is **no** `/admin/signup` route.

## Schema

See `supabase/migrations/20260921_split_auth_roles.sql`.

- `profiles.role` — `customer` \| `owner` \| `admin` (`vendor` still in the enum for old rows)
- `profiles.account_status` — `pending` \| `active` \| `rejected`
- `store_applications.owner_user_id`, `source` (`offline` \| `self_signup`)
