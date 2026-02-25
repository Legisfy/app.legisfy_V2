import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';

// Helper to extract first and second names from full name
const firstTwoNames = (name?: string) => {
  if (!name) return 'Usuário';
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).join(' ');
};

type DemandaStatusEvent = {
  id: string;
  demanda_id: string;
  user_id: string;
  status: string;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  new_deadline: string | null;
  author_name?: string;
};

type DemandaStatusEventInsert = {
  demanda_id: string;
  status: string;
  notes?: string;
  new_deadline?: string | null;
};

export const useDemandaStatusEvents = () => {
  const { user } = useAuthContext();
  const [events, setEvents] = useState<DemandaStatusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (demandaId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('demanda_status_events')
        .select('*')
        .eq('demanda_id', demandaId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const eventsData = data || [];
      const userIds = Array.from(new Set(eventsData.map(e => e.user_id).filter(Boolean)));

      let nameMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds as string[]);
        if (profiles) {
          nameMap = new Map(profiles.map(p => [p.user_id as string, firstTwoNames(p.full_name as string)]));
        }
      }

      setEvents(eventsData.map(e => ({ ...e, author_name: nameMap.get(e.user_id) || 'Usuário' })));

    } catch (err) {
      console.error('Error fetching demanda status events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const createStatusEvent = async (eventData: DemandaStatusEventInsert) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error: createError } = await supabase
      .from('demanda_status_events')
      .insert({
        ...eventData,
        user_id: user.id
      })
      .select()
      .single();

    if (createError) throw createError;

    // Add the new event to local state without refetching
    const currentName = firstTwoNames((user.user_metadata as any)?.full_name || user.email?.split('@')[0]);
    const augmented = { ...data, author_name: currentName } as DemandaStatusEvent;
    setEvents(prevEvents => [augmented, ...prevEvents]);
    
    return augmented;
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    createStatusEvent
  };
};