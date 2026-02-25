import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings } from 'lucide-react';

interface CustomerPortalButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const CustomerPortalButton: React.FC<CustomerPortalButtonProps> = ({
  className = "",
  children
}) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para gerenciar sua assinatura.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Abrir portal em nova aba
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL do portal não recebida');
      }

    } catch (error) {
      console.error('Erro ao abrir portal:', error);
      toast({
        title: "Erro no portal",
        description: error instanceof Error ? error.message : "Erro ao abrir portal de gerenciamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePortal} 
      disabled={loading || !user}
      variant="outline"
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Abrindo...
        </>
      ) : (
        <>
          {children || (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Assinatura
            </>
          )}
        </>
      )}
    </Button>
  );
};