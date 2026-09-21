-- Split auth: profiles.role is customer | owner | admin.
-- Legacy enum value `vendor` remains for existing rows; the app maps it to owner.

do $$ begin
  alter type public.user_role add value if not exists 'owner';
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists account_status text not null default 'active';

do $$ begin
  alter table public.profiles
    add constraint profiles_account_status_check
    check (account_status in ('pending', 'active', 'rejected'));
exception when duplicate_object then null; end $$;

alter table public.store_applications
  add column if not exists owner_user_id uuid references public.profiles (id),
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists source text not null default 'offline';

create index if not exists store_applications_owner_idx
  on public.store_applications (owner_user_id);

-- Owners may insert their own online application (pending until Super Admin approval).
drop policy if exists store_applications_owner_insert on public.store_applications;
create policy store_applications_owner_insert on public.store_applications
  for insert
  with check (
    owner_user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role::text in ('owner', 'vendor')
        and p.account_status = 'pending'
    )
  );

drop policy if exists store_applications_owner_select on public.store_applications;
create policy store_applications_owner_select on public.store_applications
  for select using (
    public.is_admin()
    or owner_user_id = auth.uid()
  );

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text in ('owner', 'vendor')
      and p.account_status = 'active'
  );
$$;

create or replace function public.is_store_vendor(p_store uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_vendors sv
    join public.profiles p on p.id = sv.user_id
    where sv.store_id = p_store
      and sv.user_id = auth.uid()
      and sv.approved_at is not null
      and p.role::text in ('owner', 'vendor')
      and p.account_status = 'active'
  );
$$;

-- Existing `vendor` rows stay readable via role::text in ('owner', 'vendor').
-- New accounts write `owner`. The app canonicalizes vendor → owner.
