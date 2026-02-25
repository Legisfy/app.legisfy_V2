import { useState, useEffect } from 'react';
import { useRealEleitores } from './useRealEleitores';
import { useRealDemandas } from './useRealDemandas';
import { useRealIndicacoes } from './useRealIndicacoes';

export interface EleitorWithStats {
  id: string;
  user_id: string;
  name: string;
  birth_date?: string | null;
  address: string;
  neighborhood: string;
  whatsapp: string;
  email?: string | null;
  social_media?: string | null;
  tags?: string[] | null;
  profile_photo_url?: string | null;
  sex?: string | null;
  profession?: string | null;
  cep?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
  gabinete_id: string;
  owner_user_id?: string | null;
  institution_id?: string | null;
  // Stats
  totalIndicacoes: number;
  totalDemandas: number;
  indicacoesAtendidas: number;
  demandasAtendidas: number;
  isAtendido: boolean;
}

export const useEleitoresWithStats = () => {
  console.log('🔵 useEleitoresWithStats hook called');
  const { eleitores, loading: eleitoresLoading, error: eleitoresError } = useRealEleitores();
  const { demandas, loading: demandasLoading } = useRealDemandas();
  const { indicacoes, loading: indicacoesLoading } = useRealIndicacoes();
  
  console.log('🔵 useEleitoresWithStats data:', {
    eleitores: eleitores?.length,
    eleitoresLoading,
    eleitoresError,
    eleitoresArray: eleitores,
    demandas: demandas?.length,
    demandasLoading,
    demandasArray: demandas,
    indicacoes: indicacoes?.length,
    indicacoesLoading,
    indicacoesArray: indicacoes
  });
  
  const [eleitoresWithStats, setEleitoresWithStats] = useState<EleitorWithStats[]>([]);
  
  useEffect(() => {
    console.log('🔄 useEleitoresWithStats effect triggered');
    if (!eleitoresLoading && !demandasLoading && !indicacoesLoading) {
      console.log('🔄 All hooks loaded, processing data...');
      
      if (!Array.isArray(eleitores)) {
        console.error('❌ Eleitores is not an array:', eleitores);
        setEleitoresWithStats([]);
        return;
      }
      
      const eleitoresComEstatisticas = eleitores.map(eleitor => {
        // Contar demandas do eleitor
        const demandasDoEleitor = demandas.filter(d => d.eleitor_id === eleitor.id);
        const totalDemandas = demandasDoEleitor.length;
        const demandasAtendidas = demandasDoEleitor.filter(d => 
          d.status === 'concluida' || d.status === 'resolvida' || d.status === 'finalizada'
        ).length;
        
        // Contar indicações do eleitor
        const indicacoesDoEleitor = indicacoes.filter(i => i.eleitor_id === eleitor.id);
        const totalIndicacoes = indicacoesDoEleitor.length;
        const indicacoesAtendidas = indicacoesDoEleitor.filter(i => 
          i.status === 'atendida'
        ).length;
        
        // Determinar se está atendido (todas as demandas e indicações foram atendidas)
        const temDemandas = totalDemandas > 0;
        const temIndicacoes = totalIndicacoes > 0;
        const todasDemandasAtendidas = !temDemandas || demandasAtendidas === totalDemandas;
        const todasIndicacoesAtendidas = !temIndicacoes || indicacoesAtendidas === totalIndicacoes;
        const isAtendido = (temDemandas || temIndicacoes) && todasDemandasAtendidas && todasIndicacoesAtendidas;
        
        return {
          ...eleitor,
          totalIndicacoes,
          totalDemandas,
          indicacoesAtendidas,
          demandasAtendidas,
          isAtendido
        };
      });
      
      console.log('✅ Processed eleitores with stats:', {
        count: eleitoresComEstatisticas.length,
        sample: eleitoresComEstatisticas[0]
      });
      setEleitoresWithStats(eleitoresComEstatisticas);
    } else {
      console.log('⏳ Still loading:', { eleitoresLoading, demandasLoading, indicacoesLoading });
    }
  }, [eleitores, demandas, indicacoes, eleitoresLoading, demandasLoading, indicacoesLoading]);
  
  return {
    eleitores: eleitoresWithStats,
    loading: eleitoresLoading || demandasLoading || indicacoesLoading,
    error: eleitoresError
  };
};