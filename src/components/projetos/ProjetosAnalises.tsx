import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    ResponsiveContainer
} from "recharts";
import {
    FileText,
    Clock,
    TrendingUp,
    Target,
    Zap,
    CheckCircle2,
    FileCheck,
    Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjetoLog {
    status: string;
    created_at: string;
}

interface Projeto {
    id: string;
    status: string;
    created_at: string;
    logs?: ProjetoLog[];
}

interface ProjetosAnalisesProps {
    projetos: Projeto[];
}

const statusLabels: Record<string, string> = {
    rascunho: "Rascunho",
    formalizado: "Formalizado",
    em_revisao: "Em revisão",
    pronto_para_protocolar: "Pronto para",
    protocolado: "Protocolado",
    em_tramitacao: "Tramitação",
    aprovado: "Aprovado",
    arquivado: "Arquivado",
    rejeitado: "Rejeitado",
};

const statusColors: Record<string, string> = {
    rascunho: "#94a3b8",
    formalizado: "#6366f1",
    em_revisao: "#eab308",
    pronto_para_protocolar: "#3b82f6",
    protocolado: "#a855f7",
    em_tramitacao: "#f97316",
    aprovado: "#10b981",
    arquivado: "#6b7280",
    rejeitado: "#ef4444",
};

export function ProjetosAnalises({ projetos }: ProjetosAnalisesProps) {
    const stats = useMemo(() => {
        const total = projetos.length;
        const protocolados = projetos.filter(p => p.status === "protocolado" || p.status === "em_tramitacao" || p.status === "aprovado").length;
        const emTramitacao = projetos.filter(p => p.status === "em_tramitacao").length;
        const aprovados = projetos.filter(p => p.status === "aprovado").length;

        return {
            total,
            protocolados,
            emTramitacao,
            aprovados,
            taxaProtocolo: total > 0 ? (protocolados / total) * 100 : 0
        };
    }, [projetos]);

    const dadosStatus = useMemo(() => {
        const counts = projetos.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusLabels).map(([key, label]) => ({
            name: label,
            value: counts[key] || 0,
            fill: statusColors[key]
        })).filter(d => d.value > 0);
    }, [projetos]);

    const dadosEvolucao = useMemo(() => {
        const counts = projetos.reduce((acc, p) => {
            const date = new Date(p.created_at);
            const monthYear = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            acc[monthYear] = (acc[monthYear] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([mes, qtd]) => ({ mes, qtd }));
    }, [projetos]);

    const calcularLeadTime = (statusDe: string, statusPara: string) => {
        const tempos = projetos.map(p => {
            const logs = p.logs || [];
            const eventDe = logs.find(l => l.status === statusDe);
            const eventPara = logs.find(l => l.status === statusPara);

            if (eventDe && eventPara) {
                const diff = new Date(eventPara.created_at).getTime() - new Date(eventDe.created_at).getTime();
                return diff > 0 ? diff : null;
            }
            return null;
        }).filter(t => t !== null) as number[];

        if (tempos.length === 0) return 0;
        const mediaMs = tempos.reduce((a, b) => a + b, 0) / tempos.length;
        return Number((mediaMs / (1000 * 60 * 60 * 24)).toFixed(1));
    };

    const leadTimes = useMemo(() => {
        return [
            { etapa: "Draft → Formalizado", tempo: calcularLeadTime('rascunho', 'formalizado'), icon: FileCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
            { etapa: "Formalizado → Protocolado", tempo: calcularLeadTime('formalizado', 'protocolado'), icon: Send, color: "text-purple-500", bg: "bg-purple-500/10" },
            { etapa: "Protocolado → Aprovação", tempo: calcularLeadTime('protocolado', 'aprovado'), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" }
        ];
    }, [projetos]);

    const chartConfig = {
        value: { label: "Projetos", color: "#6366f1" },
        qtd: { label: "Quantidade", color: "#3b82f6" }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total de Projetos", value: stats.total, sub: "Volume na base", icon: FileText, color: "bg-blue-500" },
                    { label: "Protocolados", value: stats.protocolados, sub: `${stats.taxaProtocolo.toFixed(0)}% do total`, icon: Send, color: "bg-purple-500" },
                    { label: "Em Tramitação", value: stats.emTramitacao, sub: "Acompanhamento ativo", icon: Clock, color: "bg-orange-500" },
                    { label: "Aprovados", value: stats.aprovados, sub: "Sucesso legislativo", icon: CheckCircle2, color: "bg-emerald-500" }
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-all">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div className={cn("p-2 rounded-xl bg-opacity-10", kpi.color)}>
                                    <kpi.icon className={cn("w-4 h-4", kpi.color.replace('bg-', 'text-'))} />
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                                <div className="text-2xl font-black text-foreground">{kpi.value}</div>
                                <p className="text-[10px] text-muted-foreground font-medium">{kpi.sub}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Distribuição por Status */}
                <Card className="lg:col-span-1 border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Target className="w-4 h-4" /> Distribuição por Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <ChartContainer config={chartConfig} className="h-[240px] w-full">
                            <PieChart>
                                <Pie data={dadosStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                    {dadosStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />)}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                        </ChartContainer>
                        <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                            {dadosStatus.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30 border border-border/10">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                                    <span className="text-[9px] font-bold text-muted-foreground truncate">{s.name}: {s.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Evolução Mensal */}
                <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Evolução de Criação
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <AreaChart data={dadosEvolucao}>
                                <defs>
                                    <linearGradient id="colorProjetos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="mes" axisLine={false} tickLine={false} fontSize={10} fontWeight="600" dy={10} />
                                <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="600" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="qtd" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorProjetos)" />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Eficiência / Lead Times */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Tempo Médio de Tramitação (Leads)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
                        {leadTimes.map((item, i) => (
                            <div key={i} className="p-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-3 rounded-2xl", item.bg, item.color)}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{item.etapa}</p>
                                        <p className="text-xs text-muted-foreground opacity-60">Eficiência por etapa</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-foreground">{item.tempo > 0 ? item.tempo : "---"}</div>
                                    <span className="text-[9px] font-bold opacity-40 uppercase">Dias</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Resumo de Eficiência */}
            <div className="p-6 rounded-3xl bg-[#111] text-white border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-yellow-500">
                        <Zap className="w-5 h-5 fill-yellow-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Insight Operacional</p>
                        <h4 className="text-xs font-black text-zinc-200 uppercase">Performance Legislativa</h4>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-zinc-600 uppercase">Caminho do Protocolo</p>
                        <p className="text-2xl font-black text-zinc-100 italic">
                            {stats.taxaProtocolo > 70 ? "Alta Conversão" : stats.taxaProtocolo > 30 ? "Fluxo Regular" : "Foco em Protocolos"}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-zinc-600 uppercase">Projetos Ativos</p>
                        <p className="text-2xl font-black text-zinc-100">{stats.emTramitacao + stats.protocolados} <span className="text-[10px] text-zinc-500">UNID</span></p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-zinc-600 uppercase">Qualidade do Banco</p>
                        <p className="text-2xl font-black text-emerald-400">Premium</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
