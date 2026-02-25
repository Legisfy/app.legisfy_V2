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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  User, 
  Calendar, 
  Tag, 
  FileText, 
  Building, 
  Briefcase, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  MessageSquare,
  Plus
} from "lucide-react";
import { Demanda } from "@/components/demandas/DemandasTable";
import { useDemandaStatusEvents } from "@/hooks/useDemandaStatusEvents";
import { AddDemandaUpdateModal } from "./AddDemandaUpdateModal";
import { supabase } from "@/integrations/supabase/client";
import { useDemandCategories } from "@/hooks/useDemandCategories";
import { usePermissions } from "@/hooks/usePermissions";

interface UpdatedViewDemandaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demanda: Demanda | null;
  onSuccess?: () => void;
}

const statusConfig = {
  pendente: { 
    label: "Pendente", 
    color: "bg-red-100 text-red-800 border-red-200",
    icon: Clock
  },
  em_atendimento: { 
    label: "Em Atendimento", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle
  },
  em_andamento: { 
    label: "Em Atendimento", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle
  },
  resolvida: { 
    label: "Resolvida", 
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  },
  cancelada: { 
    label: "Cancelada", 
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle
  },
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "baixa":
      return "bg-green-100 text-green-800 border-green-200";
    case "media":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "urgente":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function UpdatedViewDemandaModal({ 
  open, 
  onOpenChange, 
  demanda,
  onSuccess 
}: UpdatedViewDemandaModalProps) {
  const { events, loading: eventsLoading, fetchEvents } = useDemandaStatusEvents();
  const { hasPermission } = usePermissions();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [electorName, setElectorName] = useState<string | null>(null);
  const { tags } = useDemandCategories();
  
  const canWrite = hasPermission('demandas', 'write');

  const openUpdateModal = () => {
    setShowUpdateModal(true);
    onOpenChange(false); // close parent to avoid nested dialog focus/pointer trap
  };

  useEffect(() => {
    if (demanda && open) {
      fetchEvents(demanda.id);
    }
  }, [demanda, open, fetchEvents]);

  useEffect(() => {
    if (!demanda || !open) return;
    // Prefill from mapped data
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

  const formatDeadline = (date: Date) => {
    const today = new Date();
    const deadline = new Date(date);
    const diffInDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) {
      return { text: "Atrasada", color: "text-red-600", bg: "bg-red-50" };
    } else if (diffInDays === 0) {
      return { text: "Hoje", color: "text-orange-600", bg: "bg-orange-50" };
    } else if (diffInDays <= 3) {
      return { text: `${diffInDays}d restantes`, color: "text-yellow-600", bg: "bg-yellow-50" };
    } else {
      return { text: format(deadline, "dd/MM/yyyy", { locale: ptBR }), color: "text-gray-600", bg: "bg-gray-50" };
    }
  };

  const deadlineInfo = demanda.data_limite ? formatDeadline(demanda.data_limite) : null;

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    // Não recarregar a página inteira, apenas atualizar os dados localmente
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{demanda.titulo}</DialogTitle>
            <DialogDescription>
              Detalhes completos da demanda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status, Prioridade e Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant="secondary" 
                    className={`${statusInfo.color} border`}
                  >
                    {statusInfo.label}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Prioridade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {demanda.priority && (
                    <Badge 
                      variant="outline" 
                      className={`border ${getPriorityColor(demanda.priority)}`}
                    >
                      {demanda.priority}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data/Hora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {format(demanda.dataHora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Data limite se houver */}
            {deadlineInfo && (
              <Card>
                <CardContent className="p-4">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${deadlineInfo.bg}`}>
                    <Clock className="h-4 w-4" />
                    <span className={`font-medium ${deadlineInfo.color}`}>
                      Prazo: {deadlineInfo.text}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Descrição */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Descrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{demanda.descricao}</p>
              </CardContent>
            </Card>

            {/* Pessoas Envolvidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Pessoas Envolvidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Autor:</span>
                  <span className="text-sm">{authorName || demanda.autor}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Eleitor Solicitante:</span>
                  <span className="text-sm">{electorName || demanda.eleitorSolicitante}</span>
                </div>
              </CardContent>
            </Card>

            {/* TAG */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  TAG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {tags.find((t) => t.id === (demanda as any).tag_id)?.name || demanda.tag}
                </Badge>
              </CardContent>
            </Card>

            {/* Histórico de atualizações */}
            {events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Histórico de Atualizações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3 bg-muted/50">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {event.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Por: {(event as any).author_name || 'Usuário'}
                      </div>
                      {event.notes && (
                        <p className="text-sm mt-2">{event.notes}</p>
                      )}
                      {event.new_deadline && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Nova data limite: {format(new Date(event.new_deadline), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            
            {demanda.status !== "resolvida" && canWrite && (
              <Button onClick={openUpdateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Atualização
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddDemandaUpdateModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        demanda={demanda}
        onSuccess={handleUpdateSuccess}
      />
    </>
  );
}