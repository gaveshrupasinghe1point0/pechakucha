-- Run this once if you already ran schema.sql before the separate admin-login change.
-- It enforces:
-- - @students.nsbm.ac.lk accounts can be voter, competitor, or manually promoted admin
-- - @nsbm.ac.lk accounts can only be judges
-- - judges cannot be promoted into admin accounts
-- - only 4 approved student-domain emails can become admins

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin_allowlist (
  email text primary key,
  full_name text,
  access_code_hash text,
  created_at timestamptz not null default now(),
  constraint admin_allowlist_student_email check (email like '%@students.nsbm.ac.lk')
);

alter table public.admin_allowlist
add column if not exists access_code_hash text;

alter table public.admin_allowlist enable row level security;

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

drop policy if exists "Admins can read admin allowlist" on public.admin_allowlist;
create policy "Admins can read admin allowlist"
on public.admin_allowlist for select
using (private.current_user_role() = 'admin');

drop policy if exists "Admins manage admin allowlist" on public.admin_allowlist;
create policy "Admins manage admin allowlist"
on public.admin_allowlist for all
using (private.current_user_role() = 'admin')
with check (private.current_user_role() = 'admin');

grant select, insert, update, delete on public.admin_allowlist to authenticated;
grant execute on function public.verify_admin_access(text, text) to authenticated;

-- Pick any 4 of these 10 sample 5-character admin codes, or replace them:
-- K7M2Q, R9T4P, B6X1N, Z3L8C, H5V7A, Q2D9F, M4S6W, T8Y1K, P3N5R, C7J2L
--
-- Replace these 4 emails and access codes with your real admin members, then run the insert:
-- insert into public.admin_allowlist (email, full_name, access_code_hash)
-- values
--   ('admin1@students.nsbm.ac.lk', 'Admin One', extensions.crypt('K7M2Q', extensions.gen_salt('bf'))),
--   ('admin2@students.nsbm.ac.lk', 'Admin Two', extensions.crypt('R9T4P', extensions.gen_salt('bf'))),
--   ('admin3@students.nsbm.ac.lk', 'Admin Three', extensions.crypt('B6X1N', extensions.gen_salt('bf'))),
--   ('admin4@students.nsbm.ac.lk', 'Admin Four', extensions.crypt('Z3L8C', extensions.gen_salt('bf')))
-- on conflict (email) do update
-- set full_name = excluded.full_name,
--     access_code_hash = excluded.access_code_hash;

-- Promote an approved admin after they sign up with a student-domain email:
-- update public.profiles
-- set role = 'admin'
-- where email = 'your-admin-email@students.nsbm.ac.lk';
