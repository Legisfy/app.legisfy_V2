import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  FileCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Tag,
  User,
  Calendar,
  Clock,
  Download,
  Upload,
  Edit,
  MessageSquare,
  FileUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useAuthContext } from "@/components/AuthProvider";

// Helper function to safely format dates
const formatSafeDate = (dateString: string | null | undefined, formatStr: string): string => {
  if (!dateString) return 'Data inválida';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return format(date, formatStr);
  } catch (error) {
    return 'Data inválida';
  }
};

interface Indicacao {
  id: string;
  titulo: string;
  descricao: string;
  endereco_rua?: string;
  endereco_bairro?: string;
  endereco_cep?: string;
  tags?: string[] | null;
  status: "criada" | "formalizada" | "protocolada" | "pendente" | "atendida";
  requestedByVoter?: boolean;
  voterId?: string;
  voterName?: string;
  created_at: string;
  updated_at: string;
  protocol?: string;
  photos?: string[];
  comments?: string;
  observacoes?: string;
  justificativa?: string;
  user_id: string;
  userName?: string;
  category?: string;
  tag?: string;
  protocol_pdf_url?: string;
}

interface IndicacaoDrawerProps {
  indicacao: Indicacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (indicacao: Indicacao) => void;
  onAdvanceStatus: (id: string, newStatus: string, options?: { pdf_url?: string; protocolo?: string; notes?: string }) => Promise<void>;
  onProtocolar?: (indicacao: Indicacao) => void;
  onFormalizar?: (indicacao: Indicacao) => void;
  onUpdate?: (id: string, updates: any) => Promise<any>;
  onAddObservation?: (id: string, notes: string) => Promise<void>;
}

const statusConfig = {
  criada: {
    title: "Criada",
    icon: FileText,
    color: "bg-blue-500",
    description: "Indicação criada e salva no sistema",
    date: null,
  },
  formalizada: {
    title: "Formalizada",
    icon: FileCheck,
    color: "bg-purple-500",
    description: "PDF gerado e formalizada",
    date: null,
  },
  observacao: {
    title: "Observação Interna",
    icon: MessageSquare,
    color: "bg-amber-500",
    description: "Comentário interno adicionado pela equipe",
    date: null,
  },
  protocolada: {
    title: "Protocolada",
    icon: Send,
    color: "bg-orange-500",
    description: "Protocolada na câmara",
    date: null,
  },
  pendente: {
    title: "Pendente",
    icon: AlertCircle,
    color: "bg-yellow-500",
    description: "Enviada ao executivo",
    date: null,
  },
  atendida: {
    title: "Atendida",
    icon: CheckCircle2,
    color: "bg-green-500",
    description: "Atendida pelo executivo",
    date: null,
  },
};

const statusOrder = ["criada", "formalizada", "protocolada", "pendente", "atendida"];

