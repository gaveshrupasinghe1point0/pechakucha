-- NSBM PechaKucha real-time voting system
-- Run this in the Supabase SQL editor for a new project.

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'judge', 'competitor', 'voter');
  end if;
end $$;

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  student_id text unique,
  role public.user_role not null default 'voter',
  created_at timestamptz not null default now()
);

create table if not exists public.admin_allowlist (
  email text primary key,
  full_name text,
  access_code_hash text not null,
  created_at timestamptz not null default now(),
  constraint admin_allowlist_student_email check (email like '%@students.nsbm.ac.lk')
);

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  competitor_code text unique,
  student_id text,
  full_name text not null,
  presentation_title text not null,
  talk_summary text,
  department text not null,
  profile_image_url text,
  vote_count integer not null default 0 check (vote_count >= 0),
  judge_score numeric(6,2) not null default 0 check (judge_score >= 0),
  total_score numeric(8,2) not null default 0 check (total_score >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null references public.profiles(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_one_per_competitor unique (voter_id, competitor_id)
);

create table if not exists public.judge_scores (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references public.profiles(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  created_at timestamptz not null default now(),
  constraint judge_scores_one_per_judge unique (judge_id, competitor_id)
);

create table if not exists public.competition_status (
  id integer primary key default 1 check (id = 1),
  event_name text not null default 'NSBM PechaKucha Competition',
  voting_open boolean not null default false,
  active_competitor_id uuid references public.competitors(id) on delete set null,
  voting_duration_seconds integer not null default 30 check (voting_duration_seconds between 5 and 600),
  voting_started_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.competition_status (id)
values (1)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'competitor-photos',
  'competitor-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create index if not exists competitors_active_idx on public.competitors (is_active) where is_active = true;
create index if not exists competitors_total_score_idx on public.competitors (total_score desc, vote_count desc);
create index if not exists competitors_competitor_code_idx on public.competitors (competitor_code);
create index if not exists competitors_student_id_idx on public.competitors (student_id);
create index if not exists votes_competitor_id_idx on public.votes (competitor_id);
create index if not exists votes_voter_id_idx on public.votes (voter_id);
create index if not exists judge_scores_competitor_id_idx on public.judge_scores (competitor_id);

alter table public.profiles enable row level security;
alter table public.admin_allowlist enable row level security;
alter table public.competitors enable row level security;
alter table public.votes enable row level security;
alter table public.judge_scores enable row level security;
alter table public.competition_status enable row level security;

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function private.is_voting_window_open(target_competitor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.competition_status status
    join public.competitors competitor on competitor.id = status.active_competitor_id
    where status.id = 1
      and status.voting_open = true
      and competitor.id = target_competitor_id
      and competitor.is_active = true
      and status.voting_started_at is not null
      and now() <= status.voting_started_at + (status.voting_duration_seconds * interval '1 second')
  )
$$;

create or replace function private.validate_profile_role()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_email text := lower(new.email);
begin
  new.email := normalized_email;

  if normalized_email like '%@students.nsbm.ac.lk' then
    if new.role not in ('voter', 'competitor', 'admin') then
      raise exception 'Student domain accounts can only be voter, competitor, or admin';
    end if;

    if new.role = 'admin' and not exists (
      select 1 from public.admin_allowlist where email = normalized_email
    ) then
      raise exception 'This account is not one of the approved admin members';
    end if;
  elsif normalized_email like '%@nsbm.ac.lk' then
    if new.role <> 'judge' then
      raise exception 'Staff domain accounts can only be judge accounts';
    end if;
  else
    raise exception 'Only NSBM student or staff email addresses are allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_profile_role on public.profiles;
create trigger validate_profile_role
  before insert or update of email, role on public.profiles
  for each row execute function private.validate_profile_role();

create or replace function private.validate_admin_allowlist()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_email text := lower(new.email);
  admin_count integer;
begin
  new.email := normalized_email;

  if normalized_email not like '%@students.nsbm.ac.lk' then
    raise exception 'Admin allowlist emails must use @students.nsbm.ac.lk';
  end if;

  select count(*) into admin_count
  from public.admin_allowlist
  where email <> normalized_email;

  if admin_count >= 4 then
    raise exception 'Only 4 admin members are allowed';
  end if;

  if new.access_code_hash is null or length(new.access_code_hash) < 20 then
    raise exception 'Admin allowlist requires a hashed 5-character access code';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_admin_allowlist on public.admin_allowlist;
create trigger validate_admin_allowlist
  before insert or update of email, access_code_hash on public.admin_allowlist
  for each row execute function private.validate_admin_allowlist();

create or replace function public.verify_admin_access(admin_email text, access_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.admin_allowlist allowed on allowed.email = profile.email
    where profile.id = auth.uid()
      and profile.email = lower(admin_email)
      and profile.role = 'admin'
      and access_code ~ '^[A-Za-z0-9]{5}$'
      and allowed.access_code_hash = extensions.crypt(upper(access_code), allowed.access_code_hash)
  )
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(new.email);
  assigned_role public.user_role;
begin
  if normalized_email like '%@students.nsbm.ac.lk' then
    if exists (select 1 from public.admin_allowlist where email = normalized_email) then
      assigned_role := 'admin';
    else
      assigned_role := 'voter';
    end if;
  elsif normalized_email like '%@nsbm.ac.lk' then
    assigned_role := 'judge';
  else
    raise exception 'Only NSBM student or staff email addresses are allowed';
  end if;

  if assigned_role = 'admin' then
    update public.admin_allowlist
    set full_name = coalesce(new.raw_user_meta_data->>'full_name', full_name)
    where email = normalized_email;
  end if;

  insert into public.profiles (id, full_name, email, student_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    normalized_email,
    nullif(upper(new.raw_user_meta_data->>'student_id'), ''),
    assigned_role
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.refresh_competitor_totals(target_competitor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  audience_votes integer;
  average_judge_score numeric(6,2);
begin
  select count(*) into audience_votes
  from public.votes
  where competitor_id = target_competitor_id;

  select coalesce(avg(score), 0)::numeric(6,2) into average_judge_score
  from public.judge_scores
  where competitor_id = target_competitor_id;

  update public.competitors
  set
    vote_count = audience_votes,
    judge_score = average_judge_score,
    total_score = audience_votes + average_judge_score
  where id = target_competitor_id;
end;
$$;

create or replace function private.refresh_competitor_totals_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.refresh_competitor_totals(coalesce(new.competitor_id, old.competitor_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists votes_refresh_competitor_totals on public.votes;
create trigger votes_refresh_competitor_totals
  after insert or update or delete on public.votes
  for each row execute function private.refresh_competitor_totals_trigger();

drop trigger if exists judge_scores_refresh_competitor_totals on public.judge_scores;
create trigger judge_scores_refresh_competitor_totals
  after insert or update or delete on public.judge_scores
  for each row execute function private.refresh_competitor_totals_trigger();

create or replace function private.sync_active_competitor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active = true and coalesce(old.is_active, false) = false then
    update public.competitors
    set is_active = false
    where id <> new.id and is_active = true;

    update public.competition_status
    set
      active_competitor_id = new.id,
      voting_open = true,
      voting_started_at = now(),
      updated_at = now()
    where id = 1;
  elsif new.is_active = false and old.is_active = true then
    update public.competition_status
    set
      active_competitor_id = null,
      voting_open = false,
      updated_at = now()
    where id = 1 and active_competitor_id = old.id;
  end if;

  return new;
end;
$$;

drop trigger if exists competitors_sync_active on public.competitors;
create trigger competitors_sync_active
  after update of is_active on public.competitors
  for each row execute function private.sync_active_competitor();

create or replace function private.close_competitors_from_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.voting_open = false then
    update public.competitors set is_active = false where is_active = true;
  end if;

  return new;
end;
$$;

drop trigger if exists status_closes_competitors on public.competition_status;
create trigger status_closes_competitors
  after update of voting_open on public.competition_status
  for each row execute function private.close_competitors_from_status();

drop policy if exists "Profiles are readable by owner and admins" on public.profiles;
create policy "Profiles are readable by owner and admins"
on public.profiles for select
using (id = auth.uid() or private.current_user_role() = 'admin');

drop policy if exists "Users can update their display profile" on public.profiles;
create policy "Users can update their display profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid() and role = private.current_user_role());

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles"
on public.profiles for all
using (private.current_user_role() = 'admin')
with check (private.current_user_role() = 'admin');

drop policy if exists "Admins can read admin allowlist" on public.admin_allowlist;
create policy "Admins can read admin allowlist"
on public.admin_allowlist for select
using (private.current_user_role() = 'admin');

drop policy if exists "Admins manage admin allowlist" on public.admin_allowlist;
create policy "Admins manage admin allowlist"
on public.admin_allowlist for all
using (private.current_user_role() = 'admin')
with check (private.current_user_role() = 'admin');

drop policy if exists "Competitor photos are public" on storage.objects;
create policy "Competitor photos are public"
on storage.objects for select
using (bucket_id = 'competitor-photos');

drop policy if exists "Admins upload competitor photos" on storage.objects;
create policy "Admins upload competitor photos"
on storage.objects for insert
with check (
  bucket_id = 'competitor-photos'
  and private.current_user_role() = 'admin'
);

drop policy if exists "Admins update competitor photos" on storage.objects;
create policy "Admins update competitor photos"
on storage.objects for update
using (
  bucket_id = 'competitor-photos'
  and private.current_user_role() = 'admin'
)
with check (
  bucket_id = 'competitor-photos'
  and private.current_user_role() = 'admin'
);

drop policy if exists "Leaderboard competitors are public" on public.competitors;
create policy "Leaderboard competitors are public"
on public.competitors for select
using (true);

drop policy if exists "Admins manage competitors" on public.competitors;
create policy "Admins manage competitors"
on public.competitors for all
using (private.current_user_role() = 'admin')
with check (private.current_user_role() = 'admin');

drop policy if exists "Voters can read their votes" on public.votes;
create policy "Voters can read their votes"
on public.votes for select
using (voter_id = auth.uid() or private.current_user_role() = 'admin');

drop policy if exists "Only voters can vote during active window" on public.votes;
drop policy if exists "Voters and admins can vote during active window" on public.votes;
create policy "Voters and admins can vote during active window"
on public.votes for insert
with check (
  voter_id = auth.uid()
  and private.current_user_role() in ('voter', 'admin')
  and private.is_voting_window_open(competitor_id)
);

drop policy if exists "Admins can delete votes" on public.votes;
create policy "Admins can delete votes"
on public.votes for delete
using (private.current_user_role() = 'admin');

drop policy if exists "Judges can read own scores and admins read all" on public.judge_scores;
create policy "Judges can read own scores and admins read all"
on public.judge_scores for select
using (judge_id = auth.uid() or private.current_user_role() = 'admin');

drop policy if exists "Judges submit own scores" on public.judge_scores;
create policy "Judges submit own scores"
on public.judge_scores for insert
with check (
  judge_id = auth.uid()
  and private.current_user_role() in ('judge', 'admin')
);

drop policy if exists "Judges update own scores" on public.judge_scores;
create policy "Judges update own scores"
on public.judge_scores for update
using (judge_id = auth.uid() and private.current_user_role() in ('judge', 'admin'))
with check (judge_id = auth.uid() and private.current_user_role() in ('judge', 'admin'));

drop policy if exists "Competition status is public" on public.competition_status;
create policy "Competition status is public"
on public.competition_status for select
using (true);

drop policy if exists "Admins control competition status" on public.competition_status;
create policy "Admins control competition status"
on public.competition_status for update
using (private.current_user_role() = 'admin')
with check (private.current_user_role() = 'admin');

grant usage on schema public to anon, authenticated;
grant usage on schema private to authenticated;
grant select on public.competitors to anon, authenticated;
grant select on public.competition_status to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.verify_admin_access(text, text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'competitors'
  ) then
    alter publication supabase_realtime add table public.competitors;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'competition_status'
  ) then
    alter publication supabase_realtime add table public.competition_status;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'judge_scores'
  ) then
    alter publication supabase_realtime add table public.judge_scores;
  end if;
end $$;

-- Optional demo competitors. Replace values and run manually if needed:
-- insert into public.competitors (full_name, presentation_title, department)
-- values
--   ('Amani Perera', 'Designing Human-Centered AI for Campus Life', 'Computing'),
--   ('Dineth Silva', 'Green Cities in Six Minutes and Forty Seconds', 'Engineering'),
--   ('Rashmi Fernando', 'Entrepreneurship Through Student Innovation', 'Business');

-- Pick any 4 of these 10 sample 5-character admin codes, or replace them:
-- K7M2Q, R9T4P, B6X1N, Z3L8C, H5V7A, Q2D9F, M4S6W, T8Y1K, P3N5R, C7J2L
-- Add up to 4 trusted admin emails and hashed access codes before promoting them:
-- insert into public.admin_allowlist (email, full_name, access_code_hash)
-- values
--   ('admin1@students.nsbm.ac.lk', 'Admin One', extensions.crypt('K7M2Q', extensions.gen_salt('bf'))),
--   ('admin2@students.nsbm.ac.lk', 'Admin Two', extensions.crypt('R9T4P', extensions.gen_salt('bf'))),
--   ('admin3@students.nsbm.ac.lk', 'Admin Three', extensions.crypt('B6X1N', extensions.gen_salt('bf'))),
--   ('admin4@students.nsbm.ac.lk', 'Admin Four', extensions.crypt('Z3L8C', extensions.gen_salt('bf')));
-- Manually promote approved admins after signup:
-- update public.profiles set role = 'admin' where email = 'admin@students.nsbm.ac.lk';
-- Link competitor accounts after signup when needed:
-- update public.profiles set role = 'competitor' where email = 'student@students.nsbm.ac.lk';
-- update public.competitors set profile_id = '<profile-uuid>', student_id = '<student-id>' where id = '<competitor-uuid>';
