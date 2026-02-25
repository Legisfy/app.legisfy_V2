import { Bot, Loader2, Lightbulb, Send, Mail, Calendar, FileText, MessageSquare, Settings2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

const Spline = lazy(() => import('@splinetool/react-spline'));

// Ferramentas disponíveis para o Assessor IA
const AVAILABLE_TOOLS = [
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Atendimento via Telegram',
    icon: Send,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    required: true,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Leitura e envio de e-mails',
    icon: Mail,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    required: false,
  },
  {
    id: 'google_calendar',
    name: 'Google Agenda',
    description: 'Criar e consultar eventos',
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    required: false,
  },
  {
    id: 'documentos',
    name: 'Documentos',
    description: 'Gerar indicações e ofícios',
    icon: FileText,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    required: false,
  },
  {
    id: 'demandas',
    name: 'Demandas',
    description: 'Registrar e consultar demandas',
    icon: MessageSquare,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    required: false,
  },
];

export const AssessorIACard = () => {
  const { cabinet } = useAuthContext();
  const [nome, setNome] = useState("");
  const [comportamento, setComportamento] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>({
    telegram: true,
    gmail: false,
    google_calendar: false,
    documentos: false,
    demandas: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [existingAssessor, setExistingAssessor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExistingAssessor = async () => {
      if (!cabinet?.cabinet_id) return;
      try {
        const { data, error } = await supabase
          .from('meu_assessor_ia')
          .select('*')
          .eq('gabinete_id', cabinet.cabinet_id)
          .maybeSingle();
        if (error) {
          console.error("Erro ao carregar assessor:", error);
          return;
        }
        if (data) {
          setExistingAssessor(data);
          setNome(data.nome);
          setComportamento(data.comportamento);
          setTelegramToken(data.numero_whatsapp || ""); // reusing field for telegram
        }
      } catch (error) {
        console.error("Erro ao buscar assessor:", error);
      } finally {
        setLoading(false);
      }
    };
    loadExistingAssessor();
  }, [cabinet?.cabinet_id]);

  const toggleTool = (toolId: string) => {
    const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
    if (tool?.required) return; // Não pode desligar ferramenta obrigatória
    setEnabledTools(prev => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  const handleCriarAssessor = async () => {
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
      const userId = userData.user?.id || '';

      const data_payload = {
        nome: nome.trim(),
        comportamento: comportamento.trim(),
        mensagem_boas_vindas: `Olá! Eu sou ${nome.trim()}, seu assistente virtual. Como posso ajudar?`,
        numero_whatsapp: telegramToken.trim(),
        gabinete_id: cabinet.cabinet_id,
        created_by: userId,
        status: 'em_aprendizado' as const,
      };

      if (existingAssessor) {
        const { data, error } = await supabase
          .from('meu_assessor_ia').update(data_payload)
          .eq('id', existingAssessor.id).select().single();
        if (error) throw error;
        setExistingAssessor(data);
        toast.success("Configurações atualizadas!");
      } else {
        const { data, error } = await supabase
          .from('meu_assessor_ia').insert(data_payload).select().single();
        if (error) throw error;
        setExistingAssessor(data);
        setShowConfirmationModal(true);
        toast.success("Assessor IA criado com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao salvar assessor:", error);
      console.error("Detalhes:", error?.message, error?.details, error?.hint, error?.code);
      toast.error(`Erro ao salvar: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-zinc-800/50 bg-card shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">

            {/* Sidebar com Robô 3D */}
            <div className="w-full lg:w-80 bg-[#0a0a0a] relative overflow-hidden lg:rounded-l-xl flex flex-col">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-zinc-700/0 via-zinc-500/40 to-zinc-700/0" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-zinc-500/5 rounded-full blur-[60px] pointer-events-none" />

              {/* Título acima do robô */}
              <div className="relative z-10 p-5 pb-0 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800/60 rounded-full border border-zinc-700/40">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">IA Legislativa</span>
                </div>
                <h2 className="text-xl font-extrabold text-zinc-200 tracking-tight leading-tight">
                  Meu <span className="text-zinc-300">Assessor IA</span>
                </h2>
                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  Configure seu assistente para atender eleitores e fazer triagem de demandas automaticamente.
                </p>
              </div>

              {/* Robô 3D — maior */}
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

              {/* Dica */}
              <div className="relative z-10 px-5 pb-5">
                <div className="bg-zinc-800/40 border border-zinc-700/30 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb className="h-3 w-3 text-zinc-400" />
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Dica</span>
                  </div>
                  <p className="text-zinc-400 text-[10px] leading-relaxed">
                    Descreva o comportamento com detalhes — quanto mais específico, melhor a IA se adapta ao gabinete.
                  </p>
                </div>
              </div>
            </div>

            {/* Formulário + Ferramentas */}
            <div className="flex-1 p-5 lg:p-6 space-y-5">

              {/* Header do Form */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-border">
                <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                  <Settings2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Configurar Assessor</h3>
                  <p className="text-[10px] text-muted-foreground">Defina o nome, personalidade e ferramentas</p>
                </div>
              </div>

              {/* Nome + Comportamento */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome do Assessor</Label>
                  <Input
                    placeholder="Ex: Maria Assessora"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comportamento e Personalidade</Label>
                  <Textarea
                    placeholder="Ex: Seja cordial e objetivo. Priorize demandas de saúde e educação. Encaminhe casos urgentes ao gabinete..."
                    value={comportamento}
                    onChange={(e) => setComportamento(e.target.value)}
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>
              </div>

              {/* Ferramentas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ferramentas Conectadas</Label>
                  <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                    {Object.values(enabledTools).filter(Boolean).length} ativas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const isEnabled = enabledTools[tool.id];
                    return (
                      <div
                        key={tool.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${isEnabled
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border bg-muted/20 hover:bg-muted/40'
                          } ${tool.required ? 'opacity-90' : ''}`}
                        onClick={() => toggleTool(tool.id)}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`h-7 w-7 ${tool.bg} rounded-md flex items-center justify-center`}>
                            <Icon className={`h-3.5 w-3.5 ${tool.color}`} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground leading-none">{tool.name}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{tool.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {tool.required && (
                            <span className="text-[8px] font-bold text-primary uppercase tracking-wider">Obrigatório</span>
                          )}
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => toggleTool(tool.id)}
                            className="scale-75"
                            disabled={tool.required}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Token Telegram (se habilitado) */}
              {enabledTools.telegram && (
                <div className="space-y-2.5 p-4 bg-[#0a0a0a] border border-zinc-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-zinc-800/60 rounded-md flex items-center justify-center">
                      <Send className="h-3 w-3 text-zinc-400" />
                    </div>
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                      Token do Bot Telegram
                    </Label>
                  </div>
                  <Input
                    placeholder="Cole aqui o token do @BotFather"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    className="h-9 text-sm font-mono bg-zinc-900 border-zinc-700/50 text-zinc-300 placeholder:text-zinc-600 text-xs"
                  />
                  <p className="text-[9px] text-zinc-500">
                    Crie um bot no <span className="font-semibold text-zinc-400">@BotFather</span> do Telegram e cole o token aqui.
                  </p>
                </div>
              )}

              {/* Botão Salvar */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  {existingAssessor && (
                    <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Assessor configurado
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleCriarAssessor}
                  className="h-9 px-5 text-xs font-bold rounded-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" /> : null}
                  {existingAssessor ? 'Atualizar Assessor' : 'Salvar Assessor'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AssessorIAConfirmationModal
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
        whatsappNumber={telegramToken}
      />
    </>
  );
};
