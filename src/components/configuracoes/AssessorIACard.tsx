import { 
  Bot, Loader2, Lightbulb, Send, Calendar, MessageSquare, Settings2, Check, 
  UserPlus, FileText, ClipboardList, Mic, Clock, Save, QrCode, ExternalLink, 
  AlertCircle, ChevronDown, ChevronUp 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { AssessorIAConfirmationModal } from "@/components/modals/AssessorIAConfirmationModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Atividades que o Assessor IA realiza
const IA_ACTIVITIES = [
  {
    id: 'atendimento',
    name: 'Atende Eleitores',
    description: 'Responde dúvidas e faz triagem via WhatsApp',
    icon: MessageSquare,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    id: 'demandas',
    name: 'Cadastrar Demandas',
    description: 'Registra solicitações automaticamente',
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'indicacoes',
    name: 'Cadastra Indicações',
    description: 'Organiza sugestões legislativas',
    icon: ClipboardList,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    id: 'eleitores',
    name: 'Cadastra Eleitores',
    description: 'Captura novos contatos no banco',
    icon: UserPlus,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'audio',
    name: 'Entende Áudio',
    description: 'Transcreve e interpreta mensagens de voz',
    icon: Mic,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    id: 'agenda',
    name: 'Registra Agenda',
    description: 'Marca reuniões e compromissos',
    icon: Calendar,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    id: 'lembretes',
    name: 'Envia Lembretes',
    description: 'Avisa sobre prazos e eventos',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'vintequatrosete',
    name: 'Funciona 24/7',
    description: 'Disponível dia e noite, todos os dias',
    icon: Check,
    color: 'text-zinc-500',
    bg: 'bg-zinc-500/10',
  },
];

export const AssessorIACard = () => {
  const { cabinet } = useAuthContext();
  const [nome, setNome] = useState("");
  const [comportamento, setComportamento] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [existingAssessor, setExistingAssessor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // WhatsApp Integration State
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [provider, setProvider] = useState("evolution");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("DISCONNECTED");
  const [isConnecting, setIsConnecting] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!cabinet?.cabinet_id) return;
      
      try {
        // Load Assessor Config
        const { data: assessorData } = await supabase
          .from('meu_assessor_ia')
          .select('*')
          .eq('gabinete_id', cabinet.cabinet_id)
          .maybeSingle();
        
        if (assessorData) {
          setExistingAssessor(assessorData);
          setNome(assessorData.nome || "");
          setComportamento(assessorData.comportamento || "");
          setWhatsappNumber(assessorData.numero_whatsapp || "");
        }

        // Load WhatsApp Integration
        const { data: whatsappData } = await supabase
          .from('ia_integrations' as any)
          .select('*')
          .eq('gabinete_id', cabinet.cabinet_id)
          .maybeSingle();

        if (whatsappData) {
          const config = whatsappData as any;
          setIntegrationId(config.id);
          setWhatsappEnabled(config.whatsapp_enabled || false);
          setApiUrl(config.whatsapp_api_url || "");
          setApiKey(config.whatsapp_api_key || "");
          setInstanceName(config.whatsapp_instance_name || "");
          setProvider(config.whatsapp_provider || "evolution");
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [cabinet?.cabinet_id]);

  const handleConnect = async () => {
    if (!cabinet?.cabinet_id) return;
    
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-whatsapp-instance', {
        body: { action: 'connect', gabineteId: cabinet.cabinet_id }
      });

      if (error) throw error;

      if (data.qrcode) {
        setQrCode(data.qrcode);
        setConnectionStatus(data.status);
        toast.info("Aguardando leitura do QR Code...");
        
        // Iniciar polling
        startPolling();
      } else if (data.status === 'open' || data.status === 'CONNECTED') {
        setConnectionStatus('CONNECTED');
        setWhatsappEnabled(true);
        toast.success("WhatsApp conectado com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao conectar:", error);
      toast.error("Falha ao gerar QR Code");
    } finally {
      setIsConnecting(false);
    }
  };

  const startPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('manage-whatsapp-instance', {
          body: { action: 'get-status', gabineteId: cabinet?.cabinet_id }
        });

        if (data.status === 'open' || data.status === 'CONNECTED') {
          setConnectionStatus('CONNECTED');
          setWhatsappEnabled(true);
          setQrCode(null);
          toast.success("WhatsApp conectado!");
          clearInterval(interval);
        } else if (data.qrcode) {
          setQrCode(data.qrcode);
          setConnectionStatus(data.status);
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 5000);
    
    setPollingInterval(interval);
  };

  const handleLogout = async () => {
    if (!cabinet?.cabinet_id) return;
    
    try {
      await supabase.functions.invoke('manage-whatsapp-instance', {
        body: { action: 'logout', gabineteId: cabinet.cabinet_id }
      });
      setConnectionStatus('DISCONNECTED');
      setWhatsappEnabled(false);
      setQrCode(null);
      if (pollingInterval) clearInterval(pollingInterval);
      toast.success("Desconectado com sucesso");
    } catch (error) {
      toast.error("Erro ao desconectar");
    }
  };

  const handleSalvarTudo = async () => {
    if (!nome.trim() || !comportamento.trim()) {
      toast.error("Preencha nome e comportamento do assessor");
      return;
    }
    if (!cabinet?.cabinet_id) {
      toast.error("Erro ao identificar o gabinete");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // 1. Save Assessor
      const assessorPayload: any = {
        gabinete_id: cabinet.cabinet_id,
        nome: nome.trim(),
        comportamento: comportamento.trim(),
        mensagem_boas_vindas: `Olá! Eu sou ${nome.trim()}, seu assistente virtual. Como posso ajudar?`,
        numero_whatsapp: whatsappNumber.trim(),
        updated_at: new Date().toISOString(),
      };

      if (existingAssessor) {
        await supabase.from('meu_assessor_ia').update(assessorPayload).eq('id', existingAssessor.id);
      } else {
        assessorPayload.created_by = userId;
        await supabase.from('meu_assessor_ia').insert([assessorPayload]);
      }

      // 2. Save WhatsApp Integration
      const whatsappPayload = {
        gabinete_id: cabinet.cabinet_id,
        whatsapp_enabled: whatsappEnabled,
        whatsapp_api_url: apiUrl.trim(),
        whatsapp_api_key: apiKey.trim(),
        whatsapp_instance_name: instanceName.trim(),
        whatsapp_provider: provider,
        updated_at: new Date().toISOString(),
      };

      if (integrationId) {
        await supabase.from('ia_integrations' as any).update(whatsappPayload).eq('id', integrationId);
      } else {
        await supabase.from('ia_integrations' as any).insert([whatsappPayload]);
      }

      toast.success("Configurações atualizadas com sucesso!");
      
      // Reload existing assessor to update UI
      const { data } = await supabase.from('meu_assessor_ia').select('*').eq('gabinete_id', cabinet.cabinet_id).maybeSingle();
      if (data) setExistingAssessor(data);

    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="border border-zinc-800/50 bg-card shadow-sm overflow-hidden animate-in fade-in duration-500">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Esquerda: Visual e Dica */}
            <div className="lg:w-64 bg-zinc-900/50 border-r border-border/50 flex flex-col relative overflow-hidden">
              <div className="relative z-10 p-5 pb-0 space-y-1.5">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800/60 rounded-full border border-zinc-700/40">
                  <div className="w-1 h-1 bg-zinc-400 rounded-full animate-pulse" />
                  <span className="text-[8px] font-bold text-zinc-400 tracking-widest uppercase">IA Legislativa</span>
                </div>
                <h2 className="text-lg font-extrabold text-zinc-200 tracking-tight leading-tight">
                  Meu <span className="text-zinc-300">Assessor IA</span>
                </h2>
                <p className="text-zinc-500 text-[10px] leading-relaxed">
                  Trabalhando 24/7 diretamente no seu WhatsApp.
                </p>
              </div>

              <div className="h-64 lg:h-72 relative flex items-center justify-center overflow-hidden flex-1 bg-gradient-to-b from-transparent via-zinc-500/5 to-transparent">
                <img 
                  src="https://wvvxstgpjodmfxpekhkf.supabase.co/storage/v1/object/public/LEGISFY/assessor%20ia.png" 
                  alt="Assessor IA"
                  className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] animate-in zoom-in-95 duration-1000 scale-[1.35] translate-y-2"
                />
              </div>

              <div className="relative z-10 px-5 pb-5">
                <div className="bg-zinc-800/40 border border-zinc-700/30 p-2 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <Lightbulb className="h-2.5 w-2.5 text-zinc-400" />
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Dica</span>
                  </div>
                  <p className="text-zinc-400 text-[9px] leading-relaxed">
                    Personalize o comportamento para que ele responda com a voz do seu mandato.
                  </p>
                </div>
              </div>
            </div>

            {/* Direita: Configurações e Conexão */}
            <div className="flex-1 p-5 lg:p-6 space-y-6">
              
              {/* Seção 1: Identidade e Personalidade */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                  <Settings2 className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-xs font-bold text-foreground">Personalidade e Escopo</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Nome do Assessor</Label>
                    <Input
                      placeholder="Ex: Maria Assessora"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="h-8 text-xs bg-zinc-900/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Comportamento do Assessor</Label>
                  <Textarea
                    placeholder="Como o assessor deve agir?"
                    value={comportamento}
                    onChange={(e) => setComportamento(e.target.value)}
                    className="min-h-[80px] text-xs resize-none bg-zinc-900/20"
                  />
                </div>
              </div>

              {/* Seção 2: Conexão WhatsApp Integrada (Redesenhada) */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col gap-4">
                  <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="space-y-1 mb-2 relative w-full">
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Status da Conexão</p>
                       <div className="flex items-center justify-center gap-1.5">
                         <div className={cn(
                           "h-2 w-2 rounded-full",
                           (connectionStatus === 'open' || connectionStatus === 'CONNECTED') ? "bg-green-500 animate-pulse" : "bg-amber-500"
                         )} />
                         <span className={cn(
                           "text-[10px] font-bold uppercase tracking-widest",
                           (connectionStatus === 'open' || connectionStatus === 'CONNECTED') ? "text-green-500" : "text-amber-500"
                         )}>
                           {connectionStatus === 'open' || connectionStatus === 'CONNECTED' ? "Operando / Conectado" : "Aguardando Conexão"}
                         </span>
                       </div>
                       
                       {/* Switch integrado no canto superior direito do card interno */}
                       <div className="absolute right-0 top-0 flex items-center gap-1.5">
                         <Switch 
                           checked={whatsappEnabled} 
                           onCheckedChange={setWhatsappEnabled}
                           className="scale-[0.5] data-[state=checked]:bg-green-500"
                         />
                       </div>
                    </div>

                    <div className="relative shrink-0 w-56 h-56 bg-white p-3 rounded-2xl shadow-2xl flex items-center justify-center group overflow-hidden border-4 border-zinc-800/20">
                      {qrCode ? (
                        <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code" className="w-full h-full" />
                      ) : (connectionStatus === 'open' || connectionStatus === 'CONNECTED') ? (
                        <div className="flex flex-col items-center justify-center text-green-600 space-y-2">
                          <div className="bg-green-100 p-4 rounded-full">
                            <Check className="h-16 w-16" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-tighter">Conectado com Sucesso</span>
                        </div>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center opacity-10">
                          <QrCode className="h-24 w-24 text-zinc-900" />
                        </div>
                      )}
                      
                      {(!qrCode && connectionStatus !== 'open' && connectionStatus !== 'CONNECTED') && (
                        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                          <div className="bg-primary/10 p-4 rounded-full mb-4">
                            <QrCode className="h-10 w-10 text-primary animate-pulse" />
                          </div>
                          <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-tight">Pronto para Conectar?</h4>
                          <p className="text-[10px] text-zinc-400 leading-relaxed mb-4 italic">
                            A IA assumirá o atendimento assim que você escanear o código.
                          </p>
                          <Button 
                            size="lg" 
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full shadow-xl shadow-primary/20 font-bold uppercase text-[10px] tracking-widest"
                          >
                            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Gerar QR Code Agora
                          </Button>
                        </div>
                      )}
                    </div>

                    {(qrCode || connectionStatus === 'open' || connectionStatus === 'CONNECTED') && (
                      <div className="flex flex-col gap-3 w-full max-w-xs animate-in slide-in-from-bottom-2 duration-500">
                         {qrCode && (
                           <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-start gap-3 text-left">
                              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-[9px] text-amber-200/80 leading-snug font-medium italic">
                                Abra o WhatsApp no seu celular, vá em <b>Aparelhos Conectados</b> e escaneie este código.
                              </p>
                           </div>
                         )}

                         <div className="flex gap-2 w-full">
                            {(connectionStatus === 'open' || connectionStatus === 'CONNECTED') ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleLogout}
                                className="w-full h-9 text-[9px] font-bold uppercase border-red-500/30 text-red-500 hover:bg-red-500/10 bg-red-500/5 backdrop-blur-sm"
                              >
                                Desconectar Aparelho
                              </Button>
                            ) : (
                              <Button 
                                variant="outline"
                                size="sm" 
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="w-full h-9 text-[9px] font-bold uppercase border-white/10 text-zinc-400 hover:bg-white/5"
                              >
                                {isConnecting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <QrCode className="h-3 w-3 mr-2" />}
                                Atualizar QR Code
                              </Button>
                            )}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 3: Atividades (Grid Compacto) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <h3 className="text-xs font-bold text-foreground">Capacidades</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {IA_ACTIVITIES.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-zinc-800/50 bg-[#0a0a0a] transition-all hover:bg-zinc-900/50 group"
                      >
                        <div className={`h-6 w-6 flex-shrink-0 ${activity.bg} rounded flex items-center justify-center transition-transform group-hover:scale-105`}>
                          <Icon className={`h-3 w-3 ${activity.color}`} />
                        </div>
                        <p className="text-[8px] font-bold text-zinc-300 leading-tight uppercase tracking-tighter truncate">{activity.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botão Salvar Geral */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  {existingAssessor && (
                    <span className="text-[8px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="h-2.5 w-2.5" /> Assessor Operacional
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSalvarTudo}
                  className="h-8 px-5 text-[10px] font-bold rounded-lg shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AssessorIAConfirmationModal
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
        whatsappNumber={whatsappNumber}
      />
    </>
  );
};
