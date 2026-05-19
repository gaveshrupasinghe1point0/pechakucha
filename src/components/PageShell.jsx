import Navbar from './Navbar';

export default function PageShell({ children, compact = false }) {
  return (
    <div className="min-h-screen overflow-hidden bg-brand-50 dark:bg-slate-950">
      <Navbar />
      <main className={compact ? 'section-shell py-6' : 'section-shell'}>{children}</main>
    </div>
  );
}
