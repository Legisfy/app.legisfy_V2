import { Trophy, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMetasPremiacoes } from "@/hooks/useMetasPremiacoes";
import { cn } from "@/lib/utils";

const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case 'eleitores': return 'bg-emerald-500';
    case 'demandas': return 'bg-blue-500';
    case 'ideias': return 'bg-amber-500';
    case 'indicacoes': return 'bg-purple-500';
    default: return 'bg-zinc-500';
  }
};

const getTipoLabel = (tipo: string) => {
  switch (tipo) {
    case 'eleitores': return 'Eleitores';
    case 'demandas': return 'Demandas';
    case 'ideias': return 'Projeto de Leis';
    case 'indicacoes': return 'Indicações';
    default: return tipo;
  }
};

export const MetasRewards = () => {
  const { metas, loading } = useMetasPremiacoes();

  if (loading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-primary" />
            Metas e Premiações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-xs text-muted-foreground">Carregando metas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/40 bg-card/95 dark:bg-card/20 backdrop-blur-sm shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 dark:text-muted-foreground/60 font-outfit">
          <Trophy className="h-3 w-3 opacity-60 dark:opacity-40" />
          Metas Estratégicas
        </CardTitle>
        <CardDescription className="text-[8px] uppercase font-medium tracking-tighter opacity-60 dark:opacity-40">Acompanhamento de performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metas.length > 0 ? (
          metas.slice(0, 3).map((meta) => {
            const progressPercentage = Math.min((meta.progresso! / meta.meta) * 100, 100);
            return (
              <div key={meta.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[10px] font-bold truncate text-foreground font-outfit">{meta.nome}</h4>
                      <Badge variant="outline" className={cn("text-[7px] font-bold uppercase tracking-wider px-1.5 py-0 h-3.5 border-none bg-opacity-10", getTipoColor(meta.tipo), getTipoColor(meta.tipo).replace('bg-', 'text-'), getTipoColor(meta.tipo).replace('bg-', 'border-') + "/20")}>
                        {getTipoLabel(meta.tipo)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-muted-foreground/60 dark:text-muted-foreground/40 font-mono">
                        {meta.progresso}/{meta.meta}
                      </span>
                      <span className="text-[9px] font-bold text-primary/60">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <Progress
                      value={progressPercentage}
                      className="h-1 bg-muted/20"
                      indicatorClassName={cn(getTipoColor(meta.tipo), "opacity-50")}
                    />
                    <div className="flex items-center gap-1.5 mt-2 opacity-60 dark:opacity-40">
                      <Trophy className="h-2.5 w-2.5 text-primary" />
                      <span className="text-[8px] font-bold uppercase tracking-tight truncate">{meta.premio}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 opacity-20">
            <Target className="mx-auto h-6 w-6 mb-2" />
            <p className="text-[9px] uppercase font-bold tracking-widest leading-none">Sem Metas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};