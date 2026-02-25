import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bot,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  UserCheck,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";

interface ActivityLog {
  id: string;
  trabalho_realizado: string;
  data_hora: string;
  assessor_nome: string;
  assessor_avatar?: string;
  tipo_atividade: string;
}

interface ActivitiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivitiesModal({ open, onOpenChange }: ActivitiesModalProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeInstitution } = useActiveInstitution();

  useEffect(() => {
    if (open) {
      loadActivities();
    }
  }, [open, activeInstitution]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // TODO: Implementar query real quando houver tabela de logs de atividades
      // Por ora, sem dados disponíveis
      setActivities([]);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'indicacao':
        return FileText;
      case 'atendimento':
        return Users;
      case 'agenda':
        return Calendar;
      case 'demanda':
        return MessageSquare;
      case 'auxilio':
        return UserCheck;
      default:
        return Bot;
    }
  };

  const getActivityColor = (tipo: string) => {
    switch (tipo) {
      case 'indicacao':
        return 'bg-blue-100 text-blue-700';
      case 'atendimento':
        return 'bg-green-100 text-green-700';
      case 'agenda':
        return 'bg-purple-100 text-purple-700';
      case 'demanda':
        return 'bg-orange-100 text-orange-700';
      case 'auxilio':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Atividades do Assessor IA
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-muted-foreground mt-2">Carregando atividades...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma atividade registrada ainda.</p>
              </div>
            ) : (
              activities.map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.tipo_atividade);

                return (
                  <div key={activity.id}>
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.tipo_atividade)}`}>
                        <ActivityIcon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <p className="text-sm leading-relaxed">
                          {activity.trabalho_realizado}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={activity.assessor_avatar} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {activity.assessor_nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">
                              {activity.assessor_nome}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(activity.data_hora)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {index < activities.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}