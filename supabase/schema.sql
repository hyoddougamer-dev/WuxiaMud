-- ============================================================================
-- Ninefold 九重 — week one: accounts and an authoritative clock.
--
-- The single security property this file exists to guarantee:
--   a player can READ their cultivator and can never WRITE it.
-- Every mutation goes through an edge function that owns the clock and the dice.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- cultivators
create table if not exists public.cultivators (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  created_at            timestamptz not null default now(),

  path                  text not null check (path in ('sword','blade')),
  realm                 int  not null default 1 check (realm between 1 and 9),
  qi                    double precision not null default 0 check (qi >= 0),
  insight               int  not null default 0 check (insight >= 0),
  turmoil               double precision not null default 0 check (turmoil between 0 and 100),
  settling              boolean not null default false,

  learned               text[] not null default '{}',
  equipped              text[] not null default '{}',
  flame                 text,
  seen_beasts           text[] not null default '{}',
  satchel               jsonb not null default '{}'::jsonb,
  pills                 jsonb not null default '{}'::jsonb,
  pill_primed           boolean not null default false,

  -- The clock. Only the server ever writes these, which is the whole point.
  last_seen_at          timestamptz not null default now(),
  last_opened_at        timestamptz not null default now(),
  last_breakthrough_at  timestamptz not null default now(),
  injured_until         timestamptz,
  hunt_ready_at         timestamptz,

  total_breakthroughs   int not null default 0,
  failed_tribulations   int not null default 0,
  active_seconds        double precision not null default 0,

  -- Ready for the line; unused until week four.
  master_id             uuid references public.cultivators(id) on delete set null,
  seat_count            int not null default 0 check (seat_count between 0 and 2),

  unique (user_id)
);

create index if not exists cultivators_master_idx on public.cultivators(master_id);

-- --------------------------------------------------------- action idempotency
--
-- CORRECTION to the published plan, found while writing it. That plan had a
-- `ticks(cultivator_id, tick_at)` table so the same second could not be paid twice.
-- It is not needed: `advance()` credits the window between last_seen_at and now,
-- and last_seen_at only ever moves forward, so a replayed tick credits ~0 by
-- construction. Two ticks racing is harmless.
--
-- The real replay risk is ACTIONS. A flaky network retrying "hunt" must not produce
-- two piles of loot. So the key is the client's nonce, not the second.
create table if not exists public.applied_actions (
  cultivator_id uuid not null references public.cultivators(id) on delete cascade,
  nonce         text not null check (length(nonce) between 8 and 64),
  applied_at    timestamptz not null default now(),
  primary key (cultivator_id, nonce)
);

-- Nonces older than a day cannot be replayed usefully; keep the table small.
create index if not exists applied_actions_age_idx on public.applied_actions(applied_at);

-- ------------------------------------------------------------ the line (ready)
create table if not exists public.inheritances (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.cultivators(id) on delete cascade,
  author_name   text not null,
  seal          text not null check (char_length(seal) = 1),
  technique_id  text not null,
  created_at    timestamptz not null default now()
);

-- Merit is a ledger, not a column: a number you increment can be double-credited by
-- a retry and nobody ever finds out. Rows can be summed, audited and reversed.
create table if not exists public.merit (
  id            bigserial primary key,
  to_id         uuid not null references public.cultivators(id) on delete cascade,
  from_id       uuid not null references public.cultivators(id) on delete cascade,
  amount        int not null check (amount > 0),
  reason        text not null,
  created_at    timestamptz not null default now()
);

create index if not exists merit_to_idx on public.merit(to_id, created_at desc);

-- ------------------------------------------------------------------------- RLS
alter table public.cultivators     enable row level security;
alter table public.applied_actions enable row level security;
alter table public.inheritances    enable row level security;
alter table public.merit           enable row level security;

drop policy if exists "read own cultivator" on public.cultivators;
create policy "read own cultivator" on public.cultivators
  for select using (auth.uid() = user_id);

-- Deliberately absent: any insert/update/delete policy for authenticated users.
-- Writes happen only through edge functions holding the service role, so a player
-- with a debugger and their own anon key can read their state and change nothing.

drop policy if exists "read own nonces" on public.applied_actions;
create policy "read own nonces" on public.applied_actions
  for select using (
    exists (select 1 from public.cultivators c
            where c.id = applied_actions.cultivator_id and c.user_id = auth.uid())
  );

-- Inheritances are public by design: the whole point is that a name outlives its line.
drop policy if exists "inheritances are public" on public.inheritances;
create policy "inheritances are public" on public.inheritances for select using (true);

drop policy if exists "read own merit" on public.merit;
create policy "read own merit" on public.merit
  for select using (
    exists (select 1 from public.cultivators c
            where c.id = merit.to_id and c.user_id = auth.uid())
  );
