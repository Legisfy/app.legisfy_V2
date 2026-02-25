import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';

interface CheckoutButtonProps {
  priceId: string;
  plan: string;
  planName: string;
  className?: string;
  children?: React.ReactNode;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  priceId,
  plan,
  planName,
  className = "",
  children
}) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para assinar um plano.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          plan
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Abrir checkout em nova aba
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de checkout não recebida');
      }

    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast({
        title: "Erro no checkout",
        description: error instanceof Error ? error.message : "Erro ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={loading || !user}
      className={`w-full ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          {children || (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Assinar {planName}
            </>
          )}
        </>
      )}
    </Button>
  );
};