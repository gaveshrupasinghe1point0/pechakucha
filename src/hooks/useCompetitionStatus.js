import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const defaultStatus = {
  id: 1,
  event_name: 'NSBM PechaKucha Competition',
  voting_open: false,
  active_competitor_id: null,
  voting_duration_seconds: 30,
  voting_started_at: null,
  winners_page_enabled: false,
  updated_at: null,
};

const CompetitionStatusContext = createContext(null);

export function CompetitionStatusProvider({ children }) {
  const [status, setStatus] = useState(defaultStatus);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    const { data, error } = await supabase
      .from('competition_status')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      setStatus((current) => ({ ...defaultStatus, ...current, ...data }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();

    const channel = supabase
      .channel('competition-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_status' },
        (payload) => {
          if (payload.new) {
            setStatus((current) => ({ ...defaultStatus, ...current, ...payload.new }));
          }
        },
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

  const value = useMemo(
    () => ({ status, votingEndsAt, loading, reload: loadStatus }),
    [loadStatus, loading, status, votingEndsAt],
  );

  return createElement(CompetitionStatusContext.Provider, { value }, children);
}

export function useCompetitionStatus() {
  const context = useContext(CompetitionStatusContext);
  if (!context) {
    throw new Error('useCompetitionStatus must be used within CompetitionStatusProvider');
  }
  return context;
}
