import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, MessageSquare, User, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRealIdeias } from "@/hooks/useRealIdeias";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface IdeiasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IdeiasModal = ({ open, onOpenChange }: IdeiasModalProps) => {
  const { ideias, loading, updateIdeia } = useRealIdeias();
  const { user } = useAuthContext();
  const [comentarios, setComentarios] = useState<{ [key: string]: string }>({});
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [authors, setAuthors] = useState<{ [key: string]: string }>({});

  // Fetch authors for ideas
  useEffect(() => {
    const fetchAuthors = async () => {
      if (ideias.length === 0) return;

      const userIds = [...new Set(ideias.map(idea => idea.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const authorsMap: { [key: string]: string } = {};
      profiles?.forEach(profile => {
        authorsMap[profile.user_id] = profile.full_name;
      });
      setAuthors(authorsMap);
    };

    fetchAuthors();
  }, [ideias]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovada":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejeitada":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "em_analise":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "aprovada":
        return "Aprovada";
      case "rejeitada":
        return "Rejeitada";
      case "em_analise":
        return "Em Análise";
      default:
        return "Rascunho";
    }
  };

  const handleAprovar = async (ideiaId: string) => {
    try {
      setUpdating(prev => ({ ...prev, [ideiaId]: true }));
      await updateIdeia(ideiaId, { 
        status: "aprovada"
      });

      // Send notification to idea author
      const idea = ideias.find(i => i.id === ideiaId);
      if (idea && idea.user_id !== user?.id) {
        await supabase.rpc('create_notification', {
          p_user_id: idea.user_id,
          p_title: 'Ideia Aprovada! 🎉',
          p_message: `Sua ideia "${idea.titulo}" foi aprovada e será considerada para implementação!`,
          p_type: 'success',
          p_related_entity_type: 'ideias',
          p_related_entity_id: ideiaId,
          p_created_by_user_id: user?.id
        });
      }

      toast.success("Ideia aprovada com sucesso!");
    } catch (error) {
      console.error('Error approving idea:', error);
      toast.error("Erro ao aprovar ideia");
    } finally {
      setUpdating(prev => ({ ...prev, [ideiaId]: false }));
    }
  };

  const handleRejeitar = async (ideiaId: string) => {
    const comentario = comentarios[ideiaId];
    if (!comentario?.trim()) {
      toast.error("É necessário informar o motivo da rejeição");
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, [ideiaId]: true }));
      await updateIdeia(ideiaId, { 
        status: "rejeitada"
        // Nota: Como não temos campo para comentários na tabela, 
        // seria necessário adicionar um campo ou criar uma tabela separada
      });

      // Send notification to idea author
      const idea = ideias.find(i => i.id === ideiaId);
      if (idea && idea.user_id !== user?.id) {
        await supabase.rpc('create_notification', {
          p_user_id: idea.user_id,
          p_title: 'Ideia Rejeitada',
          p_message: `Sua ideia "${idea.titulo}" foi rejeitada. Motivo: ${comentario}`,
          p_type: 'info',
          p_related_entity_type: 'ideias',
          p_related_entity_id: ideiaId,
          p_created_by_user_id: user?.id
        });
      }

      setComentarios(prev => ({ ...prev, [ideiaId]: "" }));
      toast.success("Ideia rejeitada");
    } catch (error) {
      console.error('Error rejecting idea:', error);
      toast.error("Erro ao rejeitar ideia");
    } finally {
      setUpdating(prev => ({ ...prev, [ideiaId]: false }));
    }
  };

  const handleColocarEmAnalise = async (ideiaId: string) => {
    try {
      setUpdating(prev => ({ ...prev, [ideiaId]: true }));
      await updateIdeia(ideiaId, { 
        status: "em_analise"
      });

      // Send notification to idea author
      const idea = ideias.find(i => i.id === ideiaId);
      if (idea && idea.user_id !== user?.id) {
        await supabase.rpc('create_notification', {
          p_user_id: idea.user_id,
          p_title: 'Ideia em Análise',
          p_message: `Sua ideia "${idea.titulo}" foi colocada em análise pela equipe.`,
          p_type: 'info',
          p_related_entity_type: 'ideias',
          p_related_entity_id: ideiaId,
          p_created_by_user_id: user?.id
        });
      }

      toast.success("Ideia colocada em análise!");
    } catch (error) {
      console.error('Error updating idea:', error);
      toast.error("Erro ao atualizar ideia");
    } finally {
      setUpdating(prev => ({ ...prev, [ideiaId]: false }));
    }
  };

  // Ordenar ideias: pendentes/rascunho primeiro, depois por data
  const ideiasOrdernadas = ideias.sort((a, b) => {
    if ((a.status === "rascunho" || a.status === "em_analise") && 
        (b.status !== "rascunho" && b.status !== "em_analise")) return -1;
    if ((a.status !== "rascunho" && a.status !== "em_analise") && 
        (b.status === "rascunho" || b.status === "em_analise")) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ideias dos Assessores</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando ideias...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ideias dos Assessores</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {ideiasOrdernadas.map((ideia) => (
            <Card key={ideia.id} className={`${(ideia.status === "rascunho" || ideia.status === "em_analise") ? "border-yellow-200" : ""}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{ideia.titulo}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {authors[ideia.user_id] || "Assessor"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(ideia.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className={getStatusColor(ideia.status || "rascunho")}>
                    {getStatusText(ideia.status || "rascunho")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{ideia.descricao}</p>

                {ideia.link_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={ideia.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {ideia.link_url}
                    </a>
                  </div>
                )}

                {ideia.status === "rejeitada" && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        Ideia rejeitada
                      </span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Esta ideia foi rejeitada e não será implementada.
                    </p>
                  </div>
                )}

                {(ideia.status === "rascunho" || ideia.status === "em_analise") && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Comentário sobre a ideia (opcional)"
                      value={comentarios[ideia.id] || ""}
                      onChange={(e) => setComentarios(prev => ({ 
                        ...prev, 
                        [ideia.id]: e.target.value 
                      }))}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      {ideia.status === "rascunho" && (
                        <Button
                          onClick={() => handleColocarEmAnalise(ideia.id)}
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                          size="sm"
                          disabled={updating[ideia.id]}
                        >
                          {updating[ideia.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          Colocar em Análise
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => handleAprovar(ideia.id)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        size="sm"
                        disabled={updating[ideia.id]}
                      >
                        {updating[ideia.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Aprovar
                      </Button>
                      
                      <Button
                        onClick={() => handleRejeitar(ideia.id)}
                        className="gap-2 bg-red-600 hover:bg-red-700"
                        size="sm"
                        disabled={updating[ideia.id]}
                      >
                        {updating[ideia.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                )}

                {ideia.status === "aprovada" && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Ideia aprovada! Será considerada para implementação.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {ideiasOrdernadas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ideia encontrada</p>
              <p className="text-sm mt-2">As ideias criadas pelos assessores aparecerão aqui</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};