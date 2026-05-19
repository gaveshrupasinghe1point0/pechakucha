import { useEffect, useMemo, useState } from 'react';
import { KeyRound, RefreshCw, UserCheck, Vote } from 'lucide-react';
import PageShell from '../components/PageShell';
import StatCard from '../components/StatCard';
import { supabase } from '../lib/supabase';

export default function VoterActivity() {
  const [profiles, setProfiles] = useState([]);
  const [votes, setVotes] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadActivity() {
    setLoading(true);

    const [{ data: profileRows }, { data: voteRows }, { data: competitorRows }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,full_name,email,student_id,role,created_at')
        .eq('role', 'voter')
        .order('created_at', { ascending: false }),
      supabase
        .from('votes')
        .select('id,voter_id,competitor_id,created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('competitors')
        .select('id,full_name,presentation_title,competitor_code,student_id'),
    ]);

    setProfiles(profileRows ?? []);
    setVotes(voteRows ?? []);
    setCompetitors(competitorRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadActivity();

    const channel = supabase
      .channel('admin-voter-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, loadActivity)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadActivity)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const rows = useMemo(() => {
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const competitorById = new Map(competitors.map((competitor) => [competitor.id, competitor]));

    return votes.map((vote) => ({
      ...vote,
      voter: profileById.get(vote.voter_id),
      competitor: competitorById.get(vote.competitor_id),
    }));
  }, [competitors, profiles, votes]);

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
            Admin audit view
          </p>
          <h1 className="mt-2 text-4xl font-black">Voter Activity</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Shows student voter details and who they voted for. Passwords cannot be viewed because
            Supabase stores secure hashes only. If a user forgets a password, delete that auth user
            in Supabase and ask them to create the account again.
          </p>
        </div>
        <button className="btn-secondary" onClick={loadActivity} disabled={loading}>
          <RefreshCw size={18} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Registered voters" value={profiles.length} icon={UserCheck} tone="emerald" />
        <StatCard label="Votes recorded" value={votes.length} icon={Vote} />
        <StatCard label="Password help" value="Delete user" icon={KeyRound} tone="amber" />
      </div>

      <section className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/70 text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4">Voter</th>
                <th className="px-5 py-4">Student ID</th>
                <th className="px-5 py-4">Voted For</th>
                <th className="px-5 py-4">Topic</th>
                <th className="px-5 py-4">Vote Time</th>
                <th className="px-5 py-4">Password Help</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-black">{row.voter?.full_name ?? 'Unknown voter'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{row.voter?.email ?? row.voter_id}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold">{row.voter?.student_id ?? 'Not provided'}</td>
                  <td className="px-5 py-4">
                    <p className="font-black">{row.competitor?.full_name ?? 'Unknown competitor'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {row.competitor?.competitor_code ?? row.competitor_id}
                    </p>
                  </td>
                  <td className="px-5 py-4">{row.competitor?.presentation_title ?? 'Not available'}</td>
                  <td className="px-5 py-4">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <span className="inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-200">
                        Not viewable
                      </span>
                      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Delete user in Supabase Auth, then ask them to sign up again.
                      </p>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={6}>
                    No votes have been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
