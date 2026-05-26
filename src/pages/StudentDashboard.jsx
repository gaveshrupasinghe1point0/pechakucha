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
  const { competitors } = useCompetitors();
  const { status, votingEndsAt } = useCompetitionStatus();
  const { isExpired } = useCountdown(votingEndsAt);
  const [votedCompetitorId, setVotedCompetitorId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    async function checkVote() {
      if (!user) {
        setVotedCompetitorId(null);
        return;
      }

      const { data } = await supabase
        .from('votes')
        .select('competitor_id')
        .eq('voter_id', user.id)
        .maybeSingle();

      setVotedCompetitorId(data?.competitor_id ?? null);
    }

    checkVote();
  }, [user]);

  async function submitVote(competitorId) {
    if (votedCompetitorId || !status.voting_open || isExpired) return;

    setSubmittingId(competitorId);
    const { error } = await supabase.from('votes').insert({
      voter_id: user.id,
      competitor_id: competitorId,
    });
    setSubmittingId(null);

    if (error) {
      if (error.code === '23505') {
        toast.error('You already used your vote. Each person can only vote once.');
        const { data } = await supabase
          .from('votes')
          .select('competitor_id')
          .eq('voter_id', user.id)
          .maybeSingle();
        setVotedCompetitorId(data?.competitor_id ?? null);
      } else {
        toast.error(error.message);
      }
      return;
    }

    setVotedCompetitorId(competitorId);
    toast.success('Vote recorded!');
  }

  const votingOpen = status.voting_open && !isExpired;
  const hasVoted = Boolean(votedCompetitorId);

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
            Voting dashboard
          </p>
          <h1 className="mt-2 text-4xl font-black">Welcome, {profile.full_name}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {hasVoted
              ? 'Your vote is locked in. Winners will be revealed at the end.'
              : votingOpen
                ? 'Pick one competitor — you only get one vote.'
                : 'Voting opens after all presentations are finished.'}
          </p>
        </div>
        <CountdownBadge open={status.voting_open} endDate={votingEndsAt} />
      </div>

      {!votingOpen && !hasVoted ? (
        <section className="glass-card mx-auto max-w-xl p-8 text-center">
          <Radio className="mx-auto text-slate-400" size={40} />
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
            Waiting for voting
          </p>
          <h2 className="mt-3 text-2xl font-black">
            {status.voting_open && isExpired ? 'Voting time is over' : 'Voting is not open yet'}
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            When the admin opens voting, all competitors will appear here and you can choose one.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitors.map((competitor) => {
            const isSelected = votedCompetitorId === competitor.id;
            const isSubmitting = submittingId === competitor.id;
            const canVote = votingOpen && !hasVoted;

            return (
              <article
                key={competitor.id}
                className={`glass-card flex flex-col p-5 transition ${
                  isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950' : ''
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <img
                    className="h-36 w-36 rounded-3xl object-cover ring-2 ring-slate-200 dark:ring-white/10 sm:h-40 sm:w-40"
                    src={competitorAvatarUrl(competitor, 512)}
                    alt={competitor.full_name}
                  />
                  <h2 className="mt-4 text-xl font-black">{competitor.full_name}</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {competitor.presentation_title}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {[competitor.competitor_code, competitor.student_id].filter(Boolean).join(' | ')}
                  </p>
                </div>

                <button
                  className={`mt-5 w-full ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                  disabled={!canVote && !isSelected}
                  onClick={() => submitVote(competitor.id)}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 size={20} /> Your vote
                    </>
                  ) : isSubmitting ? (
                    'Submitting...'
                  ) : canVote ? (
                    <>
                      <Vote size={20} /> Vote for this competitor
                    </>
                  ) : hasVoted ? (
                    'Vote used'
                  ) : (
                    'Voting closed'
                  )}
                </button>
              </article>
            );
          })}

          {competitors.length === 0 && (
            <div className="glass-card col-span-full p-8 text-center text-slate-500 dark:text-slate-400">
              No competitors have been added yet.
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
