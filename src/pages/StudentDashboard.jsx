import { CheckCircle2, Radio, Vote } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import CountdownBadge from '../components/CountdownBadge';
import Leaderboard from '../components/Leaderboard';
import StatCard from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';
import { useCompetitors } from '../hooks/useCompetitors';
import { useCompetitionStatus } from '../hooks/useCompetitionStatus';
import { useCountdown } from '../hooks/useCountdown';
import { supabase } from '../lib/supabase';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const { competitors, activeCompetitor } = useCompetitors();
  const { status, votingEndsAt } = useCompetitionStatus();
  const { isExpired } = useCountdown(votingEndsAt);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkVote() {
      if (!activeCompetitor || !user) {
        setHasVoted(false);
        return;
      }

      const { data } = await supabase
        .from('votes')
        .select('id')
        .eq('voter_id', user.id)
        .eq('competitor_id', activeCompetitor.id)
        .maybeSingle();

      setHasVoted(Boolean(data));
    }

    checkVote();
  }, [activeCompetitor, user]);

  async function submitVote() {
    if (!activeCompetitor) return;
    setSubmitting(true);
    const { error } = await supabase.from('votes').insert({
      voter_id: user.id,
      competitor_id: activeCompetitor.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.code === '23505' ? 'You already voted for this competitor.' : error.message);
      setHasVoted(true);
      return;
    }

    setHasVoted(true);
    toast.success('Vote recorded instantly.');
  }

  const canVote = status.voting_open && activeCompetitor && !hasVoted && !isExpired;

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
            Voting dashboard
          </p>
          <h1 className="mt-2 text-4xl font-black">Welcome, {profile.full_name}</h1>
        </div>
        <CountdownBadge open={status.voting_open} endDate={votingEndsAt} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              {activeCompetitor && (
                <img
                  className="h-20 w-20 rounded-3xl object-cover ring-1 ring-slate-200 dark:ring-white/10"
                  src={
                    activeCompetitor.profile_image_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(activeCompetitor.full_name)}&background=16a34a&color=fff`
                  }
                  alt={activeCompetitor.full_name}
                />
              )}
              <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
                Active competitor
              </p>
              <h2 className="mt-3 text-3xl font-black">{activeCompetitor?.full_name ?? 'No active speaker'}</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                {activeCompetitor?.presentation_title ?? 'Wait for the admin to open voting.'}
              </p>
              {activeCompetitor && (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {[activeCompetitor.competitor_code, activeCompetitor.student_id].filter(Boolean).join(' | ')}
                </p>
              )}
              </div>
            </div>
            <Radio className={status.voting_open ? 'text-emerald-500' : 'text-slate-400'} />
          </div>

          <button className="btn-primary mt-8 w-full text-lg" disabled={!canVote || submitting} onClick={submitVote}>
            {hasVoted ? (
              <>
                <CheckCircle2 size={22} /> Vote confirmed
              </>
            ) : (
              <>
                <Vote size={22} /> {submitting ? 'Submitting...' : 'Vote for this competitor'}
              </>
            )}
          </button>
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Database RLS and a unique constraint prevent duplicate or unauthorized voting.
          </p>
        </section>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="My status" value={hasVoted ? 'Voted' : 'Ready'} icon={CheckCircle2} tone="emerald" />
            <StatCard label="Live votes" value={activeCompetitor?.vote_count ?? 0} icon={Vote} />
            <StatCard label="Competitors" value={competitors.length} icon={Radio} tone="amber" />
          </div>
          <Leaderboard competitors={competitors} highlightId={activeCompetitor?.id} />
        </div>
      </div>
    </PageShell>
  );
}
