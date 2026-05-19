import { Medal, Presentation, Vote } from 'lucide-react';
import PageShell from '../components/PageShell';
import Leaderboard from '../components/Leaderboard';
import StatCard from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';
import { useCompetitors } from '../hooks/useCompetitors';

export default function CompetitorDashboard() {
  const { profile } = useAuth();
  const { competitors, activeCompetitor } = useCompetitors();
  const competitor = competitors.find(
    (item) => item.profile_id === profile.id || (profile.student_id && item.student_id === profile.student_id),
  );
  const rank = competitor ? competitors.findIndex((item) => item.id === competitor.id) + 1 : null;

  return (
    <PageShell>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
          Competitor dashboard
        </p>
        <h1 className="mt-2 text-4xl font-black">Your live presentation results</h1>
      </div>

      {!competitor ? (
        <div className="glass-card p-8">
          <h2 className="text-2xl font-black">Competitor profile not linked yet</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Ask the admin to set your `profile_id` on your competitor record in Supabase.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard label="Rank" value={`#${rank}`} icon={Medal} tone="amber" />
            <StatCard label="Audience votes" value={competitor.vote_count} icon={Vote} />
            <StatCard label="Judge score" value={Number(competitor.judge_score).toFixed(1)} icon={Presentation} tone="emerald" />
          </div>

          <section className="glass-card mb-6 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <img
                className="h-28 w-28 rounded-3xl object-cover ring-1 ring-slate-200 dark:ring-white/10"
                src={
                  competitor.profile_image_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(competitor.full_name)}&background=16a34a&color=fff`
                }
                alt={competitor.full_name}
              />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
                  {competitor.is_active ? 'You are live now' : 'Presentation profile'}
                </p>
                <h2 className="mt-3 text-3xl font-black">{competitor.presentation_title}</h2>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {[competitor.competitor_code, competitor.student_id].filter(Boolean).join(' | ')}
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      <Leaderboard competitors={competitors} highlightId={competitor?.id ?? activeCompetitor?.id} />
    </PageShell>
  );
}
