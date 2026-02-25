import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { CustomerPortalButton } from './CustomerPortalButton';
import { CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';

export const SubscriptionStatus: React.FC = () => {
  const { subscribed, plan, subscription_end, loading, error, refreshSubscription } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Verificando assinatura...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <XCircle className="h-5 w-5 mr-2" />
            <span>Erro ao carregar status da assinatura: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={subscribed ? 'border-green-200' : 'border-gray-200'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {subscribed ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-gray-400" />
            )}
            <div>
              <CardTitle className="text-lg">
                Status da Assinatura
              </CardTitle>
              <CardDescription>
                {subscribed ? 'Você tem uma assinatura ativa' : 'Nenhuma assinatura ativa'}
              </CardDescription>
            </div>
          </div>
          <Badge variant={subscribed ? 'default' : 'secondary'}>
            {subscribed ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {subscribed && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
                <p className="text-lg font-semibold">{plan || 'Carregando...'}</p>
              </div>
              
              {subscription_end && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Próxima Cobrança</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <p className="text-lg font-semibold">
                      {new Date(subscription_end).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <CustomerPortalButton className="w-full" />
            </div>
          </>
        )}
        
        {!subscribed && (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Assine um plano para acessar todas as funcionalidades da Legisfy
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};