import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Users, Edit, Trash2, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate: Date;
  location: string;
  type: string;
  priority: string;
  participants: string[];
  createdBy: string;
}

interface ViewEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  canEdit: boolean;
}

export function ViewEventModal({
  open,
  onOpenChange,
  event,
  onUpdateEvent,
  onDeleteEvent,
  canEdit
}: ViewEventModalProps) {
  const { toast } = useToast();
  const [authorInfo, setAuthorInfo] = useState<{ name: string; role: string } | null>(null);

  // Buscar nome e cargo do autor pelo user_id
  useEffect(() => {
    const fetchAuthorInfo = async () => {
      if (!event?.createdBy) return;

      try {
        // createdBy agora contém o user_id do evento
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, main_role')
          .eq('user_id', event.createdBy)
          .single();

        if (profile) {
          const fullName = profile.full_name || 'Membro da Equipe';
          const parts = fullName.trim().split(/\s+/);
          const displayName = parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName;

          const roleLabels: Record<string, string> = {
            'politico': 'Político',
            'chefe_gabinete': 'Chefe de Gabinete',
            'assessor': 'Assessor',
            'admin': 'Administrador',
            'admin_plataforma': 'Administrador'
          };

          setAuthorInfo({
            name: displayName,
            role: roleLabels[profile.main_role || ''] || profile.main_role || 'Membro da Equipe'
          });
          return;
        }

        // Se nada funcionar, mostra algo genérico
        setAuthorInfo({ name: 'Membro da Equipe', role: 'Assessor' });
      } catch {
        setAuthorInfo({ name: 'Membro da Equipe', role: 'Assessor' });
      }
    };

    if (open && event) {
      fetchAuthorInfo();
    }
  }, [open, event?.createdBy]);

  if (!event) return null;

  const getEventTypeColor = (type: string) => {
    const colors = {
      reuniao: "bg-blue-500",
      visita: "bg-emerald-500",
      sessao: "bg-purple-500",
      audiencia: "bg-orange-500",
      evento: "bg-indigo-500",
      default: "bg-gray-500"
    };
    return colors[type as keyof typeof colors] || colors.default;
  };

  const getPriorityVariant = (priority: string) => {
    const variants = {
      high: "destructive",
      medium: "secondary",
      low: "outline"
    };
    return variants[priority as keyof typeof variants] || "outline";
  };

  const getTypeName = (type: string) => {
    const types = {
      reuniao: "Reunião",
      visita: "Visita",
      sessao: "Sessão",
      audiencia: "Audiência",
      evento: "Evento"
    };
    return types[type as keyof typeof types] || type;
  };

  const getPriorityName = (priority: string) => {
    const priorities = {
      high: "Alta",
      medium: "Média",
      low: "Baixa"
    };
    return priorities[priority as keyof typeof priorities] || priority;
  };

  const handleDelete = () => {
    onDeleteEvent(event.id);
    toast({
      title: "Evento excluído",
      description: "O evento foi excluído com sucesso."
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 bg-card/95 backdrop-blur-xl border-border/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogHeader className="p-0 space-y-0">
                <DialogTitle className="text-sm font-bold text-foreground/90 font-outfit leading-tight">
                  {event.title}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}></div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{getTypeName(event.type)}</span>
                <Badge variant={getPriorityVariant(event.priority) as any} className="h-4 px-1.5 text-[7px] font-bold uppercase tracking-wider rounded-full">
                  {getPriorityName(event.priority)}
                </Badge>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-7 px-2.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border-border/40">
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border-destructive/30 text-destructive hover:bg-destructive/5">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir evento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o evento "{event.title}"?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="rounded-xl">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Descrição */}
          {event.description && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Descrição</p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Detalhes */}
          <div className="bg-muted/20 rounded-xl p-3 space-y-2.5 border border-border/20">
            <div className="flex items-center gap-2 text-[11px]">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-medium text-muted-foreground/70">Data:</span>
              <span className="font-bold text-foreground/80">{format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-medium text-muted-foreground/70">Horário:</span>
              <span className="font-bold text-foreground/80">
                {format(new Date(event.date), "HH:mm")} às {format(new Date(event.endDate), "HH:mm")}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-[11px]">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="font-medium text-muted-foreground/70">Local:</span>
                <span className="font-bold text-foreground/80">{event.location}</span>
              </div>
            )}
          </div>

          {/* Participantes */}
          {event.participants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-muted-foreground/50" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Participantes ({event.participants.length})
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {event.participants.map((participant, index) => (
                  <Badge key={index} variant="outline" className="h-5 text-[8px] rounded-md border-border/30 font-medium">
                    {participant}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Autor - Nome + Cargo */}
          <Separator className="opacity-30" />
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-muted/40 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground/70 leading-none">
                {authorInfo?.name || 'Carregando...'}
              </p>
              <p className="text-[8px] font-medium text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                {authorInfo?.role || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/20 flex justify-end bg-muted/5">
          <Button onClick={() => onOpenChange(false)}
            className="h-8 px-5 text-[9px] font-bold uppercase tracking-widest rounded-xl shadow-sm">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}