-- Euromart core schema: cities → stores → products → FX → orders
-- Target: PostgreSQL (Supabase). Run after enabling auth.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'vendor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.store_status as enum ('pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'draft', 'awaiting_payment', 'paid', 'accepted',
    'preparing', 'ready', 'delivering', 'completed',
    'cancelled', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.discount_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.promo_placement as enum ('hero', 'store', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.location_source as enum ('ip', 'gps', 'manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'pending', 'requires_action', 'succeeded', 'failed', 'refunded'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'customer',
  preferred_currency char(3) not null default 'EUR',
  locale text not null default 'ko',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Geo + stores
-- ---------------------------------------------------------------------------
create table if not exists public.countries (
  code char(2) primary key,
  name_en text not null,
  name_ko text,
  default_currency char(3) not null
);

create table if not exists public.currencies (
  code char(3) primary key,
  locale text not null,
  decimals smallint not null default 2 check (decimals between 0 and 4)
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references public.countries (code),
  slug text not null unique,
  name_en text not null,
  name_ko text,
  lat double precision,
  lng double precision,
  timezone text not null default 'Europe/Budapest',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_locations (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  city_id uuid references public.cities (id),
  lat double precision,
  lng double precision,
  source public.location_source not null default 'manual',
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id),
  slug text not null unique,
  name text not null,
  name_en text,
  description text,
  currency_code char(3) not null references public.currencies (code),
  address text not null,
  phone text,
  lat double precision,
  lng double precision,
  hours jsonb not null default '{}'::jsonb,
  cover_image text,
  logo text,
  delivery_fee numeric(12, 2) not null default 0,
  min_order numeric(12, 2) not null default 0,
  status public.store_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stores_city_status_idx
  on public.stores (city_id, status);

create table if not exists public.store_vendors (
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  vendor_role text not null default 'owner' check (vendor_role in ('owner', 'staff')),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id text primary key,
  slug text not null unique,
  name_ko text not null,
  name_en text not null,
  sort int not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  category_id text references public.categories (id),
  name text not null,
  name_en text,
  description text,
  unit text,
  brand text,
  price numeric(14, 4) not null check (price >= 0),
  sale_price numeric(14, 4) check (sale_price is null or sale_price >= 0),
  stock int not null default 0 check (stock >= 0),
  image_url text,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_store_active_idx
  on public.products (store_id, active);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  title text not null,
  banner_url text,
  discount_type public.discount_type not null default 'percent',
  discount_value numeric(12, 4) not null check (discount_value >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  placement public.promo_placement not null default 'store',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists promotions_window_idx
  on public.promotions (store_id, starts_at, ends_at)
  where active;

-- ---------------------------------------------------------------------------
-- FX
-- ---------------------------------------------------------------------------
create table if not exists public.exchange_rates (
  base_currency char(3) not null references public.currencies (code),
  target_currency char(3) not null references public.currencies (code),
  rate numeric(18, 8) not null check (rate > 0),
  source text not null default 'frankfurter',
  fetched_at timestamptz not null default now(),
  primary key (base_currency, target_currency),
  check (base_currency <> target_currency)
);

-- ---------------------------------------------------------------------------
-- Checkout quote lock (15 min)
-- ---------------------------------------------------------------------------
create table if not exists public.checkout_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  store_id uuid not null references public.stores (id),
  store_currency char(3) not null,
  charge_currency char(3) not null,
  fx_rate numeric(18, 8) not null,
  fx_fetched_at timestamptz not null,
  subtotal_store numeric(14, 4) not null,
  delivery_fee_store numeric(14, 4) not null default 0,
  total_charge numeric(14, 4) not null,
  items jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders + payments
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  store_id uuid not null references public.stores (id),
  quote_id uuid references public.checkout_quotes (id),
  status public.order_status not null default 'awaiting_payment',
  store_currency char(3) not null,
  charge_currency char(3) not null,
  fx_rate numeric(18, 8) not null,
  fx_fetched_at timestamptz not null,
  subtotal_store numeric(14, 4) not null,
  delivery_fee_store numeric(14, 4) not null default 0,
  total_charge numeric(14, 4) not null,
  customer_name text not null,
  address text not null,
  phone text not null,
  notes text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_store_idx on public.orders (store_id, status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name_snapshot text not null,
  quantity int not null check (quantity > 0),
  unit_price_store numeric(14, 4) not null,
  unit_price_charge numeric(14, 4) not null,
  line_total_store numeric(14, 4) not null,
  line_total_charge numeric(14, 4) not null
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'stripe',
  provider_ref text,
  amount numeric(14, 4) not null,
  currency char(3) not null,
  status public.payment_status not null default 'pending',
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_provider_ref_uidx
  on public.payments (provider, provider_ref)
  where provider_ref is not null;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists stores_updated_at on public.stores;
create trigger stores_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Effective unit price in store currency (sale_price or active promo)
create or replace function public.product_effective_price(p public.products)
returns numeric
language sql
stable
as $$
  select coalesce(
    (
      select case pr.discount_type
        when 'percent' then round(p.price * (1 - pr.discount_value / 100.0), 4)
        when 'fixed' then greatest(p.price - pr.discount_value, 0)
      end
      from public.promotions pr
      where pr.active
        and pr.product_id = p.id
        and now() between pr.starts_at and pr.ends_at
      order by case pr.discount_type
        when 'percent' then p.price * pr.discount_value / 100.0
        else pr.discount_value
      end desc
      limit 1
    ),
    p.sale_price,
    p.price
  );
$$;

-- Cross rate via EUR base when direct pair missing
create or replace function public.get_fx_rate(p_from char(3), p_to char(3))
returns table (rate numeric, fetched_at timestamptz)
language plpgsql
stable
as $$
declare
  r numeric;
  ts timestamptz;
  a numeric;
  b numeric;
  ta timestamptz;
  tb timestamptz;
begin
  if p_from = p_to then
    return query select 1::numeric, now();
    return;
  end if;

  select er.rate, er.fetched_at into r, ts
  from public.exchange_rates er
  where er.base_currency = p_from and er.target_currency = p_to;

  if found then
    return query select r, ts;
    return;
  end if;

  -- inverse
  select er.rate, er.fetched_at into r, ts
  from public.exchange_rates er
  where er.base_currency = p_to and er.target_currency = p_from;

  if found then
    return query select round(1 / r, 8), ts;
    return;
  end if;

  -- via EUR
  select er.rate, er.fetched_at into a, ta
  from public.exchange_rates er
  where er.base_currency = 'EUR' and er.target_currency = p_from;

  select er.rate, er.fetched_at into b, tb
  from public.exchange_rates er
  where er.base_currency = 'EUR' and er.target_currency = p_to;

  if a is not null and b is not null then
    return query select round(b / a, 8), least(ta, tb);
    return;
  end if;

  raise exception 'FX rate not available for % → %', p_from, p_to;
end;
$$;

-- ---------------------------------------------------------------------------
-- Seed currencies / sample countries (safe upserts)
-- ---------------------------------------------------------------------------
insert into public.currencies (code, locale, decimals) values
  ('EUR', 'de-DE', 2),
  ('HUF', 'hu-HU', 0),
  ('CZK', 'cs-CZ', 2),
  ('SEK', 'sv-SE', 2),
  ('PLN', 'pl-PL', 2),
  ('GBP', 'en-GB', 2),
  ('USD', 'en-US', 2)
on conflict (code) do nothing;

insert into public.countries (code, name_en, name_ko, default_currency) values
  ('HU', 'Hungary', '헝가리', 'HUF'),
  ('CZ', 'Czechia', '체코', 'CZK'),
  ('SE', 'Sweden', '스웨덴', 'SEK'),
  ('DE', 'Germany', '독일', 'EUR'),
  ('FR', 'France', '프랑스', 'EUR'),
  ('PL', 'Poland', '폴란드', 'PLN'),
  ('GB', 'United Kingdom', '영국', 'GBP')
on conflict (code) do nothing;

insert into public.cities (country_code, slug, name_en, name_ko, lat, lng, timezone)
values
  ('HU', 'budapest', 'Budapest', '부다페스트', 47.4979, 19.0402, 'Europe/Budapest'),
  ('CZ', 'prague', 'Prague', '프라하', 50.0755, 14.4378, 'Europe/Prague'),
  ('DE', 'berlin', 'Berlin', '베를린', 52.5200, 13.4050, 'Europe/Berlin'),
  ('SE', 'stockholm', 'Stockholm', '스톡홀름', 59.3293, 18.0686, 'Europe/Stockholm')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- RLS (enable; policies are role-aware)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_vendors enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.checkout_quotes enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.cities enable row level security;
alter table public.countries enable row level security;
alter table public.currencies enable row level security;
alter table public.categories enable row level security;
alter table public.user_locations enable row level security;

-- Public read catalogs
create policy cities_read on public.cities for select using (active = true);
create policy countries_read on public.countries for select using (true);
create policy currencies_read on public.currencies for select using (true);
create policy categories_read on public.categories for select using (true);
create policy fx_read on public.exchange_rates for select using (true);
create policy stores_public_read on public.stores for select using (status = 'active');
create policy products_public_read on public.products for select using (
  active = true and exists (
    select 1 from public.stores s where s.id = store_id and s.status = 'active'
  )
);
create policy promotions_public_read on public.promotions for select using (
  active = true and now() between starts_at and ends_at
);

create policy profiles_self on public.profiles
  for select using (auth.uid() = id);
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id);

create policy user_locations_self on public.user_locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.is_store_vendor(p_store uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_vendors sv
    where sv.store_id = p_store
      and sv.user_id = auth.uid()
      and sv.approved_at is not null
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create policy products_vendor_write on public.products
  for all using (public.is_store_vendor(store_id) or public.is_admin())
  with check (public.is_store_vendor(store_id) or public.is_admin());

create policy promotions_vendor_write on public.promotions
  for all using (public.is_store_vendor(store_id) or public.is_admin())
  with check (public.is_store_vendor(store_id) or public.is_admin());

create policy orders_customer_read on public.orders
  for select using (auth.uid() = user_id or public.is_store_vendor(store_id) or public.is_admin());

create policy order_items_read on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_store_vendor(o.store_id) or public.is_admin())
    )
  );
