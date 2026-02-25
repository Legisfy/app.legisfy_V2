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

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  response?: string;
  responded_at?: string;
}

export function TicketHistory() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const { profile } = useCurrentUser();

  useEffect(() => {
    if (profile) {
      loadTickets();
    }
  }, [profile]);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', profile?.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResponseDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'aberto': 'default',
      'em_andamento': 'secondary',
      'resolvido': 'outline',
      'fechado': 'outline'
    } as const;
    
    const labels = {
      'aberto': 'Aberto',
      'em_andamento': 'Em Andamento',
      'resolvido': 'Resolvido',
      'fechado': 'Fechado'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'eleitores': 'Eleitores',
      'indicacao': 'Indicação',
      'demandas': 'Demandas',
      'ideias': 'Ideias',
      'agenda': 'Agenda',
      'assessores': 'Assessores',
      'pontuacao_metas': 'Pontuação e Metas',
      'assessor_ia': 'Assessor IA',
      'geral': 'Geral'
    };
    return labels[category] || category;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>;
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você ainda não possui chamados abertos.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Histórico de Chamados</h2>
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getCategoryLabel(ticket.category)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewResponse(ticket)}
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

      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Chamado</DialogTitle>
            <DialogDescription>
              Aberto em {selectedTicket && format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Categoria</p>
                <p className="text-sm text-muted-foreground">{getCategoryLabel(selectedTicket.category)}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <div>{getStatusBadge(selectedTicket.status)}</div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Descrição</p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {selectedTicket.response ? (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Resposta da Equipe</p>
                    {selectedTicket.responded_at && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(selectedTicket.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.response}</p>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aguardando resposta da equipe de suporte...
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