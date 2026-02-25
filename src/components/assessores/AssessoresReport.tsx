import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface Assessor {
  id: string;
  nome: string;
  eleitoresCadastrados: number;
  ideiasAprovadas: number;
  demandas: number;
  indicacoes: number;
  ranking: number;
}

interface AssessoresReportProps {
  assessores: Assessor[];
}

export const AssessoresReport = ({ assessores }: AssessoresReportProps) => {
  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Relacionadas aos Assessores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <Card className="bg-card/40 backdrop-blur-md border-border/40 rounded-xl shadow-lg shadow-primary/5 transition-all hover:shadow-primary/10 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total de Assessores</CardTitle>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold font-outfit">{assessores.length}</div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-0.5">Equipe Cadastrada</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};