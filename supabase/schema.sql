create extension if not exists "pgcrypto";

create table if not exists figures (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  wiki_slug text not null,
  image_url text,
  birth_year int,
  death_year int,
  short_blurb text,
  category text not null default 'historical',
  elo numeric not null default 1500,
  matches int not null default 0,
  wins int not null default 0,
  social_url text,
  social_kind text,
  created_at timestamptz default now()
);

-- Backfill the column on existing installs that predated it.
alter table figures add column if not exists category text not null default 'historical';
alter table figures add column if not exists social_url text;
alter table figures add column if not exists social_kind text;
-- Editorial ranks (1-100) for current figures only. Seeded by hand in
-- scripts/seed-ranks.ts; null means "not yet rated".
alter table figures add column if not exists fame_rank int;
alter table figures add column if not exists controversy_rank int;
alter table figures add column if not exists money_rank int;

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid references figures(id) on delete cascade,
  loser_id uuid references figures(id) on delete cascade,
  session_id text,
  client_ip text,
  matchup_token text,
  created_at timestamptz default now()
);

create index if not exists figures_elo_idx on figures (elo desc);
create index if not exists figures_category_elo_idx on figures (category, elo desc);
create index if not exists figures_category_matches_idx on figures (category, matches asc);
create index if not exists matches_created_idx on matches (created_at desc);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  figure_id uuid not null references figures(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists comments_figure_created_idx on comments (figure_id, created_at desc);

alter table comments enable row level security;

do $$
begin
  create policy "Comments are readable by anyone"
    on comments for select
    using (true);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can insert their own comments"
    on comments for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can delete their own comments"
    on comments for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public)
values ('portraits', 'portraits', true)
on conflict (id) do nothing;

-- Allow public read on portraits bucket. Wrapped in DO block so re-running the
-- script doesn't error if the policy already exists (CREATE POLICY ... IF NOT
-- EXISTS isn't available on every Postgres version Supabase ships).
do $$
begin
  create policy "Public read portraits"
    on storage.objects for select
    using (bucket_id = 'portraits');
exception when duplicate_object then null;
end $$;

-- Atomic Elo update + match insert. Called from the /api/vote route so winner
-- and loser are updated together and we don't lose votes if one update fails.
create or replace function record_vote(
  p_winner_id uuid,
  p_loser_id uuid,
  p_session_id text,
  p_client_ip text,
  p_matchup_token text,
  p_k numeric default 32
) returns table (winner_new_elo numeric, loser_new_elo numeric)
language plpgsql
as $$
declare
  v_winner_elo numeric;
  v_loser_elo numeric;
  v_expected_winner numeric;
  v_delta numeric;
  v_winner_new numeric;
  v_loser_new numeric;
begin
  -- Lock both rows in a stable order to avoid deadlocks under concurrent votes.
  if p_winner_id < p_loser_id then
    select elo into v_winner_elo from figures where id = p_winner_id for update;
    select elo into v_loser_elo from figures where id = p_loser_id for update;
  else
    select elo into v_loser_elo from figures where id = p_loser_id for update;
    select elo into v_winner_elo from figures where id = p_winner_id for update;
  end if;

  if v_winner_elo is null or v_loser_elo is null then
    raise exception 'figure not found';
  end if;

  v_expected_winner := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo) / 400.0));
  v_delta := p_k * (1.0 - v_expected_winner);
  v_winner_new := v_winner_elo + v_delta;
  v_loser_new := v_loser_elo - v_delta;

  update figures
     set elo = v_winner_new, matches = matches + 1, wins = wins + 1
   where id = p_winner_id;

  update figures
     set elo = v_loser_new, matches = matches + 1
   where id = p_loser_id;

  insert into matches (winner_id, loser_id, session_id, client_ip, matchup_token)
  values (p_winner_id, p_loser_id, p_session_id, p_client_ip, p_matchup_token);

  winner_new_elo := v_winner_new;
  loser_new_elo := v_loser_new;
  return next;
end;
$$;
