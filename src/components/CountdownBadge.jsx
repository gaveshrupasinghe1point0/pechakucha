import { Timer } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';

export default function CountdownBadge({ endDate, open }) {
  const { secondsLeft, isExpired } = useCountdown(endDate);
  const active = open && !isExpired;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeLabel =
    minutes > 0
      ? `${minutes} min ${seconds.toString().padStart(2, '0')} sec left`
      : `${secondsLeft} sec left`;

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-3xl px-5 py-3 text-lg font-black shadow-lg sm:text-xl ${
        active
          ? 'bg-emerald-500/15 text-emerald-700 shadow-emerald-500/10 dark:text-emerald-200'
          : 'bg-rose-500/15 text-rose-700 shadow-rose-500/10 dark:text-rose-200'
      }`}
    >
      <Timer size={24} />
      {active ? `${timeLabel} to vote` : 'Voting closed'}
    </div>
  );
}
