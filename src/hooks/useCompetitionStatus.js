import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const defaultStatus = {
  id: 1,
  event_name: 'NSBM PechaKucha Competition',
  voting_open: false,
  active_competitor_id: null,
  voting_duration_seconds: 30,
  voting_started_at: null,
  updated_at: null,
};

export function useCompetitionStatus() {
  const [status, setStatus] = useState(defaultStatus);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    const { data, error } = await supabase
      .from('competition_status')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) setStatus(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();

    const channel = supabase
      .channel('competition-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_status' },
        (payload) => setStatus(payload.new ?? defaultStatus),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStatus]);

  const votingEndsAt = useMemo(() => {
    if (!status.voting_started_at) return null;
    const startedAt = new Date(status.voting_started_at).getTime();
    return new Date(startedAt + status.voting_duration_seconds * 1000);
  }, [status.voting_duration_seconds, status.voting_started_at]);

  return { status, votingEndsAt, loading, reload: loadStatus };
}
