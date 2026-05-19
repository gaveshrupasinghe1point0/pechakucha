import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.theme === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  return (
    <button
      type="button"
      className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white"
      onClick={() => setDark((value) => !value)}
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
