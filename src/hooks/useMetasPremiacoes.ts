import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { toast } from "@/hooks/use-toast";

export interface Meta {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'eleitores' | 'demandas' | 'ideias' | 'indicacoes';
  meta: number;
  premio: string;
  progresso?: number;
  gabinete_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Pontuacao {
  id?: string;
  acao: string;
  pontos: number;
  gabinete_id: string;
  created_at?: string;
  updated_at?: string;
}

export const useMetasPremiacoes = () => {
  const { activeInstitution } = useActiveInstitution();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [pontuacoes, setPontuacoes] = useState<Pontuacao[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultPontuacoes = [
    { acao: 'Eleitor cadastrado', pontos: 1 },
    { acao: 'Demanda criada', pontos: 1 },
    { acao: 'Demanda atualizada', pontos: 1 },
    { acao: 'Demanda atendida', pontos: 3 },
    { acao: 'Indicação criada', pontos: 1 },
    { acao: 'Indicação formalizada', pontos: 2 },
    { acao: 'Indicação atendida', pontos: 3 },
    { acao: 'Ideia de projeto de lei', pontos: 1 },
    { acao: 'Projeto de Lei formalizado', pontos: 2 }
  ];

  const loadMetas = async () => {
    if (!activeInstitution?.cabinet_id) return;

    try {
      setLoading(true);

      // Carregar metas
      const { data: metasData, error: metasError } = await supabase
        .from('gabinete_metas')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: false });

      if (metasError && metasError.code !== 'PGRST116') {
        console.error('Error loading metas:', metasError);
      }

      // Calcular progresso para cada meta
      const metasComProgresso = await Promise.all(
        (metasData || []).map(async (meta): Promise<Meta> => {
          let progresso = 0;

          try {
            switch (meta.tipo as Meta['tipo']) {
              case 'eleitores':
                const { count: eleitoresCount } = await supabase
                  .from('eleitores')
                  .select('id', { count: 'exact' })
                  .eq('gabinete_id', activeInstitution.cabinet_id);
                progresso = eleitoresCount || 0;
                break;
              case 'demandas':
                const { count: demandasCount } = await supabase
                  .from('demandas')
                  .select('id', { count: 'exact' })
                  .eq('gabinete_id', activeInstitution.cabinet_id)
                  .eq('status', 'resolvida');
                progresso = demandasCount || 0;
                break;
              case 'ideias':
                const { count: ideiasCount } = await supabase
                  .from('ideias')
                  .select('id', { count: 'exact' })
                  .eq('gabinete_id', activeInstitution.cabinet_id)
                  .eq('status', 'aprovada');
                progresso = ideiasCount || 0;
                break;
              case 'indicacoes':
                const { count: indicacoesCount } = await supabase
                  .from('indicacoes')
                  .select('id', { count: 'exact' })
                  .eq('gabinete_id', activeInstitution.cabinet_id)
                  .eq('status', 'atendida');
                progresso = indicacoesCount || 0;
                break;
            }
          } catch (error) {
            console.error('Error calculating progress for meta:', meta.id, error);
          }

          return {
            ...meta,
            tipo: meta.tipo as Meta['tipo'],
            descricao: meta.descricao || '',
            progresso
          } as Meta;
        })
      );

      setMetas(metasComProgresso);

      // Carregar pontuações
      const { data: pontuacoesData, error: pontuacoesError } = await supabase
        .from('gabinete_pontuacoes')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id);

      if (pontuacoesError && pontuacoesError.code !== 'PGRST116') {
        console.error('Error loading pontuacoes:', pontuacoesError);
        // Se não existir tabela ou dados, usar padrão
        setPontuacoes(defaultPontuacoes.map(p => ({ ...p, gabinete_id: activeInstitution.cabinet_id })));
      } else {
        // Se não há dados salvos, usar padrão
        if (!pontuacoesData || pontuacoesData.length === 0) {
          setPontuacoes(defaultPontuacoes.map(p => ({ ...p, gabinete_id: activeInstitution.cabinet_id })));
        } else {
          setPontuacoes(pontuacoesData);
        }
      }

    } catch (error) {
      console.error('Error loading metas and pontuacoes:', error);
      // Em caso de erro, usar pontuações padrão
      setPontuacoes(defaultPontuacoes.map(p => ({ ...p, gabinete_id: activeInstitution.cabinet_id })));
    } finally {
      setLoading(false);
    }
  };

  const salvarMeta = async (metaData: Omit<Meta, 'id' | 'gabinete_id' | 'created_at' | 'updated_at'>) => {
    if (!activeInstitution?.cabinet_id) {
      toast({
        title: "Erro",
        description: "Gabinete não identificado",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gabinete_metas')
        .insert({
          ...metaData,
          gabinete_id: activeInstitution.cabinet_id
        })
        .select()
        .single();

      if (error) throw error;

      setMetas(prev => [{ ...data, progresso: 0, tipo: data.tipo as Meta['tipo'], descricao: data.descricao || '' } as Meta, ...prev]);

      toast({
        title: "Sucesso",
        description: "Meta adicionada com sucesso!"
      });

      return data;
    } catch (error) {
      console.error('Error saving meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar meta",
        variant: "destructive"
      });
    }
  };

  const removerMeta = async (metaId: string) => {
    try {
      const { error } = await supabase
        .from('gabinete_metas')
        .delete()
        .eq('id', metaId);

      if (error) throw error;

      setMetas(prev => prev.filter(m => m.id !== metaId));

      toast({
        title: "Sucesso",
        description: "Meta removida com sucesso!"
      });
    } catch (error) {
      console.error('Error removing meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover meta",
        variant: "destructive"
      });
    }
  };

  const salvarPontuacoes = async (novasPontuacoes: Omit<Pontuacao, 'id' | 'gabinete_id' | 'created_at' | 'updated_at'>[]) => {
    if (!activeInstitution?.cabinet_id) {
      toast({
        title: "Erro",
        description: "Gabinete não identificado",
        variant: "destructive"
      });
      return;
    }

    try {
      // Primeiro, remover todas as pontuações existentes
      await supabase
        .from('gabinete_pontuacoes')
        .delete()
        .eq('gabinete_id', activeInstitution.cabinet_id);

      // Inserir as novas pontuações
      const { data, error } = await supabase
        .from('gabinete_pontuacoes')
        .insert(
          novasPontuacoes.map(p => ({
            ...p,
            gabinete_id: activeInstitution.cabinet_id
          }))
        )
        .select();

      if (error) throw error;

      setPontuacoes(data || []);

      toast({
        title: "Sucesso",
        description: "Configurações de pontuação salvas!"
      });

      return data;
    } catch (error) {
      console.error('Error saving pontuacoes:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pontuações",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (activeInstitution?.cabinet_id) {
      loadMetas();
    }
  }, [activeInstitution?.cabinet_id]);

  return {
    metas,
    pontuacoes,
    loading,
    loadMetas,
    salvarMeta,
    removerMeta,
    salvarPontuacoes,
    defaultPontuacoes
  };
};