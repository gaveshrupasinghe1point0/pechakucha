-- Run this once to allow voting windows up to 10 minutes.

alter table public.competition_status
drop constraint if exists competition_status_voting_duration_seconds_check;

alter table public.competition_status
add constraint competition_status_voting_duration_seconds_check
check (voting_duration_seconds between 5 and 600);
