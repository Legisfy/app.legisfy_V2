import {
    Building2,
    Search,
    ExternalLink,
    Globe,
    Gavel,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface IndicacoesCamaraProps {
    cityName?: string;
    politicianName?: string;
}

export function IndicacoesCamara({ cityName, politicianName }: IndicacoesCamaraProps) {
    const camaraName = cityName ? `Câmara Municipal de ${cityName}` : "Câmara Municipal";
    const name = politicianName || "Vereador";

    const getCamaraUrl = () => {
        if (!cityName) return "https://www.google.com/search?q=camara+municipal";
        const citySlug = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
        if (citySlug === 'belo-horizonte') return `https://www.cmbh.mg.gov.br/search/node/${encodeURIComponent(name)}`;
        return `https://www.google.com/search?q=${encodeURIComponent(`indicacoes ${name} camara municipal ${cityName}`)}`;
    };

    const portalUrl = getCamaraUrl();

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Perfil Compacto e Elegante */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-card/20 backdrop-blur-sm rounded-xl border border-border/40">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border">
                        <Gavel className="w-5 h-5 text-muted-foreground/60" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold tracking-tight text-foreground/80 font-outfit uppercase">{name}</h2>
                            <Badge variant="outline" className="h-4 px-1.5 text-[6px] font-black border-emerald-500/20 text-emerald-500/80 bg-emerald-500/5 uppercase tracking-[0.2em] rounded-full">
                                Ativo
                            </Badge>
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.1em]">
                            {camaraName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground gap-2"
                        onClick={() => window.open(portalUrl, "_blank")}
                    >
                        <Globe className="w-3 h-3 opacity-40" />
                        Perfil
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground gap-2"
                        onClick={() => window.open(portalUrl, "_blank")}
                    >
                        <Building2 className="w-3 h-3 opacity-40" />
                        Portal
                    </Button>
                </div>
            </div>

            {/* Grid de Informação Sóbiro */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 p-10 rounded-xl border border-dashed border-border/60 bg-card/10 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                        <Search className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xs font-bold text-foreground/60 font-outfit uppercase tracking-widest">Registros Oficiais</h3>
                        <p className="text-[10px] text-muted-foreground/50 max-w-xs mx-auto leading-relaxed uppercase tracking-tighter">
                            Consulte a base de dados da {camaraName} já filtrada por parlamentar.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="h-9 px-6 rounded-lg font-bold uppercase tracking-[0.15em] text-[9px] gap-2 border-border/60 hover:border-border text-muted-foreground hover:text-foreground transition-all"
                        onClick={() => window.open(portalUrl, "_blank")}
                    >
                        Acessar Dados Reais
                        <ExternalLink className="w-3 h-3 opacity-30" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border/40 bg-card/20 space-y-3">
                        <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Conectividade</h4>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500/40" />
                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Sincronizado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-3 h-3 text-muted-foreground/30" />
                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">1h atrás</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border/30 bg-muted/5 flex flex-col items-center justify-center text-center py-6">
                        <p className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-normal">
                            Crawler de<br />Integração Direta<br />em FASE ALPHA
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
