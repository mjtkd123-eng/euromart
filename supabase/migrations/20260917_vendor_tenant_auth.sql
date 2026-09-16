-- Vendor tenant onboarding: Super Admin issues store + owner accounts.
-- Passwords live in auth.users (bcrypt via GoTrue) or, in demo, bcrypt hashes in the app directory.
-- profiles never stores a plaintext or recoverable password.

create extension if not exists "pgcrypto";

do $$ begin
  alter type public.store_status add value if not exists 'inactive';
exception when duplicate_object then null; end $$;

alter table public.stores
  add column if not exists business_number text,
  add column if not exists legal_name text,
  add column if not exists onboarding_notes text;

alter table public.profiles
  add column if not exists must_change_password boolean not null default false,
  add column if not exists password_changed_at timestamptz;

-- Offline document intake reviewed by Super Admin
create table if not exists public.store_applications (
  id uuid primary key default gen_random_uuid(),
  store_name text not null,
  legal_name text,
  business_number text not null,
  city_id uuid references public.cities (id),
  city_slug text,
  contact_email text not null,
  contact_name text,
  documents_note text,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_store_id uuid references public.stores (id),
  created_at timestamptz not null default now()
);

create index if not exists store_applications_status_idx
  on public.store_applications (status, created_at desc);

-- Invite / reset tokens — SHA-256 of the secret, never the secret itself
create table if not exists public.auth_action_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  purpose text not null check (purpose in ('invite', 'password_reset')),
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists auth_action_tokens_hash_idx
  on public.auth_action_tokens (token_hash)
  where used_at is null;

alter table public.store_applications enable row level security;
alter table public.auth_action_tokens enable row level security;

drop policy if exists store_applications_admin on public.store_applications;
create policy store_applications_admin on public.store_applications
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists auth_tokens_admin on public.auth_action_tokens;
create policy auth_tokens_admin on public.auth_action_tokens
  for all using (public.is_admin()) with check (public.is_admin());

-- Store owners may update their own store row only
drop policy if exists stores_vendor_update on public.stores;
create policy stores_vendor_update on public.stores
  for update using (public.is_store_vendor(id) or public.is_admin())
  with check (public.is_store_vendor(id) or public.is_admin());

drop policy if exists stores_vendor_select on public.stores;
create policy stores_vendor_select on public.stores
  for select using (
    status = 'active'
    or public.is_store_vendor(id)
    or public.is_admin()
  );
