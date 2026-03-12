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
import { useState, useEffect, Suspense, lazy } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { AssessorIAConfirmationModal } from "@/components/modals/AssessorIAConfirmationModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Spline = lazy(() => import('@splinetool/react-spline'));

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
  }, [cabinet?.cabinet_id]);

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
      // 1. Save Assessor
      const assessorPayload = {
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
            <div className="lg:w-80 bg-zinc-900/50 border-r border-border/50 flex flex-col relative overflow-hidden min-h-[400px]">
              <div className="relative z-10 p-5 pb-0 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800/60 rounded-full border border-zinc-700/40">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">IA Legislativa</span>
                </div>
                <h2 className="text-xl font-extrabold text-zinc-200 tracking-tight leading-tight">
                  Meu <span className="text-zinc-300">Assessor IA</span>
                </h2>
                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  Um verdadeiro assessor de inteligência artificial que atua dentro do seu WhatsApp.
                </p>
              </div>

              <div className="h-64 lg:h-80 relative flex items-center justify-center overflow-hidden flex-1">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <Bot className="h-20 w-20 text-zinc-700 animate-pulse" />
                  </div>
                }>
                  <Spline
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                  />
                </Suspense>
              </div>

              <div className="relative z-10 px-5 pb-5">
                <div className="bg-zinc-800/40 border border-zinc-700/30 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb className="h-3 w-3 text-zinc-400" />
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Dica</span>
                  </div>
                  <p className="text-zinc-400 text-[10px] leading-relaxed">
                    Personalize o comportamento para que ele responda com a voz do seu mandato.
                  </p>
                </div>
              </div>
            </div>

            {/* Direita: Configurações e Conexão */}
            <div className="flex-1 p-5 lg:p-6 space-y-8">
              
              {/* Seção 1: Identidade e Personalidade */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Personalidade e Escopo</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome do Assessor</Label>
                    <Input
                      placeholder="Ex: Maria Assessora"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="h-10 text-sm bg-zinc-900/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Número Oficial</Label>
                    <Input
                      placeholder="Ex: 5511999999999"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="h-10 text-sm font-mono bg-zinc-900/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comportamento do Assessor</Label>
                  <Textarea
                    placeholder="Como o assessor deve agir? (Ex: Cordial, focado em saúde, encaminhar demandas...)"
                    value={comportamento}
                    onChange={(e) => setComportamento(e.target.value)}
                    className="min-h-[100px] text-sm resize-none bg-zinc-900/20"
                  />
                </div>
              </div>

              {/* Seção 2: Conexão WhatsApp Integrada */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <h3 className="text-sm font-bold text-foreground">Conexão WhatsApp</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={whatsappEnabled ? "success" : "secondary"} className="text-[8px] uppercase font-bold">
                      {whatsappEnabled ? "Ativo" : "Inativo"}
                    </Badge>
                    <Switch 
                      checked={whatsappEnabled} 
                      onCheckedChange={setWhatsappEnabled}
                      className="scale-75"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="shrink-0 w-44 h-44 bg-white p-2.5 rounded-xl shadow-lg relative group overflow-hidden">
                    {whatsappEnabled && apiUrl && apiKey ? (
                      <QrCode className="h-full w-full text-zinc-900" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center opacity-20">
                        <QrCode className="h-20 w-20 text-zinc-400" />
                      </div>
                    )}
                    {(!whatsappEnabled || !apiUrl || !apiKey) && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-3 text-center">
                        <AlertCircle className="h-6 w-6 text-amber-500 mb-1" />
                        <p className="text-[9px] font-bold text-zinc-200 uppercase leading-snug">
                          Salve para <br /> conectar
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Status da Conexão</p>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          whatsappEnabled ? "bg-green-500 animate-pulse" : "bg-amber-500"
                        )} />
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          whatsappEnabled ? "text-green-500" : "text-amber-500"
                        )}>
                          {whatsappEnabled ? "Operando / Conectado" : "Aguardando Ativação"}
                        </span>
                      </div>
                    </div>

                    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="border border-border/40 rounded-lg overflow-hidden bg-muted/5">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full flex items-center justify-between px-3 py-2 h-auto text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          Configurações Técnicas
                          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 border-t border-border/40 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[8px] uppercase tracking-wider text-muted-foreground">Provedor</Label>
                            <select 
                              value={provider} 
                              onChange={(e) => setProvider(e.target.value)} 
                              className="w-full h-8 bg-background border border-border rounded px-2 text-[10px]"
                            >
                              <option value="evolution">Evolution API</option>
                              <option value="zapi">Z-API</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] uppercase tracking-wider text-muted-foreground">Instância</Label>
                            <Input 
                              placeholder="gabinete-id" 
                              value={instanceName} 
                              onChange={(e) => setInstanceName(e.target.value)}
                              className="h-8 text-[10px]" 
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] uppercase tracking-wider text-muted-foreground">URL da API</Label>
                          <Input 
                            placeholder="https://sua-api.com" 
                            value={apiUrl} 
                            onChange={(e) => setApiUrl(e.target.value)}
                            className="h-8 text-[10px]" 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] uppercase tracking-wider text-muted-foreground">API Token/Key</Label>
                          <Input 
                            type="password" 
                            placeholder="Seu Token" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)}
                            className="h-8 text-[10px]" 
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              </div>

              {/* Seção 3: Atividades (Grid Expandido) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-foreground">Capacidades do Assessor</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {IA_ACTIVITIES.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800/50 bg-[#0a0a0a] transition-all hover:bg-zinc-900/50 text-center space-y-1.5 group"
                      >
                        <div className={`h-8 w-8 ${activity.bg} rounded-full flex items-center justify-center transition-transform group-hover:scale-110`}>
                          <Icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <p className="text-[9px] font-bold text-zinc-300 leading-tight uppercase tracking-tight">{activity.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botão Salvar Geral */}
              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  {existingAssessor && (
                    <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Assessor pronto para operar
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSalvarTudo}
                  className="h-10 px-8 text-xs font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
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
