import { Crown, Calendar, Building2, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface PlanoInfo {
  title: string;
  price_monthly: number;
  price_yearly: number;
  tipo_plano: 'institucional' | 'individual';
  instituicao_nome?: string;
}

export const PlanoAssinaturaCard = () => {
  const { cabinet } = useAuthContext();
  const navigate = useNavigate();
  const [planoInfo, setPlanoInfo] = useState<PlanoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanoInfo = async () => {
      if (!cabinet?.cabinet_id) return;
      
      try {
        // Buscar informações do gabinete, câmara e planos
        const { data: gabineteData } = await supabase
          .from('gabinetes')
          .select(`
            id,
            plan_id,
            subscription_start_date,
            subscription_end_date,
            payment_status,
            camaras!camara_id(
              id,
              nome,
              plan_id
            )
          `)
          .eq('id', cabinet.cabinet_id)
          .single();

        if (!gabineteData || !gabineteData.camaras) return;

        // Verificar se existe plano institucional (da câmara)
        if (gabineteData.camaras.plan_id) {
          const { data: planoInstitucional } = await supabase
            .from('plans')
            .select('name, monthly_price_cents')
            .eq('id', gabineteData.camaras.plan_id)
            .single();

          if (planoInstitucional) {
            setPlanoInfo({
              title: planoInstitucional.name,
              price_monthly: planoInstitucional.monthly_price_cents / 100 || 0,
              price_yearly: 0, // Not available in new schema
              tipo_plano: 'institucional',
              instituicao_nome: gabineteData.camaras.nome
            });
            return;
          }
        }

        // Se não tem plano institucional, verificar plano direto do gabinete
        if (gabineteData.plan_id) {
          const { data: planoGabinete } = await supabase
            .from('plans')
            .select('name, monthly_price_cents')
            .eq('id', gabineteData.plan_id)
            .single();

          if (planoGabinete) {
            setPlanoInfo({
              title: planoGabinete.name,
              price_monthly: planoGabinete.monthly_price_cents / 100 || 0,
              price_yearly: 0, // Not available in new schema
              tipo_plano: 'individual'
            });
            return;
          }
        }

        // Fallback para plano padrão
        setPlanoInfo({
          title: 'Plano Padrão',
          price_monthly: 0,
          price_yearly: 0,
          tipo_plano: 'individual'
        });

      } catch (error) {
        console.error('Erro ao buscar plano:', error);
        setPlanoInfo({
          title: 'Plano Padrão',
          price_monthly: 0,
          price_yearly: 0,
          tipo_plano: 'individual'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlanoInfo();
  }, [cabinet?.cabinet_id]);

  if (loading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="bg-muted p-1.5 rounded-lg">
              <Crown className="h-4 w-4 text-yellow-600" />
            </div>
            Plano de Assinatura
          </CardTitle>
          <CardDescription className="text-xs">
            Carregando informações...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const planoAtual = planoInfo?.title || "Plano Básico";
  const precoMensal = planoInfo?.price_monthly || 0;
  const isInstitucional = planoInfo?.tipo_plano === 'institucional';

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className="bg-muted p-1.5 rounded-lg">
            {isInstitucional ? (
              <Building2 className="h-4 w-4 text-blue-600" />
            ) : (
              <Crown className="h-4 w-4 text-yellow-600" />
            )}
          </div>
          Plano de Assinatura
        </CardTitle>
        <CardDescription className="text-xs">
          {isInstitucional ? 'Plano institucional vinculado' : 'Seu plano atual e benefícios'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 pt-0">
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs px-2 py-1">
            {planoAtual}
          </Badge>
          {isInstitucional && (
            <Badge variant="outline" className="text-xs px-2 py-1 border-blue-200 text-blue-700">
              Institucional
            </Badge>
          )}
        </div>
        
        {isInstitucional ? (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Building2 className="h-3 w-3" />
              <span>{planoInfo?.instituicao_nome}</span>
            </div>
            <div className="mt-1">
              Plano personalizado para a instituição
            </div>
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" />
                <span>Mensal</span>
              </div>
              <div className="font-medium text-foreground">
                R$ {precoMensal.toFixed(2)}/mês
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              • Acesso completo às funcionalidades
              • Suporte técnico incluso
              • Atualizações automáticas
            </div>
          </>
        )}
        
        <div className="mt-4 pt-3 border-t border-border/40">
          <Button 
            onClick={() => navigate('/assinatura')}
            variant="outline" 
            size="sm" 
            className="w-full text-xs h-8"
          >
            <CreditCard className="h-3 w-3 mr-2" />
            Minha Assinatura
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};