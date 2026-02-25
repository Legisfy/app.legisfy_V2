import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/useSubscription';
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
  Crown,
  Building2,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MinhaAssinatura() {
  const { subscribed, plan, product_id, subscription_end, loading, error, refreshSubscription } = useSubscription();
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

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

  // Informações reais de assinatura via Stripe (próxima cobrança e dias restantes)
  const subscriptionInfo = {
    planName: plan || 'Plano Básico',
    status: subscribed ? 'active' : 'inactive',
    nextBillingDate: subscription_end ? new Date(subscription_end) : null,
    daysRemaining: subscription_end
      ? Math.max(0, Math.ceil((new Date(subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null
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
      <div className="max-w-4xl mx-auto p-6 space-y-8">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Próxima Cobrança
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscriptionInfo.nextBillingDate
                    ? format(subscriptionInfo.nextBillingDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Sem data definida'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Dias Restantes</p>
                <p className="text-sm text-muted-foreground">
                  {subscriptionInfo.daysRemaining !== null ? `${subscriptionInfo.daysRemaining} dias` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              Método de Pagamento
            </CardTitle>
            <CardDescription>
              Gerencie seu método de pagamento pelo portal do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Dados disponíveis no portal</p>
                <p className="text-sm text-muted-foreground">
                  Acesse o portal para ver e alterar seu método de pagamento
                </p>
              </div>
              <CustomerPortalButton className="shrink-0">
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar Pagamento
              </CustomerPortalButton>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Ações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Visualize todas as suas transações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowPaymentHistory(true)}
                variant="outline"
                className="w-full"
              >
                Ver Histórico
              </Button>
            </CardContent>
          </Card>

          {/* Alterar Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <Crown className="h-5 w-5 text-green-600" />
                </div>
                Alterar Plano
              </CardTitle>
              <CardDescription>
                Upgrade ou downgrade do seu plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => window.location.href = '/assinatura-stripe'}
                className="w-full"
              >
                Ver Planos Disponíveis
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Configurações Avançadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gray-100">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              Configurações Avançadas
            </CardTitle>
            <CardDescription>
              Gerencie todas as configurações da sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <CustomerPortalButton className="flex-1">
                <Building2 className="h-4 w-4 mr-2" />
                Portal do Cliente
              </CustomerPortalButton>

              <Button variant="outline" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Pausar Assinatura
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Cancelar Assinatura</h4>
              <p className="text-sm text-muted-foreground">
                Você pode cancelar sua assinatura a qualquer momento através do portal do cliente.
                Você continuará tendo acesso aos recursos até o final do período de cobrança.
              </p>
              <CustomerPortalButton className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm px-3 py-1">
                Gerenciar Cancelamento
              </CustomerPortalButton>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Precisa de Ajuda?</CardTitle>
            <CardDescription>
              Nossa equipe está pronta para ajudar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" asChild>
                <a href="mailto:suporte@legisfy.com">
                  📧 suporte@legisfy.com
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📱 WhatsApp Suporte
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Histórico de Pagamentos */}
        <PaymentHistoryModal
          open={showPaymentHistory}
          onOpenChange={setShowPaymentHistory}
        />
      </div>
    </AppLayout>
  );
}