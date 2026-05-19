import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, RadioTower, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { eventConfig } from '../lib/constants';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
      <nav className="section-shell flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-700 text-white shadow-glow">
            <RadioTower size={22} />
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
              LiveVote
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{eventConfig.brand}</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <NavItem to="/leaderboard">Leaderboard</NavItem>
          <NavItem to="/join">QR Join</NavItem>
          {profile?.role && <NavItem to={`/${profile.role}`}>Dashboard</NavItem>}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {profile ? (
            <button className="btn-secondary px-4 py-3" onClick={handleSignOut}>
              <LogOut size={17} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <>
              <Link className="btn-secondary hidden px-4 py-3 sm:inline-flex" to="/admin-login">
                Admin
              </Link>
              <Link className="btn-primary px-4 py-3" to="/login">
                <ShieldCheck size={17} />
                Login
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-2xl px-4 py-2 text-sm font-semibold transition ${
          isActive
            ? 'bg-brand-600 text-white'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
