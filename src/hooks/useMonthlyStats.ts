import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

interface MonthlyData {
  month: string;
  eleitores: number;
  indicacoes: number;
  demandas: number;
  ideias: number;
}

interface UpcomingEvent {
  id: string;
  titulo: string;
  data_inicio: string;
  tipo: string;
  cor?: string;
  local?: string;
  descricao?: string;
}

export function useMonthlyStats() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeInstitution } = useActiveInstitution();

  useEffect(() => {
    if (activeInstitution?.cabinet_id) {
      loadMonthlyStats();
      loadUpcomingEvents();
    } else {
      // Try to load data without activeInstitution hook for now
      loadDataDirectly();
    }
  }, [activeInstitution?.cabinet_id]);

  const loadDataDirectly = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find user's gabinete
      let gabineteId: string | null = null;

      // First, check if user is a politician
      const { data: gabineteData } = await supabase
        .from('gabinetes')
        .select('id')
        .eq('politico_id', user.id)
        .eq('status', 'ativo')
        .maybeSingle();

      if (gabineteData) {
        gabineteId = gabineteData.id;
      } else {
        // Check if user is a member
        const { data: memberData } = await supabase
          .from('gabinete_members')
          .select('gabinete_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          gabineteId = memberData.gabinete_id;
        }
      }

      if (gabineteId) {
        await loadMonthlyStatsForGabinete(gabineteId);
        await loadUpcomingEventsForGabinete(gabineteId);
      }
    } catch (error) {
      console.error('Error loading data directly:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyStats = async () => {
    if (!activeInstitution?.cabinet_id) return;
    await loadMonthlyStatsForGabinete(activeInstitution.cabinet_id);
  };

  const loadMonthlyStatsForGabinete = async (gabineteId: string) => {

    try {
      const months = [];
      const now = new Date();

      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' });
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const [eleitores, indicacoes, demandas, ideias] = await Promise.all([
          supabase
            .from('eleitores')
            .select('id', { count: 'exact' })
            .eq('gabinete_id', gabineteId)
            .gte('created_at', `${yearMonth}-01`)
            .lt('created_at', `${date.getFullYear()}-${String(date.getMonth() + 2).padStart(2, '0')}-01`),

          supabase
            .from('indicacoes')
            .select('id', { count: 'exact' })
            .eq('gabinete_id', gabineteId)
            .gte('created_at', `${yearMonth}-01`)
            .lt('created_at', `${date.getFullYear()}-${String(date.getMonth() + 2).padStart(2, '0')}-01`),

          supabase
            .from('demandas')
            .select('id', { count: 'exact' })
            .eq('gabinete_id', gabineteId)
            .gte('created_at', `${yearMonth}-01`)
            .lt('created_at', `${date.getFullYear()}-${String(date.getMonth() + 2).padStart(2, '0')}-01`),

          supabase
            .from('ideias')
            .select('id', { count: 'exact' })
            .eq('gabinete_id', gabineteId)
            .gte('created_at', `${yearMonth}-01`)
            .lt('created_at', `${date.getFullYear()}-${String(date.getMonth() + 2).padStart(2, '0')}-01`)
        ]);

        months.push({
          month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
          eleitores: eleitores.count || 0,
          indicacoes: indicacoes.count || 0,
          demandas: demandas.count || 0,
          ideias: ideias.count || 0,
        });
      }

      setMonthlyData(months);
    } catch (error) {
      console.error('Error loading monthly stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    if (!activeInstitution?.cabinet_id) return;
    await loadUpcomingEventsForGabinete(activeInstitution.cabinet_id);
  };

  const loadUpcomingEventsForGabinete = async (gabineteId: string) => {
    try {
      const { data: events } = await supabase
        .from('eventos')
        .select('id, titulo, data_inicio, tipo, cor, local, descricao')
        .eq('gabinete_id', gabineteId)
        .gte('data_inicio', new Date().toISOString())
        .order('data_inicio', { ascending: true })
        .limit(10);

      setUpcomingEvents(events || []);
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    }
  };

  return {
    monthlyData,
    upcomingEvents,
    loading,
    refetch: () => {
      if (activeInstitution?.cabinet_id) {
        loadMonthlyStats();
        loadUpcomingEvents();
      } else {
        loadDataDirectly();
      }
    }
  };
}