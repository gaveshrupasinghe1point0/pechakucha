-- Run this once after the initial schema to support:
-- - student IDs on voter/competitor profiles
-- - admin-created competitor cards
-- - competitor profile photos in Supabase Storage

alter table public.profiles
add column if not exists student_id text unique;

alter table public.competitors
add column if not exists competitor_code text unique,
add column if not exists student_id text,
add column if not exists talk_summary text,
add column if not exists profile_image_url text;

create index if not exists competitors_competitor_code_idx on public.competitors (competitor_code);
create index if not exists competitors_student_id_idx on public.competitors (student_id);

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
