# Vendor tenant admin (manual account issuance)

K-EuroMart store owners do **not** self-register. Super Admin reviews offline onboarding documents, then issues a store + owner account.

## Access

| Actor | Login | Data |
|---|---|---|
| Customer | `/auth/login` · `/auth/sign-up` | Own orders only |
| Store owner (`vendor` / STORE_OWNER) | `/vendor/login` | Own `store_id` only |
| Super Admin (`admin`) | `/vendor/login` | All stores; **cannot read plaintext passwords** |

Demo HQ: `admin@k-euromart.demo` / `EuroMart-Admin-2026!`

## Schema (Postgres)

See `supabase/migrations/20260917_vendor_tenant_auth.sql`.

- `stores` — `id`, `name`, `business_number`, `status` (`pending` / `active` / `inactive`)
- `profiles` — `id`, `email`, `role`, `must_change_password` (no password column)
- `store_vendors` — `(store_id, user_id)` tenant membership
- `store_applications` — document queue
- `auth_action_tokens` — SHA-256 of invite/reset secrets

Passwords: **bcrypt** (cost 12) via GoTrue (`auth.users`) in production, or `bcryptjs` in the demo directory. Super Admin never has a select path to a plaintext password.

## APIs

| Method | Path | Who |
|---|---|---|
| POST | `/api/admin/stores/create` | Super Admin — create store + owner, return temp password **once** |
| POST | `/api/auth/login` | Owner / admin; `mustChangePassword` → `/auth/change-password` |
| POST | `/api/auth/change-password` | Authenticated owner |
| POST | `/api/auth/reset-password-request` | Public; does not reveal whether the email exists |
| GET | `/api/vendor/stores/:storeId` | Owner; **403 if `store_id` mismatch** |

## Tenant middleware

`lib/tenant-guard.ts` → `assertStoreAccess(actor, targetStoreId)`.

`middleware.ts` forces `/auth/change-password` while `mustChangePassword` is true.

## UI

- Super Admin: `/admin` → **입점 심사 · 계정 발급**
- Owner login: `/vendor/login` (forgot-password link)
- First login: `/auth/change-password` (mandatory)
