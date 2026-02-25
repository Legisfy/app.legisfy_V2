import { Trophy, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PremiacaoModal } from "@/components/modals/PremiacaoModal";
import { useMetasPremiacoes } from "@/hooks/useMetasPremiacoes";
import { useAuthContext } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGabineteData } from "@/hooks/useGabineteData";

export const PremiacoesCard = () => {
  const { metas } = useMetasPremiacoes();
  const { cabinet } = useAuthContext();
  const [assessoresCount, setAssessoresCount] = useState(0);
  const { assessorRanking } = useGabineteData();

  useEffect(() => {
    const fetchAssessoresCount = async () => {
      if (!cabinet?.cabinet_id) return;
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('gabinete_id', cabinet.cabinet_id);
      setAssessoresCount(count || 0);
    };
    fetchAssessoresCount();
  }, [cabinet?.cabinet_id]);

  // Top 3 assessores do ranking real
  const topAssessores = assessorRanking.slice(0, 3);

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Premiações e Metas</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
            <span className="text-2xl font-bold text-foreground tracking-tight">{assessoresCount}</span>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Assessores</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
            <span className="text-2xl font-bold text-foreground tracking-tight">{metas.length}</span>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Metas ativas</p>
          </div>
        </div>

        {/* Mini Leaderboard - dados reais */}
        <div className="space-y-2">
          {topAssessores.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">Sem dados de ranking</p>
          ) : (
            topAssessores.map((assessor, idx) => {
              const initials = (assessor.name || 'U')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <div key={assessor.user_id || idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${idx === 0 ? 'text-foreground' : 'text-muted-foreground'} w-3`}>
                      {idx + 1}º
                    </span>
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground border border-border/50">
                      {initials}
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      {assessor.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-foreground/70">
                    {assessor.points} pts
                  </span>
                </div>
              );
            })
          )}
        </div>

        <PremiacaoModal>
          <Button variant="outline" className="w-full h-8 text-xs font-semibold rounded-lg">
            <Settings className="mr-2 h-3.5 w-3.5" />
            Configurar Premiações
          </Button>
        </PremiacaoModal>
      </CardContent>
    </Card>
  );
};