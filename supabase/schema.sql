-- ============================================================================
-- Ninefold 九重 — week one: accounts and an authoritative clock.
--
-- The single security property this file exists to guarantee:
--   a player can READ their cultivator and can never WRITE it.
-- Every mutation goes through an edge function that owns the clock and the dice.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- cultivators
-- One column for the cultivator, and three promoted out of it.
--
-- This table used to shred PlayerState into forty columns, and that design had a
-- standing defect rather than a bug: every field added to the engine had to be added
-- here and in toRow/toState by hand, and the fourteen that were not turned every call
-- into a 500 — `advance()` threw on `s.meridians is not iterable` before reaching a
-- single write. A finished cultivator is under a kilobyte. There was never a reason
-- to take it apart.
--
-- What stays promoted is only what the database itself has to do: order a leaderboard
-- without deserialising every row, and hold the foreign key. Everything else lives in
-- `state`, is migrated on read by the same migrate() the phone runs, and is checked on
-- write by the same verify().
create table if not exists public.cultivators (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  created_at            timestamptz not null default now(),

  -- The whole cultivator, exactly as src/core/state.ts defines it.
  state                 jsonb not null,

  -- Promoted for the leaderboard and for the one thing SQL enforces cheaply.
  realm                 int not null default 1 check (realm between 1 and 9),
  total_breakthroughs   int not null default 0 check (total_breakthroughs >= 0),
  last_seen_at          timestamptz not null default now(),

  -- Ready for the line; unused until the hall holds other people's names.
  master_id             uuid references public.cultivators(id) on delete set null,
  seat_count            int not null default 0 check (seat_count between 0 and 2),

  unique (user_id)
);

-- What a ranking orders by. Realm first, then who got there sooner.
create index if not exists cultivators_ladder_idx
  on public.cultivators (realm desc, created_at asc);

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
