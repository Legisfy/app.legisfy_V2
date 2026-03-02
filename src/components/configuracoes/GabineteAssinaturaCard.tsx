import { useState, useCallback } from "react";
import {
    Crown, Calendar, CreditCard, History, AlertTriangle, CheckCircle,
    ChevronRight, Users, MessageCircle, FileSignature, FileText,
    TrendingUp, Loader2, RefreshCw, X, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentHistoryModal } from "@/components/assinatura/PaymentHistoryModal";
import { CustomerPortalButton } from "@/components/stripe/CustomerPortalButton";
import { cn } from "@/lib/utils";

const LIMIT_META = [
    { key: "users" as const, limitKey: "max_users", label: "Usuários", icon: Users, color: "bg-emerald-500", trackColor: "text-emerald-500" },
    { key: "demandas" as const, limitKey: "max_demandas", label: "Demandas", icon: MessageCircle, color: "bg-blue-500", trackColor: "text-blue-500" },
    { key: "indicacoes" as const, limitKey: "max_indicacoes", label: "Indicações", icon: FileSignature, color: "bg-purple-500", trackColor: "text-purple-500" },
    { key: "ideias" as const, limitKey: "max_ideias", label: "Proj. de Lei", icon: FileText, color: "bg-amber-500", trackColor: "text-amber-500" },
];

function UsageBar({ pct, color }: { pct: number; color: string }) {
    const isUnlimited = pct === -1;
    const barColor = isUnlimited ? "bg-muted/30"
        : pct >= 90 ? "bg-red-500"
            : pct >= 70 ? "bg-amber-500"
                : color;
    return (
        <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
            <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: isUnlimited ? "30%" : `${pct}%`, opacity: isUnlimited ? 0.3 : 1 }}
            />
        </div>
    );
}

export function GabineteAssinaturaCard() {
    const navigate = useNavigate();
    const { subscribed, plan, subscription_end, loading: subLoading, error, refreshSubscription } = useSubscription();
    const { limits, usage, usagePercent, loading: limitsLoading } = usePlanLimits();
    const [showHistory, setShowHistory] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    const planName = limits?.plan_name || plan || "Plano Básico";
    const priceMonthly = limits ? limits.monthly_price_cents / 100 : 0;
    const description = limits?.plan_description;
    const nextBillingDate = subscription_end ? new Date(subscription_end) : null;
    const daysRemaining = nextBillingDate
        ? Math.max(0, Math.ceil((nextBillingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const isLoading = subLoading || limitsLoading;

    return (
        <>
            <Card className="border border-border/40 bg-card/95 dark:bg-card/20 backdrop-blur-sm shadow-none">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            <Crown className="h-3 w-3 opacity-40" />
                            Assinatura
                        </CardTitle>
                        <div className="flex items-center gap-1.5">
                            <Badge className={cn(
                                "text-[7px] font-bold tracking-widest uppercase px-1.5 h-4 border",
                                subscribed
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            )}>
                                {subscribed ? "Ativo" : "Inativo"}
                            </Badge>
                            <button onClick={refreshSubscription} className="opacity-30 hover:opacity-70 transition-opacity" title="Atualizar">
                                <RefreshCw className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 opacity-30">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Plano atual */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-base font-bold text-foreground">{planName}</p>
                                        {subscribed && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                    </div>
                                    {description && (
                                        <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-xs">{description}</p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-bold text-foreground">R$ {priceMonthly.toFixed(2)}</p>
                                    <p className="text-[9px] text-muted-foreground/50 uppercase font-bold tracking-widest">por mês</p>
                                </div>
                            </div>

                            <Separator className="opacity-20" />

                            {/* Período de cobrança */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                                        <Calendar className="h-2.5 w-2.5" />
                                        Próxima Cobrança
                                    </p>
                                    <p className="text-[11px] font-semibold text-foreground/80">
                                        {nextBillingDate ? format(nextBillingDate, "d 'de' MMM 'de' yyyy", { locale: ptBR }) : "—"}
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Dias Restantes</p>
                                    <p className="text-[11px] font-semibold text-foreground/80">
                                        {daysRemaining !== null ? `${daysRemaining} dias` : "—"}
                                    </p>
                                </div>
                            </div>

                            <Separator className="opacity-20" />

                            {/* Limites de uso reais */}
                            <div className="space-y-2.5">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                                    <TrendingUp className="h-2.5 w-2.5" />
                                    Uso do Plano
                                </p>
                                <div className="space-y-2">
                                    {LIMIT_META.map(({ key, limitKey, label, icon: Icon, color, trackColor }) => {
                                        const pct = usagePercent(key);
                                        const max = limits ? (limits[limitKey as keyof typeof limits] as number) : -1;
                                        const current = usage[key];
                                        const isUnlimited = max < 0;
                                        const isAtLimit = !isUnlimited && pct >= 100;
                                        return (
                                            <div key={key} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className={cn("flex items-center gap-1.5 text-[9px] font-bold", trackColor)}>
                                                        <Icon className="h-3 w-3" />
                                                        <span className="text-muted-foreground/60">{label}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-[9px] font-bold",
                                                        isAtLimit ? "text-red-400" : isUnlimited ? "text-muted-foreground/30" : "text-foreground/60"
                                                    )}>
                                                        {isUnlimited ? `${current} / ∞` : `${current} / ${max}`}
                                                    </span>
                                                </div>
                                                <UsageBar pct={pct} color={color} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator className="opacity-20" />

                            {/* Ações */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowHistory(true)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/20 border border-border/20 hover:bg-muted/40 transition-all group"
                                >
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                        <History className="h-3 w-3" />
                                        Histórico de Cobranças
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                                </button>

                                <button
                                    onClick={() => navigate("/assinatura-stripe")}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all group"
                                >
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">
                                        <Crown className="h-3 w-3" />
                                        Atualizar Plano
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-primary/30 group-hover:text-primary/60 transition-colors" />
                                </button>

                                <CustomerPortalButton className="w-full h-8 text-[10px] font-bold uppercase tracking-widest bg-transparent border border-border/30 text-muted-foreground/60 hover:bg-muted/20 hover:text-muted-foreground rounded-lg transition-all flex items-center justify-center gap-2">
                                    <CreditCard className="h-3 w-3" />
                                    Gerenciar Pagamento
                                </CustomerPortalButton>

                                {!cancelConfirm ? (
                                    <button
                                        onClick={() => setCancelConfirm(true)}
                                        className="w-full text-[9px] font-bold uppercase tracking-widest text-destructive/40 hover:text-destructive/70 transition-colors pt-1"
                                    >
                                        Cancelar Assinatura
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                                        <p className="text-[9px] text-destructive/70 font-bold flex-1">Confirmar cancelamento?</p>
                                        <CustomerPortalButton className="h-6 px-2 text-[8px] bg-destructive/80 text-white hover:bg-destructive border-0 rounded font-bold uppercase tracking-wider">
                                            Confirmar
                                        </CustomerPortalButton>
                                        <button onClick={() => setCancelConfirm(false)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                                    <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0" />
                                    <p className="text-[9px] text-orange-400/80">Erro ao carregar dados de assinatura</p>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <PaymentHistoryModal open={showHistory} onOpenChange={setShowHistory} />
        </>
    );
}
