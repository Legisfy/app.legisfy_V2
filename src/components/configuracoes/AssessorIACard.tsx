import { Bot, Loader2, Lightbulb, Send, Calendar, MessageSquare, Settings2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, Suspense, lazy } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { AssessorIAConfirmationModal } from "@/components/modals/AssessorIAConfirmationModal";
import { Badge } from "@/components/ui/badge";

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
    id: 'agenda',
    name: 'Lembretes de Agenda',
    description: 'Avisa sobre compromissos e reuniões',
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'aniversariantes',
    name: 'Aniversariantes',
    description: 'Envia mensagens automáticas de parabéns',
    icon: Lightbulb,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
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
          setWhatsappNumber(data.numero_whatsapp || "");
        }
      } catch (error) {
        console.error("Erro ao buscar assessor:", error);
      } finally {
        setLoading(false);
      }
    };
    loadExistingAssessor();
  }, [cabinet?.cabinet_id]);

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
        comportamento: comportamiento.trim(),
        mensagem_boas_vindas: `Olá! Eu sou ${nome.trim()}, seu assistente virtual. Como posso ajudar?`,
        numero_whatsapp: whatsappNumber.trim(),
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
                    Descreva o comportamento com detalhes — quanto mais específico, melhor a IA se adapta ao gabinete.
                  </p>
                </div>
              </div>
            </div>

            {/* Formulário + Atividades */}
            <div className="flex-1 p-5 lg:p-6 space-y-5">

              <div className="flex items-center gap-2.5 pb-3 border-b border-border">
                <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                  <Settings2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Configurar Assessor</h3>
                  <p className="text-[10px] text-muted-foreground">Defina o nome, personalidade e atividades</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">WhatsApp de Contato</Label>
                    <Input
                      placeholder="Ex: 5511999999999"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comportamento e Personalidade</Label>
                  <Textarea
                    placeholder="Ex: Seja cordial e objetivo. Priorize demandas de saúde e educação. Encaminhe casos urgentes ao gabinete..."
                    value={comportamento}
                    onChange={(e) => setComportamento(e.target.value)}
                    className="min-h-[100px] text-sm resize-none"
                  />
                </div>

                {/* Atividades do Assessor */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Atividades Automatizadas</Label>
                    <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-1.5 py-0 h-4">
                      Via WhatsApp
                    </Badge>
                  </div>
  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {IA_ACTIVITIES.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <div
                          key={activity.id}
                          className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-800/50 bg-[#0a0a0a] transition-all hover:border-zinc-700/50 text-center space-y-2 group"
                        >
                          <div className={`h-10 w-10 ${activity.bg} rounded-full flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <Icon className={`h-5 w-5 ${activity.color}`} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-zinc-200 leading-tight">{activity.name}</p>
                            <p className="text-[9px] text-zinc-500 mt-1 leading-relaxed hidden sm:block">{activity.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botão Salvar */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-1.5">
                  {existingAssessor && (
                    <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Assessor configurado
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleCriarAssessor}
                  className="h-10 px-6 text-xs font-bold rounded-xl shadow-lg shadow-primary/10 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" /> : null}
                  {existingAssessor ? 'Atualizar Assessor' : 'Criar Assessor IA'}
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
