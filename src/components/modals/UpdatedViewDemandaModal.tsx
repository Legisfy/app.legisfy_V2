import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/components/AuthProvider";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  Calendar,
  Tag,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Plus,
  ChevronRight,
  UserCircle2,
  ArrowRight,
  History
} from "lucide-react";
import { Demanda } from "@/components/demandas/DemandasTable";
import { useDemandaStatusEvents } from "@/hooks/useDemandaStatusEvents";
import { supabase } from "@/integrations/supabase/client";
import { useDemandCategories } from "@/hooks/useDemandCategories";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

interface UpdatedViewDemandaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demanda: Demanda | null;
  onSuccess?: () => void;
}

const statusConfig = {
  pendente: {
    label: "Pendente",
    color: "bg-rose-500/20 text-rose-500 border-rose-500/30",
    glow: "shadow-[0_0_15px_-5px_#f43f5e]",
    icon: Clock
  },
  em_atendimento: {
    label: "Em Andamento",
    color: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    glow: "shadow-[0_0_15px_-5px_#f59e0b]",
    icon: PlayCircle
  },
  resolvida: {
    label: "Resolvida",
    color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    glow: "shadow-[0_0_15px_-5px_#10b981]",
    icon: CheckCircle2
  },
  cancelada: {
    label: "Cancelada",
    color: "bg-slate-500/20 text-slate-500 border-slate-500/30",
    glow: "shadow-none",
    icon: AlertCircle
  },
};

