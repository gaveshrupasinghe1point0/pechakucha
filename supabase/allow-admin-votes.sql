-- Run this once to let admin accounts vote through the normal voting flow.
-- Admin votes are inserted into public.votes and count exactly like student voter votes.

drop policy if exists "Only voters can vote during active window" on public.votes;
drop policy if exists "Voters and admins can vote during active window" on public.votes;

create policy "Voters and admins can vote during active window"
on public.votes for insert
with check (
  voter_id = auth.uid()
  and private.current_user_role() in ('voter', 'admin')
  and private.is_voting_window_open(competitor_id)
);
