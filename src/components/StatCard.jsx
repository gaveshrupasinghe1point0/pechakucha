export default function StatCard({ label, value, icon: Icon, tone = 'brand' }) {
  const toneClass =
    tone === 'emerald'
      ? 'from-emerald-500 to-teal-500'
      : tone === 'amber'
        ? 'from-amber-500 to-orange-500'
        : 'from-brand-500 to-emerald-700';

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        {Icon && (
          <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${toneClass} text-white`}>
            <Icon size={22} />
          </span>
        )}
      </div>
    </div>
  );
}
