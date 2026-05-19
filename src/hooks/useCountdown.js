import { useEffect, useMemo, useState } from 'react';

export function useCountdown(endDate) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    if (!endDate) return { secondsLeft: 0, isExpired: true };
    const secondsLeft = Math.max(0, Math.ceil((new Date(endDate).getTime() - now) / 1000));
    return { secondsLeft, isExpired: secondsLeft === 0 };
  }, [endDate, now]);
}