// Internal icon for "Em Atendimento" if not imported
function PlayCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "baixa":
      return { label: "Baixa", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
    case "media":
      return { label: "Média", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    case "urgente":
      return { label: "Urgente", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" };
    default:
      return { label: priority, color: "bg-slate-500/10 text-slate-500 border-slate-500/20" };
  }
};

export function UpdatedViewDemandaModal({
  open,
  onOpenChange,
  demanda,
  onSuccess
}: UpdatedViewDemandaModalProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { events, loading: eventsLoading, fetchEvents, createStatusEvent } = useDemandaStatusEvents();
  const { hasPermission } = usePermissions();
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [electorName, setElectorName] = useState<string | null>(null);
  const [quickNote, setQuickNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { tags } = useDemandCategories();

  const canWrite = hasPermission('demandas', 'write');



  const handleQuickComment = async () => {
    if (!quickNote.trim() || !demanda || !user) return;

    setIsSubmitting(true);
    console.log('📝 Tentando adicionar comentário rápido:', { demandaId: demanda.id, note: quickNote });

    try {
      await createStatusEvent({
        demanda_id: demanda.id,
        status: demanda.status,
        notes: quickNote.trim()
      });

      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi registrado com sucesso.",
      });

      setQuickNote("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('❌ Erro ao adicionar comentário:', error);
      toast({
        title: "Erro ao comentar",
        description: error.message || "Não foi possível adicionar o comentário.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!demanda || !user) return;

    setIsSubmitting(true);

    try {
      // 1. Criar o evento via hook
      await createStatusEvent({
        demanda_id: demanda.id,
        status: newStatus,
        notes: quickNote.trim() || `Alteração de status rápida para: ${newStatus}`
      });

      // 2. Atualizar a demanda
      // Nota: Algumas tabelas exigem gabinete_id no filtro se o RLS for restritivo
      const updatePayload: any = { status: newStatus };
      if (newStatus === 'resolvida') {
        updatePayload.resolvido_em = new Date().toISOString();
      }

      console.log('📤 Enviando payload de update para demandas:', updatePayload);

      const { error: updateError } = await supabase
        .from('demandas')
        .update(updatePayload)
        .eq('id', demanda.id);

      if (updateError) {
        console.error('❌ Erro no update da demanda:', updateError);
        throw updateError;
      }

      toast({
        title: "Status atualizado",
        description: `A demanda agora está: ${newStatus}.`,
      });

      setQuickNote("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('❌ Erro na atualização de status:', error);
      toast({
        title: "Erro na atualização",
        description: error.message || "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (demanda && open) {
      fetchEvents(demanda.id);
    }
  }, [demanda, open, fetchEvents]);

  useEffect(() => {
    if (!demanda || !open) return;
    setAuthorName(demanda.autor || null);
    setElectorName(demanda.eleitorSolicitante || null);

    const load = async () => {
      try {
        const d: any = demanda as any;
        if (d.user_id) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', d.user_id)
            .maybeSingle();
          if (prof?.full_name) setAuthorName(prof.full_name);
        }
        if (d.eleitor_id) {
          const { data: el } = await supabase
            .from('eleitores')
            .select('name')
            .eq('id', d.eleitor_id)
            .maybeSingle();
          if (el?.name) setElectorName(el.name);
        }
      } catch (e) {
        console.error('Erro ao buscar nomes relacionados', e);
      }
    };
    load();
  }, [demanda, open]);

  if (!demanda) return null;

  const statusInfo = statusConfig[demanda.status] || statusConfig.pendente;
  const StatusIcon = statusInfo?.icon || Clock;
  const priorityConfig = getPriorityConfig(demanda.priority || 'media');

  const formatDeadline = (date: Date) => {
    const today = new Date();
    const deadline = new Date(date);
    const diffInDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      return { text: "Atrasada", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" };
    } else if (diffInDays === 0) {
      return { text: "Hoje", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" };
    } else if (diffInDays <= 3) {
      return { text: `${diffInDays}d restantes`, color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20" };
    } else {
      return { text: format(deadline, "dd/MM/yyyy", { locale: ptBR }), color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" };
    }
  };

  const deadlineInfo = demanda.data_limite ? formatDeadline(demanda.data_limite) : null;

  const handleUpdateSuccess = () => {
    if (onSuccess) onSuccess();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-white/10 font-outfit">
          <DialogHeader className="p-8 pb-4">
            <div className="flex justify-between items-start mb-1">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="border-border/40 text-[9px] uppercase tracking-widest font-bold py-0.5 px-2.5 rounded-full bg-muted/20">
                ID: {demanda.id.split('-')[0]}
              </Badge>
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground leading-tight">
              {demanda.titulo}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/60 text-[10px] font-medium uppercase tracking-widest">
              Detalhes completos e histórico
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pt-0 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/10 border border-border/20 p-4 rounded-3xl space-y-3 relative overflow-hidden group hover:bg-muted/20 transition-all">
                <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest">
                  <Clock className="h-3 w-3" /> Status
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all", statusInfo.color, statusInfo.glow)}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/10 border border-border/20 p-4 rounded-3xl space-y-3 relative overflow-hidden group hover:bg-muted/20 transition-all">
                <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest">
                  <AlertCircle className="h-3 w-3" /> Prioridade
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all", priorityConfig.color)}>
                    {priorityConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/10 border border-border/20 p-4 rounded-3xl space-y-3 relative overflow-hidden group hover:bg-muted/20 transition-all">
                <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest">
                  <Calendar className="h-3 w-3" /> Criada em
                </div>
                <div className="text-sm font-bold text-foreground">
                  {format(demanda.dataHora, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>

            {/* Deadline Banner */}
            {deadlineInfo && (
              <div className={cn("flex items-center justify-between p-4 rounded-3xl border animate-in fade-in slide-in-from-top-2", deadlineInfo.bg)}>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl bg-background/50 backdrop-blur-sm", deadlineInfo.color)}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Prazo para conclusão</p>
                    <p className={cn("text-sm font-bold", deadlineInfo.color)}>{deadlineInfo.text}</p>
                  </div>
                </div>
                <div className="h-10 w-10 flex items-center justify-center opacity-20">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            )}

            {/* Description Card */}
            <div className="bg-muted/10 border border-border/20 p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                <FileText className="h-4 w-4" /> Descrição da Solicitação
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                {demanda.descricao || "Nenhuma descrição fornecida."}
              </p>
            </div>

            {/* People Info */}
            <div className="bg-muted/10 border border-border/20 p-6 rounded-[2rem] space-y-6">
              <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                <UserCircle2 className="h-4 w-4" /> Pessoas Envolvidas
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0 border border-sky-500/20">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Responsável / Autor</p>
                    <p className="text-sm font-bold text-foreground">{authorName || demanda.autor}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-500/20">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Eleitor Solicitante</p>
                    <p className="text-sm font-bold text-foreground">{electorName || demanda.eleitorSolicitante}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories & Tags */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-muted/10 border border-border/20 py-2 px-4 rounded-full flex items-center gap-2 hover:bg-muted/20 transition-all cursor-default">
                <Tag className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Categoria:</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{demanda.categoria || "Geral"}</span>
              </div>

              <div className="bg-muted/10 border border-border/20 py-2 px-4 rounded-full flex items-center gap-2 hover:bg-muted/20 transition-all cursor-default">
                <ChevronRight className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Tag:</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                  {tags.find((t) => t.id === (demanda as any).tag_id)?.name || demanda.tag}
                </Badge>
              </div>
            </div>

            {/* Quick Actions / Response Section */}
            {canWrite && demanda.status !== 'resolvida' && (
              <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2rem] space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                  <MessageSquare className="h-4 w-4" /> Adicionar Comentário ou Atualização
                </div>

                <Textarea
                  placeholder="Escreva algo sobre esta demanda..."
                  className="bg-background/50 border-border/40 rounded-2xl min-h-[100px] text-sm resize-none focus:ring-primary/20"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  disabled={isSubmitting}
                />

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="ghost"
                    className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border border-border/20 hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={handleQuickComment}
                    disabled={isSubmitting || !quickNote.trim()}
                  >
                    Somente Comentar
                  </Button>

                  <Separator orientation="vertical" className="h-9 mx-1" />

                  <Button
                    className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                    onClick={() => handleQuickStatusChange('em_atendimento')}
                    disabled={isSubmitting || demanda.status === 'em_atendimento'}
                  >
                    Em Andamento
                  </Button>

                  <Button
                    className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                    onClick={() => handleQuickStatusChange('resolvida')}
                    disabled={isSubmitting}
                  >
                    Resolver
                  </Button>

                  <Button
                    className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all ml-auto"
                    onClick={() => handleQuickStatusChange('cancelada')}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Timeline / Updates */}
            {events.length > 0 && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                  <History className="h-4 w-4" /> Linha do Tempo de Atualizações
                </div>

                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-5 before:w-[2px] before:bg-border/20">
                  {events.map((event, idx) => (
                    <div key={event.id} className="relative pl-12 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="absolute left-0 top-1 h-10 w-10 rounded-2xl bg-background border-2 border-primary/20 flex items-center justify-center z-10 shadow-lg shadow-black/20">
                        {event.status === 'resolvida' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="bg-muted/5 border border-border/10 p-5 rounded-3xl space-y-3 hover:bg-muted/10 transition-all">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest rounded-lg border-primary/20 text-primary bg-primary/5">
                            {statusConfig[event.status]?.label || event.status}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                            {format(new Date(event.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground/70">{event.notes || "Atualização de status realizada."}</p>
                        <div className="flex items-center gap-2 border-t border-border/10 pt-3 mt-3">
                          <UserCircle2 className="h-3 w-3 text-muted-foreground/40" />
                          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                            Responsável: {(event as any).author_name || 'Equipe'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-8 pt-4 flex gap-3 border-t border-border/10 bg-muted/5">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12 px-6 rounded-2xl border-border/40 hover:bg-muted/50 transition-all flex-1 font-bold tracking-widest uppercase text-xs">
              Fechar Detalhes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}