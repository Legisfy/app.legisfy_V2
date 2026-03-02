import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

interface PeriodData {
  label: string;
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

// Alias for backward compat
type MonthlyData = PeriodData;

export function useMonthlyStats() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [weeklyData, setWeeklyData] = useState<PeriodData[]>([]);
  const [todayData, setTodayData] = useState<PeriodData[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeInstitution } = useActiveInstitution();

  useEffect(() => {
    if (activeInstitution?.cabinet_id) {
      loadAllStats(activeInstitution.cabinet_id);
      loadUpcomingEventsForGabinete(activeInstitution.cabinet_id);
    } else {
      loadDataDirectly();
    }
  }, [activeInstitution?.cabinet_id]);

  const loadDataDirectly = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let gabineteId: string | null = null;

      const { data: gabineteData } = await supabase
        .from('gabinetes')
        .select('id')
        .eq('politico_id', user.id)
        .eq('status', 'ativo')
        .maybeSingle();

      if (gabineteData) {
        gabineteId = gabineteData.id;
      } else {
        const { data: memberData } = await (supabase as any)
          .from('gabinete_members')
          .select('gabinete_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (memberData) gabineteId = (memberData as any).gabinete_id;
      }

      if (gabineteId) {
        await loadAllStats(gabineteId);
        await loadUpcomingEventsForGabinete(gabineteId);
      }
    } catch (error) {
      console.error('Error loading data directly:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllStats = async (gabineteId: string) => {
    await Promise.all([
      loadMonthlyStatsForGabinete(gabineteId),
      loadWeeklyStatsForGabinete(gabineteId),
      loadTodayStatsForGabinete(gabineteId),
    ]);
    setLoading(false);
  };

  // ─── MENSAL: últimos 6 meses ───────────────────────────────────────────────
  const loadMonthlyStatsForGabinete = async (gabineteId: string) => {
    try {
      const months = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' });
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const nextMonth = `${date.getFullYear()}-${String(date.getMonth() + 2).padStart(2, '0')}-01`;

        const [eleitores, indicacoes, demandas, ideias] = await Promise.all([
          supabase.from('eleitores').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', `${yearMonth}-01`).lt('created_at', nextMonth),
          supabase.from('indicacoes').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', `${yearMonth}-01`).lt('created_at', nextMonth),
          supabase.from('demandas').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', `${yearMonth}-01`).lt('created_at', nextMonth),
          supabase.from('ideias').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', `${yearMonth}-01`).lt('created_at', nextMonth),
        ]);

        months.push({
          label: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
          month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1), // backward compat
          eleitores: eleitores.count || 0,
          indicacoes: indicacoes.count || 0,
          demandas: demandas.count || 0,
          ideias: ideias.count || 0,
        });
      }

      setMonthlyData(months as any);
    } catch (error) {
      console.error('Error loading monthly stats:', error);
    }
  };

  // ─── SEMANAL: últimos 7 dias ───────────────────────────────────────────────
  const loadWeeklyStatsForGabinete = async (gabineteId: string) => {
    try {
      const days = [];
      const now = new Date();
      const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
        const label = i === 0 ? 'Hoje' : DAY_LABELS[date.getDay()];

        const [eleitores, indicacoes, demandas, ideias] = await Promise.all([
          supabase.from('eleitores').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', dayStart).lt('created_at', dayEnd),
          supabase.from('indicacoes').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', dayStart).lt('created_at', dayEnd),
          supabase.from('demandas').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', dayStart).lt('created_at', dayEnd),
          supabase.from('ideias').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', dayStart).lt('created_at', dayEnd),
        ]);

        days.push({ label, eleitores: eleitores.count || 0, indicacoes: indicacoes.count || 0, demandas: demandas.count || 0, ideias: ideias.count || 0 });
      }

      setWeeklyData(days);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    }
  };

  // ─── HOJE: por turno (Manhã / Tarde / Noite) ──────────────────────────────
  const loadTodayStatsForGabinete = async (gabineteId: string) => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const turns = [
        { label: 'Manhã', from: 0, to: 12 },
        { label: 'Tarde', from: 12, to: 18 },
        { label: 'Noite', from: 18, to: 24 },
      ];

      const result = await Promise.all(turns.map(async (turn) => {
        const from = new Date(todayStart); from.setHours(turn.from);
        const to = new Date(todayStart); to.setHours(turn.to);
        const fromISO = from.toISOString();
        const toISO = to.toISOString();

        const [eleitores, indicacoes, demandas, ideias] = await Promise.all([
          supabase.from('eleitores').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', fromISO).lt('created_at', toISO),
          supabase.from('indicacoes').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', fromISO).lt('created_at', toISO),
          supabase.from('demandas').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', fromISO).lt('created_at', toISO),
          supabase.from('ideias').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).gte('created_at', fromISO).lt('created_at', toISO),
        ]);

        return { label: turn.label, eleitores: eleitores.count || 0, indicacoes: indicacoes.count || 0, demandas: demandas.count || 0, ideias: ideias.count || 0 };
      }));

      setTodayData(result);
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
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
    weeklyData,
    todayData,
    upcomingEvents,
    loading,
    refetch: () => {
      if (activeInstitution?.cabinet_id) {
        loadAllStats(activeInstitution.cabinet_id);
        loadUpcomingEventsForGabinete(activeInstitution.cabinet_id);
      } else {
        loadDataDirectly();
      }
    }
  };
}
