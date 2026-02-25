import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Lightbulb, MessageSquare, FileText, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessorPerformanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessor: {
    id: string;
    nome: string;
    avatar: string;
    cargo: string;
    ranking: number;
    eleitoresCadastrados: number;
    ideiasAprovadas: number;
    demandas: number;
    indicacoes: number;
  } | null;
}

export const AssessorPerformanceModal = ({
  open,
  onOpenChange,
  assessor
}: AssessorPerformanceModalProps) => {
  if (!assessor) return null;

  const totalActividade = assessor.eleitoresCadastrados + assessor.ideiasAprovadas + assessor.demandas + assessor.indicacoes;

  const getRankingColor = (ranking: number) => {
    switch (ranking) {
      case 1:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case 3:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getRankingEmoji = (ranking: number) => {
    switch (ranking) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏅";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/60 backdrop-blur-xl border-border/40 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col p-5 overflow-hidden max-h-[85vh]">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold font-outfit uppercase tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Desempenho
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
          {/* Cabeçalho com informações do assessor */}
          <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl relative overflow-hidden">
            <div className="relative">
              <Avatar className="h-14 w-14 border-2 border-primary/20 p-0.5 bg-background shadow-lg">
                <AvatarImage src={assessor.avatar} alt={assessor.nome} className="rounded-full" />
                <AvatarFallback className="text-base font-bold font-outfit text-primary">
                  {assessor.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-lg",
                assessor.ranking === 1 ? "bg-yellow-400" : "bg-primary/20"
              )}>
                {getRankingEmoji(assessor.ranking)}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold font-outfit uppercase tracking-tight text-foreground/90">{assessor.nome}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{assessor.cargo}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="rounded-md border-primary/20 text-primary font-bold text-[9px] uppercase tracking-widest px-2 py-0">#{assessor.ranking}</Badge>
                <Badge variant="secondary" className="rounded-md bg-primary/10 text-primary font-bold text-[9px] uppercase tracking-widest px-2 py-0">{totalActividade} impactos</Badge>
              </div>
            </div>
          </div>

          {/* Métricas de Desempenho */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl shadow-xl shadow-primary/5 hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Eleitores</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-outfit text-blue-500">{assessor.eleitoresCadastrados}</div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">Base Cadastrada</p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl shadow-xl shadow-primary/5 hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Proj. de Lei</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-outfit text-orange-500">{assessor.ideiasAprovadas}</div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">Registros Efetuados</p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl shadow-xl shadow-primary/5 hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Demandas</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-outfit text-green-500">{assessor.demandas}</div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">Casos Solucionados</p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl shadow-xl shadow-primary/5 hover:border-primary/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Indicações</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-outfit text-purple-500">{assessor.indicacoes}</div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">Projetos Executados</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo de Produtividade */}
          <Card className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl shadow-xl shadow-primary/5 overflow-hidden">
            <CardHeader className="pb-3 bg-primary/[0.02]">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Matriz de Produtividade Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Impacto Consolidado</span>
                  <span className="font-bold font-outfit text-lg">{totalActividade} ATIVIDADES</span>
                </div>

                <div className="pt-4 border-t border-border/10">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">Distribuição Relativa:</div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-blue-500/70">Eleitores</span>
                        <span>{totalActividade > 0 ? Math.round((assessor.eleitoresCadastrados / totalActividade) * 100) : 0}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${totalActividade > 0 ? (assessor.eleitoresCadastrados / totalActividade) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-green-500/70">Demandas</span>
                        <span>{totalActividade > 0 ? Math.round((assessor.demandas / totalActividade) * 100) : 0}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-1000 ease-out" style={{ width: `${totalActividade > 0 ? (assessor.demandas / totalActividade) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-purple-500/70">Indicações</span>
                        <span>{totalActividade > 0 ? Math.round((assessor.indicacoes / totalActividade) * 100) : 0}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-1000 ease-out" style={{ width: `${totalActividade > 0 ? (assessor.indicacoes / totalActividade) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-orange-500/70">Proj. de Lei</span>
                        <span>{totalActividade > 0 ? Math.round((assessor.ideiasAprovadas / totalActividade) * 100) : 0}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all duration-1000 ease-out" style={{ width: `${totalActividade > 0 ? (assessor.ideiasAprovadas / totalActividade) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};