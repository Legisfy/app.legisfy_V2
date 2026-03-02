import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';

interface SubscriptionStatus {
  subscribed: boolean;
  plan: string | null;
  product_id: string | null;
  subscription_end: string | null;
  customer_id: string | null;
  loading: boolean;
  error: string | null;
}

export const useSubscription = () => {
  const { user } = useAuthContext();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    plan: null,
    product_id: null,
    subscription_end: null,
    customer_id: null,
    loading: true,
    error: null
  });

  const checkSubscription = async () => {
    if (!user) {
      setSubscription(prev => ({
        ...prev,
        loading: false,
        subscribed: false,
        plan: null,
        error: null
      }));
      return;
    }

    try {
      setSubscription(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      // Edge function agora retorna 200 sempre (mesmo sem assinatura)
      // Só considera erro real se não tem data ou tem um campo error sem subscribed
      if (error) {
        console.warn('[useSubscription] Edge function error (ignorado):', error);
        setSubscription(prev => ({
          ...prev,
          loading: false,
          error: null, // Nao mostrar erro para o usuario
          subscribed: false
        }));
        return;
      }

      setSubscription(prev => ({
        ...prev,
        subscribed: data?.subscribed ?? false,
        plan: data?.plan ?? null,
        product_id: data?.product_id ?? null,
        subscription_end: data?.subscription_end ?? null,
        customer_id: data?.customer_id ?? null,
        loading: false,
        error: null
      }));

    } catch (error) {
      console.warn('[useSubscription] Error (ignorado):', error);
      // Nao exibir erro para o usuario — o card de assinatura usa dados do contrato local
      setSubscription(prev => ({
        ...prev,
        loading: false,
        error: null
      }));
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const refreshSubscription = () => {
    checkSubscription();
  };

  return {
    ...subscription,
    refreshSubscription
  };
};