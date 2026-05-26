import { Activity, Users, Vote } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import Leaderboard from '../components/Leaderboard';
import CountdownBadge from '../components/CountdownBadge';
import StatCard from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';
import { useCompetitors } from '../hooks/useCompetitors';
import { useCompetitionStatus } from '../hooks/useCompetitionStatus';
import { usePresence } from '../hooks/usePresence';
import { ROLES } from '../lib/constants';

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const { competitors, activeCompetitor } = useCompetitors();
  const { status, votingEndsAt } = useCompetitionStatus();
  const onlineCount = usePresence('leaderboard');
  const totalVotes = competitors.reduce((sum, competitor) => sum + competitor.vote_count, 0);

  if (profile?.role === ROLES.VOTER) {
    return <Navigate to="/voter" replace />;
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
            Public live view
          </p>
          <h1 className="mt-2 text-4xl font-black">Competition Leaderboard</h1>
        </div>
        <CountdownBadge open={status.voting_open} endDate={votingEndsAt} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Online viewers" value={onlineCount} icon={Users} tone="emerald" />
        <StatCard label="Total votes" value={totalVotes} icon={Vote} />
        <StatCard
          label="Status"
          value={status.voting_open ? 'Live' : 'Closed'}
          icon={Activity}
          tone={status.voting_open ? 'emerald' : 'amber'}
        />
      </div>

      <Leaderboard competitors={competitors} highlightId={activeCompetitor?.id} />
    </PageShell>
  );
}
