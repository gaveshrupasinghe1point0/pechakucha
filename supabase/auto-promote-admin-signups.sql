-- Run this after set-admin-members.sql.
-- Allowlisted admin emails automatically become admin when they sign up.
-- Their signup name is copied into admin_allowlist.full_name.

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

-- Promote allowlisted admins who already signed up before this trigger update.
update public.profiles profile
set role = 'admin'
from public.admin_allowlist allowed
where profile.email = allowed.email;

-- Keep allowlist display names aligned with already-created profiles.
update public.admin_allowlist allowed
set full_name = profile.full_name
from public.profiles profile
where profile.email = allowed.email;
