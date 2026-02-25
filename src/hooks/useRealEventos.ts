import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useActiveInstitution } from './useActiveInstitution';
import { Database } from '@/integrations/supabase/types';

type Evento = Database['public']['Tables']['eventos']['Row'];
type EventoInsert = Database['public']['Tables']['eventos']['Insert'];
type EventoUpdate = Database['public']['Tables']['eventos']['Update'];

export const useRealEventos = () => {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && activeInstitution) {
      fetchEventos();
    } else {
      setEventos([]);
      setLoading(false);
    }
  }, [user, activeInstitution]);

  const fetchEventos = async () => {
    if (!user || !activeInstitution) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('eventos')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('data_inicio', { ascending: true });

      if (fetchError) throw fetchError;

      setEventos(data || []);
    } catch (err) {
      console.error('Error fetching eventos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch eventos');
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  const createEvento = async (eventoData: Omit<EventoInsert, 'user_id' | 'gabinete_id'>) => {
    if (!user || !activeInstitution) {
      throw new Error('User or institution not available');
    }

    const { data, error: createError } = await supabase
      .from('eventos')
      .insert({
        ...eventoData,
        user_id: user.id,
        gabinete_id: activeInstitution.cabinet_id
      })
      .select()
      .single();

    if (createError) throw createError;

    setEventos(prev => [data, ...prev]);
    return data;
  };

  const updateEvento = async (id: string, updates: EventoUpdate) => {
    const { data, error: updateError } = await supabase
      .from('eventos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    setEventos(prev => prev.map(evento => 
      evento.id === id ? data : evento
    ));
    return data;
  };

  const deleteEvento = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    setEventos(prev => prev.filter(evento => evento.id !== id));
  };

  return {
    eventos,
    loading,
    error,
    fetchEventos,
    createEvento,
    updateEvento,
    deleteEvento
  };
};