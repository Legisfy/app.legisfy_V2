import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useActiveInstitution } from './useActiveInstitution';
import { Database } from '@/integrations/supabase/types';

type Demanda = Database['public']['Tables']['demandas']['Row'];
type DemandaInsert = Database['public']['Tables']['demandas']['Insert'] & {
  categoria_id?: string | null;
  tag_id?: string | null;
  data_limite?: string | null;
};
type DemandaUpdate = Database['public']['Tables']['demandas']['Update'];

export const useRealDemandas = () => {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const [demandas, setDemandas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && activeInstitution) {
      fetchDemandas();
    } else {
      setDemandas([]);
      setLoading(false);
    }
  }, [user, activeInstitution]);

  const fetchDemandas = async () => {
    if (!user || !activeInstitution) {
      console.log('🚫 Cannot fetch demandas: missing user or institution', {
        hasUser: !!user,
        hasInstitution: !!activeInstitution
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching demandas for cabinet_id:', activeInstitution.cabinet_id);

      const { data, error: fetchError } = await supabase
        .from('demandas')
        .select(`
          *,
          eleitores!demandas_eleitor_id_fkey(name),
          gabinete_categorias!demandas_categoria_id_fkey(nome, icone),
          gabinete_custom_tags!demandas_tag_id_fkey(name, color)
        `)
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: false });

      console.log('📊 Demandas query result:', {
        data: data?.length,
        error: fetchError,
        hasData: !!data,
        errorDetails: fetchError ? JSON.stringify(fetchError) : null
      });

      if (fetchError) {
        console.error('DEBUG: Error fetching demandas:', fetchError);
        throw fetchError;
      }

      console.log('DEBUG: Raw demandas data:', data);

      // Get user profiles separately to get author names
      const userIds = [...new Set((data || []).map(d => d.user_id))];
      console.log('DEBUG: User IDs to fetch:', userIds);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in(
          'user_id',
          userIds.filter((id): id is string => !!id)
        );

      if (profilesError) {
        console.error('DEBUG: Error fetching profiles:', profilesError);
      }
      console.log('DEBUG: Profiles data:', profiles);

      const transformedData = (data || []).map((item: any) => {
        const authorProfile = profiles?.find(p => p.user_id === item.user_id);
        const fullName = authorProfile?.full_name || 'Usuário não encontrado';
        const authorName = String(fullName).trim().split(/\s+/).slice(0, 2).join(' ');

        return {
          ...item,
          titulo: item.title || item.titulo,
          descricao: item.description || item.descricao,
          dataHora: new Date(item.created_at),
          tag: item.gabinete_custom_tags?.name || item.gabinete_categorias?.nome || 'Geral',
          categoria: item.gabinete_categorias?.nome || 'Geral',
          author: authorProfile,
          eleitor: item.eleitores,
          tag_relation: item.gabinete_custom_tags,
          autor: authorName,
          eleitorSolicitante: item.eleitores?.name || 'Eleitor não informado'
        };
      });

      console.log('DEBUG: Final transformed data:', transformedData);
      setDemandas(transformedData);
    } catch (err) {
      console.error('Error fetching demandas:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch demandas');
      setDemandas([]);
    } finally {
      setLoading(false);
    }
  };

  const createDemanda = async (demandaData: any) => {
    if (!user || !activeInstitution) {
      throw new Error('User or institution not available');
    }

    // Explicitly mapping fields to database column names (Portuguese)
    const payload = {
      titulo: demandaData.titulo || demandaData.title,
      descricao: (demandaData.descricao || demandaData.description || '').trim() || null,
      prioridade: demandaData.prioridade || demandaData.priority || 'media',
      status: demandaData.status || 'pendente',
      categoria_id: demandaData.categoria_id || null,
      tag_id: demandaData.tag_id || null,
      eleitor_id: demandaData.eleitor_id || null,
      data_limite: demandaData.data_limite || null,
      user_id: user.id,
      gabinete_id: activeInstitution.cabinet_id
    };

    console.log('🚀 Sending insert payload to demandas:', payload);

    const { data, error: createError } = await supabase
      .from('demandas')
      .insert(payload)
      .select()
      .single();

    if (createError) {
      console.error('❌ Supabase insert error:', createError);
      throw createError;
    }

    // Manually update local state since we removed real-time subscription
    await fetchDemandas();
    return data;
  };

  const updateDemanda = async (id: string, updates: DemandaUpdate) => {
    const { data, error: updateError } = await supabase
      .from('demandas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Manually update local state since we removed real-time subscription
    await fetchDemandas();
    return data;
  };

  const deleteDemanda = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('demandas')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Manually update local state since we removed real-time subscription
    await fetchDemandas();
  };

  return {
    demandas,
    loading,
    error,
    fetchDemandas,
    createDemanda,
    updateDemanda,
    deleteDemanda
  };
};