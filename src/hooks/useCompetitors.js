import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const competitorSelect =
  'id,profile_id,competitor_code,student_id,full_name,presentation_title,profile_image_url,vote_count,judge_score,is_active,created_at';

export function useCompetitors({ realtime = true } = {}) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCompetitors = useCallback(async () => {
    const { data, error } = await supabase
      .from('competitors')
      .select(competitorSelect)
      .order('created_at', { ascending: true });

    if (!error) setCompetitors(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCompetitors();

    if (!realtime) return undefined;

    const channel = supabase
      .channel('competitors-leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competitors' },
        () => loadCompetitors(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCompetitors, realtime]);

  const activeCompetitor = useMemo(
    () => competitors.find((competitor) => competitor.is_active) ?? null,
    [competitors],
  );

  return { competitors, activeCompetitor, loading, reload: loadCompetitors };
}
