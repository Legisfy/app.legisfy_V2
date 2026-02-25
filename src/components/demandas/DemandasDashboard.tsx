import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Target,
  Activity,
  Tag
} from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Demanda } from "./DemandasTable";

interface DemandasDashboardProps {
  demandas: Demanda[];
}

const COLORS = {
  pendente: "#f59e0b",
  em_atendimento: "#3b82f6", 
  resolvida: "#10b981",
  cancelada: "#ef4444"
};

export function DemandasDashboard({ demandas }: DemandasDashboardProps) {
  // Dados consolidados
  const dashboardData = useMemo(() => {
    const stats = {
      total: demandas.length,
      pendentes: demandas.filter(d => d.status === "pendente").length,
      emAndamento: demandas.filter(d => d.status === "em_atendimento").length,
      resolvidas: demandas.filter(d => d.status === "resolvida").length,
      canceladas: demandas.filter(d => d.status === "cancelada").length,
    };

    // Taxa de resolução
    const taxaResolucao = stats.total > 0 ? (stats.resolvidas / stats.total) * 100 : 0;

    return { stats, taxaResolucao };
  }, [demandas]);

  // Dados por tag (top 5)
  const dadosPorTag = useMemo(() => {
    const tags = demandas.reduce((acc, demanda) => {
      acc[demanda.tag] = (acc[demanda.tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tags)
      .map(([tag, quantidade]) => ({ tag, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)
      .map((item, index) => ({ ...item, posicao: index + 1 }));
  }, [demandas]);

  // Dados por status - todos os status
  const dadosStatus = useMemo(() => [
    { name: "Pendente", value: dashboardData.stats.pendentes, color: COLORS.pendente },
    { name: "Em Atendimento", value: dashboardData.stats.emAndamento, color: COLORS.em_atendimento },
    { name: "Resolvida", value: dashboardData.stats.resolvidas, color: COLORS.resolvida },
    { name: "Cancelada", value: dashboardData.stats.canceladas, color: COLORS.cancelada },
  ], [dashboardData]);

  // Evolução temporal mensal
  const evolucaoMensal = useMemo(() => {
    const meses = demandas.reduce((acc, demanda) => {
      if (demanda.dataHora) {
        const date = new Date(demanda.dataHora);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        acc[monthYear] = (acc[monthYear] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    let acumulado = 0;
    return Object.entries(meses)
      .sort((a, b) => {
        const [monthA, yearA] = a[0].split('/').map(Number);
        const [monthB, yearB] = b[0].split('/').map(Number);
        return yearA === yearB ? monthA - monthB : yearA - yearB;
      })
      .map(([mes, quantidade]) => {
        acumulado += quantidade;
        return {
          mes,
          quantidade,
          acumulado
        };
      });
  }, [demandas]);

  // Métricas avançadas
  const metricas = useMemo(() => {
    const demandasTrabalho = demandas.filter(d => d.tipo === "trabalho_emprego").length;
    const demandasGerais = demandas.filter(d => d.tipo === "geral").length;
    
    const tempoMedioResolucao = demandas
      .filter(d => d.status === "resolvida")
      .reduce((acc, d) => {
        const hoje = new Date();
        const dias = Math.floor((hoje.getTime() - d.dataHora.getTime()) / (1000 * 60 * 60 * 24));
        return acc + dias;
      }, 0) / dashboardData.stats.resolvidas || 0;

    return {
      demandasTrabalho,
      demandasGerais,
      tempoMedioResolucao: Math.round(tempoMedioResolucao),
    };
  }, [demandas, dashboardData.stats.resolvidas]);

  const chartConfig = {
    quantidade: {
      label: "Quantidade"
    },
    demandas: {
      label: "Demandas",
      color: "hsl(var(--primary))"
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Demandas</CardTitle>
            <Activity className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Base completa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Resolução</CardTitle>
            <Target className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{dashboardData.taxaResolucao.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.stats.resolvidas} resolvidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
            <Clock className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info">{metricas.tempoMedioResolucao}</div>
            <p className="text-xs text-muted-foreground mt-1">
              dias para resolução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{dashboardData.stats.emAndamento}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.stats.total > 0 ? ((dashboardData.stats.emAndamento / dashboardData.stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Primeira linha - Status e Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={dadosStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  dataKey="value"
                >
                  {dadosStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tags Principais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Categorias Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dadosPorTag.map((item) => {
                const maxQuantidade = Math.max(...dadosPorTag.map(t => t.quantidade));
                
                // Cores diferentes para cada posição no ranking
                const rankColors = [
                  { bg: 'bg-amber-500/10', text: 'text-amber-600', bar: 'bg-gradient-to-r from-amber-500 to-orange-500' },
                  { bg: 'bg-blue-500/10', text: 'text-blue-600', bar: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
                  { bg: 'bg-purple-500/10', text: 'text-purple-600', bar: 'bg-gradient-to-r from-purple-500 to-pink-500' },
                  { bg: 'bg-green-500/10', text: 'text-green-600', bar: 'bg-gradient-to-r from-green-500 to-emerald-500' },
                  { bg: 'bg-rose-500/10', text: 'text-rose-600', bar: 'bg-gradient-to-r from-rose-500 to-red-500' },
                ];
                
                const color = rankColors[item.posicao - 1] || rankColors[0];
                
                return (
                  <div key={item.tag} className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${color.bg} ${color.text} font-bold`}>
                      {item.posicao}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{item.tag}</span>
                        <span className="text-xs text-muted-foreground">{item.quantidade}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className={`${color.bar} h-2.5 rounded-full transition-all shadow-sm`}
                          style={{ width: `${(item.quantidade / maxQuantidade) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha - Evolução e Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução de Demandas (maior) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolução de Demandas Cadastradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={evolucaoMensal}>
                <defs>
                  <linearGradient id="colorAcumuladoDemandas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="acumulado" 
                  name="Total de Demandas"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fill="url(#colorAcumuladoDemandas)"
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Métricas por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Demandas por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Trabalho/Emprego</span>
                <span className="text-2xl font-bold text-primary">{metricas.demandasTrabalho}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all" 
                  style={{ width: `${dashboardData.stats.total > 0 ? (metricas.demandasTrabalho / dashboardData.stats.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData.stats.total > 0 ? ((metricas.demandasTrabalho / dashboardData.stats.total) * 100).toFixed(1) : 0}% do total
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Demandas Gerais</span>
                <span className="text-2xl font-bold text-info">{metricas.demandasGerais}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-info h-3 rounded-full transition-all" 
                  style={{ width: `${dashboardData.stats.total > 0 ? (metricas.demandasGerais / dashboardData.stats.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData.stats.total > 0 ? ((metricas.demandasGerais / dashboardData.stats.total) * 100).toFixed(1) : 0}% do total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}