import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  plan_name: string;
  status: 'completed' | 'pending' | 'failed';
  payment_id: string;
  month_year: string;
  type: 'one_time' | 'subscription';
}

interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePaymentHistory = (): PaymentHistoryResponse => {
  const { user } = useAuthContext();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentHistory = async () => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('get-payment-history', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      setPayments(data?.payments || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar histórico de pagamentos');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, [user]);

  return {
    payments,
    loading,
    error,
    refetch: fetchPaymentHistory
  };
};