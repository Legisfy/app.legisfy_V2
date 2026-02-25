import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useActiveInstitution } from './useActiveInstitution';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useIAChat() {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('ia_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (activeInstitution?.cabinet_id) {
        query = query.eq('gabinete_id', activeInstitution.cabinet_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conversas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      console.log('Buscando mensagens para conversa:', conversationId);
      const { data, error } = await supabase
        .from('ia_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      console.log('Mensagens encontradas:', data);
      if (error) throw error;
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      }));
      console.log('Mensagens processadas:', typedMessages);
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens",
        variant: "destructive",
      });
    }
  };

  // Send message
  const sendMessage = async (message: string) => {
    if (!user || !message.trim()) return;

    try {
      setSendingMessage(true);
      console.log('Enviando mensagem:', message);

      // Adicionar mensagem do usuário imediatamente na interface
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMessage]);

      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message: message.trim(),
          conversationId: currentConversation,
          gabineteId: activeInstitution?.cabinet_id || null
        }
      });

      console.log('Resposta da função:', { data, error });

      if (error) {
        // Remove a mensagem temporária em caso de erro
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        throw error;
      }

      const conversationId = data.conversationId;
      console.log('Conversation ID:', conversationId);
      
      // If this is a new conversation, set it as current
      if (!currentConversation) {
        setCurrentConversation(conversationId);
        await fetchConversations(); // Refresh conversations list
      }

      // Refresh messages to get the real ones from database
      await fetchMessages(conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Create new conversation
  const createNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  // Select conversation
  const selectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId);
    fetchMessages(conversationId);
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('ia_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      // If deleting current conversation, clear it
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      await fetchConversations();
      
      toast({
        title: "Sucesso",
        description: "Conversa excluída",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conversa",
        variant: "destructive",
      });
    }
  };

  // Load conversations on mount and when dependencies change
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, activeInstitution?.cabinet_id]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    sendingMessage,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    refreshConversations: fetchConversations
  };
}