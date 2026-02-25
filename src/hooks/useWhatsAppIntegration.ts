import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type CargoType = 'politico' | 'chefe_gabinete' | 'assessor' | 'atendente';

interface WhatsAppUser {
  id: string;
  nome: string;
  email: string;
  whatsapp_e164: string;
  gabinete_id: string;
  cargo: CargoType;
  ativo: boolean;
}

interface WebhookEvent {
  id: string;
  source: string;
  event_type: string;
  correlation_id: string;
  status_code: number;
  request: any;
  response: any;
  processed_at: string;
  created_at: string;
}

export const useWhatsAppIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para criar usuário WhatsApp
  const createWhatsAppUser = async (userData: {
    nome: string;
    email: string;
    whatsapp_e164: string;
    gabinete_id: string;
    cargo?: CargoType;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('usuarios_whatsapp')
        .insert({
          nome: userData.nome,
          email: userData.email,
          whatsapp_e164: userData.whatsapp_e164,
          gabinete_id: userData.gabinete_id,
          cargo: (userData.cargo || 'assessor') as CargoType,
          ativo: true
        })
        .select()
        .single();

      if (createError) throw createError;

      // Disparar evento de boas-vindas
      await triggerWelcomeEvent(data);

      toast({
        title: "Usuário WhatsApp criado",
        description: "O usuário foi cadastrado e receberá uma mensagem de boas-vindas.",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário WhatsApp';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para disparar evento de boas-vindas
  const triggerWelcomeEvent = async (user: WhatsAppUser) => {
    try {
      // Buscar dados do gabinete
      const { data: gabinete } = await supabase
        .from('gabinetes_whatsapp')
        .select('*')
        .eq('id', user.gabinete_id)
        .single();

      if (!gabinete) throw new Error('Gabinete não encontrado');

      // Chamar edge function para disparar evento
      const { error } = await supabase.functions.invoke('whatsapp-endpoints', {
        body: {
          action: 'trigger_welcome',
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            whatsapp_e164: user.whatsapp_e164
          },
          gabinete: {
            id: gabinete.id,
            nome: gabinete.nome
          }
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error triggering welcome event:', err);
      // Não falhar a criação do usuário por causa do evento
    }
  };

  // Função para buscar usuários WhatsApp
  const fetchWhatsAppUsers = async (gabineteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('usuarios_whatsapp')
        .select(`
          *,
          gabinetes_whatsapp!inner (
            id,
            nome
          )
        `)
        .eq('gabinete_id', gabineteId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuários WhatsApp';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar usuário WhatsApp
  const updateWhatsAppUser = async (userId: string, updates: Partial<WhatsAppUser>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('usuarios_whatsapp')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário WhatsApp';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar logs de webhook
  const fetchWebhookLogs = async (limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);

      // Simular busca de logs por enquanto
      const data: WebhookEvent[] = [];
      const fetchError = null;

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar logs de webhook';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função para testar conectividade com N8N
  const testN8NConnectivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('whatsapp-endpoints', {
        body: {
          action: 'test_connectivity'
        }
      });

      if (error) throw error;

      toast({
        title: "Teste de conectividade",
        description: "Conectividade com N8N testada com sucesso.",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao testar conectividade';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar estatísticas WhatsApp
  const fetchWhatsAppStats = async (gabineteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [
        { count: usuariosCount },
        { count: eleitoresCount },
        { count: demandasCount },
        { count: ideiasCount },
        { count: indicacoesCount }
      ] = await Promise.all([
        supabase
          .from('usuarios_whatsapp')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', gabineteId)
          .eq('ativo', true),
        supabase
          .from('eleitores_whatsapp')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', gabineteId),
        supabase
          .from('demandas_whatsapp')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', gabineteId),
        supabase
          .from('ideias_whatsapp')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', gabineteId),
        supabase
          .from('indicacoes_whatsapp')
          .select('*', { count: 'exact', head: true })
          .eq('gabinete_id', gabineteId)
      ]);

      return {
        usuarios: usuariosCount || 0,
        eleitores: eleitoresCount || 0,
        demandas: demandasCount || 0,
        ideias: ideiasCount || 0,
        indicacoes: indicacoesCount || 0
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return {
        usuarios: 0,
        eleitores: 0,
        demandas: 0,
        ideias: 0,
        indicacoes: 0
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createWhatsAppUser,
    fetchWhatsAppUsers,
    updateWhatsAppUser,
    fetchWebhookLogs,
    testN8NConnectivity,
    fetchWhatsAppStats,
    triggerWelcomeEvent
  };
};