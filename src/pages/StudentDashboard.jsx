import { CheckCircle2, Radio, Vote } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import CountdownBadge from '../components/CountdownBadge';
import { useAuth } from '../hooks/useAuth';
import { useCompetitors } from '../hooks/useCompetitors';
import { useCompetitionStatus } from '../hooks/useCompetitionStatus';
import { useCountdown } from '../hooks/useCountdown';
import { competitorAvatarUrl } from '../lib/competitorAvatar';
import { supabase } from '../lib/supabase';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const { activeCompetitor } = useCompetitors();
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
    toast.success('Vote recorded!');
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

      <section className="glass-card mx-auto max-w-xl p-6 sm:p-8">
        {activeCompetitor && status.voting_open ? (
          <div className="flex flex-col items-center text-center">
            <img
              className="h-44 w-44 rounded-3xl object-cover ring-4 ring-emerald-500/30 sm:h-52 sm:w-52"
              src={competitorAvatarUrl(activeCompetitor, 512)}
              alt={activeCompetitor.full_name}
            />
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
              Now presenting
            </p>
            <h2 className="mt-2 text-3xl font-black">{activeCompetitor.full_name}</h2>
            <p className="mt-2 max-w-md text-slate-500 dark:text-slate-400">
              {activeCompetitor.presentation_title}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {[activeCompetitor.competitor_code, activeCompetitor.student_id].filter(Boolean).join(' | ')}
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Radio className="mx-auto text-slate-400" size={40} />
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
              Waiting for next speaker
            </p>
            <h2 className="mt-3 text-2xl font-black">Voting is not open yet</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              When a competitor starts presenting, they will appear here for you to vote.
            </p>
          </div>
        )}

        {activeCompetitor && status.voting_open && (
          <>
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
            {hasVoted && (
              <p className="mt-4 text-center text-sm text-emerald-600 dark:text-emerald-300">
                Thanks! Winners will be revealed at the end of the competition.
              </p>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}
