export default function LoadingScreen({ message = 'Preparing live event...' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-brand-500" />
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-100">{message}</p>
      </div>
    </div>
  );
}
