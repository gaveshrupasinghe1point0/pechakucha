import { Link } from 'react-router-dom';
import { eventConfig } from '../lib/constants';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen place-items-center bg-brand-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-brand-600 dark:text-brand-100">
            LiveVote
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{eventConfig.brand}</p>
        </Link>

        <div className="glass-card p-6 sm:p-8">
          <h1 className="text-3xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
