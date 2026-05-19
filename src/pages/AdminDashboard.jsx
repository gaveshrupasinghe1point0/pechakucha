import { Link } from 'react-router-dom';
import {
  Activity,
  Clock,
  GraduationCap,
  ImagePlus,
  PlusCircle,
  RadioTower,
  Trash2,
  Users,
  Vote,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import CountdownBadge from '../components/CountdownBadge';
import Leaderboard from '../components/Leaderboard';
import StatCard from '../components/StatCard';
import { useCompetitors } from '../hooks/useCompetitors';
import { useCompetitionStatus } from '../hooks/useCompetitionStatus';
import { usePresence } from '../hooks/usePresence';
import { supabase } from '../lib/supabase';

function splitDuration(totalSeconds = 30) {
  return {
    minutes: Math.floor(Number(totalSeconds) / 60),
    seconds: Number(totalSeconds) % 60,
  };
}

export default function AdminDashboard() {
  const { competitors, activeCompetitor, reload } = useCompetitors();
  const { status, votingEndsAt } = useCompetitionStatus();
  const onlineCount = usePresence('admin-monitor');
  const [duration, setDuration] = useState(() => splitDuration(status.voting_duration_seconds ?? 30));
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [competitorForm, setCompetitorForm] = useState({
    competitorCode: '',
    studentId: '',
    fullName: '',
    presentationTitle: '',
    profileImage: null,
  });

  const totalVotes = useMemo(
    () => competitors.reduce((sum, competitor) => sum + competitor.vote_count, 0),
    [competitors],
  );

  async function activateCompetitor(competitorId) {
    setSavingId(competitorId);
    const { error } = await supabase
      .from('competitors')
      .update({ is_active: true })
      .eq('id', competitorId);
    setSavingId(null);

    if (error) toast.error(error.message);
    else {
      toast.success('Voting enabled for this competitor.');
      reload();
    }
  }

  async function closeVoting() {
    const { error } = await supabase
      .from('competition_status')
      .update({ voting_open: false, active_competitor_id: null, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) toast.error(error.message);
    else toast.success('Voting closed.');
  }

  async function removeCompetitor(competitor) {
    const confirmed = window.confirm(
      `Remove ${competitor.full_name}? This also removes their votes and judge scores. This is useful for testing, but cannot be undone.`,
    );
    if (!confirmed) return;

    setSavingId(competitor.id);

    if (competitor.is_active) {
      await supabase
        .from('competition_status')
        .update({ voting_open: false, active_competitor_id: null, updated_at: new Date().toISOString() })
        .eq('id', 1);
    }

    const { error } = await supabase.from('competitors').delete().eq('id', competitor.id);
    setSavingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Competitor removed.');
    reload();
  }

  async function updateDuration() {
    const totalSeconds = Number(duration.minutes) * 60 + Number(duration.seconds);
    if (totalSeconds < 5 || totalSeconds > 600) {
      toast.error('Voting duration must be between 5 seconds and 10 minutes.');
      return;
    }

    const { error } = await supabase
      .from('competition_status')
      .update({ voting_duration_seconds: totalSeconds, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) toast.error(error.message);
    else toast.success('Voting timer updated.');
  }

  async function createCompetitor(event) {
    event.preventDefault();
    setCreating(true);

    let profileImageUrl = null;
    if (competitorForm.profileImage) {
      const file = competitorForm.profileImage;
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      const filePath = `${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('competitor-photos')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        setCreating(false);
        toast.error(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('competitor-photos').getPublicUrl(filePath);
      profileImageUrl = data.publicUrl;
    }

    const { error } = await supabase.from('competitors').insert({
      competitor_code: competitorForm.competitorCode.trim().toUpperCase(),
      student_id: competitorForm.studentId.trim().toUpperCase(),
      full_name: competitorForm.fullName.trim(),
      presentation_title: competitorForm.presentationTitle.trim(),
      department: 'PechaKucha',
      profile_image_url: profileImageUrl,
    });

    setCreating(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Competitor created.');
    setCompetitorForm({
      competitorCode: '',
      studentId: '',
      fullName: '',
      presentationTitle: '',
      profileImage: null,
    });
    event.target.reset();
    reload();
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
            Admin command center
          </p>
          <h1 className="mt-2 text-4xl font-black">Live competition control</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="btn-secondary" to="/admin/voter-activity">
            <Users size={18} />
            Voter Activity
          </Link>
          <Link className="btn-secondary" to="/admin/users">
            <Users size={18} />
            Users
          </Link>
          <Link className="btn-secondary" to="/voter">
            <Vote size={18} />
            Vote
          </Link>
          <CountdownBadge open={status.voting_open} endDate={votingEndsAt} />
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Online users" value={onlineCount} icon={Users} tone="emerald" />
        <StatCard label="Total votes" value={totalVotes} icon={Vote} />
        <StatCard label="Active speaker" value={activeCompetitor ? '1' : '0'} icon={RadioTower} tone="amber" />
        <StatCard label="Status" value={status.voting_open ? 'Open' : 'Closed'} icon={Activity} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <section className="glass-card overflow-hidden">
            <div className="border-b border-slate-200/70 p-5 dark:border-white/10">
              <h2 className="text-2xl font-black">Create competitor</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add profile image, student ID, competitor ID, name, and topic.
              </p>
            </div>

            <form className="space-y-4 p-5" onSubmit={createCompetitor}>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="input-field"
                  placeholder="Competitor ID e.g. PK-001"
                  value={competitorForm.competitorCode}
                  onChange={(event) =>
                    setCompetitorForm({ ...competitorForm, competitorCode: event.target.value })
                  }
                  required
                />
                <input
                  className="input-field"
                  placeholder="Student ID"
                  value={competitorForm.studentId}
                  onChange={(event) =>
                    setCompetitorForm({ ...competitorForm, studentId: event.target.value.toUpperCase() })
                  }
                  required
                />
              </div>
              <input
                className="input-field"
                placeholder="Competitor full name"
                value={competitorForm.fullName}
                onChange={(event) => setCompetitorForm({ ...competitorForm, fullName: event.target.value })}
                required
              />
              <input
                className="input-field"
                placeholder="Topic / presentation title"
                value={competitorForm.presentationTitle}
                onChange={(event) =>
                  setCompetitorForm({ ...competitorForm, presentationTitle: event.target.value })
                }
                required
              />
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-white/15 dark:text-slate-400">
                <ImagePlus size={20} />
                {competitorForm.profileImage?.name ?? 'Upload competitor profile picture'}
                <input
                  className="hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setCompetitorForm({ ...competitorForm, profileImage: event.target.files?.[0] ?? null })
                  }
                />
              </label>
              <button className="btn-primary w-full" disabled={creating}>
                <PlusCircle size={19} />
                {creating ? 'Creating competitor...' : 'Create competitor'}
              </button>
            </form>
          </section>

          <section className="glass-card overflow-hidden">
          <div className="border-b border-slate-200/70 p-5 dark:border-white/10">
            <h2 className="text-2xl font-black">Presentation voting controls</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              When a competitor starts presenting, enable voting for that competitor. The database
              automatically closes voting for everyone else and starts the timer.
            </p>
          </div>

          <div className="border-b border-slate-200/70 p-5 dark:border-white/10">
            <label className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Voting timer
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Minutes
                </span>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="10"
                  value={duration.minutes}
                  onChange={(event) => setDuration({ ...duration, minutes: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Seconds
                </span>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="59"
                  value={duration.seconds}
                  onChange={(event) => setDuration({ ...duration, seconds: event.target.value })}
                />
              </label>
              <button className="btn-secondary whitespace-nowrap" onClick={updateDuration}>
                <Clock size={18} /> Save
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Example: 0 minutes 30 seconds = 30 sec voting window. Maximum is 10 minutes.
            </p>
          </div>

          <div className="divide-y divide-slate-200/70 dark:divide-white/10">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="p-5">
                <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-white/10"
                      src={competitor.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(competitor.full_name)}&background=16a34a&color=fff`}
                      alt={competitor.full_name}
                    />
                    <div>
                    <h3 className="text-lg font-black">{competitor.full_name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{competitor.presentation_title}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {competitor.competitor_code} | {competitor.student_id}
                    </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={competitor.is_active ? 'btn-secondary' : 'btn-primary'}
                      disabled={savingId === competitor.id}
                      onClick={() => activateCompetitor(competitor.id)}
                    >
                      <RadioTower size={18} />
                      {competitor.is_active ? 'Voting enabled now' : 'Enable voting'}
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-white/10 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      disabled={savingId === competitor.id}
                      onClick={() => removeCompetitor(competitor)}
                    >
                      <Trash2 size={18} />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ScorePill icon={Vote} label="Voter score" value={competitor.vote_count} />
                  <ScorePill
                    icon={GraduationCap}
                    label="Judge score"
                    value={Number(competitor.judge_score).toFixed(1)}
                  />
                </div>
                {competitor.is_active && (
                  <div className="rounded-2xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                    Voters can vote for this competitor now until the countdown ends.
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5">
            <button className="btn-secondary w-full" onClick={closeVoting}>
              Close voting
            </button>
          </div>
          </section>
        </div>

        <Leaderboard competitors={competitors} highlightId={activeCompetitor?.id} />
      </div>
    </PageShell>
  );
}

function ScorePill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3 dark:bg-white/10">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {Icon && <Icon size={15} />}
        {label}
      </div>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
