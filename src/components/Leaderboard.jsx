import { Trophy } from 'lucide-react';
import { rankCompetitors } from '../lib/competitors';
import { competitorAvatarUrl } from '../lib/competitorAvatar';

export default function Leaderboard({ competitors = [], highlightId }) {
  const rankedCompetitors = rankCompetitors(competitors);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200/70 p-5 dark:border-white/10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
            Live Leaderboard
          </p>
          <h2 className="mt-1 text-2xl font-black">Live Rankings by Score</h2>
        </div>
        <Trophy className="text-amber-500" />
      </div>

      <div className="divide-y divide-slate-200/70 dark:divide-white/10">
        {rankedCompetitors.map((competitor, index) => (
          <div
            key={competitor.id}
            className={`grid gap-4 p-5 transition md:grid-cols-[4rem_1fr_8rem_8rem] md:items-center ${
              competitor.id === highlightId ? 'bg-brand-500/10' : ''
            }`}
          >
            <div className="text-3xl font-black text-slate-400">#{index + 1}</div>
            <div className="flex items-center gap-5">
              <img
                className="h-32 w-32 shrink-0 rounded-3xl object-cover ring-2 ring-slate-200 dark:ring-white/10 md:h-40 md:w-40"
                src={competitorAvatarUrl(competitor, 512)}
                alt={competitor.full_name}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black">{competitor.full_name}</h3>
                  {competitor.is_active && (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                      Live now
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{competitor.presentation_title}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {[competitor.competitor_code, competitor.student_id].filter(Boolean).join(' | ')}
                </p>
              </div>
            </div>
            <Metric label="Voter Score" value={competitor.vote_count} />
            <Metric label="Judge Score" value={Number(competitor.judge_score).toFixed(1)} />
          </div>
        ))}

        {competitors.length === 0 && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No competitors have been published yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, strong }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3 text-center dark:bg-white/10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={strong ? 'text-2xl font-black text-brand-600 dark:text-brand-100' : 'text-xl font-black'}>
        {value}
      </p>
    </div>
  );
}
