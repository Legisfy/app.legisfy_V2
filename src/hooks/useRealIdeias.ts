import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useActiveInstitution } from './useActiveInstitution';
import { Database } from '@/integrations/supabase/types';

type Ideia = Database['public']['Tables']['ideias']['Row'];
type IdeiaInsert = Database['public']['Tables']['ideias']['Insert'];
type IdeiaUpdate = Database['public']['Tables']['ideias']['Update'];

export const useRealIdeias = () => {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const [ideias, setIdeias] = useState<Ideia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && activeInstitution) {
      fetchIdeias();
    } else {
      setIdeias([]);
      setLoading(false);
    }
  }, [user, activeInstitution]);

  const fetchIdeias = async () => {
    if (!user || !activeInstitution) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ideias')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setIdeias(data || []);
    } catch (err) {
      console.error('Error fetching ideias:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ideias');
      setIdeias([]);
    } finally {
      setLoading(false);
    }
  };

  const createIdeia = async (ideiaData: Omit<IdeiaInsert, 'user_id' | 'gabinete_id'>) => {
    if (!user || !activeInstitution) {
      throw new Error('User or institution not available');
    }

    const { data, error: createError } = await supabase
      .from('ideias')
      .insert({
        ...ideiaData,
        user_id: user.id,
        gabinete_id: activeInstitution.cabinet_id
      })
      .select()
      .single();

    if (createError) throw createError;

    setIdeias(prev => [data, ...prev]);
    return data;
  };

  const updateIdeia = async (id: string, updates: IdeiaUpdate) => {
    const { data, error: updateError } = await supabase
      .from('ideias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    setIdeias(prev => prev.map(ideia => 
      ideia.id === id ? data : ideia
    ));
    return data;
  };

  const deleteIdeia = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('ideias')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    setIdeias(prev => prev.filter(ideia => ideia.id !== id));
  };

  return {
    ideias,
    loading,
    error,
    fetchIdeias,
    createIdeia,
    updateIdeia,
    deleteIdeia
  };
};