import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useActiveInstitution } from './useActiveInstitution';
import { Database } from '@/integrations/supabase/types';

type Indicacao = Database['public']['Tables']['indicacoes']['Row'];
type IndicacaoInsert = Database['public']['Tables']['indicacoes']['Insert'];
type IndicacaoUpdate = Database['public']['Tables']['indicacoes']['Update'];

export const useRealIndicacoes = () => {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && activeInstitution) {
      fetchIndicacoes();
    } else {
      setIndicacoes([]);
      setLoading(false);
    }
  }, [user, activeInstitution]);

  const formatName = (name?: string | null) => {
    if (!name) return 'Usuário não identificado';
    const names = name.trim().split(' ');
    if (names.length <= 2) return name.trim();
    return `${names[0]} ${names[1]}`;
  };

  const fetchIndicacoes = async () => {
    if (!user || !activeInstitution) {
      console.log('🚫 Cannot fetch indicacoes: missing user or institution', {
        hasUser: !!user,
        hasInstitution: !!activeInstitution
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching indicacoes for cabinet_id:', activeInstitution.cabinet_id);

      const { data: rawIndicacoes, error: fetchError } = await supabase
        .from('indicacoes')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      if (!rawIndicacoes || rawIndicacoes.length === 0) {
        setIndicacoes([]);
        return;
      }

      // 1. EXTRACTION
      const userIds = [...new Set(rawIndicacoes.map(i => i.user_id))].filter(Boolean);
      const eleitorIds = [...new Set(rawIndicacoes.map(i => i.eleitor_id))].filter(Boolean);
      const indicacaoIds = rawIndicacoes.map(i => i.id);

      // 2. FETCHING CABINET MEMBERS (MOST RELIABLE - Includes Politico/Assessores)
      const { data: members, error: rpcError } = await (supabase as any).rpc('get_gabinete_members_with_profiles', {
        gab_id: activeInstitution.cabinet_id
      });

      if (rpcError) {
        console.warn('RPC get_gabinete_members_with_profiles failed, falling back to profiles query:', rpcError);
      }

      const memberMap = new Map((members as any[])?.map(m => [m.user_id, formatName(m.full_name)]) || []);

      // 3. FETCHING ELEITORES
      const { data: eleitores } = eleitorIds.length > 0
        ? await supabase.from('eleitores').select('id, name').in('id', eleitorIds)
        : { data: [] };
      const eleitorLookup = new Map(eleitores?.map(e => [e.id, e.name] as [string, string]));

      // 4. FETCHING STATUS EVENTS
      const { data: allEvents } = await supabase
        .from('indicacao_status_events')
        .select('indicacao_id, status, created_at, pdf_url, protocolo')
        .in('indicacao_id', indicacaoIds)
        .order('created_at', { ascending: true }); // Ascending para histórico cronológico

      const latestStatusMap = new Map();
      const protocolPdfMap = new Map();
      const protocolNumberMap = new Map();
      const statusHistoryMap = new Map<string, any[]>();

      allEvents?.forEach(event => {
        // Criar histórico cronológico
        if (!statusHistoryMap.has(event.indicacao_id)) {
          statusHistoryMap.set(event.indicacao_id, []);
        }
        statusHistoryMap.get(event.indicacao_id)?.push(event);

        // Map do status atual (último evento não observação)
        if (event.status !== 'observacao') {
          latestStatusMap.set(event.indicacao_id, event.status);

          // Se o evento tem PDF, guardamos como o PDF de protocolo mais recente
          if (event.pdf_url) {
            protocolPdfMap.set(event.indicacao_id, event.pdf_url);
          }
          // Se o evento tem número de protocolo
          if (event.protocolo) {
            protocolNumberMap.set(event.indicacao_id, event.protocolo);
          }
        }
      });

      // 5. REMAINING PROFILES (For users no longer in cabinet, historical data, or if RPC failed)
      const identifiedUserIds = new Set(memberMap.keys());
      const unidentifiedUserIds = userIds.filter(id => !identifiedUserIds.has(id));

      let fallbackProfileMap = new Map<string, string>();
      if (unidentifiedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', unidentifiedUserIds);
        profiles?.forEach(p => {
          fallbackProfileMap.set(p.user_id, formatName(p.full_name));
        });
      }

      // 6. PROCESSING
      const processedIndicacoes = rawIndicacoes.map((indicacao: any) => {
        // Try cabinet members first, then fallback profiles
        const authorName = memberMap.get(indicacao.user_id) || fallbackProfileMap.get(indicacao.user_id);
        const voterName = indicacao.eleitor_id ? eleitorLookup.get(indicacao.eleitor_id) : null;
        const currentStatus = latestStatusMap.get(indicacao.id) || indicacao.status;
        const protocolPdf = protocolPdfMap.get(indicacao.id);
        const protocolNumber = protocolNumberMap.get(indicacao.id) || indicacao.protocol;

        return {
          ...indicacao,
          userName: authorName || 'Usuário não identificado',
          eleitor_nome: voterName,
          status: currentStatus,
          protocol: protocolNumber,
          protocol_pdf_url: protocolPdf,
          status_history: statusHistoryMap.get(indicacao.id) || [],
        } as any;
      });

      setIndicacoes(processedIndicacoes);
    } catch (err) {
      console.error('Error fetching indicacoes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch indicacoes');
      setIndicacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const createIndicacao = async (indicacaoData: Omit<IndicacaoInsert, 'user_id' | 'gabinete_id'>) => {
    if (!user || !activeInstitution) {
      console.error('User or institution not available:', { user: !!user, activeInstitution });
      throw new Error('User or institution not available');
    }

    console.log('Creating indicação with data:', {
      ...indicacaoData,
      user_id: user.id,
      gabinete_id: activeInstitution.cabinet_id,
      status: 'criada'
    });

    const { data, error: createError } = await supabase
      .from('indicacoes')
      .insert({
        ...indicacaoData,
        user_id: user.id,
        gabinete_id: activeInstitution.cabinet_id,
        status: 'criada'
      })
      .select()
      .maybeSingle();

    console.log('Insert result:', { data, createError });

    if (createError) {
      console.error('Error creating indicação:', createError);
      throw createError;
    }

    if (data) {
      console.log('Successfully created indicação, creating status event...');
      // Create initial status event
      const { error: statusError } = await supabase
        .from('indicacao_status_events')
        .insert({
          indicacao_id: data.id,
          status: 'criada',
          user_id: user.id,
          notes: 'Indicação criada e salva no sistema'
        });

      if (statusError) {
        console.error('Error creating status event:', statusError);
        // Continue anyway as the indicação was created successfully
      }

      console.log('Adding to local state and triggering refresh...');
      // Get the user's name for the local state update
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const newIndicacao = {
        ...data,
        userName: formatName(profile?.full_name),
      } as any;

      setIndicacoes(prev => [newIndicacao, ...prev]);

      // Also fetch fresh data to ensure consistency
      await fetchIndicacoes();
    } else {
      console.log('No data returned, fetching fresh data...');
      await fetchIndicacoes();
    }
    return data;
  };

  const updateIndicacao = async (id: string, updates: IndicacaoUpdate) => {
    const { data, error: updateError } = await supabase
      .from('indicacoes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    setIndicacoes(prev => prev.map(indicacao =>
      indicacao.id === id ? { ...indicacao, ...data } : indicacao
    ));

    // Refresh to get any computed fields or relationships
    await fetchIndicacoes();
    return data;
  };

  const deleteIndicacao = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('indicacoes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    setIndicacoes(prev => prev.filter(indicacao => indicacao.id !== id));
  };

  const advanceStatus = async (id: string, newStatus: string, options?: { pdf_url?: string; protocolo?: string; notes?: string }) => {
    if (!user) throw new Error('User not available');

    console.log('🔄 Advancing status:', { id, newStatus, options, user_id: user.id });

    const { data, error } = await supabase
      .from('indicacao_status_events')
      .insert({
        indicacao_id: id,
        status: newStatus,
        user_id: user.id,
        pdf_url: options?.pdf_url || null,
        protocolo: options?.protocolo || null,
        notes: options?.notes || null
      })
      .select();

    if (error) {
      console.error('❌ Error creating status event:', error);
      throw error;
    }

    console.log('✅ Status event created:', data);

    // Update the local state immediately for better UX
    setIndicacoes(prev => prev.map(indicacao =>
      indicacao.id === id ? { ...indicacao, status: newStatus } : indicacao
    ));

    // Then refetch to ensure consistency
    await fetchIndicacoes();

    console.log('🔄 Indicacoes refreshed after status change');
  };

  const getStatusEvents = async (indicacaoId: string) => {
    const { data, error } = await supabase
      .from('indicacao_status_events')
      .select('*')
      .eq('indicacao_id', indicacaoId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  };

  const addObservation = async (indicacaoId: string, notes: string) => {
    if (!user) throw new Error('User not available');

    console.log('📝 Adding observation:', { indicacaoId, notes });

    const { error } = await supabase
      .from('indicacao_status_events')
      .insert({
        indicacao_id: indicacaoId,
        status: 'observacao',
        user_id: user.id,
        notes: notes.trim()
      });

    if (error) {
      console.error('❌ Error adding observation:', error);
      throw error;
    }

    // Refresh to update the timeline in the UI
    await fetchIndicacoes();
  };

  return {
    indicacoes,
    loading,
    error,
    fetchIndicacoes,
    createIndicacao,
    updateIndicacao,
    deleteIndicacao,
    advanceStatus,
    getStatusEvents,
    addObservation
  };
};