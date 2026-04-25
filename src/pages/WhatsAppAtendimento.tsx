import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useDemandCategories } from "@/hooks/useDemandCategories";
import { useIndicationCategories } from "@/hooks/useIndicationCategories";
import { useRealDemandas } from "@/hooks/useRealDemandas";
import { useRealIndicacoes } from "@/hooks/useRealIndicacoes";
import { useRealEleitores } from "@/hooks/useRealEleitores";
import { useAuthContext } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  Send, 
  Smile, 
  Paperclip, 
  Mic, 
  User,
  Plus,
  Calendar,
  MapPin,
  Tag,
  ChevronRight,
  MessageSquare,
  FileCheck,
  Check,
  StickyNote,
  Trash2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from "@/components/layouts/AppLayout";

// Evolution API Integration Page

import { useAssessores } from "@/hooks/useAssessores";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  MessageCircle, 
  Inbox,
  LayoutGrid,
  History,
  Mail,
  Home,
  Briefcase,
  Cake,
  VenetianMask
} from 'lucide-react';

export default function WhatsAppAtendimento() {
  const { eleitores, loading: loadingEleitores, updateEleitor } = useRealEleitores();
  const { assessores, loading: loadingAssessores } = useAssessores();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const { categories: demandCategories } = useDemandCategories();
  const { getTagsByCategory: getIndicationTagsByCategory, getCategories: getIndicationCategories } = useIndicationCategories();
  const { demandas, createDemanda } = useRealDemandas();
  const { indicacoes, createIndicacao } = useRealIndicacoes();
  const { toast } = useToast();
  const { activeInstitution } = useActiveInstitution();
  
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [activeFolder, setActiveFolder] = useState<'all' | 'novo' | 'em_atendimento' | 'aguardando' | 'atendido'>('all');
  const [sidePanel, setSidePanel] = useState<'profile' | 'demanda' | 'indicacao'>('profile');
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageNotes, setMessageNotes] = useState<Record<string, any>>({});
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [integration, setIntegration] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const [loadingLastMessages, setLoadingLastMessages] = useState(false);

  // Filter eleitores for WhatsApp (those with a phone number)
  const whatsappEleitores = React.useMemo(() => eleitores.filter(e => !!e.whatsapp), [eleitores]);

  // Mapear telefones para conversas (Eleitores conhecidos + Contatos novos)
  const allConversations = React.useMemo(() => {
    const conversationsMap: Record<string, any> = {};

    // 1. Adicionar todos os eleitores que têm WhatsApp
    whatsappEleitores.forEach(eleitor => {
      const phone = eleitor.whatsapp?.replace(/\D/g, '') || '';
      conversationsMap[phone] = {
        id: eleitor.id,
        name: eleitor.name,
        phone: phone,
        eleitor: eleitor,
        lastMsg: lastMessages[phone] || null,
        updated_at: eleitor.updated_at
      };
    });

    // 2. Adicionar contatos da conversation_history que não são eleitores cadastrados (ou match falhou)
    Object.keys(lastMessages).forEach(phone => {
      if (!conversationsMap[phone]) {
        conversationsMap[phone] = {
          id: `unknown-${phone}`,
          name: `+${phone}`,
          phone: phone,
          eleitor: null,
          lastMsg: lastMessages[phone],
          updated_at: lastMessages[phone].created_at
        };
      }
    });

    return Object.values(conversationsMap).sort((a: any, b: any) => {
      const dateA = new Date(a.lastMsg?.created_at || a.updated_at).getTime();
      const dateB = new Date(b.lastMsg?.created_at || b.updated_at).getTime();
      return dateB - dateA;
    });
  }, [whatsappEleitores, lastMessages]);

  const filteredConversations = allConversations.filter((chat: any) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          chat.phone.includes(searchTerm);
    
    if (activeFolder === 'all') return matchesSearch;
    return matchesSearch && (chat.eleitor as any)?.whatsapp_status === activeFolder;
  });

  // Auto-selecionar ao carregar
  useEffect(() => {
    if (!selectedPhone && allConversations.length > 0) {
      setSelectedPhone(allConversations[0].phone);
    }
  }, [allConversations, selectedPhone]);

  const selectedChat = allConversations.find((c: any) => c.phone === selectedPhone) || null;
  const selectedEleitor = selectedChat?.eleitor || null;

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'novo': return 'Novo';
      case 'em_atendimento': return 'Em atendimento';
      case 'aguardando': return 'Aguardando resposta';
      case 'atendido': return 'Atendido';
      default: return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'novo': return 'bg-blue-500 text-white';
      case 'em_atendimento': return 'bg-orange-500 text-white';
      case 'aguardando': return 'bg-red-500 text-white';
      case 'atendido': return 'bg-green-500 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  // States for Real Demanda Form
  const [demandaData, setDemandaData] = useState({
    titulo: "",
    descricao: "",
    prioridade: "media",
    categoria_id: "",
    tag_id: "",
  });

  // States for Real Indicacao Form
  const [indicacaoData, setIndicacaoData] = useState({
    titulo: "",
    justificativa: "",
    endereco_rua: "",
    endereco_bairro: "",
    endereco_cep: "",
    cidade: "Vitória",
    estado: "ES",
    requestedByVoter: true,
    category: "",
    tag: "",
  });

  const fetchAttendanceLogs = React.useCallback(async () => {
    if (!selectedEleitor?.id) return;
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tabela', 'eleitores')
        .eq('registro_id', selectedEleitor.id)
        .in('acao', ['atribuicao_assessor', 'status_whatsapp'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttendanceLogs(data || []);
    } catch (err) {
      console.error('Erro ao buscar logs de atendimento:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [selectedEleitor?.id]);

  const fetchIntegration = async () => {
    if (!activeInstitution?.cabinet_id) return;
    try {
      const { data, error } = await supabase
        .from('ia_integrations')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .eq('whatsapp_enabled', true)
        .maybeSingle();

      if (error) throw error;
      setIntegration(data);
    } catch (err) {
      console.error('Erro ao buscar integração:', err);
    }
  };
  
  const fetchLastMessages = async () => {
    if (!activeInstitution?.cabinet_id) return;
    setLoadingLastMessages(true);
    try {
      // Buscar a última mensagem de cada telefone para este gabinete
      const { data, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const lastMsgsMap: Record<string, any> = {};
      data?.forEach(msg => {
        if (!lastMsgsMap[msg.telefone]) {
          lastMsgsMap[msg.telefone] = msg;
        }
      });
      setLastMessages(lastMsgsMap);
    } catch (err) {
      console.error('Erro ao buscar últimas mensagens:', err);
    } finally {
      setLoadingLastMessages(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedPhone || !activeInstitution?.cabinet_id) return;
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('telefone', selectedPhone)
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Se houver mensagens, buscar notas
      if (data && data.length > 0) {
        const messageIds = data.map(m => m.id);
        const { data: notes, error: notesError } = await supabase
          .from('chat_message_notes')
          .select('*, assessor:assessores(nome)')
          .in('message_id', messageIds);
        
        if (!notesError && notes) {
          const notesMap: Record<string, any> = {};
          notes.forEach(n => {
            notesMap[n.message_id] = n;
          });
          setMessageNotes(notesMap);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedPhone || !activeInstitution?.cabinet_id || !integration) {
      if (!integration) toast({ title: "WhatsApp Desconectado", description: "Configure o WhatsApp em 'Meu Gabinete' primeiro.", variant: "destructive" });
      return;
    }
    
    setIsSending(true);
    const phone = selectedPhone;
    const msgContent = message.trim();
    setMessage(""); // Limpar input para UX fluida
    
    try {
      // 1. Salvar no histórico (Banco de Dados)
      const { data: newMsg, error: dbError } = await supabase
        .from('conversation_history')
        .insert({
          gabinete_id: activeInstitution.cabinet_id,
          telefone: phone,
          role: 'assistant',
          content: msgContent
        })
        .select()
        .single();
        
      if (dbError) throw dbError;
      
      // Atualizar estado local imediatamente
      setMessages(prev => [...prev, newMsg]);

      // 2. Enviar via Evolution API real
      const response = await fetch(`${integration.whatsapp_api_url}/message/sendText/${integration.whatsapp_instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': integration.whatsapp_api_key
        },
        body: JSON.stringify({
          number: phone,
          text: msgContent
        })
      });

      if (!response.ok) {
        console.error('Erro Evolution API:', await response.text());
        toast({ title: "Atenção", description: "A mensagem foi salva no histórico, mas o envio real via WhatsApp pode ter falhado.", variant: "warning" } as any);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      toast({ title: "Erro ao enviar", description: "Não foi possível completar o envio.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveNote = async (messageId: string) => {
    if (!newNoteContent.trim()) return;
    setIsSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Tentar encontrar o assessor vinculado ao usuário logado
      const { data: currentAssessor } = await supabase
        .from('assessores')
        .select('id')
        .eq('email', user?.email)
        .single();

      const { error } = await supabase
        .from('chat_message_notes')
        .upsert({
          message_id: messageId,
          content: newNoteContent,
          assessor_id: currentAssessor?.id || null,
          gabinete_id: activeInstitution.cabinet_id
        }, { onConflict: 'message_id' });

      if (error) throw error;
      
      toast({ title: "Nota Salva!", description: "O comentário foi adicionado com sucesso." });
      setEditingNoteFor(null);
      setNewNoteContent("");
      fetchMessages(); // Recarregar para pegar o nome do assessor
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
      toast({ title: "Erro", description: "Falha ao salvar a nota.", variant: "destructive" });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_message_notes')
        .delete()
        .eq('message_id', messageId);

      if (error) throw error;
      
      const newNotes = { ...messageNotes };
      delete newNotes[messageId];
      setMessageNotes(newNotes);
      toast({ title: "Nota Removida", description: "O comentário foi excluído." });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao remover nota.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!activeInstitution?.cabinet_id) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_history',
          filter: `gabinete_id=eq.${activeInstitution.cabinet_id}`
        },
        (payload) => {
          console.log('Nova mensagem recebida via Realtime:', payload);
          // Atualizar o mapa de últimas mensagens
          const newMsg = payload.new;
          setLastMessages(prev => ({
            ...prev,
            [newMsg.telefone]: newMsg
          }));

          // Se a mensagem for para o eleitor selecionado, atualizar o chat
          const selectedPhone = selectedEleitor?.whatsapp?.replace(/\D/g, '');
          if (newMsg.telefone === selectedPhone) {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeInstitution?.cabinet_id, selectedPhone]);

  useEffect(() => {
    fetchIntegration();
    fetchLastMessages();
  }, [activeInstitution?.cabinet_id]);

  useEffect(() => {
    fetchAttendanceLogs();
    fetchMessages();
  }, [selectedPhone, activeInstitution?.cabinet_id]);

  // Form Handlers
  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setIndicacaoData(prev => ({
          ...prev,
          endereco_rua: data.logradouro || "",
          endereco_bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || ""
        }));
        toast({ title: "CEP encontrado!", description: "Endereço preenchido." });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCreateDemanda = async () => {
    if (!demandaData.titulo || !demandaData.categoria_id) {
      toast({ title: "Erro", description: "Preencha o título e a categoria.", variant: "destructive" });
      return;
    }
    if (!selectedEleitor) {
      toast({ title: "Erro", description: "Selecione um eleitor para criar a demanda.", variant: "destructive" });
      return;
    }
    setLoadingForm(true);
    try {
      await createDemanda({
        ...demandaData,
        eleitor_id: selectedEleitor.id,
      });
      toast({ title: "Demanda Criada!", description: "A demanda foi registrada com sucesso." });
      setSidePanel('profile');
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao criar demanda.", variant: "destructive" });
    } finally {
      setLoadingForm(false);
    }
  };

  const handleCreateIndicacao = async () => {
    if (!indicacaoData.titulo || !indicacaoData.category || !indicacaoData.tag) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }
    if (!selectedEleitor) {
      toast({ title: "Erro", description: "Selecione um eleitor para criar a indicação.", variant: "destructive" });
      return;
    }
    setLoadingForm(true);
    try {
      await createIndicacao({
        ...indicacaoData,
        eleitor_id: indicacaoData.requestedByVoter ? selectedEleitor.id : null,
      } as any);
      toast({ title: "Indicação Criada!", description: "A indicação foi registrada com sucesso." });
      setSidePanel('profile');
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao criar indicação.", variant: "destructive" });
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-64px)] bg-[#f0f2f5] dark:bg-[#0b141a] overflow-hidden transition-colors duration-300">
        {/* Coluna 1: Pastas/Filtros */}
        <div className="w-[80px] border-r border-black/5 dark:border-white/5 bg-[#f0f2f5] dark:bg-[#202c33] flex flex-col items-center py-4 gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveFolder('all')}
            className={cn("h-12 w-12 rounded-xl transition-all", activeFolder === 'all' ? "bg-white dark:bg-white/10 text-[#00a884] shadow-sm" : "text-slate-500")}
            title="Todas"
          >
            <Inbox className="h-6 w-6" />
          </Button>

          <div className="w-8 h-[1px] bg-black/5 dark:bg-white/10" />

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveFolder('novo')}
            className={cn("h-12 w-12 rounded-xl transition-all", activeFolder === 'novo' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-500")}
            title="Novas"
          >
            <Plus className="h-6 w-6" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveFolder('em_atendimento')}
            className={cn("h-12 w-12 rounded-xl transition-all", activeFolder === 'em_atendimento' ? "bg-green-600 text-white shadow-lg shadow-green-600/20" : "text-slate-500")}
            title="Em Atendimento"
          >
            <Clock className="h-6 w-6" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveFolder('aguardando')}
            className={cn("h-12 w-12 rounded-xl transition-all", activeFolder === 'aguardando' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-slate-500")}
            title="Aguardando Resposta"
          >
            <History className="h-6 w-6" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveFolder('atendido')}
            className={cn("h-12 w-12 rounded-xl transition-all", activeFolder === 'atendido' ? "bg-slate-500 text-white shadow-lg shadow-slate-500/20" : "text-slate-500")}
            title="Atendidas"
          >
            <CheckCircle2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Coluna 2: Lista de Conversas */}
        <div className={cn(
          "border-r border-black/5 dark:border-white/5 bg-white dark:bg-[#111b21] flex flex-col transition-all duration-300 ease-in-out",
          leftPanelOpen ? "w-[350px]" : "w-0 overflow-hidden"
        )}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#111b21] dark:text-white tracking-tight">
                {activeFolder === 'all' ? 'Mensagens' : getStatusLabel(activeFolder)}
              </h2>
              <Button variant="ghost" size="icon" className="text-black/40 dark:text-white/40">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/20 dark:text-white/20" />
              <Input 
                placeholder="Buscar eleitor..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#f0f2f5] dark:bg-white/5 border-none text-sm rounded-xl"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-2 pb-4 space-y-1">
              {filteredConversations.map((chat) => {
                const eleitor = chat.eleitor;
                const status = (eleitor as any)?.whatsapp_status || 'novo';
                const assignedTo = assessores.find(a => a.id === (eleitor as any)?.assigned_assessor_id);
                const lastMsg = chat.lastMsg;

                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedPhone(chat.phone)}
                    className={cn(
                      "group relative p-3 rounded-xl cursor-pointer transition-all duration-200",
                      selectedPhone === chat.phone 
                        ? "bg-[#f0f2f5] dark:bg-white/10 shadow-sm" 
                        : "hover:bg-[#f5f6f6] dark:hover:bg-white/5"
                    )}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12 border border-black/5 dark:border-white/5 shadow-sm">
                        {eleitor?.profile_photo_url ? (
                          <AvatarImage src={eleitor.profile_photo_url} />
                        ) : (
                          <AvatarFallback className="bg-[#00a884]/20 text-[#00a884] font-bold">
                            {chat.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-sm text-[#111b21] dark:text-white truncate">{chat.name}</span>
                          <span className="text-[10px] text-black/30 dark:text-white/30 lowercase">
                            {lastMsg 
                              ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <p className="text-xs text-black/40 dark:text-white/40 truncate mb-1">
                          {lastMsg ? lastMsg.content : "Sem mensagens"}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          {eleitor && (
                            <Badge className={cn("text-[8px] px-1.5 py-0 h-4 border-0 rounded-full font-black uppercase tracking-tighter", getStatusColor(status))}>
                              {getStatusLabel(status)}
                            </Badge>
                          )}
                          {!eleitor && (
                             <Badge className="text-[8px] px-1.5 py-0 h-4 bg-slate-500/10 text-slate-500 border-0 rounded-full font-black uppercase tracking-tighter">
                               Novo Contato
                             </Badge>
                          )}
                           {assignedTo ? (
                             <div className="flex items-center gap-1 px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-600 rounded-full">
                               <User className="h-2 w-2" />
                               <span className="text-[8px] font-black uppercase tracking-tighter truncate">{assignedTo.nome.split(' ')[0]}</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-1 px-1.5 py-0 h-4 bg-slate-500/10 text-slate-500 rounded-full">
                               <Clock className="h-2 w-2" />
                               <span className="text-[8px] font-black uppercase tracking-tighter truncate">
                                 {new Date(chat.updated_at).toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4 opacity-20">
                  <MessageCircle className="h-12 w-12 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhuma conversa encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Coluna 2: Janela de Chat */}
        <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative shadow-inner">
          <div className="h-16 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-6 bg-[#f0f2f5] dark:bg-[#202c33] z-10 transition-colors">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="mr-2 text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10 border border-black/5 dark:border-white/5">
                {selectedEleitor?.profile_photo_url ? (
                  <AvatarImage src={selectedEleitor.profile_photo_url} />
                ) : (
                  <AvatarFallback className="bg-[#00a884] text-white font-bold text-xs uppercase">
                    {selectedChat?.name.substring(0, 2)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-bold text-sm text-[#111b21] dark:text-[#e9edef]">{selectedChat?.name}</h3>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] text-black/40 dark:text-[#8696a0] font-bold">Online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all",
                  integration ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {integration ? "● Evolution API Ativa" : "○ Evolution API Offline"}
                </span>
                <span className="text-[10px] font-bold opacity-30">
                  {integration?.whatsapp_instance_name || "Sem instância"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className={cn(
                    "text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5",
                    rightPanelOpen && "text-[#00a884]"
                  )}
                >
                  <Info className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-black/40 dark:text-white/40" onClick={fetchMessages} disabled={loadingMessages}>
                  <Clock className={cn("h-5 w-5", loadingMessages && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="icon" className="text-black/40 dark:text-white/40">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6 bg-chat-pattern relative">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex justify-center mb-6">
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-[#182229] shadow-sm text-[11px] text-[#54656f] dark:text-[#8696a0] uppercase tracking-wide font-black">
                  Criptografia de ponta a ponta
                </span>
              </div>

              {loadingMessages && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                   <Clock className="h-12 w-12 animate-spin mb-4" />
                   <p className="font-black uppercase tracking-widest">Carregando Histórico...</p>
                </div>
              )}

              {!loadingMessages && selectedEleitor && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                   <History className="h-16 w-16 mb-4" />
                   <p className="font-black uppercase tracking-widest">Sem mensagens anteriores</p>
                </div>
              )}

              {!loadingMessages && messages.map((msg) => {
                const note = messageNotes[msg.id];
                const isUser = msg.role === 'user';
                
                return (
                  <div key={msg.id} className={cn("flex flex-col mb-4", isUser ? "items-start" : "items-end")}>
                    <div className="flex items-start gap-2 max-w-[85%] group">
                      {isUser ? (
                        <>
                          <div className="bg-white dark:bg-[#232d36] shadow-md border border-black/5 dark:border-white/10 p-3 rounded-2xl rounded-tl-none relative group transition-all">
                            <p className="text-sm text-[#111b21] dark:text-[#e9edef] leading-relaxed">
                              {msg.content}
                            </p>
                            <span className="text-[10px] text-black/40 dark:text-white/40 block text-right mt-1 font-bold">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mt-2"
                            onClick={() => {
                              setEditingNoteFor(msg.id);
                              setNewNoteContent(note?.content || "");
                            }}
                          >
                            <StickyNote className={cn("h-4 w-4", note ? "text-[#00a884]" : "text-black/20")} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mt-2"
                            onClick={() => {
                              setEditingNoteFor(msg.id);
                              setNewNoteContent(note?.content || "");
                            }}
                          >
                            <StickyNote className={cn("h-4 w-4", note ? "text-[#00a884]" : "text-black/20")} />
                          </Button>
                          <div className="bg-[#dcf8c6] dark:bg-[#056162] shadow-md border border-black/5 dark:border-white/10 p-3 rounded-2xl rounded-tr-none relative group transition-all">
                            <p className="text-sm text-[#111b21] dark:text-[#e9edef] leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[10px] text-black/40 dark:text-white/40 font-bold">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className="flex -space-x-1">
                                <Check className="h-3 w-3 text-[#53bdeb]" />
                                <Check className="h-3 w-3 text-[#53bdeb] -ml-2" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Área de Comentário / Nota */}
                    {(note || editingNoteFor === msg.id) && (
                      <div className={cn(
                        "mt-2 w-full max-w-[70%] animate-in slide-in-from-top-2 duration-300",
                        isUser ? "ml-4" : "mr-4"
                      )}>
                        {editingNoteFor === msg.id ? (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl shadow-inner space-y-2">
                            <Textarea 
                              value={newNoteContent}
                              onChange={(e) => setNewNoteContent(e.target.value)}
                              placeholder="Adicionar nota para esta mensagem..."
                              className="bg-white dark:bg-[#111b21] border-none text-xs min-h-[60px] resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingNoteFor(null)} className="h-7 text-[10px] uppercase font-bold">Cancelar</Button>
                              <Button size="sm" onClick={() => handleSaveNote(msg.id)} disabled={isSavingNote} className="h-7 bg-[#00a884] text-white text-[10px] uppercase font-bold px-4">
                                {isSavingNote ? 'Salvando...' : 'Salvar Nota'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-yellow-50/50 dark:bg-yellow-900/5 border border-yellow-200/50 dark:border-yellow-900/10 rounded-xl relative group/note">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <StickyNote className="h-3 w-3 text-yellow-600/60" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-600/70">Comentário Interno</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-4 w-4 opacity-0 group-hover/note:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteNote(msg.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-[11px] text-[#111b21] dark:text-[#e9edef] font-medium italic mb-2">
                              "{note.content}"
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-yellow-200/30">
                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[6px] bg-yellow-600 text-white">{note.assessor?.nome?.substring(0,2) || 'S'}</AvatarFallback>
                                </Avatar>
                                <span className="text-[9px] font-bold opacity-60">{note.assessor?.nome || 'Sistema'}</span>
                              </div>
                              <span className="text-[9px] opacity-40 font-bold uppercase">
                                {new Date(note.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2 border-t border-black/5 dark:border-white/5">
            <div className="flex-1 px-2">
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                placeholder={integration ? "Digite uma mensagem" : "Conecte o WhatsApp para enviar mensagens"}
                disabled={!integration || isSending}
                className="w-full bg-white dark:bg-[#2a3942] border-none text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#aebac1] rounded-xl h-10 px-4 focus-visible:ring-0 shadow-sm"
              />
            </div>
            <Button 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-full transition-all",
                message.trim() && integration ? "bg-[#00a884] text-white" : "bg-transparent text-[#54656f] dark:text-[#8696a0]"
              )}
              disabled={!message.trim() || !integration || isSending}
              onClick={handleSendMessage}
            >
              <Send className={cn("h-5 w-5", isSending && "animate-pulse")} />
            </Button>
          </div>
        </div>

        <div className={cn(
          "border-l border-black/5 dark:border-white/5 bg-white dark:bg-[#111b21] flex flex-col shadow-2xl transition-all duration-300 ease-in-out",
          rightPanelOpen ? "w-[420px]" : "w-0 overflow-hidden"
        )}>
          <ScrollArea className="flex-1">
            <div className="p-6">
              {sidePanel === 'profile' && selectedEleitor && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-24 w-24 border-4 border-emerald-500/20 shadow-xl">
                      {selectedEleitor.profile_photo_url ? (
                        <AvatarImage src={selectedEleitor.profile_photo_url} />
                      ) : (
                        <AvatarFallback className="text-3xl font-black bg-emerald-500 text-white">
                          {selectedEleitor.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-[#111b21] dark:text-white tracking-tight">{selectedEleitor.name}</h3>
                      <div className="flex items-center justify-center gap-1.5 bg-[#f0f2f5] dark:bg-white/5 px-3 py-1 rounded-full w-fit mx-auto border border-black/5 dark:border-white/5">
                        <Phone className="h-3 w-3 text-[#00a884]" />
                        <span className="text-xs font-bold text-black/60 dark:text-white/60">{selectedEleitor.whatsapp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => setSidePanel('demanda')} className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest gap-2 rounded-xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all">
                      <Plus className="h-4 w-4" /> Demanda
                    </Button>
                    <Button onClick={() => setSidePanel('indicacao')} variant="outline" className="h-12 border-emerald-500/50 text-emerald-500 font-black uppercase text-[10px] tracking-widest gap-2 rounded-xl border-b-4 border-emerald-500/20 active:border-b-0 active:translate-y-1 transition-all">
                      <FileCheck className="h-4 w-4" /> Indicação
                    </Button>
                  </div>

                  {/* Informações detalhadas do Eleitor */}
                  <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
                    
                    {/* Atribuição de Assessor */}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00a884]">Atribuir Responsável</Label>
                      <Select 
                        value={(selectedEleitor as any).assigned_assessor_id || "none"}
                        onValueChange={async (val) => {
                          try {
                            await updateEleitor(selectedEleitor.id, { 
                              assigned_assessor_id: val === "none" ? null : val 
                            } as any);
                            toast({ title: "Atribuído!", description: "Assessor vinculado com sucesso." });
                          } catch (err) {
                            toast({ title: "Erro", description: "Falha na atribuição.", variant: "destructive" });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-[#f0f2f5] dark:bg-white/5 border-none h-12 rounded-xl shadow-inner font-bold">
                          <SelectValue placeholder="Sem responsável" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#232d36] border-black/5 dark:border-white/10 rounded-xl shadow-2xl">
                          <SelectItem value="none" className="font-bold text-black/40 dark:text-white/40">Remover atribuição</SelectItem>
                          {assessores.map(assessor => (
                            <SelectItem key={assessor.id} value={assessor.id} className="font-bold">
                               <div className="flex items-center gap-2">
                                 <Avatar className="h-5 w-5"><AvatarFallback className="text-[8px]">{assessor.nome.substring(0,2)}</AvatarFallback></Avatar>
                                 {assessor.nome}
                               </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status do Atendimento */}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00a884]">Status do Atendimento</Label>
                      <div className="grid grid-cols-2 gap-2">
                         {(['novo', 'em_atendimento', 'aguardando', 'atendido'] as const).map(status => (
                           <button 
                             key={status}
                             onClick={async () => {
                               try {
                                 await updateEleitor(selectedEleitor.id, { whatsapp_status: status } as any);
                                 toast({ title: "Status Atualizado!", description: `Agora está como ${getStatusLabel(status)}` });
                               } catch (err) {
                                 toast({ title: "Erro", description: "Falha ao mudar status.", variant: "destructive" });
                               }
                             }}
                             className={cn(
                               "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border-2 transition-all",
                               (selectedEleitor as any).whatsapp_status === status
                                 ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                 : "border-black/5 dark:border-white/10 text-black/40 dark:text-white/40 hover:border-emerald-500/30"
                             )}
                           >
                             {getStatusLabel(status)}
                           </button>
                         ))}
                      </div>
                    </div>

                    {/* Dados Cadastrais */}
                    <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00a884]">Dados do Eleitor</Label>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-[#f0f2f5] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 group transition-all hover:border-emerald-500/30">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">E-mail</p>
                            <p className="text-xs font-black truncate">{selectedEleitor.email || '-'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-[#f0f2f5] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 group transition-all hover:border-emerald-500/30">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Bairro / Localidade</p>
                            <p className="text-xs font-black truncate">{selectedEleitor.neighborhood || '-'} {selectedEleitor.cidade ? `/ ${selectedEleitor.cidade}` : ''}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-[#f0f2f5] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 group transition-all hover:border-emerald-500/30">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Briefcase className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Profissão</p>
                            <p className="text-xs font-black truncate">{selectedEleitor.profession || '-'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-[#f0f2f5] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 group transition-all hover:border-emerald-500/30">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Cake className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Data de Nascimento</p>
                            <p className="text-xs font-black">{selectedEleitor.birth_date ? new Date(selectedEleitor.birth_date).toLocaleDateString() : '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Log de Histórico de Atendimento */}
                    <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00a884]">Log de Atendimento</Label>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 opacity-40 hover:opacity-100" 
                          onClick={fetchAttendanceLogs}
                          disabled={loadingLogs}
                        >
                          <Clock className={cn("h-3 w-3", loadingLogs && "animate-spin")} />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {attendanceLogs.length === 0 ? (
                          <div className="py-4 text-center border border-dashed border-black/5 dark:border-white/5 rounded-xl opacity-40">
                            <p className="text-[10px] font-bold uppercase tracking-wider">Aguardando novos registros...</p>
                          </div>
                        ) : (
                          attendanceLogs.map((log) => {
                            const isAssessorChange = log.acao === 'atribuicao_assessor';
                            const novoAssessor = isAssessorChange 
                              ? assessores.find(a => a.id === log.metadata.novo_assessor_id)
                              : null;
                            const statusNovo = !isAssessorChange ? log.metadata.status_novo : null;
                            
                            // Encontrar quem executou a ação (Carlos, etc)
                            // Se for o próprio político, mostramos o nome dele
                            // Se for nulo, mostramos "Sistema"
                            
                            return (
                              <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-emerald-500/20 last:pb-0">
                                <div className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#111b21]" />
                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold leading-tight">
                                    {isAssessorChange ? (
                                      <>
                                        Atribuído a <strong>{novoAssessor?.nome || 'um assessor'}</strong>
                                      </>
                                    ) : (
                                      <>
                                        Status alterado para <Badge className="text-[8px] h-4 px-1">{getStatusLabel(statusNovo || '')}</Badge>
                                      </>
                                    )}
                                  </p>
                                  <p className="text-[9px] opacity-40 font-bold uppercase tracking-tighter">
                                    {new Date(log.created_at).toLocaleString('pt-BR', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Histórico de Solicitações */}
                    <div className="space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00a884]">Histórico de Solicitações</Label>
                        <Badge variant="outline" className="text-[9px] font-bold bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                          {((demandas?.filter(d => d.eleitor_id === selectedEleitor.id) || []).length + 
                            (indicacoes?.filter(i => i.eleitor_id === selectedEleitor.id) || []).length)} Itens
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {(() => {
                          const historyItems = [
                            ...(demandas?.filter(d => d.eleitor_id === selectedEleitor.id).map(d => ({ ...d, type: 'demanda' })) || []),
                            ...(indicacoes?.filter(i => i.eleitor_id === selectedEleitor.id).map(i => ({ ...i, type: 'indicacao' })) || [])
                          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                          if (historyItems.length === 0) {
                            return (
                              <div className="py-8 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl opacity-30">
                                <History className="h-8 w-8 mx-auto mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Sem histórico registrado</span>
                              </div>
                            );
                          }

                          return historyItems.map((item: any) => (
                            <div 
                              key={`${item.type}-${item.id}`}
                              className="p-3 bg-[#f0f2f5] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 group transition-all hover:border-emerald-500/30"
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                  item.type === 'demanda' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                                )}>
                                  {item.type === 'demanda' ? <Plus className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                                      {item.type === 'demanda' ? 'Demanda' : 'Indicação'}
                                    </span>
                                    <span className="text-[9px] font-bold opacity-30 text-right shrink-0 ml-2">
                                      {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs font-black truncate mb-1">{item.titulo}</p>
                                  <div className="flex items-center justify-between">
                                    <Badge className={cn(
                                      "text-[8px] px-1.5 py-0 h-4 border-0 rounded-full font-black uppercase tracking-tighter",
                                      item.status === 'atendido' || item.status === 'concluida' ? "bg-green-500/10 text-green-600" : 
                                      item.status === 'pendente' || item.status === 'criada' ? "bg-orange-500/10 text-orange-600" :
                                      "bg-blue-500/10 text-blue-600"
                                    )}>
                                      {item.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sidePanel === 'profile' && !selectedEleitor && selectedPhone && (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                    <User className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="font-black text-lg uppercase tracking-widest mb-2 text-[#111b21] dark:text-white">Contato Não Salvo</h3>
                  <p className="text-xs text-black/40 dark:text-white/40 mb-8 max-w-[200px]">Este número de telefone ainda não está vinculado a um eleitor no sistema.</p>
                  
                  <Button className="w-full h-12 bg-[#00a884] hover:bg-[#008f6f] text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-emerald-500/20 gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Novo Eleitor
                  </Button>
                </div>
              )}

              {sidePanel === 'profile' && !selectedPhone && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                  <LayoutGrid className="h-16 w-16 mb-4" />
                  <p className="font-black uppercase tracking-widest">Painel de Detalhes</p>
                  <p className="text-[10px]">Livre para visualizar informações</p>
                </div>
              )}

              {sidePanel === 'demanda' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
                    <h3 className="font-black text-sm uppercase tracking-widest">Nova Demanda</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSidePanel('profile')}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Título*</Label>
                       <Input value={demandaData.titulo} onChange={(e)=>setDemandaData(p=>({...p,titulo:e.target.value}))} className="bg-[#f0f2f5] dark:bg-white/5 border-none rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Descrição</Label>
                       <Textarea value={demandaData.descricao} onChange={(e)=>setDemandaData(p=>({...p,descricao:e.target.value}))} className="bg-[#f0f2f5] dark:bg-white/5 border-none rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Categoria*</Label>
                         <Select value={demandaData.categoria_id} onValueChange={(val)=>setDemandaData(p=>({...p,categoria_id:val}))}>
                           <SelectTrigger className="bg-[#f0f2f5] dark:bg-white/5 border-none h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                           <SelectContent>{demandCategories.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                         </Select>
                       </div>
                       <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Prioridade</Label>
                         <Select value={demandaData.prioridade} onValueChange={(val)=>setDemandaData(p=>({...p,prioridade:val}))}>
                           <SelectTrigger className="bg-[#f0f2f5] dark:bg-white/5 border-none h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                           <SelectContent><SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="urgente">Urgente</SelectItem></SelectContent>
                         </Select>
                       </div>
                    </div>
                    <Button onClick={handleCreateDemanda} disabled={loadingForm} className="w-full h-12 bg-emerald-500 text-white font-black uppercase text-xs rounded-xl mt-4">
                      {loadingForm ? "Processando..." : "Salvar Demanda"}
                    </Button>
                  </div>
                </div>
              )}

              {sidePanel === 'indicacao' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
                    <h3 className="font-black text-sm uppercase tracking-widest">Nova Indicação</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSidePanel('profile')}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Título*</Label>
                       <Input value={indicacaoData.titulo} onChange={(e)=>setIndicacaoData(p=>({...p,titulo:e.target.value}))} className="bg-[#f0f2f5] dark:bg-white/5 border-none rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">CEP</Label>
                         <Input value={indicacaoData.endereco_cep} onChange={(e)=>{setIndicacaoData(p=>({...p,endereco_cep:e.target.value})); if(e.target.value.length===8)handleCepSearch(e.target.value)}} className="bg-[#f0f2f5] dark:bg-white/5 border-none h-10" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Bairro*</Label>
                         <Input value={indicacaoData.endereco_bairro} onChange={(e)=>setIndicacaoData(p=>({...p,endereco_bairro:e.target.value}))} className="bg-[#f0f2f5] dark:bg-white/5 border-none h-10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Categoria*</Label>
                         <Select value={indicacaoData.category} onValueChange={(val)=>setIndicacaoData(p=>({...p,category:val,tag:''}))}>
                           <SelectTrigger className="bg-[#f0f2f5] dark:bg-white/5 border-none h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                           <SelectContent>{getIndicationCategories().map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                         </Select>
                       </div>
                       <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">TAG*</Label>
                         <Select value={indicacaoData.tag} onValueChange={(val)=>setIndicacaoData(p=>({...p,tag:val}))}>
                           <SelectTrigger className="bg-[#f0f2f5] dark:bg-white/5 border-none h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                           <SelectContent>{indicacaoData.category && getIndicationTagsByCategory(indicacaoData.category).map(t=><SelectItem key={t.id} value={t.tag_type}>{t.name}</SelectItem>)}</SelectContent>
                         </Select>
                       </div>
                    </div>
                    <Button onClick={handleCreateIndicacao} disabled={loadingForm} className="w-full h-12 bg-[#5865F2] text-white font-black uppercase text-xs rounded-xl mt-4">
                      {loadingForm ? "Salvando..." : "Criar Indicação"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </AppLayout>
  );
}
