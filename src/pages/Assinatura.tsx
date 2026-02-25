import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { CustomerPortalButton } from '@/components/stripe/CustomerPortalButton';
import { PaymentHistoryModal } from '@/components/assinatura/PaymentHistoryModal';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  History,
  TrendingUp,
  XCircle,
  ArrowUp,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Assinatura() {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const { subscribed, plan, product_id, subscription_end, loading: subscriptionLoading, error: subscriptionError, refreshSubscription } = useSubscription();
  const { payments, loading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = usePaymentHistory();

  const loading = subscriptionLoading || paymentsLoading;
  const error = subscriptionError || paymentsError;

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('main_role')
          .eq('user_id', user.id)
          .single();
        
        setUserRole(profile?.main_role || null);
      }
      setCheckingRole(false);
    };

    checkUserRole();
  }, []);

  // Real subscription info based on current data
  const subscriptionInfo = {
    planName: plan || 'Nenhum plano ativo',
    status: subscribed ? 'active' : 'inactive',
    nextBillingDate: subscription_end ? new Date(subscription_end) : null,
    daysRemaining: subscription_end 
      ? Math.max(0, Math.ceil((new Date(subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { color: 'bg-green-100 text-green-800', text: 'Pago' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Falhou' }
    };
    return variants[status as keyof typeof variants] || variants.completed;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading || checkingRole) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded animate-pulse" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show locked page for non-politico users
  if (userRole !== 'politico') {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Minha Assinatura</h1>
            <p className="text-muted-foreground">
              Gerencie seu plano, pagamentos e configurações de assinatura
            </p>
          </div>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Lock className="h-5 w-5 text-orange-600" />
                </div>
                Acesso Restrito
              </CardTitle>
              <CardDescription className="text-orange-700">
                Esta funcionalidade está disponível apenas para políticos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-800">
                O gerenciamento de assinaturas e pagamentos é exclusivo para usuários com perfil de político. 
                Se você acredita que deveria ter acesso a esta página, entre em contato com o administrador do seu gabinete.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => window.history.back()}>
                  Voltar
                </Button>
                <Button asChild>
                  <a href="/dashboard">Ir para o Dashboard</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Minha Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie seu plano, pagamentos e configurações de assinatura
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar informações da assinatura: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Status da Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${subscribed ? 'bg-green-100' : 'bg-orange-100'}`}>
                {subscribed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
              </div>
              Status da Assinatura
            </CardTitle>
            <CardDescription>
              Informações sobre seu plano atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={subscribed ? "default" : "secondary"} className="text-sm">
                    {subscriptionInfo.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <span className="font-medium">{subscriptionInfo.planName}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscribed ? 'Assinatura ativa e em dia' : 'Assinatura não encontrada'}
                </p>
              </div>
              <Button onClick={refreshSubscription} variant="outline" size="sm">
                Atualizar Status
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Próxima Cobrança
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscriptionInfo.nextBillingDate 
                    ? format(subscriptionInfo.nextBillingDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Não definida'
                  }
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {subscribed ? 'Assinatura ativa' : 'Sem assinatura ativa'}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Dias Restantes</p>
                <p className="text-sm text-muted-foreground">
                  {subscriptionInfo.daysRemaining > 0 ? `${subscriptionInfo.daysRemaining} dias` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              Histórico de Pagamentos
            </CardTitle>
            <CardDescription>
              Visualize todas as suas transações e cobranças
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e Horário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Nome do Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ID do Pagamento</TableHead>
                    <TableHead>Mês/Ano</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {paymentsLoading ? 'Carregando histórico...' : 'Nenhum pagamento encontrado'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => {
                      const statusBadge = getStatusBadge(payment.status);
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {format(new Date(payment.date), "dd/MM/yyyy")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(payment.date), "HH:mm")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{payment.plan_name}</TableCell>
                          <TableCell>
                            <Badge className={statusBadge.color}>
                              {statusBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {payment.payment_id}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.month_year}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Método de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              Informações de Pagamento
            </CardTitle>
            <CardDescription>
              Forma de pagamento atual para sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">
                  {subscribed ? 'Método configurado via Stripe' : 'Nenhum método configurado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscribed ? 'Gerencie através do portal do cliente' : 'Configure uma assinatura para ver os métodos de pagamento'}
                </p>
              </div>
              {subscribed ? (
                <CustomerPortalButton className="shrink-0">
                  <Settings className="h-4 w-4 mr-2" />
                  Atualizar Pagamento
                </CustomerPortalButton>
              ) : (
                <Button disabled className="shrink-0">
                  <Settings className="h-4 w-4 mr-2" />
                  Atualizar Pagamento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações da Assinatura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upgrade do Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                Upgrade do Plano
              </CardTitle>
              <CardDescription>
                Acesse recursos avançados e aumente os limites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = '/assinatura-stripe'}
                className="w-full"
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Ver Planos Disponíveis
              </Button>
            </CardContent>
          </Card>

          {/* Cancelamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                Cancelar Assinatura
              </CardTitle>
              <CardDescription>
                Cancele sua assinatura a qualquer momento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerPortalButton 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Gerenciar Cancelamento
              </CustomerPortalButton>
            </CardContent>
          </Card>
        </div>

        {/* Modal de Histórico de Pagamentos */}
        <PaymentHistoryModal 
          open={showPaymentHistory}
          onOpenChange={setShowPaymentHistory}
        />
      </div>
    </AppLayout>
  );
}