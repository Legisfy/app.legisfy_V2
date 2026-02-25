import { useState } from "react";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEleitoresWithStats } from "@/hooks/useEleitoresWithStats";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  MapPin,
  Tag,
  Calendar,
  ArrowLeft,
  BarChart3,
  Search
} from "lucide-react";


interface EleitoresAnalyticsProps {
  onBack: () => void;
}

export function EleitoresAnalytics({ onBack }: EleitoresAnalyticsProps) {
  console.log('🎯 EleitoresAnalytics component mounted');
  const { eleitores, loading, error } = useEleitoresWithStats();
  console.log('🎯 EleitoresAnalytics data:', {
    eleitores: eleitores?.length,
    loading,
    error,
    hasEleitores: Array.isArray(eleitores),
    firstEleitor: eleitores?.[0]
  });
  const [timeFilter, setTimeFilter] = useState("todos");
  const [bairroFilter, setBairroFilter] = useState("todos");

  // Estados Iniciais e Early Returns
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-50 dark:bg-red-500/10 p-8 rounded-[2rem] border border-red-100 dark:border-red-500/20 max-w-sm">
          <p className="text-red-600 dark:text-red-400 font-bold uppercase text-xs tracking-tight">Erro ao carregar análise</p>
          <p className="text-[10px] text-red-500/60 mt-2 uppercase tracking-widest">{error}</p>
          <Button onClick={onBack} variant="outline" className="mt-6 font-bold uppercase text-[9px] tracking-widest">Voltar</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Sincronizando dados...</p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(eleitores)) {
    return (
      <div className="p-12 flex flex-col items-center justify-center bg-white/40 dark:bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl min-h-[400px]">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-zinc-400 opacity-20" />
        </div>
        <h3 className="text-xl font-bold font-outfit uppercase tracking-tight text-foreground/80">Dados Indisponíveis</h3>
        <p className="text-sm text-muted-foreground/60 mt-2 text-center max-w-xs uppercase tracking-widest">Não foi possível carregar a base de eleitores.</p>
        <Button variant="ghost" className="mt-8 font-bold text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5" onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  try {
    // 1. Filtragem Inicial
    const filteredData = eleitores.filter(eleitor =>
      bairroFilter === "todos" || eleitor?.neighborhood === bairroFilter
    );

    const totalEleitores = filteredData.length;

    if (totalEleitores === 0) {
      return (
        <div className="p-12 flex flex-col items-center justify-center bg-white/40 dark:bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl min-h-[400px]">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-zinc-400 opacity-20" />
          </div>
          <h3 className="text-xl font-bold font-outfit uppercase tracking-tight text-foreground/80">Sem dados para análise</h3>
          <p className="text-sm text-muted-foreground/60 mt-2 text-center max-w-xs uppercase tracking-widest leading-relaxed">Não há eleitores que correspondam aos filtros selecionados.</p>
          <Button variant="ghost" className="mt-8 font-bold text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5" onClick={() => setBairroFilter("todos")}>Limpar Filtros</Button>
        </div>
      );
    }

    // 2. Cálculos KPIs
    const eleitoresAtendidos = filteredData.filter(e => e?.isAtendido).length;
    const eleitoresNaoAtendidos = filteredData.filter(e =>
      !e?.isAtendido && ((e?.totalDemandas || 0) > 0 || (e?.totalIndicacoes || 0) > 0)
    ).length;

    // 3. Distribuição por Bairro
    const bairrosMap = filteredData.reduce((acc, e) => {
      const b = e?.neighborhood || 'Não informado';
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const rankingBairro = Object.entries(bairrosMap)
      .map(([bairro, quantidade]) => ({ bairro, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    // 4. Ranking de Tags
    const tagsCount = filteredData.reduce((acc, e) => {
      if (e?.tags && Array.isArray(e.tags)) {
        e.tags.forEach(tag => { if (tag) acc[tag] = (acc[tag] || 0) + 1; });
      }
      return acc;
    }, {} as Record<string, number>);

    const dadosTags = Object.entries(tagsCount)
      .map(([tag, quantidade]) => ({ tag, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    const maxTagsQuantidade = dadosTags.length > 0 ? Math.max(...dadosTags.map(t => t.quantidade)) : 0;

    // 5. Demografia (Sexo e Idade)
    const sexGroups = filteredData.reduce((acc, e) => {
      let sex = 'Não informado';
      if (e?.sex) {
        const s = e.sex.toLowerCase();
        if (s === 'masculino' || s === 'homem' || s === 'm') sex = 'Homem';
        else if (s === 'feminino' || s === 'mulher' || s === 'f') sex = 'Mulher';
        else if (s.includes('binário') || s.includes('binario')) sex = 'Não binário';
      }
      acc[sex] = (acc[sex] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dadosSexo = Object.entries(sexGroups).map(([sexo, quantidade]) => ({ sexo, quantidade }));

    const ageGroupsMap = filteredData.reduce((acc, e) => {
      let group = 'Não informado';
      if (e?.birth_date) {
        const bd = new Date(e.birth_date);
        if (!isNaN(bd.getTime())) {
          const age = new Date().getFullYear() - bd.getFullYear();
          if (age < 18) group = 'Menos de 18';
          else if (age <= 25) group = '18-25';
          else if (age <= 35) group = '26-35';
          else if (age <= 45) group = '36-45';
          else if (age <= 55) group = '46-55';
          else if (age <= 65) group = '56-65';
          else group = 'Acima de 65';
        }
      }

      let s = 'Não informado';
      if (e?.sex) {
        const sl = e.sex.toLowerCase();
        if (sl === 'masculino' || sl === 'homem' || sl === 'm') s = 'Homem';
        else if (sl === 'feminino' || sl === 'mulher' || sl === 'f') s = 'Mulher';
        else if (sl.includes('binário') || sl.includes('binario')) s = 'Não binário';
      }

      if (!acc[group]) acc[group] = { Homem: 0, Mulher: 0, 'Não binário': 0, 'Não informado': 0 };
      acc[group][s] = (acc[group][s] || 0) + 1;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    const dadosIdade = Object.entries(ageGroupsMap).map(([faixa, sexos]) => ({
      faixa,
      Homem: sexos.Homem || 0,
      Mulher: sexos.Mulher || 0,
      'Não binário': sexos['Não binário'] || 0
    }));

    // 6. Evolução Temporal
    const evolutionMap = filteredData.reduce((acc, e) => {
      if (e?.created_at) {
        const d = new Date(e.created_at);
        if (!isNaN(d.getTime())) {
          const k = d.getFullYear() * 100 + (d.getMonth() + 1);
          const l = `${d.getMonth() + 1}/${d.getFullYear()}`;
          if (!acc[k]) acc[k] = { label: l, count: 0 };
          acc[k].count += 1;
        }
      }
      return acc;
    }, {} as Record<number, { label: string, count: number }>);

    let cumulative = 0;
    const dadosEvolucao = Object.entries(evolutionMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([_, data]) => {
        cumulative += data.count;
        return { mes: data.label, quantidade: data.count, acumulado: cumulative };
      });

    const bairrosUnicos = [...new Set(eleitores.map(e => e?.neighborhood).filter(n => n))];

    const chartConfig = {
      quantidade: { label: "Quantidade" },
      atendidos: { label: "Atendidos", color: "#22c55e" },
      pendentes: { label: "Pendentes", color: "#ef4444" },
      acumulado: { label: "Total Acumulado", color: "hsl(var(--primary))" }
    };
    return (
      <div className="p-0 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Search and Filters Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/40 dark:bg-card/40 backdrop-blur-xl p-4 rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-inner">
              <BarChart3 className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-outfit uppercase tracking-tight text-foreground/90 leading-tight">Análise de Influência</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-primary/20 text-primary bg-primary/5 uppercase tracking-[0.2em] rounded-full">
                  Dashboard Estratégico
                </Badge>
                <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest leading-none">
                  {totalEleitores} registros analisados
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-muted/30 p-1 rounded-xl flex items-center gap-1">
              <Select value={bairroFilter} onValueChange={setBairroFilter}>
                <SelectTrigger className="h-8 w-[180px] bg-background border-none shadow-sm rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  <MapPin className="w-3 h-3 mr-2 opacity-50" />
                  <SelectValue placeholder="Todos os Bairros" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="todos" className="text-[10px] font-bold uppercase tracking-widest">Todos os bairros</SelectItem>
                  {bairrosUnicos.map(bairro => (
                    <SelectItem key={bairro} value={bairro} className="text-[10px] font-bold uppercase tracking-widest">{bairro}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-10 px-4 rounded-xl border-zinc-200 dark:border-white/5 font-bold uppercase text-[9px] tracking-widest hover:bg-zinc-50 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        {/* Primary KPIs - Premium Metallic Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative overflow-hidden bg-white dark:bg-card/40 p-4 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-all hover:shadow-2xl hover:border-primary/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-zinc-100 dark:bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors">
                  <Users className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
                </div>
                <Badge variant="secondary" className="bg-zinc-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-widest border-none">Total</Badge>
              </div>
              <div className="text-3xl font-black font-outfit tracking-tighter mb-0.5">{totalEleitores}</div>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Base Territorial</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white dark:bg-card/40 p-4 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-all hover:shadow-2xl hover:border-emerald-500/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                  <UserCheck className="w-5 h-5 text-emerald-600 transition-colors" />
                </div>
                <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border-none">Sucesso</Badge>
              </div>
              <div className="text-3xl font-black font-outfit tracking-tighter mb-0.5 text-emerald-600 dark:text-emerald-400">{eleitoresAtendidos}</div>
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 bg-emerald-100 dark:bg-emerald-500/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${totalEleitores > 0 ? (eleitoresAtendidos / totalEleitores) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-black font-outfit text-emerald-600">
                  {totalEleitores > 0 ? ((eleitoresAtendidos / totalEleitores) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white dark:bg-card/40 p-4 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-all hover:shadow-2xl hover:border-amber-500/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                  <UserX className="w-5 h-5 text-amber-600 transition-colors" />
                </div>
                <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest border-none">Atenção</Badge>
              </div>
              <div className="text-3xl font-black font-outfit tracking-tighter mb-0.5 text-amber-600 dark:text-amber-400">{eleitoresNaoAtendidos}</div>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Pendências Críticas</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 p-4 rounded-3xl border border-white/10 shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            <div className="relative z-10 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest">Eficiência</Badge>
              </div>
              <div className="text-3xl font-black font-outfit tracking-tighter mb-0.5">
                {totalEleitores > 0 ? ((eleitoresAtendidos / totalEleitores) * 100).toFixed(0) : 0}%
              </div>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary truncate">Active Analysis</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-[50px] rounded-full -mr-12 -mt-12" />
          </div>
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Localization Ranking */}
          <div className="bg-white dark:bg-card/40 p-5 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl shadow-zinc-200/10 dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black font-outfit uppercase tracking-tight">Capilaridade Territorial</CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Top Bairros com maior Base</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {rankingBairro.map((item, index) => (
                <div key={item.bairro} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-background border border-zinc-100 dark:border-white/5 shadow-sm text-base font-black font-outfit group-hover:text-primary transition-colors">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-black font-outfit uppercase tracking-tight">{item.bairro}</span>
                      <span className="text-xs font-bold text-primary">{item.quantidade} <span className="text-[9px] opacity-60 uppercase">Eleitores</span></span>
                    </div>
                    <div className="relative w-full bg-zinc-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(item.quantidade / totalEleitores) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demographics Visualization */}
          <div className="bg-white dark:bg-card/40 p-5 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl shadow-zinc-200/10 dark:shadow-none flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-purple-500/10 rounded-xl">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black font-outfit uppercase tracking-tight">Censo de Influência</CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Distribuição por Sexo</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 space-y-8 py-4">
              <div className="relative flex items-center justify-center">
                {/* Custom Centered Circle Distribution */}
                <div className="w-52 h-52 rounded-full border-[10px] border-zinc-100 dark:border-white/5 relative bg-zinc-50/50 dark:bg-white/5 shadow-inner">
                  {/* Visual indicator of distribution */}
                  <div className="absolute inset-0 rounded-full flex overflow-hidden rotate-45">
                    <div
                      className="h-full border-r-[4px] border-white dark:border-zinc-900 transition-all duration-1000"
                      style={{
                        width: `${totalEleitores > 0 ? (dadosSexo.find(s => s.sexo === 'Mulher')?.quantidade || 0) / totalEleitores * 100 : 50}%`,
                        backgroundColor: '#ec4899'
                      }}
                    />
                    <div
                      className="h-full flex-1 border-l-[4px] border-white dark:border-zinc-900 transition-all duration-1000"
                      style={{
                        backgroundColor: '#3b82f6'
                      }}
                    />
                  </div>
                  {/* Center Cutout */}
                  <div className="absolute inset-[15%] bg-white dark:bg-zinc-900 rounded-full shadow-2xl flex flex-col items-center justify-center">
                    <span className="text-3xl font-black font-outfit tracking-tighter">{totalEleitores}</span>
                    <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">Total</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {dadosSexo.map((item) => {
                  const isMulher = item.sexo === 'Mulher';
                  const isHomem = item.sexo === 'Homem';
                  const percent = totalEleitores > 0 ? ((item.quantidade / totalEleitores) * 100).toFixed(0) : 0;

                  return (
                    <div key={item.sexo} className="bg-zinc-50 dark:bg-white/5 p-3 rounded-2xl border border-zinc-100 dark:border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("w-1.5 h-1.5 rounded-full", isMulher ? "bg-pink-500" : isHomem ? "bg-blue-500" : "bg-purple-500")} />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{item.sexo}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black font-outfit">{item.quantidade}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Area & Bar Charts Group */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Evolution Chart (Wide) */}
          <div className="lg:col-span-2 bg-white dark:bg-card/40 p-5 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl shadow-zinc-200/10 dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-info/10 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-info" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black font-outfit uppercase tracking-tight">Expansão de Base</CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Evolução de Crescimento</p>
                </div>
              </div>
            </div>

            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
                  content={<ChartTooltipContent className="rounded-2xl border-none shadow-2xl font-outfit" />}
                />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  name="Total de Eleitores"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#colorAcumulado)"
                  dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                  animationDuration={2000}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          {/* Tags Ranking (Compact) */}
          <div className="bg-white dark:bg-card/40 p-5 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl shadow-zinc-200/10 dark:shadow-none">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2.5 bg-amber-500/10 rounded-xl">
                <Tag className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-black font-outfit uppercase tracking-tight">Perfis</CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Principais Classificações</p>
              </div>
            </div>

            <div className="space-y-3">
              {dadosTags.map((item) => (
                <div key={item.tag} className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-zinc-100 dark:border-white/5">
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[11px] font-black font-outfit uppercase tracking-tighter">{item.tag}</span>
                    <span className="text-[10px] font-bold text-amber-600">{item.quantidade}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${maxTagsQuantidade > 0 ? (item.quantidade / maxTagsQuantidade) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-white/5 dark:to-white/10 rounded-2xl border border-zinc-100 dark:border-white/5">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                Utilize tags para segmentar sua base de forma assertiva.
              </p>
            </div>
          </div>
        </div>

        {/* Age Distribution Header */}
        <div className="pt-4 pb-2 border-b border-zinc-100 dark:border-white/5">
          <h2 className="text-lg font-black font-outfit uppercase tracking-tighter flex items-center gap-2">
            <Calendar className="w-5 h-5 opacity-40" />
            Raio-X de Faixa Etária
          </h2>
        </div>

        <div className="bg-white dark:bg-card/40 p-5 rounded-3xl border border-zinc-200/50 dark:border-white/5 shadow-xl shadow-zinc-200/10 dark:shadow-none">
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <BarChart data={dadosIdade} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis
                dataKey="faixa"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip content={<ChartTooltipContent className="rounded-2xl border-none shadow-2xl font-outfit" />} />
              <Bar dataKey="Homem" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Homens" />
              <Bar dataKey="Mulher" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} name="Mulheres" />
              <Bar dataKey="Não binário" stackId="a" fill="#a855f7" radius={[6, 6, 0, 0]} name="Não binário" />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Footer Branding */}
        <div className="flex items-center justify-center pt-8 opacity-20 group">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground group-hover:text-primary transition-colors">Legisfy Intelligence Analytics</span>
            <div className="w-8 h-px bg-muted-foreground" />
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    console.error('EleitoresAnalytics render error:', err);
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-50 dark:bg-red-500/10 p-8 rounded-[2rem] border border-red-100 dark:border-red-500/20 max-w-sm">
          <p className="text-red-600 dark:text-red-400 font-bold uppercase text-xs tracking-tight">Erro no Renderizador</p>
          <p className="text-[10px] text-red-500/60 mt-2 uppercase tracking-widest">{err?.message || 'Erro desconhecido'}</p>
          <Button onClick={onBack} variant="outline" className="mt-6 font-bold uppercase text-[9px] tracking-widest">Tentar Novamente</Button>
        </div>
      </div>
    );
  }
}