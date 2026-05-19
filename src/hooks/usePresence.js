import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

function createPresenceKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function usePresence(room = 'event-lobby') {
  const { user, profile } = useAuth();
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const channel = supabase.channel(room, {
      config: { presence: { key: user?.id ?? createPresenceKey() } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user?.id ?? 'guest',
            role: profile?.role ?? 'guest',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.role, room, user?.id]);

  return onlineCount;
}
