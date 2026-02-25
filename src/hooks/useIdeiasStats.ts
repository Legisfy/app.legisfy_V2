import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

interface IdeiasStats {
  total: number;
  aprovadas: number;
  em_analise: number;
  rejeitadas: number;
  currentMonth: number;
  previousMonth: number;
  percentualMudanca: number;
}

export const useIdeiasStats = () => {
  const { activeInstitution } = useActiveInstitution();
  const [stats, setStats] = useState<IdeiasStats>({
    total: 0,
    aprovadas: 0,
    em_analise: 0,
    rejeitadas: 0,
    currentMonth: 0,
    previousMonth: 0,
    percentualMudanca: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeInstitution?.cabinet_id) {
      fetchIdeiasStats();
    }
  }, [activeInstitution?.cabinet_id]);

  const fetchIdeiasStats = async () => {
    if (!activeInstitution?.cabinet_id) return;

    try {
      setLoading(true);
      setError(null);

      // Data atual e mês anterior
      const currentDate = new Date();
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

      // Buscar todas as ideias do gabinete
      const { data: ideiasData, error: ideiasError } = await supabase
        .from('ideias')
        .select('status, created_at')
        .eq('gabinete_id', activeInstitution.cabinet_id);

      if (ideiasError) throw ideiasError;

      const ideias = ideiasData || [];

      // Calcular estatísticas por status
      const aprovadas = ideias.filter(i => i.status === 'aprovada').length;
      const em_analise = ideias.filter(i => i.status === 'em_analise' || i.status === 'rascunho').length;
      const rejeitadas = ideias.filter(i => i.status === 'rejeitada').length;

      // Calcular ideias do mês atual
      const ideiasCurrentMonth = ideias.filter(i => {
        const createdAt = new Date(i.created_at);
        return createdAt >= currentMonth && createdAt < nextMonth;
      }).length;

      // Calcular ideias do mês anterior
      const ideiasPreviousMonth = ideias.filter(i => {
        const createdAt = new Date(i.created_at);
        return createdAt >= previousMonth && createdAt < currentMonth;
      }).length;

      // Calcular percentual de mudança
      let percentualMudanca = 0;
      if (ideiasPreviousMonth > 0) {
        percentualMudanca = ((ideiasCurrentMonth - ideiasPreviousMonth) / ideiasPreviousMonth) * 100;
      } else if (ideiasCurrentMonth > 0) {
        percentualMudanca = 100;
      }

      setStats({
        total: ideias.length,
        aprovadas,
        em_analise,
        rejeitadas,
        currentMonth: ideiasCurrentMonth,
        previousMonth: ideiasPreviousMonth,
        percentualMudanca: Math.round(percentualMudanca * 10) / 10
      });

    } catch (err) {
      console.error('Error fetching ideias stats:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas das ideias');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refetch: fetchIdeiasStats
  };
};