export function IndicacaoDrawer({
  indicacao,
  open,
  onOpenChange,
  onEdit,
  onAdvanceStatus,
  onFormalizar,
  onProtocolar,
  onUpdate,
  onAddObservation,
}: IndicacaoDrawerProps) {
  const { activeInstitution } = useActiveInstitution();
  const { user } = useAuthContext();
  const [observacoes, setObservacoes] = useState("");
  const [protocolNumber, setProtocolNumber] = useState("");
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [statusEvents, setStatusEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [savingObservacoes, setSavingObservacoes] = useState(false);

  useEffect(() => {
    if (indicacao && open) {
      fetchStatusEvents();
    }
  }, [indicacao?.id, indicacao?.status, open]);

  const formatName = (name?: string | null) => {
    if (!name) return 'Usuário não identificado';
    const names = name.trim().split(' ');
    if (names.length <= 2) return name.trim();
    return `${names[0]} ${names[1]}`;
  };

  const fetchStatusEvents = async () => {
    if (!indicacao) return;

    setLoadingEvents(true);
    try {
      // Step 1: Get status events
      const { data: events, error: eventsError } = await supabase
        .from('indicacao_status_events')
        .select('*')
        .eq('indicacao_id', indicacao.id)
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      // Step 2: Extract unique user IDs and fetch profiles
      const eventsData = events || [];
      const userIds = [...new Set(eventsData.map(e => e.user_id).filter(Boolean))];

      let nameMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        if (profiles) {
          profiles.forEach(p => {
            nameMap.set(p.user_id, p.full_name);
          });
        }
      }

      // Step 3: Process events with fallbacks
      let processedEvents = eventsData.map(event => {
        let name = nameMap.get(event.user_id);

        // Fallback for current user
        if (!name && event.user_id === user?.id) {
          name = user.user_metadata?.full_name || user.email?.split('@')[0];
        }

        return {
          ...event,
          author_name: formatName(name)
        };
      });

      // Step 4: Ensure 'criada' event exists (for older records)
      const hasCriadaEvent = processedEvents.some(e => e.status === 'criada');
      if (!hasCriadaEvent && indicacao.created_at) {
        processedEvents.push({
          id: 'initial-creation',
          indicacao_id: indicacao.id,
          status: 'criada',
          created_at: indicacao.created_at,
          user_id: indicacao.user_id,
          notes: 'Indicação criada e salva no sistema',
          author_name: indicacao.userName || 'Autor identificado',
          pdf_url: null,
          protocolo: null
        });
      }

      setStatusEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching status events:', error);
      setStatusEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  if (!indicacao) return null;

  const currentStatusIndex = statusOrder.indexOf(indicacao.status);

  const handleSaveObservacoes = async () => {
    if (!indicacao || !observacoes.trim()) return;

    try {
      setSavingObservacoes(true);

      if (onAddObservation) {
        await onAddObservation(indicacao.id, observacoes.trim());

        // Success toast
        const toastModule = await import("@/hooks/use-toast");
        toastModule.toast({
          title: "Observação salva",
          description: "O comentário foi adicionado ao histórico.",
        });

        // Clear input and reload events
        setObservacoes("");
        fetchStatusEvents();
      } else {
        // Fallback to update if addObservation is not available
        if (onUpdate) {
          await onUpdate(indicacao.id, { observacoes: observacoes.trim() || null });
        } else {
          const { error } = await supabase
            .from('indicacoes')
            .update({ observacoes: observacoes.trim() || null } as any)
            .eq('id', indicacao.id);
          if (error) throw error;
        }

        const toastModule = await import("@/hooks/use-toast");
        toastModule.toast({
          title: "Observações salvas",
          description: "As observações foram salvas com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error saving observacoes:', error);
      const toastModule = await import("@/hooks/use-toast");
      toastModule.toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a observação.",
        variant: "destructive",
      });
    } finally {
      setSavingObservacoes(false);
    }
  };

  const handleProtocolar = () => {
    if (protocolNumber.trim()) {
      onAdvanceStatus(indicacao.id, "protocolada", {
        protocolo: protocolNumber,
        notes: "Protocolada na câmara"
      });
      setProtocolNumber("");
      setShowProtocolForm(false);
    }
  };

  const getNextAction = () => {
    switch (indicacao.status) {
      case "criada":
        return {
          action: () => onFormalizar ? onFormalizar(indicacao) : onAdvanceStatus(indicacao.id, "formalizada", { notes: "PDF gerado e formalizada" }),
          label: "Formalizar",
          icon: FileCheck
        };
      case "formalizada":
        return {
          action: () => onProtocolar ? onProtocolar(indicacao) : setShowProtocolForm(true),
          label: "Protocolar",
          icon: Send
        };
      case "protocolada":
        return {
          action: async () => {
            await onAdvanceStatus(indicacao.id, "atendida", { notes: "Atendida pelo executivo" });
            fetchStatusEvents();
          },
          label: "Atendido",
          icon: CheckCircle2
        };
      case "pendente":
        return {
          action: async () => {
            await onAdvanceStatus(indicacao.id, "atendida", { notes: "Atendida pelo executivo" });
            fetchStatusEvents();
          },
          label: "Atendido",
          icon: CheckCircle2
        };
      case "atendida":
        return null; // Não há próxima ação após atendida
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-xl">
                {indicacao.titulo}
              </SheetTitle>
              <SheetDescription>
                Indicação registrada no sistema
              </SheetDescription>
            </div>
            <Badge
              variant="secondary"
              className={`${statusConfig[indicacao.status].color} text-white`}
            >
              {statusConfig[indicacao.status].title}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Título</h4>
                <p className="text-sm font-medium">{indicacao.titulo}</p>
              </div>


              {indicacao.justificativa && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Justificativa</h4>
                  <p className="text-sm">{indicacao.justificativa}</p>
                </div>
              )}

              {indicacao.category && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Categoria</h4>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {indicacao.category}
                    </Badge>
                  </div>
                  {indicacao.tag && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">TAG</h4>
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{indicacao.tag.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Autor</h4>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{indicacao.userName || 'Usuário não identificado'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Local</h4>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {indicacao.endereco_rua}
                    {indicacao.endereco_bairro && `, ${indicacao.endereco_bairro}`}
                    {indicacao.endereco_cep && ` - ${indicacao.endereco_cep}`}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Data e Hora de Criação</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatSafeDate(indicacao.created_at, "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
              </div>

              {indicacao.tags && indicacao.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Tags</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {indicacao.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {indicacao.requestedByVoter && indicacao.voterName && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Solicitado por Eleitor</h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="text-xs">
                        {indicacao.voterName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{indicacao.voterName}</span>
                  </div>
                </div>
              )}

              {indicacao.protocol && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm">Protocolo</div>
                  <div className="text-sm text-muted-foreground">{indicacao.protocol}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linha do Tempo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Carregando linha do tempo...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statusEvents
                    .filter(event => event.status !== 'observacao')
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((event, index) => {
                      const config = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.criada;
                      const StatusIcon = config.icon;

                      return (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className={`
                            p-2 rounded-full border-2 transition-all duration-200
                            ${config.color} text-white border-transparent
                          `}>
                            <StatusIcon className="h-4 w-4" />
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-foreground">
                              {config.title}
                            </div>

                            {event.notes && event.status !== 'observacao' && (
                              <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md italic">
                                "{event.notes}"
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              {formatSafeDate(event.created_at, "dd/MM/yyyy 'às' HH:mm")}
                              {event.author_name && ` - por ${event.author_name}`}
                            </div>

                            {event.protocolo && (
                              <div className="text-xs bg-muted px-2 py-1 rounded mt-1">
                                Protocolo: {event.protocolo}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Histórico de Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Carregando observações...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statusEvents.filter(event => event.status === 'observacao').length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nenhuma observação registrada.
                    </p>
                  ) : (
                    statusEvents
                      .filter(event => event.status === 'observacao')
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((event) => (
                        <div key={event.id} className="p-3 bg-muted/30 rounded-lg space-y-2 border border-muted">
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 bg-amber-500 rounded-full text-white">
                              <MessageSquare className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm italic text-foreground">
                                "{event.notes}"
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-2">
                                {formatSafeDate(event.created_at, "dd/MM/yyyy 'às' HH:mm")}
                                {event.author_name && ` - por ${event.author_name}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adicionar Nova Observação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Adicionar Observação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Adicione uma nova observação interna..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
              <Button
                size="sm"
                onClick={handleSaveObservacoes}
                disabled={savingObservacoes || !observacoes.trim()}
                className="w-full sm:w-auto"
              >
                {savingObservacoes ? "Salvando..." : "Salvar Observação"}
              </Button>
            </CardContent>
          </Card>

          {/* Formulário de Protocolo */}
          {showProtocolForm && indicacao.status === "formalizada" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Protocolar na Câmara
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="protocol">Número do Protocolo</Label>
                  <Input
                    id="protocol"
                    placeholder="Ex: 2024/001234"
                    value={protocolNumber}
                    onChange={(e) => setProtocolNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Anexar PDF com Protocolo da Câmara</Label>
                  <Button variant="outline" className="w-full justify-start">
                    <FileUp className="h-4 w-4 mr-2" />
                    Selecionar PDF Protocolado
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Anexe o PDF retornado pela câmara com o protocolo oficial
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleProtocolar}
                    disabled={!protocolNumber.trim()}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Confirmar Protocolo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowProtocolForm(false);
                      setProtocolNumber("");
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-3">
            {nextAction && indicacao.status !== "atendida" && !showProtocolForm && (
              <Button
                onClick={nextAction.action}
                className="w-full"
                size="lg"
              >
                <nextAction.icon className="h-4 w-4 mr-2" />
                {nextAction.label}
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onEdit(indicacao)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>

              {indicacao.status === "formalizada" && (
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              )}

              {indicacao.protocol_pdf_url && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(indicacao.protocol_pdf_url, '_blank')}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Ver Protocolo
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}