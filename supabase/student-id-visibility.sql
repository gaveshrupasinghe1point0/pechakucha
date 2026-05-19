-- Supabase Auth's built-in auth.users table cannot be customized in the dashboard.
-- Student IDs are stored in public.profiles.student_id instead.
-- Run this if you want to backfill student IDs from signup metadata and view users clearly.

alter table public.profiles
add column if not exists student_id text unique;

update public.profiles profile
set student_id = nullif(upper(auth_user.raw_user_meta_data->>'student_id'), '')
from auth.users auth_user
where profile.id = auth_user.id
  and profile.student_id is null
  and auth_user.raw_user_meta_data ? 'student_id';

create or replace view public.user_directory
with (security_invoker = true)
as
select
  profiles.id,
  profiles.full_name,
  profiles.email,
  profiles.student_id,
  profiles.role,
  profiles.created_at
from public.profiles
order by profiles.created_at desc;

grant select on public.user_directory to authenticated;
