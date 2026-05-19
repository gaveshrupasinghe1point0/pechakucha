-- These are the student-domain emails allowed to use /admin-login.
-- Run this after admin-role-hardening.sql.
--
-- 10 sample 5-character admin codes:
-- K7M2Q, R9T4P, B6X1N, Z3L8C, H5V7A, Q2D9F, M4S6W, T8Y1K, P3N5R, C7J2L
--
-- Give each admin one code. They must enter it on /admin-login.

delete from public.admin_allowlist;

insert into public.admin_allowlist (email, full_name, access_code_hash)
values
  ('maggrupasinghe@students.nsbm.ac.lk', 'Magg Rupasinghe', extensions.crypt('K7M2Q', extensions.gen_salt('bf'))),
  ('ugsdgamage@students.nsbm.ac.lk', 'Sadew', extensions.crypt('R9T4P', extensions.gen_salt('bf'))),
  ('dmhdsiriwardhana@students.nsbm.ac.lk', 'Hirun', extensions.crypt('H5V7A', extensions.gen_salt('bf')));

-- After each person signs up, promote them:
update public.profiles
set role = 'admin'
where email in (
  'maggrupasinghe@students.nsbm.ac.lk',
  'ugsdgamage@students.nsbm.ac.lk',
  'dmhdsiriwardhana@students.nsbm.ac.lk'
);
