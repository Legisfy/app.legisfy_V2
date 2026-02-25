import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AIAgentConfig {
  id: string;
  is_active: boolean;
  custom_prompt: string;
  official_whatsapp: string | null;
  max_response_time: number;
  auto_responses: boolean;
  learning_mode: boolean;
  push_notifications: boolean;
}

interface WhatsAppStats {
  conversasAtivas: number;
  usuariosConectados: number;
  mensagensProcessadas: number;
  eficienciaResolucao: number;
}

interface RecentConversation {
  id: string;
  phone_number: string;
  user_message: string;
  bot_response: string | null;
  created_at: string;
  status: string;
  response_time_ms: number | null;
}

export const useAIAgentConfig = () => {
  const [config, setConfig] = useState<AIAgentConfig | null>(null);
  const [stats, setStats] = useState<WhatsAppStats>({
    conversasAtivas: 0,
    usuariosConectados: 0,
    mensagensProcessadas: 0,
    eficienciaResolucao: 0
  });
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('ai_agent_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setConfig(data[0] as AIAgentConfig);
      }
    } catch (error) {
      console.error('Error fetching AI config:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações da IA",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      // A tabela audit_log_whatsapp ainda não existe — exibindo zeros por ora
      setStats({
        conversasAtivas: 0,
        usuariosConectados: 0,
        mensagensProcessadas: 0,
        eficienciaResolucao: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentConversations = async () => {
    try {
      // A tabela audit_log_whatsapp ainda não existe — sem conversas por ora
      setRecentConversations([]);
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
      setRecentConversations([]);
    }
  };

  const updateConfig = async (updates: Partial<AIAgentConfig>) => {
    if (!config) return;

    try {
      const { error } = await (supabase as any)
        .from('ai_agent_config')
        .update(updates)
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, ...updates });
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações",
        variant: "destructive",
      });
    }
  };

  const sendCommand = async (command: string) => {
    try {
      // Here you would send the command to your AI service
      // For now, we'll just log it
      console.log('Sending command to AI:', command);

      toast({
        title: "Comando Enviado",
        description: "Comando enviado para o agente IA",
      });
    } catch (error) {
      console.error('Error sending command:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar comando",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchConfig(),
          fetchStats(),
          fetchRecentConversations()
        ]);
      } catch (error) {
        console.error('Error loading AI agent data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up periodic updates since real-time table doesn't exist
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentConversations();
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  console.log('useAIAgentConfig hook state:', { config, stats, recentConversations, loading });

  return {
    config,
    stats,
    recentConversations,
    loading,
    updateConfig,
    sendCommand,
    refetch: () => {
      fetchConfig();
      fetchStats();
      fetchRecentConversations();
    }
  };
};