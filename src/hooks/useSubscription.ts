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
        plan: null 
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

      if (error) throw error;

      setSubscription(prev => ({
        ...prev,
        ...data,
        loading: false,
        error: null
      }));

    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
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