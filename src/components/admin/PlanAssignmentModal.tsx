import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, Users, Plus, Trash2, Calendar, Crown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  title: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  plan_type: string;
}

interface Gabinete {
  id: string;
  nome: string;
  camara_id: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  payment_status?: string;
  camaras?: {
    nome: string;
    tipo: string;
  };
}

interface PlanAssignmentModalProps {
  plan: Plan;
  children: React.ReactNode;
}

export const PlanAssignmentModal = ({ plan, children }: PlanAssignmentModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedGabineteId, setSelectedGabineteId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch gabinetes assigned to this plan
  const { data: assignedGabinetes, isLoading: assignedLoading } = useQuery({
    queryKey: ['plan-assignments', plan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gabinetes')
        .select(`
          id,
          nome,
          camara_id,
          subscription_start_date,
          subscription_end_date,
          payment_status,
          camaras!gabinetes_camara_id_fkey (
            nome,
            tipo
          )
        `)
        .eq('plan_id', plan.id);

      if (error) throw error;
      return data as any;
    },
    enabled: open,
  });

  // Fetch available gabinetes (not assigned to this plan)
  const { data: availableGabinetes, isLoading: availableLoading } = useQuery({
    queryKey: ['available-gabinetes', plan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gabinetes')
        .select(`
          id,
          nome,
          camara_id,
          camaras!gabinetes_camara_id_fkey (
            nome,
            tipo
          )
        `)
        .neq('plan_id', plan.id)
        .eq('status', 'ativo');

      if (error) throw error;
      return data as any;
    },
    enabled: open,
  });

  // Assign gabinete to plan
  const assignGabineteMutation = useMutation({
    mutationFn: async (gabineteId: string) => {
      const { error } = await supabase
        .from('gabinetes')
        .update({ 
          plan_id: plan.id,
          subscription_start_date: new Date().toISOString(),
          payment_status: 'active'
        })
        .eq('id', gabineteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['available-gabinetes'] });
      queryClient.invalidateQueries({ queryKey: ['plan-statistics'] });
      setSelectedGabineteId('');
      toast({
        title: "Gabinete atribuído",
        description: "O gabinete foi atribuído ao plano com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atribuir gabinete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove gabinete from plan
  const removeGabineteMutation = useMutation({
    mutationFn: async (gabineteId: string) => {
      const { error } = await supabase
        .from('gabinetes')
        .update({ 
          plan_id: null,
          subscription_start_date: null,
          subscription_end_date: null,
          payment_status: null
        })
        .eq('id', gabineteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['available-gabinetes'] });
      queryClient.invalidateQueries({ queryKey: ['plan-statistics'] });
      toast({
        title: "Gabinete removido",
        description: "O gabinete foi removido do plano.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover gabinete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Não definido</Badge>;
    }
  };

  const getDaysUntilRenewal = (endDate?: string) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Gerenciar Atribuições - {plan.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{assignedGabinetes?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Gabinetes Vinculados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency((assignedGabinetes?.length || 0) * plan.price_monthly)}
              </p>
              <p className="text-sm text-muted-foreground">Receita Mensal</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency((assignedGabinetes?.length || 0) * plan.price_yearly)}
              </p>
              <p className="text-sm text-muted-foreground">Receita Anual</p>
            </div>
          </div>

          {/* Add New Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Vincular Novo Gabinete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={selectedGabineteId} onValueChange={setSelectedGabineteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um gabinete disponível" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGabinetes?.map((gabinete) => (
                        <SelectItem key={gabinete.id} value={gabinete.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{gabinete.nome}</span>
                            <span className="text-xs text-muted-foreground">
                              {gabinete.camaras?.nome}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => selectedGabineteId && assignGabineteMutation.mutate(selectedGabineteId)}
                  disabled={!selectedGabineteId || assignGabineteMutation.isPending}
                  className="gap-2"
                >
                  {assignGabineteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Vincular
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gabinetes Vinculados
                {assignedGabinetes && (
                  <Badge variant="secondary" className="ml-2">
                    {assignedGabinetes.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : assignedGabinetes && assignedGabinetes.length > 0 ? (
                <div className="space-y-3">
                  {assignedGabinetes.map((gabinete) => {
                    const daysUntilRenewal = getDaysUntilRenewal(gabinete.subscription_end_date);
                    const isRenewalSoon = daysUntilRenewal !== null && daysUntilRenewal <= 7;
                    
                    return (
                      <Card key={gabinete.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5 text-blue-600" />
                              <div>
                                <CardTitle className="text-base">{gabinete.nome}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {gabinete.camaras?.nome}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(gabinete.payment_status)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeGabineteMutation.mutate(gabinete.id)}
                                disabled={removeGabineteMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Início da Assinatura</p>
                              <p className="font-medium">{formatDate(gabinete.subscription_start_date)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Próxima Renovação</p>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{formatDate(gabinete.subscription_end_date)}</p>
                                {isRenewalSoon && (
                                  <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {daysUntilRenewal} dias
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Tipo da Câmara</p>
                              <p className="font-medium capitalize">
                                {gabinete.camaras?.tipo?.replace('_', ' ') || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum gabinete vinculado a este plano</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <p>
              Total de gabinetes: {assignedGabinetes?.length || 0}
            </p>
            <p>
              Receita mensal projetada: {formatCurrency((assignedGabinetes?.length || 0) * plan.price_monthly)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};