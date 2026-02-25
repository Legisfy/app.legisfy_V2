
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Calendar, 
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Play,
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import type { Demanda } from "../demandas/DemandasTable";
import { usePermissions } from "@/hooks/usePermissions";

interface AddDemandaUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demanda: Demanda | null;
  onSuccess?: () => void;
}

const statusOptions = [
  { value: "em_atendimento", label: "Colocar em Andamento", icon: Play, color: "bg-blue-100 text-blue-800" },
  { value: "resolvida", label: "Marcar como Resolvida", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "cancelada", label: "Cancelar Demanda", icon: AlertCircle, color: "bg-red-100 text-red-800" },
];

export function AddDemandaUpdateModal({ 
  open, 
  onOpenChange, 
  demanda, 
  onSuccess 
}: AddDemandaUpdateModalProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    status: "",
    notes: "",
    new_deadline: "",
  });

  // Fetch events with error handling
  const fetchEvents = async (demandaId: string) => {
    try {
      const { data, error } = await supabase
        .from('demanda_status_events')
        .select('*')
        .eq('demanda_id', demandaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch events:', error);
        setEvents([]); // Continue without events
        return;
      }

      setEvents(data || []);
    } catch (err) {
      console.warn('Error fetching events:', err);
      setEvents([]); // Continue without events
    }
  };

  useEffect(() => {
    if (demanda && open) {
      fetchEvents(demanda.id);
      setFormData({
        status: "",
        notes: "",
        new_deadline: "",
      });
    }
  }, [demanda, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('DEBUG: handleSubmit called with formData:', formData);
    console.log('DEBUG: demanda object:', demanda);
    
    if (!demanda || !formData.status) {
      console.log('DEBUG: Missing demanda or status');
      return;
    }

    // Verificar permissão de escrita
    if (!hasPermission('demandas', 'write')) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para atualizar demandas. Entre em contato com o administrador do gabinete.",
        variant: "destructive"
      });
      return;
    }

    // Validar se está colocando em andamento sem comentário
    if (formData.status === "em_atendimento" && !formData.notes.trim()) {
      toast({
        title: "Comentário obrigatório",
        description: "Para colocar em andamento, adicione um comentário explicando o que está sendo feito.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      if (!user?.id) {
        console.error('DEBUG: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      const eventData = {
        demanda_id: demanda.id,
        status: formData.status,
        notes: formData.notes.trim() || null,
        new_deadline: formData.new_deadline || null,
        user_id: user.id
      };

      console.log('DEBUG: About to create status event');
      console.log('DEBUG: Event data:', JSON.stringify(eventData, null, 2));
      console.log('DEBUG: User ID:', user.id);
      console.log('DEBUG: Demanda ID:', demanda.id);
      console.log('DEBUG: User object:', JSON.stringify(user, null, 2));
      
      // Create status event
      const { data: eventResult, error: createError } = await supabase
        .from('demanda_status_events')
        .insert(eventData)
        .select()
        .single();

      if (createError) {
        console.error('DEBUG: Error creating status event - FULL ERROR:');
        console.error('  - message:', createError.message);
        console.error('  - details:', createError.details);
        console.error('  - hint:', createError.hint);
        console.error('  - code:', createError.code);
        console.error('  - Full error object:', JSON.stringify(createError, null, 2));
        throw createError;
      }
      console.log('DEBUG: Status event created successfully:', eventResult);

      // Update demanda status - usar o status correto da constraint
      console.log('DEBUG: About to update demanda status to:', formData.status);
      const { error: updateError } = await supabase
        .from('demandas')
        .update({ status: formData.status })
        .eq('id', demanda.id);

      if (updateError) {
        console.warn('DEBUG: Failed to update demanda status:', updateError);
      } else {
        console.log('DEBUG: Demanda status updated successfully');
      }

      toast({
        title: "Demanda atualizada!",
        description: "A atualização foi registrada com sucesso.",
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating status event:', error);
      toast({
        title: "Erro ao atualizar demanda",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a demanda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStatuses = () => {
    if (!demanda) return [];
    
    // Always show all 3 options as requested
    return statusOptions;
  };

  const availableStatuses = getAvailableStatuses();

  const handleStatusChange = (statusValue: string) => {
    setFormData(prev => ({ ...prev, status: statusValue }));
  };

  const handleNotesChange = (notes: string) => {
    setFormData(prev => ({ ...prev, notes }));
  };

  const handleDeadlineChange = (deadline: string) => {
    setFormData(prev => ({ ...prev, new_deadline: deadline }));
  };

  if (!demanda) return null;

  const canWrite = hasPermission('demandas', 'write');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border shadow-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Adicionar Atualização
          </DialogTitle>
          <DialogDescription>
            {demanda.titulo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info da demanda */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Autor:</strong> {
                      demanda.author?.full_name || 
                      demanda.autor || 
                      'Usuário não encontrado'
                    }</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(demanda.dataHora, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
                {demanda.eleitorSolicitante && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Eleitor Solicitante:</strong> {demanda.eleitorSolicitante}</span>
                  </div>
                )}
                {demanda.descricao && (
                  <div className="text-sm">
                    <strong>Descrição:</strong> {demanda.descricao}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {demanda.tag}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className={
                      demanda.status === "pendente" ? "bg-yellow-100 text-yellow-800" :
                      demanda.status === "em_atendimento" ? "bg-blue-100 text-blue-800" :
                      demanda.status === "resolvida" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }
                  >
                    {demanda.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de atualizações */}
          {events.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico de Atualizações
              </h4>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {events.map((event) => (
                  <Card key={event.id} className="bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {event.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="text-sm mt-2">{event.notes}</p>
                      )}
                      {event.new_deadline && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Nova data limite: {format(new Date(event.new_deadline), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Formulário de atualização */}
          {!canWrite && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Lock className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    Você não tem permissão para atualizar demandas. Contate o administrador do gabinete para obter acesso.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label>Nova Ação*</Label>
              <div className="space-y-2">
                {availableStatuses.map((status) => {
                  const IconComponent = status.icon;
                  const isSelected = formData.status === status.value;
                  
                  return (
                    <div 
                      key={status.value} 
                      className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !loading && handleStatusChange(status.value)}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {availableStatuses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma ação disponível para o status atual: {demanda.status}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                Comentário/Atualização{formData.status === "em_atendimento" ? "*" : ""}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Descreva o que está sendo feito ou foi realizado..."
                rows={4}
                disabled={loading}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_deadline">Nova Data Limite (opcional)</Label>
              <Input
                id="new_deadline"
                type="date"
                value={formData.new_deadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.status || loading || !canWrite}
              >
                {loading ? "Atualizando..." : "Adicionar Atualização"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
