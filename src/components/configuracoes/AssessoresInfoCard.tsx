import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAssessores } from "@/hooks/useAssessores";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface PlanoLimites {
  usuarios_por_gabinete_permitidos: number;
  tipo_plano: 'institucional' | 'individual';
  nome_plano: string;
}

export const AssessoresInfoCard = () => {
  const { assessores, loading: assessoresLoading } = useAssessores();
  const { cabinet } = useAuthContext();
  const [planoLimites, setPlanoLimites] = useState<PlanoLimites | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanoLimites = async () => {
      if (!cabinet?.cabinet_id) return;
      
      try {
        // Primeiro buscar dados do gabinete e câmara
        const { data: gabineteData } = await supabase
          .from('gabinetes')
          .select(`
            id,
            camara_id,
            plan_id,
            camaras!camara_id(
              id,
              nome,
              usuarios_por_gabinete_permitidos,
              plan_id
            )
          `)
          .eq('id', cabinet.cabinet_id)
          .single();

        if (!gabineteData || !gabineteData.camaras) return;

        // Verificar se existe plano institucional (da câmara)
        if (gabineteData.camaras.plan_id) {
          // Buscar plano institucional
          const { data: planoInstitucional } = await supabase
            .from('plans')
            .select('name')
            .eq('id', gabineteData.camaras.plan_id)
            .single();

          if (planoInstitucional) {
            setPlanoLimites({
              usuarios_por_gabinete_permitidos: gabineteData.camaras.usuarios_por_gabinete_permitidos || 20,
              tipo_plano: 'institucional',
              nome_plano: `${planoInstitucional.name} (Institucional)`
            });
            return;
          }
        }

        // Se não tem plano institucional, verificar plano direto do gabinete
        if (gabineteData.plan_id) {
          const { data: planoGabinete } = await supabase
            .from('plans')
            .select('name')
            .eq('id', gabineteData.plan_id)
            .single();

          if (planoGabinete) {
            setPlanoLimites({
              usuarios_por_gabinete_permitidos: 20, // Usar valor padrão por enquanto
              tipo_plano: 'individual',
              nome_plano: planoGabinete.name
            });
            return;
          }
        }

        // Fallback: usar limite da câmara ou padrão
        setPlanoLimites({
          usuarios_por_gabinete_permitidos: gabineteData.camaras.usuarios_por_gabinete_permitidos || 20,
          tipo_plano: 'individual',
          nome_plano: 'Plano Padrão'
        });

      } catch (error) {
        console.error('Erro ao buscar limites do plano:', error);
        // Fallback em caso de erro
        setPlanoLimites({
          usuarios_por_gabinete_permitidos: 20,
          tipo_plano: 'individual',
          nome_plano: 'Plano Padrão'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlanoLimites();
  }, [cabinet?.cabinet_id]);

  const limiteAssessores = planoLimites?.usuarios_por_gabinete_permitidos || 20;
  const assessoresAtuais = assessores.length;
  const assessoresRestantes = Math.max(0, limiteAssessores - assessoresAtuais);
  const percentualUso = (assessoresAtuais / limiteAssessores) * 100;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className="bg-muted p-1.5 rounded-lg">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          Assessores
        </CardTitle>
        <CardDescription className="text-xs">
          Controle de membros da equipe
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 pt-0">
        {loading || assessoresLoading ? (
          <div className="text-xs text-muted-foreground">Carregando...</div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">
              <div className="font-medium text-foreground">
                {assessoresAtuais} de {limiteAssessores} assessores
              </div>
              <div className="mt-1">
                Restam {assessoresRestantes} vagas disponíveis
              </div>
            </div>
            
            <Progress 
              value={percentualUso} 
              className="h-2"
            />
            
            <div className="text-xs text-muted-foreground">
              {percentualUso.toFixed(0)}% do limite utilizado
            </div>
            
            {planoLimites && (
              <div className="text-xs text-muted-foreground">
                <div className="opacity-75">
                  Limite definido pelo {planoLimites.nome_plano}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};