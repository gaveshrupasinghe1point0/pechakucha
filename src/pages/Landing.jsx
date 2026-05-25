import { Link } from 'react-router-dom';
import { BarChart3, Clock, QrCode, ShieldCheck, Users, Vote } from 'lucide-react';
import PageShell from '../components/PageShell';
import StatCard from '../components/StatCard';
import Leaderboard from '../components/Leaderboard';
import CountdownBadge from '../components/CountdownBadge';
import { useCompetitionStatus } from '../hooks/useCompetitionStatus';
import { useCompetitors } from '../hooks/useCompetitors';
import { usePresence } from '../hooks/usePresence';
import { eventConfig } from '../lib/constants';

export default function Landing() {
  const { competitors, activeCompetitor } = useCompetitors();
  const { status, votingEndsAt } = useCompetitionStatus();
  const onlineCount = usePresence();

  return (
    <PageShell>
      <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div>
          <p className="inline-flex rounded-full bg-brand-500/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-brand-700 dark:text-brand-100">
            Real-time university voting
          </p>
          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            {eventConfig.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            A secure Supabase-powered PechaKucha platform with live student voting, judge scoring,
            instant leaderboards, and role-based dashboards for a professional university event.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn-primary" to="/signup">
              Join Event
            </Link>
            <Link className="btn-secondary" to="/admin-login">
              Admin Login
            </Link>
            <Link className="btn-secondary" to="/leaderboard">
              Watch Leaderboard
            </Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-4">
              {activeCompetitor && (
                <img
                  className="h-36 w-36 rounded-3xl object-cover ring-2 ring-slate-200 dark:ring-white/10 sm:h-44 sm:w-44"
                  src={
                    activeCompetitor.profile_image_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(activeCompetitor.full_name)}&background=16a34a&color=fff&size=512`
                  }
                  alt={activeCompetitor.full_name}
                />
              )}
              <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
                Now presenting
              </p>
              <h2 className="mt-2 text-3xl font-black">
                {activeCompetitor?.full_name ?? 'Waiting for admin'}
              </h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                {activeCompetitor?.presentation_title ?? 'Voting opens when a competitor is activated.'}
              </p>
              </div>
            </div>
            <CountdownBadge open={status.voting_open} endDate={votingEndsAt} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Online" value={onlineCount} icon={Users} tone="emerald" />
            <StatCard label="Competitors" value={competitors.length} icon={BarChart3} />
            <StatCard label="Timer seconds" value={`${status.voting_duration_seconds}s`} icon={Clock} tone="amber" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 py-8 md:grid-cols-4">
        <Feature icon={ShieldCheck} title="RLS protected" text="Role-aware database policies protect votes, scores, and admin controls." />
        <Feature icon={Vote} title="Duplicate safe" text="Students can vote once per competitor, enforced by a database unique constraint." />
        <Feature icon={QrCode} title="QR join" text="Audience members can scan and join directly from their mobile devices." />
        <Feature icon={BarChart3} title="Live reports" text="Competitor activity, scores, and totals update through Supabase Realtime." />
      </section>

      <Leaderboard competitors={competitors.slice(0, 6)} highlightId={activeCompetitor?.id} />
    </PageShell>
  );
}

function Feature({ icon: Icon, title, text }) {
  const featureIcon = <Icon className="text-brand-600 dark:text-brand-100" />;

  return (
    <div className="glass-card p-5">
      {featureIcon}
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}
