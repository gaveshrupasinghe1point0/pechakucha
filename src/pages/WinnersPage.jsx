import { Crown, Trophy } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useCompetitors } from '../hooks/useCompetitors';
import { useCompetitionStatus } from '../hooks/useCompetitionStatus';
import { competitorAvatarUrl } from '../lib/competitorAvatar';
import { rankCompetitors } from '../lib/competitors';

export default function WinnersPage() {
  const { status } = useCompetitionStatus();
  const { competitors, loading } = useCompetitors();
  const winner = rankCompetitors(competitors)[0];

  if (loading) {
    return (
      <PageShell>
        <div className="glass-card p-10 text-center text-slate-500 dark:text-slate-400">Loading winner...</div>
      </PageShell>
    );
  }

  if (!status.winners_page_enabled) {
    return (
      <PageShell>
        <div className="glass-card mx-auto max-w-2xl p-10 text-center">
          <Trophy className="mx-auto text-amber-500" size={48} />
          <h1 className="mt-4 text-3xl font-black">Winner coming soon</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            The winner will appear here once the admin reveals the results.
          </p>
        </div>
      </PageShell>
    );
  }

  if (!winner) {
    return (
      <PageShell>
        <div className="glass-card mx-auto max-w-2xl p-10 text-center">
          <h1 className="text-3xl font-black">Competition winner</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">No competitors yet.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
          Grand finale
        </p>
        <h1 className="mt-2 text-4xl font-black sm:text-5xl">1st Place Winner</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">NSBM PechaKucha Champion</p>

        <div className="winner-rise glass-card mx-auto mt-10 p-8 sm:p-12">
          <div className="winner-float relative mx-auto w-fit rounded-full ring-4 ring-amber-400 winner-glow-gold">
            <img
              className="h-48 w-48 rounded-full object-cover sm:h-64 sm:w-64"
              src={competitorAvatarUrl(winner, 512)}
              alt={winner.full_name}
            />
            <span className="absolute -right-1 -top-1 grid h-12 w-12 place-items-center rounded-full bg-amber-500 text-white shadow-lg">
              <Crown size={22} />
            </span>
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-amber-600 dark:text-amber-300">
            Champion
          </p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">{winner.full_name}</h2>
          <p className="mx-auto mt-3 max-w-md text-lg text-slate-500 dark:text-slate-400">
            {winner.presentation_title}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {[winner.competitor_code, winner.student_id].filter(Boolean).join(' | ')}
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <ScoreChip label="Votes" value={winner.vote_count} />
            <ScoreChip label="Judge" value={Number(winner.judge_score).toFixed(1)} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function ScoreChip({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/80 px-4 py-3 dark:bg-white/10">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
