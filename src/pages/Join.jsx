import { QRCodeCanvas } from 'qrcode.react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { eventConfig } from '../lib/constants';

export default function Join() {
  const joinUrl = `${window.location.origin}/signup`;

  return (
    <PageShell>
      <div className="mx-auto grid max-w-5xl items-center gap-8 py-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
            Fast audience onboarding
          </p>
          <h1 className="mt-3 text-5xl font-black">Scan to join the live vote</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Display this page on the event screen. Students can scan, verify their NSBM email,
            and vote from any mobile device.
          </p>
          <Link className="btn-primary mt-7" to="/leaderboard">
            Open live leaderboard
          </Link>
        </div>

        <div className="glass-card mx-auto p-8 text-center">
          <div className="rounded-3xl bg-white p-5">
            <QRCodeCanvas value={joinUrl} size={280} includeMargin />
          </div>
          <p className="mt-5 text-xl font-black">{eventConfig.name}</p>
          <p className="mt-2 break-all text-sm text-slate-500 dark:text-slate-400">{joinUrl}</p>
        </div>
      </div>
    </PageShell>
  );
}
