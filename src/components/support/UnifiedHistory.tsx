import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MessageSquare, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UnifiedItem {
  id: string;
  created_at: string;
  type: 'Sugestão' | 'Elogio' | 'Reclamação';
  status: string;
  category?: string;
  description: string;
  response?: string;
  responded_at?: string;
}

export function UnifiedHistory() {
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<UnifiedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { profile } = useCurrentUser();

  useEffect(() => {
    if (profile) {
      loadAllItems();
    }
  }, [profile]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.type.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower) ||
          (item.category && item.category.toLowerCase().includes(searchLower)) ||
          item.description.toLowerCase().includes(searchLower) ||
          format(new Date(item.created_at), "dd/MM/yyyy HH:mm").includes(searchLower)
        );
      });
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const loadAllItems = async () => {
    try {
      // Buscar feedback (sugestões e elogios)
      const { data: feedbackData } = await supabase
        .from('feedback_ouvidoria')
        .select('*')
        .eq('usuario_email', profile?.email)
        .order('created_at', { ascending: false });

      // Buscar tickets (reclamações)
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // Unificar os dados
      const unified: UnifiedItem[] = [];

      // Adicionar feedbacks
      if (feedbackData) {
        feedbackData.forEach(item => {
          unified.push({
            id: item.id,
            created_at: item.created_at,
            type: item.tipo === 'Sugestão' ? 'Sugestão' : 'Elogio',
            status: mapFeedbackStatus(item.status),
            description: item.mensagem,
            response: item.resposta,
            responded_at: item.respondido_em
          });
        });
      }

      // Adicionar tickets
      if (ticketsData) {
        ticketsData.forEach(item => {
          unified.push({
            id: item.id,
            created_at: item.created_at,
            type: 'Reclamação',
            status: mapTicketStatus(item.status),
            category: getCategoryLabel(item.category),
            description: item.description
          });
        });
      }

      // Ordenar por data (mais recente primeiro)
      unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(unified);
      setFilteredItems(unified);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapFeedbackStatus = (status: string): string => {
    const mapping: Record<string, string> = {
      'Novo': 'Novo',
      'Em Análise': 'Em Andamento',
      'Respondido': 'Resolvido',
      'Fechado': 'Resolvido'
    };
    return mapping[status] || status;
  };

  const mapTicketStatus = (status: string): string => {
    const mapping: Record<string, string> = {
      'aberto': 'Novo',
      'em_andamento': 'Em Andamento',
      'resolvido': 'Resolvido',
      'fechado': 'Resolvido'
    };
    return mapping[status] || status;
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
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

  const handleView = (item: UnifiedItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      'Novo': 'default',
      'Em Andamento': 'secondary',
      'Resolvido': 'outline'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>;
  }

  if (filteredItems.length === 0 && searchTerm) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Histórico</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tipo, status, categoria ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum resultado encontrado para "{searchTerm}".
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você ainda não possui registros.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Histórico</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tipo, status, categoria ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>
                      {item.category ? (
                        <span className="text-sm text-muted-foreground">{item.category}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(item)}
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
            <DialogTitle>Detalhes - {selectedItem?.type}</DialogTitle>
            <DialogDescription>
              Enviado em {selectedItem && format(new Date(selectedItem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Tipo</p>
                <p className="text-sm text-muted-foreground">{selectedItem.type}</p>
              </div>

              {selectedItem.category && (
                <div>
                  <p className="text-sm font-medium mb-1">Categoria</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.category}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <div>{getStatusBadge(selectedItem.status)}</div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Descrição</p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedItem.description}</p>
                </div>
              </div>

              {selectedItem.response ? (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Resposta da Equipe</p>
                    {selectedItem.responded_at && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(selectedItem.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm whitespace-pre-wrap">{selectedItem.response}</p>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aguardando resposta da equipe...
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
