# Vendor tenant admin (manual account issuance)

See also **`docs/auth-roles.md`** — customer, owner, and admin logins are split.

Store owners may submit `/owner/signup` (pending until Super Admin approves) **or** Super Admin issues a store + owner account after offline documents.

## Access

| Actor | Login | Data |
|---|---|---|
| Customer | `/auth/login` · `/auth/sign-up` | Own orders; mypage `/account` |
| Store owner (`owner`, legacy `vendor`) | `/owner/login` · `/owner/signup` | Own `store_id` only · `/owner/dashboard` |
| Super Admin (`admin`) | `/admin/login` (no public signup) | All stores; **cannot read plaintext passwords** · `/admin/dashboard` |

Public domain: `k-euromart.com`. Support copy uses `support@k-euromart.com` / `privacy@k-euromart.com`. Real delivery needs MX (or Resend) plus `RESEND_API_KEY` and `MAIL_FROM=K-EuroMart <noreply@k-euromart.com>`.

Demo HQ login (not a real mailbox): `admin@k-euromart.demo` / `EuroMart-Admin-2026!`  
Demo store owner (Vienna 1호점 only): `owner.vienna@k-euromart.demo` / `EuroMart-Owner-2026!`

## Schema (Postgres)

See `supabase/migrations/20260917_vendor_tenant_auth.sql` and `supabase/migrations/20260921_split_auth_roles.sql`.

- `stores` — `id`, `name`, `business_number`, `status` (`pending` / `active` / `inactive`)
- `profiles` — `id`, `email`, `role` (`customer` / `owner` / `admin`), `account_status`, `must_change_password` (no password column)
- `store_vendors` — `(store_id, user_id)` tenant membership
- `store_applications` — document queue
- `auth_action_tokens` — SHA-256 of invite/reset secrets

Passwords: **bcrypt** (cost 12) via GoTrue (`auth.users`) in production, or `bcryptjs` in the demo directory. Super Admin never has a select path to a plaintext password.

Temporary passwords are 16-character unambiguous alphanumerics (no `+`, `O`, `0`, `I`, `l`, `1`). The issuer UI copies them as selectable text; the hash is verified against the same string before the row is saved.

## APIs

| Method | Path | Who |
|---|---|---|
| POST | `/api/admin/stores/create` | Super Admin — create store + owner, return temp password **once** |
| POST | `/api/auth/login` | `{ email, password, portal }`; owner `mustChangePassword` → `/auth/change-password` |
| POST | `/api/auth/change-password` | Authenticated owner |
| POST | `/api/auth/reset-password-request` | Public; does not reveal whether the email exists |
| GET | `/api/vendor/stores/:storeId` | Owner; **403 if `store_id` mismatch** |

## Tenant middleware

`lib/tenant-guard.ts` → `assertStoreAccess(actor, targetStoreId)`.

`middleware.ts` forces `/auth/change-password` while `mustChangePassword` is true. On that first login the current (temporary) password is **not** re-checked — the session already proved possession. Later password changes still require the current password.

## UI

- Super Admin: `/admin/dashboard` → **입점 심사 · 계정 발급**
- Owner login: `/owner/login` (forgot-password link)
- Owner signup: `/owner/signup` (pending until approval)
- First login: `/auth/change-password` (mandatory for HQ-issued temp passwords)
