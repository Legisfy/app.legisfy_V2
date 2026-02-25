import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
  LabelList
} from "recharts";
import {
  FileText,
  Send,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Tag,
  Clock,
  User,
  ArrowLeft,
  Zap,
  LucideIcon,
  Building2
} from "lucide-react";

interface IndicacoesAnalisesProps {
  onBack: () => void;
  indicacoes: any[];
  cityName?: string;
}

export function IndicacoesAnalises({ onBack, indicacoes, cityName }: IndicacoesAnalisesProps) {
  const [bairroFilter, setBairroFilter] = useState("todos");

  // Filtragem regional reativa
  const filteredData = useMemo(() => {
    return bairroFilter === "todos"
      ? indicacoes
      : indicacoes.filter(i => (i.endereco_bairro || 'Geral') === bairroFilter);
  }, [indicacoes, bairroFilter]);

  // Estatísticas baseadas nos dados filtrados
  const totalIndicacoes = filteredData.length;
  const indicacoesAtendidas = filteredData.filter(i => i.status === "atendida").length;
  const indicacoesPendentes = filteredData.filter(i => i.status === "pendente").length;
  const indicacoesPorEleitor = filteredData.filter(i => i.eleitor_id).length;

  const taxaAtendimento = totalIndicacoes > 0 ? ((indicacoesAtendidas / totalIndicacoes) * 100) : 0;

  // Dados para gráficos
  const dadosStatus = [
    { status: "Criada", quantidade: filteredData.filter(i => i.status === "criada").length, fill: "#3b82f6" },
    { status: "Formalizada", quantidade: filteredData.filter(i => i.status === "formalizada").length, fill: "#8b5cf6" },
    { status: "Protocolada", quantidade: filteredData.filter(i => i.status === "protocolada").length, fill: "#f59e0b" },
    { status: "Pendente", quantidade: indicacoesPendentes, fill: "#eab308" },
    { status: "Atendida", quantidade: indicacoesAtendidas, fill: "#22c55e" }
  ];

  const rankingBairros = useMemo(() => {
    const counts = indicacoes.reduce((acc, indicacao) => {
      const bairro = indicacao.endereco_bairro || 'Geral';
      acc[bairro] = (acc[bairro] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([bairro, quantidade]) => ({ bairro, quantidade: Number(quantidade) }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [indicacoes]);

  const dadosEvolucao = useMemo(() => {
    const counts = indicacoes.reduce((acc, indicacao) => {
      if (indicacao.created_at) {
        const date = new Date(indicacao.created_at);
        const monthYear = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        acc[monthYear] = (acc[monthYear] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([mes, qtd]) => ({ mes, qtd }));
  }, [indicacoes]);

  // Eficiência
  const indicacoesFinalizadas = filteredData.filter(i => i.status === 'atendida' && i.created_at && (i.updated_at || i.created_at));
  const somaTempo = indicacoesFinalizadas.reduce((acc, curr) => {
    const inicio = new Date(curr.created_at).getTime();
    const fim = new Date(curr.updated_at || curr.created_at).getTime();
    return acc + (fim - inicio);
  }, 0);

  const calcularLeadTime = (statusDe: string, statusPara: string) => {
    const tempos = indicacoes.map(ind => {
      const history = ind.status_history || [];
      const eventDe = history.find((e: any) => e.status === statusDe);
      const eventPara = history.find((e: any) => e.status === statusPara);

      if (eventDe && eventPara) {
        const diff = new Date(eventPara.created_at).getTime() - new Date(eventDe.created_at).getTime();
        return diff > 0 ? diff : null;
      }
      return null;
    }).filter(t => t !== null) as number[];

    if (tempos.length === 0) return "---";
    const mediaMs = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return (mediaMs / (1000 * 60 * 60 * 24)).toFixed(1);
  };

  const leadTimeFormalizacao = calcularLeadTime('criada', 'formalizada');
  const leadTimeProtocolo = calcularLeadTime('formalizada', 'protocolada');
  const leadTimeAtendimento = calcularLeadTime('protocolada', 'atendida');

  // Médias
  const agora = new Date();
  const trintaDiasAtras = new Date(agora.getTime() - (30 * 24 * 60 * 60 * 1000));
  const criadas30Dias = indicacoes.filter(i => new Date(i.created_at) >= trintaDiasAtras).length;
  const mediaDia = (criadas30Dias / 30).toFixed(1);
  const mediaSemana = (criadas30Dias / 4).toFixed(1);
  const mediaMes = criadas30Dias;

  // DINAMIZAÇÃO DE SECRETARIAS + TEMPO DE RESPOSTA
  const dadosGraficoSecretarias = useMemo(() => {
    // 1. Extrair todas as categorias/tags únicas presentes nas indicações
    const categoriasExistentes = Array.from(new Set(indicacoes.map(ind => ind.category || ind.tag || 'Geral')));

    // 2. Secretarias padrão que SEMPRE devem aparecer (mesmo com 0)
    const secretariasPadrao = [
      "Saúde", "Educação", "Meio Ambiente", "Obras", "Cultura", "Esporte", "Assistência Social", "Segurança", "Mobilidade Urbana", "Saneamento Básico"
    ];

    const todasSecretarias = Array.from(new Set([...secretariasPadrao, ...categoriasExistentes]));

    const counts = todasSecretarias.map(nome => {
      const indDaSecretaria = indicacoes.filter(ind => {
        const indCat = (ind.category || ind.tag || '').toLowerCase();
        return indCat.includes(nome.toLowerCase()) || nome.toLowerCase().includes(indCat);
      });

      // Cálculo de lead time específico para esta secretaria (Protocolo -> Atendido)
      const atendidas = indDaSecretaria.filter(i => i.status === 'atendida' && i.protocolada_em && i.atendida_em);
      let mediaLeadTime = 0;
      if (atendidas.length > 0) {
        const tempos = atendidas.map(i => new Date(i.atendida_em!).getTime() - new Date(i.protocolada_em!).getTime());
        mediaLeadTime = Number((tempos.reduce((a, b) => a + b, 0) / atendidas.length / (1000 * 60 * 60 * 24)).toFixed(0));
      }

      return {
        nome,
        total: indDaSecretaria.length,
        leadTime: mediaLeadTime > 0 ? `${mediaLeadTime}d` : '--'
      };
    });

    return counts.sort((a, b) => b.total - a.total).slice(0, 15);
  }, [indicacoes]);

  // CATEGORIAS PRINCIPAIS ( VOLUME ) - DINAMIZAÇÃO FIEL
  const dadosCategorias = useMemo(() => {
    // Mapeamento de palavras-chave para categorias consolidadas
    const mapping: Record<string, string[]> = {
      "Saneamento Básico": ["saneamento", "esgoto", "água", "drenagem", "limpeza", "lixo"],
      "Educação": ["educação", "escola", "creche", "ensino", "merenda"],
      "Saúde": ["saúde", "hospital", "upa", "ubs", "médico", "vacina"],
      "Segurança": ["segurança", "guarda", "iluminação", "luz", "polícia"],
      "Infraestrutura": ["infraestrutura", "obras", "asfalto", "buraco", "pavimentação", "ponte"],
      "Social": ["social", "assistência", "crás", "ajuda", "família"],
      "Cultura/Lazer": ["cultura", "lazer", "praça", "parque", "evento", "esporte"]
    };

    const cats = Object.keys(mapping);
    const results = cats.map(cat => {
      const keywords = mapping[cat];
      const count = indicacoes.filter(i => {
        const text = ((i.category || '') + ' ' + (i.tag || '') + ' ' + (i.titulo || '')).toLowerCase();
        return keywords.some(kw => text.includes(kw));
      }).length;

      return {
        categoria: cat,
        quantidade: count,
        fill: cat === 'Educação' ? '#3b82f6' :
          cat === 'Saúde' ? '#ef4444' :
            cat === 'Saneamento Básico' ? '#10b981' :
              cat === 'Segurança' ? '#f59e0b' :
                cat === 'Infraestrutura' ? '#8b5cf6' : '#a855f7'
      };
    });

    return results.sort((a, b) => b.quantidade - a.quantidade).filter(r => r.quantidade > 0);
  }, [indicacoes]);

  const getInsightText = () => {
    if (totalIndicacoes === 0) return "Nenhuma indicação registrada no período.";
    if (taxaAtendimento > 80) return "Desempenho de Elite: Fluxo operacional altamente otimizado.";
    if (taxaAtendimento > 40) return "Ritmo Estável: Manter a constância garantirá o aumento da eficiência.";
    return "Alerta de Fluxo: Priorizar protocolos pode destravar o processo.";
  };

  const KPICard = ({ title, value, sub, icon: Icon, color }: { title: string, value: string | number, sub: string, icon: LucideIcon, color: string }) => (
    <Card className="overflow-hidden border-none shadow-lg bg-card group hover:ring-2 hover:ring-primary/20 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 transition-transform group-hover:scale-110 duration-300`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <div className="text-xl font-bold text-foreground">{value}</div>
          <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );

  const chartConfig = {
    qtd: { label: "Quantidade", color: "#3b82f6" },
    total: { label: "Total", color: "#8b5cf6" }
  };

  return (
    <div className="p-4 md:p-6 space-y-8 bg-background min-h-screen pb-24 max-w-[1600px] mx-auto">
      {/* Header Premium Unificado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 p-6 rounded-3xl border border-border/50 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-5">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-2xl hover:bg-accent border-border/50 shadow-sm transition-all hover:scale-105 active:scale-95">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/90 text-primary-foreground text-[9px] uppercase font-black tracking-[0.15em] px-2 py-0.5 rounded-md">Dashboard Legisfy</Badge>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70">v.Unificada</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              Visão Geral do Mandato <TrendingUp className="w-5 h-5 text-emerald-500" />
            </h1>
            <p className="text-xs text-muted-foreground font-medium opacity-80">Dados em tempo real, abrangência regional e performance operacional.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Select value={bairroFilter} onValueChange={setBairroFilter}>
            <SelectTrigger className="w-[200px] h-11 rounded-2xl bg-card border-border/50 shadow-sm text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all">
              <MapPin className="w-3.5 h-3.5 mr-2 text-primary" />
              <SelectValue placeholder="Todas as regiões" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border shadow-2xl">
              <SelectItem value="todos" className="text-xs font-bold p-3">Todas as regiões</SelectItem>
              {Object.keys(rankingBairros).map(bairro => (
                <SelectItem key={bairro} value={bairro} className="text-xs font-bold uppercase p-3">{bairro}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DASHBOARD BODY */}
      <div className="space-y-8 animate-in fade-in duration-700">

        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Total de Indicações" value={totalIndicacoes} sub="Volume total registrado" icon={FileText} color="bg-blue-500" />
          <KPICard title="Taxa de Atendimento" value={`${taxaAtendimento.toFixed(1)}%`} sub="Eficiência de resolução" icon={CheckCircle2} color="bg-emerald-500" />
          <KPICard title="Em Aberto" value={indicacoesPendentes} sub="Aguardando atendimento" icon={Clock} color="bg-orange-500" />
          <KPICard title="Vínculo Eleitoral" value={indicacoesPorEleitor} sub="Com eleitor identificado" icon={User} color="bg-purple-500" />
        </div>

        {/* Row 2: Evolução e Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-md bg-card overflow-hidden rounded-2xl">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <AreaChart data={dadosEvolucao}>
                  <defs>
                    <linearGradient id="colorUnificado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} fontSize={10} fontWeight="900" dy={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="900" dx={-10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="qtd" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUnificado)" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-card overflow-hidden rounded-2xl">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-500" /> Volume por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie data={dadosCategorias} dataKey="quantidade" nameKey="categoria" cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8}>
                    {dadosCategorias.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                {dadosCategorias.slice(0, 4).map(c => (
                  <div key={c.categoria} className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/20">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: c.fill }}></div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">{c.categoria}: {c.quantidade}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Regional e Tempos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Regional */}
          <Card className="border-none shadow-md bg-card rounded-2xl">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> Distribuição por Bairros
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={rankingBairros} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="bairro" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900' }} width={120} />
                  <Bar dataKey="quantidade" fill="#10b981" radius={[0, 6, 6, 0]} barSize={18} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Tempos Médios */}
          <Card className="border-none shadow-md bg-card rounded-2xl">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Eficiência (Dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-5 rounded-3xl bg-blue-500/[0.05] border border-blue-500/10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500"><FileText className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Criação → Formalização</p>
                      <p className="text-xs font-medium text-muted-foreground opacity-60">Tempo interno de assessoria</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black">{leadTimeFormalizacao} <span className="text-[9px] font-bold opacity-40">DIAS</span></div>
                </div>

                <div className="flex items-center justify-between p-5 rounded-3xl bg-purple-500/[0.05] border border-purple-500/10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500"><Send className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Formalização → Protocolo</p>
                      <p className="text-xs font-medium text-muted-foreground opacity-60">Envio para a Câmara</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black">{leadTimeProtocolo} <span className="text-[9px] font-bold opacity-40">DIAS</span></div>
                </div>

                <div className="flex items-center justify-between p-5 rounded-3xl bg-orange-500/[0.05] border border-orange-500/10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500"><CheckCircle2 className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Protocolo → Atendimento</p>
                      <p className="text-xs font-medium text-muted-foreground opacity-60">Resposta do Executivo</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black">{leadTimeAtendimento} <span className="text-[9px] font-bold opacity-40">DIAS</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Secretarias e Ritmo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Secretarias DINAMIZADAS */}
          <Card className="border-none shadow-md bg-card rounded-2xl relative overflow-hidden">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> Impacto por Secretaria
                </CardTitle>
                <div className="flex items-center bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Building2 className="w-3 h-3 mr-2" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {cityName && cityName.length > 0 ? `Prefeitura Municipal de ${cityName}` : "Prefeitura Municipal"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={dadosGraficoSecretarias} layout="vertical" margin={{ left: 20, right: 60 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} fontSize={10} width={130} tick={{ fontWeight: "900", fill: "currentColor" }} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={16}>
                    <LabelList
                      dataKey="leadTime"
                      position="right"
                      style={{ fontSize: '10px', fontWeight: '800', fill: '#6b7280' }}
                      formatter={(val: string) => `Resp: ${val}`}
                    />
                  </Bar>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Ritmo de Produção */}
          <Card className="border-none shadow-md bg-card rounded-2xl overflow-hidden">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Ritmo de Trabalho (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-xl bg-muted/40 border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Por Dia</p>
                  <p className="text-xl font-bold text-foreground">{mediaDia}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-[10px] font-bold text-primary uppercase mb-1 tracking-widest">Semanal</p>
                  <p className="text-xl font-bold text-primary">{mediaSemana}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/40 border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Mensal</p>
                  <p className="text-xl font-bold text-foreground">{mediaMes}</p>
                </div>
              </div>

              {/* Eficiência Unificada (Black Card Integrado) */}
              <div className="mt-8 p-6 rounded-[2rem] bg-[#1a1a1a] text-white border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em]">Resumo Operacional</p>
                    <h4 className="text-xs font-black text-white/90">Eficácia Geral do Gabinete</h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-[#666] uppercase">Média p/ Atendimento</p>
                    <p className="text-2xl font-black">{(somaTempo / Math.max(indicacoesFinalizadas.length, 1) / (1000 * 60 * 60 * 24)).toFixed(1)} <span className="text-[10px] text-white/30">DIAS</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-[#666] uppercase">Índice de Resolução</p>
                    <p className="text-2xl font-black text-emerald-400">{taxaAtendimento.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-start gap-4">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="text-[11px] text-[#999] font-medium italic leading-relaxed">"{getInsightText()}"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}