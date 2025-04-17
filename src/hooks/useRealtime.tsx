
import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type PostgresChangesPayload<T> = {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

// The correct type for Supabase realtime events
type SupabaseEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export function useRealtime<T>(
  schema: string,
  table: string, 
  event: SupabaseEventType,
  callback: (payload: PostgresChangesPayload<T>) => void
) {
  useEffect(() => {
    // Create a channel for listening to changes
    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      // Define the channel with a unique name
      channel = supabase.channel(`${schema}-${table}-changes`);
      
      // Subscribe to the channel with the specific changes we want to listen for
      channel
        .on(
          'postgres_changes',
          {
            event: event,
            schema: schema,
            table: table,
          },
          (payload) => {
            callback(payload as unknown as PostgresChangesPayload<T>);
          }
        )
        .subscribe();
    };

    setupRealtime();

    // Cleanup function to remove the channel when component unmounts
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [schema, table, event, callback]);
}
