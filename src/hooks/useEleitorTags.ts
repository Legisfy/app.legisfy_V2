import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

export interface EleitorTag {
  id: string;
  name: string;
  color: string;
  icon: string;
  gabinete_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useEleitorTags() {
  const { activeInstitution } = useActiveInstitution();
  const [tags, setTags] = useState<EleitorTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeInstitution?.cabinet_id) {
      fetchTags();
      setupRealtimeSubscription();
    }
  }, [activeInstitution?.cabinet_id]);

  const fetchTags = async () => {
    if (!activeInstitution?.cabinet_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('eleitor_tags')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching eleitor tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!activeInstitution?.cabinet_id) return;

    const channel = supabase
      .channel('eleitor_tags_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'eleitor_tags',
          filter: `gabinete_id=eq.${activeInstitution.cabinet_id}`,
        },
        () => {
          fetchTags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createTag = async (name: string, color: string = '#3b82f6', icon: string = 'Tag') => {
    if (!activeInstitution?.cabinet_id) {
      throw new Error('Gabinete não identificado');
    }

    const { data, error } = await supabase
      .from('eleitor_tags')
      .insert({
        name,
        color,
        icon,
        gabinete_id: activeInstitution.cabinet_id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return {
    tags,
    loading,
    fetchTags,
    createTag,
  };
}
