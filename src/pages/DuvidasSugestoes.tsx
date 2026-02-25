import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { toast } from "@/hooks/use-toast";
import {
  Heart,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  Send,
  Clock,
  CheckCircle2,
  MessageSquare,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

type Categoria = 'elogio' | 'sugestao' | 'reclamacao' | 'ajuda';

interface Resposta {
  id: string;
  mensagem: string;
  autor: string;
  created_at: string;
}

interface Ticket {
  id: string;
  categoria: Categoria;
  descricao: string;
  status: string;
  created_at: string;
  respostas: Resposta[];
}

const categorias: { value: Categoria; label: string; icon: any; color: string; bgColor: string }[] = [
  { value: 'elogio', label: 'Elogio', icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40' },
  { value: 'sugestao', label: 'Sugestões', icon: Lightbulb, color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40' },
  { value: 'reclamacao', label: 'Reclamações', icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10 border-red-500/20 hover:border-red-500/40' },
  { value: 'ajuda', label: 'Ajuda', icon: HelpCircle, color: 'text-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40' },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  aberto: { label: 'Aberto', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Loader2 },
  respondido: { label: 'Respondido', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: MessageSquare },
  fechado: { label: 'Fechado', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: CheckCircle2 },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} às ${hours}:${minutes}`;
};

const getCategoriaLabel = (cat: Categoria) => {
  return categorias.find(c => c.value === cat)?.label?.toUpperCase() || cat.toUpperCase();
};

const getCategoriaConfig = (cat: Categoria) => {
  return categorias.find(c => c.value === cat);
};

export default function Suporte() {
  const { activeInstitution } = useActiveInstitution();
  const [userId, setUserId] = useState<string | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);
  const [descricao, setDescricao] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) loadTickets();
  }, [userId]);

  const loadTickets = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: ticketsData, error } = await (supabase as any)
        .from('suporte_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ticketsWithRespostas = await Promise.all(
        (ticketsData || []).map(async (ticket: any) => {
          const { data: respostas } = await (supabase as any)
            .from('suporte_respostas')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });
          return { ...ticket, respostas: respostas || [] };
        })
      );

      setTickets(ticketsWithRespostas);
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!categoriaSelecionada || !descricao.trim() || !userId) {
      toast({ title: "Preencha todos os campos", description: "Selecione uma categoria e escreva a descrição.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { error } = await (supabase as any)
        .from('suporte_tickets')
        .insert({
          user_id: userId,
          gabinete_id: activeInstitution?.cabinet_id || '00000000-0000-0000-0000-000000000000',
          categoria: categoriaSelecionada,
          descricao: descricao.trim(),
        });

      if (error) throw error;

      toast({ title: "Enviado com sucesso!", description: "Seu ticket foi registrado. Acompanhe o status no histórico abaixo." });
      setCategoriaSelecionada(null);
      setDescricao("");
      await loadTickets();
    } catch (err) {
      console.error('Erro ao enviar ticket:', err);
      toast({ title: "Erro ao enviar", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold font-outfit tracking-tight">Suporte</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Envie sua mensagem e acompanhe o status
            </p>
          </div>

          {/* Novo Ticket */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <p className="text-sm font-medium text-foreground/80">Selecione a categoria:</p>

            {/* Categorias */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categorias.map((cat) => {
                const Icon = cat.icon;
                const isSelected = categoriaSelecionada === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategoriaSelecionada(cat.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                      isSelected
                        ? `${cat.bgColor} ring-2 ring-offset-2 ring-offset-background`
                        : "border-border/50 hover:border-border bg-background/50 hover:bg-muted/30",
                      isSelected && cat.value === 'elogio' && 'ring-rose-500/50',
                      isSelected && cat.value === 'sugestao' && 'ring-amber-500/50',
                      isSelected && cat.value === 'reclamacao' && 'ring-red-500/50',
                      isSelected && cat.value === 'ajuda' && 'ring-blue-500/50',
                    )}
                  >
                    <Icon className={cn("h-6 w-6", isSelected ? cat.color : "text-muted-foreground")} />
                    <span className={cn(
                      "text-xs font-semibold",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Descrição */}
            {categoriaSelecionada && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Textarea
                  placeholder="Descreva aqui..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={!descricao.trim() || sending}
                    className="gap-2"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Histórico */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold font-outfit">Histórico</h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum ticket registrado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const catConfig = getCategoriaConfig(ticket.categoria);
                  const statusCfg = statusConfig[ticket.status] || statusConfig.aberto;
                  const CatIcon = catConfig?.icon || HelpCircle;

                  return (
                    <div
                      key={ticket.id}
                      className="rounded-xl border border-border/50 bg-card overflow-hidden"
                    >
                      {/* Ticket Header */}
                      <div className="p-4 flex items-start gap-3">
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          catConfig?.bgColor?.split(' ')[0] || 'bg-muted'
                        )}>
                          <CatIcon className={cn("h-4 w-4", catConfig?.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wide">
                              {getCategoriaLabel(ticket.categoria)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              — {formatDate(ticket.created_at)}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px] px-2 py-0", statusCfg.color)}>
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
                            {ticket.descricao}
                          </p>
                        </div>
                      </div>

                      {/* Respostas */}
                      {ticket.respostas.length > 0 && (
                        <div className="border-t border-border/30">
                          {ticket.respostas.map((resp) => (
                            <div
                              key={resp.id}
                              className="px-4 py-3 flex items-start gap-3 bg-muted/20"
                            >
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <MessageSquare className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold uppercase tracking-wide text-primary">
                                    Resposta
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    — {formatDate(resp.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
                                  {resp.mensagem}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}