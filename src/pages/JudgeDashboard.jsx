import { Award, Save, Star } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import Leaderboard from '../components/Leaderboard';
import StatCard from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';
import { useCompetitors } from '../hooks/useCompetitors';
import { supabase } from '../lib/supabase';

export default function JudgeDashboard() {
  const { user, profile } = useAuth();
  const { competitors, activeCompetitor } = useCompetitors();
  const [scores, setScores] = useState({});
  const [savingId, setSavingId] = useState(null);
  const topJudgeScore = competitors.length
    ? Math.max(...competitors.map((competitor) => Number(competitor.judge_score)))
    : 0;

  async function submitScore(competitorId) {
    const score = Number(scores[competitorId]);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      toast.error('Score must be between 0 and 100.');
      return;
    }

    setSavingId(competitorId);
    const { error } = await supabase.from('judge_scores').upsert(
      {
        judge_id: user.id,
        competitor_id: competitorId,
        score,
      },
      { onConflict: 'judge_id,competitor_id' },
    );
    setSavingId(null);

    if (error) toast.error(error.message);
    else toast.success('Judge score submitted.');
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
            Lecturer/Judge dashboard
          </p>
          <h1 className="mt-2 text-4xl font-black">Scoring panel, {profile.full_name}</h1>
        </div>
        <div className="rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-300">
          Active: {activeCompetitor?.full_name ?? 'None'}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Competitors" value={competitors.length} icon={Award} />
        <StatCard label="Active votes" value={activeCompetitor?.vote_count ?? 0} icon={Star} tone="emerald" />
        <StatCard label="Top judge score" value={topJudgeScore.toFixed(1)} icon={Save} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="glass-card overflow-hidden">
          <div className="border-b border-slate-200/70 p-5 dark:border-white/10">
            <h2 className="text-2xl font-black">Submit scores</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Scores are upserted once per judge and competitor, then reflected live on the leaderboard.
            </p>
          </div>
          <div className="divide-y divide-slate-200/70 dark:divide-white/10">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="grid gap-4 p-5 md:grid-cols-[1fr_10rem_8rem] md:items-center">
                <div className="flex items-start gap-3">
                  <img
                    className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-white/10"
                    src={
                      competitor.profile_image_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(competitor.full_name)}&background=16a34a&color=fff`
                    }
                    alt={competitor.full_name}
                  />
                  <div>
                    <h3 className="text-lg font-black">{competitor.full_name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{competitor.presentation_title}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {[competitor.competitor_code, competitor.student_id].filter(Boolean).join(' | ')}
                    </p>
                  </div>
                </div>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={scores[competitor.id] ?? ''}
                  onChange={(event) => setScores({ ...scores, [competitor.id]: event.target.value })}
                />
                <button className="btn-primary" disabled={savingId === competitor.id} onClick={() => submitScore(competitor.id)}>
                  {savingId === competitor.id ? 'Saving' : 'Submit'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <Leaderboard competitors={competitors} highlightId={activeCompetitor?.id} />
      </div>
    </PageShell>
  );
}
