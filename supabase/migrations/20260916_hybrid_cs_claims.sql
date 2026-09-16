-- Hybrid CS claims, escalations, settlements, FDS logs, GDPR retention
-- K-EuroMart. Safe to apply after 20260811_euromart_core.sql
-- Core schema has no claims table; this is the claims source of truth.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.claim_market as enum ('EU', 'KR');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.claim_band as enum ('micro', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.claim_issue as enum (
    'omission', 'partial_damage', 'freshness',
    'full_misdelivery', 'batch_freshness',
    'food_poisoning', 'unlabeled_allergen', 'legal_threat',
    'change_of_mind'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.claim_tier as enum ('system', 'tier1_merchant', 'tier2_platform');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.claim_lifecycle as enum (
    'received', 'merchant_review', 'auto_refunded',
    'platform_review', 'escalated', 'refunded', 'rejected', 'legal_hold'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.escalation_reason as enum (
    'sla_timeout', 'amount', 'high_risk', 'fds', 'merchant_dispute', 'legal'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.settlement_status as enum (
    'draft', 'invoiced', 'recovered', 'written_off'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fds_action as enum (
    'flag_rate', 'block_auto', 'warning', 'force_disconnect', 'unmask'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.penalty_event as enum (
    'sla_timeout', 'safety_incident', 'allergen', 'dispute_lost'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Merchant PL insurance (gate for active stores) + penalty score
-- ---------------------------------------------------------------------------
alter table public.stores
  add column if not exists penalty_score int not null default 0;

create table if not exists public.merchant_insurance (
  store_id uuid primary key references public.stores (id) on delete cascade,
  pl_carrier text,
  pl_coverage_eur numeric(14, 2) not null default 1000000
    check (pl_coverage_eur >= 1000000),
  pl_expires_at date,
  valid boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.store_penalty_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  claim_id uuid,
  event public.penalty_event not null,
  points int not null,
  score_after int not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Claims (money + routing). PII: description, user_id
-- ---------------------------------------------------------------------------
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  order_item_id uuid references public.order_items (id) on delete set null,
  user_id uuid not null references public.profiles (id),
  store_id uuid not null references public.stores (id),
  market public.claim_market not null default 'EU',
  issue public.claim_issue not null,
  band public.claim_band not null,
  tier public.claim_tier not null default 'tier1_merchant',
  lifecycle public.claim_lifecycle not null default 'received',
  refund_amount numeric(14, 4) not null check (refund_amount >= 0),
  currency char(3) not null,
  amount_eur numeric(14, 4),
  fx_rate numeric(18, 8),
  description text,
  description_masked boolean not null default false,
  photo_required boolean not null default true,
  photo_count int not null default 0,
  retrieval_required boolean not null default false,
  fds_blocked boolean not null default false,
  sla_deadline_at timestamptz not null,
  closed_at timestamptz,
  pii_purge_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists claims_sla_open_idx
  on public.claims (sla_deadline_at)
  where lifecycle in ('received', 'merchant_review');

create index if not exists claims_user_idx on public.claims (user_id, created_at desc);
create index if not exists claims_store_idx on public.claims (store_id, lifecycle);
create index if not exists claims_purge_idx
  on public.claims (pii_purge_after)
  where description_masked = false and closed_at is not null;

create table if not exists public.claim_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.claim_evidence (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  storage_path text not null,
  kind text not null default 'photo'
    check (kind in ('photo', 'medical_cert', 'label', 'other')),
  created_at timestamptz not null default now()
);

create index if not exists claim_evidence_claim_idx on public.claim_evidence (claim_id);

-- ---------------------------------------------------------------------------
-- Escalations (Tier 2)
-- ---------------------------------------------------------------------------
create table if not exists public.escalations (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  reason public.escalation_reason not null,
  assignee_id uuid references public.profiles (id),
  sku_halted boolean not null default false,
  recall_sent_at timestamptz,
  medical_cert_path text,
  legal_hold boolean not null default false,
  notes_masked boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists escalations_open_idx
  on public.escalations (created_at desc)
  where resolved_at is null;

-- ---------------------------------------------------------------------------
-- Settlements (platform pays customer, recourses merchant PL)
-- ---------------------------------------------------------------------------
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.claims (id),
  store_id uuid not null references public.stores (id),
  customer_payout numeric(14, 4) not null,
  currency char(3) not null,
  payout_at timestamptz,
  recourse_amount numeric(14, 4),
  status public.settlement_status not null default 'draft',
  nda_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FDS
-- ---------------------------------------------------------------------------
create table if not exists public.fds_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  action public.fds_action not null,
  refund_rate numeric(6, 4),
  order_count int,
  warning_count int not null default 0,
  reason text,
  actor_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists fds_logs_user_idx on public.fds_logs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.claims_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists claims_updated_at on public.claims;
create trigger claims_updated_at
  before update on public.claims
  for each row execute function public.claims_set_updated_at();

create or replace function public.apply_merchant_penalty(
  p_store uuid,
  p_claim uuid,
  p_event public.penalty_event
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  pts int;
  new_score int;
begin
  pts := case p_event
    when 'sla_timeout' then 1
    when 'dispute_lost' then 3
    when 'safety_incident' then 10
    when 'allergen' then 10
  end;

  update public.stores
     set penalty_score = penalty_score + pts
   where id = p_store
   returning penalty_score into new_score;

  insert into public.store_penalty_events (store_id, claim_id, event, points, score_after)
  values (p_store, p_claim, p_event, pts, new_score);

  -- 10+ suspend listings; 3+ rank-down is scored only (search uses penalty_score)
  if new_score >= 10 then
    update public.products set active = false where store_id = p_store;
  end if;

  return new_score;
end;
$$;

-- SLA sweep: Tier 1 open past deadline → escalate + 1 penalty point
create or replace function public.sweep_claim_sla()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
  rec record;
begin
  for rec in
    select id, store_id
    from public.claims
    where lifecycle in ('received', 'merchant_review')
      and tier = 'tier1_merchant'
      and sla_deadline_at <= now()
  loop
    update public.claims
       set tier = 'tier2_platform',
           lifecycle = 'escalated'
     where id = rec.id;

    insert into public.escalations (claim_id, reason)
    select rec.id, 'sla_timeout'
    where not exists (
      select 1 from public.escalations e
      where e.claim_id = rec.id and e.reason = 'sla_timeout'
    );

    insert into public.claim_events (claim_id, event, payload)
    values (rec.id, 'sla_timeout', jsonb_build_object('hours', 2));

    perform public.apply_merchant_penalty(rec.store_id, rec.id, 'sla_timeout');

    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Paths due for GDPR photo deletion (cron deletes Storage objects, then purge)
create or replace function public.gdpr_evidence_paths_due()
returns table (storage_path text)
language sql
security definer
set search_path = public
as $$
  select e.storage_path
  from public.claim_evidence e
  join public.claims c on c.id = e.claim_id
  where c.pii_purge_after is not null
    and c.pii_purge_after <= now();
$$;

-- GDPR: mask + drop evidence after retention
create or replace function public.gdpr_purge_closed_claims()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
begin
  update public.claims
     set description = 'redacted',
         description_masked = true
   where closed_at is not null
     and pii_purge_after is not null
     and pii_purge_after <= now()
     and description_masked = false;

  get diagnostics n = row_count;

  delete from public.claim_evidence e
   using public.claims c
   where e.claim_id = c.id
     and c.pii_purge_after is not null
     and c.pii_purge_after <= now();

  update public.escalations
     set notes = 'redacted',
         notes_masked = true,
         medical_cert_path = null
   where (resolved_at is not null and resolved_at < now() - interval '36 months')
      or (
        medical_cert_path is not null
        and exists (
          select 1 from public.claims c
          where c.id = claim_id
            and c.issue = 'food_poisoning'
            and c.closed_at is not null
            and c.closed_at < now() - interval '36 months'
        )
      );

  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.claims enable row level security;
alter table public.claim_events enable row level security;
alter table public.claim_evidence enable row level security;
alter table public.escalations enable row level security;
alter table public.settlements enable row level security;
alter table public.fds_logs enable row level security;
alter table public.merchant_insurance enable row level security;
alter table public.store_penalty_events enable row level security;

drop policy if exists claims_self_read on public.claims;
create policy claims_self_read on public.claims
  for select using (auth.uid() = user_id or public.is_admin() or public.is_store_vendor(store_id));

drop policy if exists claim_events_read on public.claim_events;
create policy claim_events_read on public.claim_events
  for select using (
    exists (
      select 1 from public.claims c
      where c.id = claim_id
        and (c.user_id = auth.uid() or public.is_admin() or public.is_store_vendor(c.store_id))
    )
  );

drop policy if exists claim_evidence_read on public.claim_evidence;
create policy claim_evidence_read on public.claim_evidence
  for select using (
    exists (
      select 1 from public.claims c
      where c.id = claim_id
        and (c.user_id = auth.uid() or public.is_admin() or public.is_store_vendor(c.store_id))
    )
  );

drop policy if exists escalations_admin on public.escalations;
create policy escalations_admin on public.escalations
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists settlements_admin on public.settlements;
create policy settlements_admin on public.settlements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists fds_admin on public.fds_logs;
create policy fds_admin on public.fds_logs
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists insurance_vendor_read on public.merchant_insurance;
create policy insurance_vendor_read on public.merchant_insurance
  for select using (public.is_admin() or public.is_store_vendor(store_id));

drop policy if exists penalty_vendor_read on public.store_penalty_events;
create policy penalty_vendor_read on public.store_penalty_events
  for select using (public.is_admin() or public.is_store_vendor(store_id));
