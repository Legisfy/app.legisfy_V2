import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuthContext } from "@/components/AuthProvider";

interface PaymentHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  open,
  onOpenChange
}) => {
  const { user, cabinet } = useAuthContext();
  const gabineteId = cabinet?.cabinet_id;

  // TODO: Implement when payment_history table is created
  const { data: paymentHistory = [], isLoading } = useQuery({
    queryKey: ['payment-history', gabineteId],
    queryFn: async () => {
      console.log('Payment history requested for gabinete:', gabineteId);
      return [];
    },
    enabled: open && !!user && !!gabineteId,
  });

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'sucesso':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'falhou':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhado';
      default: return status;
    }
  };

  const translatePaymentMethod = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card': return 'Cartão';
      case 'pix': return 'PIX';
      case 'boleto': return 'Boleto';
      default: return method;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Pagamentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : paymentHistory.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>Nenhum histórico de pagamentos encontrado.</p>
                <p className="text-sm mt-2">
                  Histórico de pagamentos não está disponível no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {paymentHistory.map((payment: any) => (
                <Card key={payment.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {formatCurrency(payment.amount, payment.currency)}
                      </CardTitle>
                      <Badge className={getStatusColor(payment.payment_status)}>
                        {translateStatus(payment.payment_status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {format(new Date(payment.payment_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Método:</span>
                        <p>{translatePaymentMethod(payment.payment_method)}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium">Transação:</span>
                        <p className="font-mono text-xs">{payment.transaction_id}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium">Plano:</span>
                        <p>{payment.plans?.title || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};