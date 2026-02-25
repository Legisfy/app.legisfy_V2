import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Feedback {
  id: string;
  tipo: string;
  mensagem: string;
  status: string;
  created_at: string;
  resposta?: string;
  respondido_em?: string;
}

export function FeedbackHistory() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { profile } = useCurrentUser();

  useEffect(() => {
    if (profile) {
      loadFeedbacks();
    }
  }, [profile]);

  const loadFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback_ouvidoria')
        .select('*')
        .eq('usuario_email', profile?.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      'Novo': 'default',
      'Em Análise': 'secondary',
      'Respondido': 'outline',
      'Fechado': 'outline'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (feedbacks.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Histórico de Sugestões e Elogios</h2>
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="font-medium">
                      {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{feedback.tipo}</TableCell>
                    <TableCell>{getStatusBadge(feedback.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(feedback)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do {selectedFeedback?.tipo}</DialogTitle>
            <DialogDescription>
              Enviado em {selectedFeedback && format(new Date(selectedFeedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Tipo</p>
                <p className="text-sm text-muted-foreground">{selectedFeedback.tipo}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <div>{getStatusBadge(selectedFeedback.status)}</div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Mensagem</p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedFeedback.mensagem}</p>
                </div>
              </div>

              {selectedFeedback.resposta ? (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Resposta da Equipe</p>
                    {selectedFeedback.respondido_em && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(selectedFeedback.respondido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm whitespace-pre-wrap">{selectedFeedback.resposta}</p>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aguardando análise da equipe...
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
