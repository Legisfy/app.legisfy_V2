import { useState, useEffect } from "react";
import {
    Crown, Calendar, CreditCard, History, AlertTriangle, CheckCircle,
    ChevronRight, Users, MessageCircle, FileSignature, FileText,
    TrendingUp, Loader2, RefreshCw, X, Zap, Check, Star,
    CalendarDays, Repeat
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentHistoryModal } from "@/components/assinatura/PaymentHistoryModal";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const LIMIT_META = [
    { key: "users" as const, limitKey: "max_users", label: "Usuários", icon: Users, color: "bg-emerald-500", trackColor: "text-emerald-500" },
    { key: "demandas" as const, limitKey: "max_demandas", label: "Demandas", icon: MessageCircle, color: "bg-blue-500", trackColor: "text-blue-500" },
    { key: "indicacoes" as const, limitKey: "max_indicacoes", label: "Indicações", icon: FileSignature, color: "bg-purple-500", trackColor: "text-purple-500" },
    { key: "projetos_lei" as const, limitKey: "max_projetos_lei", label: "Proj. de Lei", icon: FileText, color: "bg-amber-500", trackColor: "text-amber-500" },
];

interface AvailablePlan {
    id: string;
    name: string;
    description: string;
    monthly_price_cents: number;
    features: string[];
    max_users: number;
    max_eleitores: number;
    max_demandas: number;
    max_indicacoes: number;
    max_ideias: number;
}

function UsageBar({ pct, color }: { pct: number; color: string }) {
    const isUnlimited = pct === -1;
    const barColor = isUnlimited ? "bg-muted/20"
        : pct >= 90 ? "bg-red-500"
            : pct >= 70 ? "bg-amber-500"
                : color;
    return (
        <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
            <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: isUnlimited ? "20%" : `${pct}%`, opacity: isUnlimited ? 0.3 : 1 }}
            />
        </div>
    );
}

function PlansModal({ open, onOpenChange, currentPlanId }: { open: boolean; onOpenChange: (v: boolean) => void; currentPlanId?: string }) {
    const [plans, setPlans] = useState<AvailablePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [processPlanId, setProcessPlanId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!open) return;
        const db = supabase as any;
        db.from('plans')
            .select('id, name, description, monthly_price_cents, features, max_users, max_eleitores, max_demandas, max_indicacoes, max_ideias')
            .eq('is_active', true)
            .order('monthly_price_cents')
            .then(({ data }: any) => {
                if (data) setPlans(data);
                setLoading(false);
            });
    }, [open]);

    const PLAN_ACCENT: Record<string, string> = {
        Starter: "border-emerald-500/30 hover:border-emerald-500/60",
        Pro: "border-blue-500/30 hover:border-blue-500/60",
        Premium: "border-amber-500/30 hover:border-amber-500/60",
    };
    const PLAN_BADGE: Record<string, string> = {
        Starter: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        Pro: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        Premium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl border border-border/40 bg-background dark:bg-card/95 backdrop-blur-sm">
                <DialogHeader className="pb-2">
                    <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                        <Crown className="h-4 w-4 text-primary opacity-60" />
                        Planos Disponíveis
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                        Escolha o plano ideal para o seu mandato
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12 opacity-30">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                        {plans.map((plan) => {
                            const isCurrent = plan.id === currentPlanId;
                            const accent = PLAN_ACCENT[plan.name] || "border-border/30 hover:border-border/60";
                            const badge = PLAN_BADGE[plan.name] || "bg-muted/10 text-muted-foreground border-border/20";
                            const price = plan.monthly_price_cents / 100;

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "relative flex flex-col p-4 rounded-xl border transition-all",
                                        accent,
                                        isCurrent && "ring-1 ring-primary/30 bg-primary/2"
                                    )}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-2 left-3">
                                            <Badge className="text-[8px] font-bold bg-primary/80 text-white border-0 h-4 px-1.5 uppercase tracking-widest">
                                                Plano Atual
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-foreground">{plan.name}</p>
                                            <Badge className={cn("text-[8px] font-bold border h-4 px-1.5 uppercase tracking-wider", badge)}>
                                                {plan.name}
                                            </Badge>
                                        </div>

                                        <div>
                                            <span className="text-xl font-bold text-foreground">R$ {price.toFixed(2)}</span>
                                            <span className="text-[9px] text-muted-foreground/50 ml-1 font-bold uppercase">/mês</span>
                                        </div>

                                        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{plan.description}</p>

                                        <Separator className="opacity-20 my-2" />

                                        {/* Limites */}
                                        <div className="space-y-1">
                                            {[
                                                { label: "Usuários", value: plan.max_users },
                                                { label: "Demandas", value: plan.max_demandas },
                                                { label: "Indicações", value: plan.max_indicacoes },
                                                { label: "Proj. de Lei", value: plan.max_ideias },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="flex items-center justify-between text-[9px]">
                                                    <span className="text-muted-foreground/50">{label}</span>
                                                    <span className="font-bold text-foreground/70">{value < 0 ? "∞" : value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Features */}
                                        {plan.features && plan.features.length > 0 && (
                                            <div className="space-y-1 pt-1">
                                                {plan.features.slice(0, 4).map((f: string) => (
                                                    <div key={f} className="flex items-start gap-1.5 text-[9px] text-muted-foreground/60">
                                                        <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        size="sm"
                                        variant={isCurrent ? "outline" : "default"}
                                        disabled={isCurrent || !!processPlanId}
                                        className={cn(
                                            "w-full mt-3 h-8 text-[9px] font-bold uppercase tracking-widest",
                                            !isCurrent && "bg-primary hover:bg-primary/90"
                                        )}
                                        onClick={async () => {
                                            if (isCurrent) return;
                                            try {
                                                setProcessPlanId(plan.id);
                                                const { data, error } = await supabase.functions.invoke('create-checkout', {
                                                    body: { planId: plan.id, recorrencia: 'mensal' },
                                                });
                                                if (error) throw error;
                                                if (data?.url) {
                                                    window.open(data.url, '_blank');
                                                }
                                            } catch (err) {
                                                console.error("Erro no checkout:", err);
                                            } finally {
                                                setProcessPlanId(null);
                                            }
                                        }}
                                    >
                                        {processPlanId === plan.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : isCurrent ? "Plano Ativo" : "Quero esse Plano"}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export function GabineteAssinaturaCard() {
    const navigate = useNavigate();
    const { subscribed, subscription_end, loading: subLoading, refreshSubscription } = useSubscription();
    const { limits, contract, usage, usagePercent, loading: limitsLoading, refetch } = usePlanLimits();
    const [showHistory, setShowHistory] = useState(false);
    const [showPlans, setShowPlans] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    const planName = limits?.plan_name || "Plano Básico";
    const priceMonthly = limits ? limits.monthly_price_cents / 100 : 0;
    const description = limits?.plan_description;

    // Data de início vem do contrato
    const dataInicio = contract?.data_inicio ? new Date(contract.data_inicio) : null;
    const dataVencimento = contract?.data_vencimento
        ? new Date(contract.data_vencimento)
        : subscription_end ? new Date(subscription_end) : null;
    const daysRemaining = dataVencimento
        ? Math.max(0, Math.ceil((dataVencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const recorrenciaLabel: Record<string, string> = {
        mensal: "Mensal",
        anual: "Anual",
        semestral: "Semestral",
    };
    const recorrencia = contract?.recorrencia
        ? recorrenciaLabel[contract.recorrencia] || contract.recorrencia
        : "Mensal";

    const isAtivo = contract?.status === 'ativo' || subscribed;
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
                                isAtivo
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            )}>
                                {isAtivo ? "Ativo" : "Inativo"}
                            </Badge>
                            <button onClick={() => { refreshSubscription(); refetch(); }} className="opacity-30 hover:opacity-70 transition-opacity" title="Atualizar">
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
                                        {isAtivo && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                        {contract?.is_trial && (
                                            <Badge className="text-[7px] bg-amber-500/10 text-amber-400 border-amber-500/20 h-4 px-1.5 uppercase tracking-widest">
                                                Trial
                                            </Badge>
                                        )}
                                    </div>
                                    {description && (
                                        <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-xs">{description}</p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xl font-bold text-foreground">R$ {priceMonthly.toFixed(2)}</p>
                                    <p className="text-[9px] text-muted-foreground/50 uppercase font-bold tracking-widest">por mês</p>
                                </div>
                            </div>

                            <Separator className="opacity-20" />

                            {/* Período e cobrança */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1 bg-muted/10 rounded-lg px-2.5 py-2">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                                        <CalendarDays className="h-2.5 w-2.5" />
                                        Início do Plano
                                    </p>
                                    <p className="text-[11px] font-semibold text-foreground/80">
                                        {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "—"}
                                    </p>
                                </div>
                                <div className="space-y-1 bg-muted/10 rounded-lg px-2.5 py-2">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                                        <Calendar className="h-2.5 w-2.5" />
                                        Vencimento
                                    </p>
                                    <p className="text-[11px] font-semibold text-foreground/80">
                                        {dataVencimento ? format(dataVencimento, "dd/MM/yyyy") : "—"}
                                    </p>
                                </div>
                                <div className="space-y-1 bg-muted/10 rounded-lg px-2.5 py-2">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                                        <Repeat className="h-2.5 w-2.5" />
                                        Recorrência
                                    </p>
                                    <p className="text-[11px] font-semibold text-foreground/80">{recorrencia}</p>
                                </div>
                                <div className="space-y-1 bg-muted/10 rounded-lg px-2.5 py-2">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                                        <CreditCard className="h-2.5 w-2.5" />
                                        Pagamento
                                    </p>
                                    <p className="text-[11px] font-semibold text-foreground/80">
                                        PIX / Boleto {contract?.metadata?.card_last4 ? `(Final ${contract.metadata.card_last4})` : ''}
                                    </p>
                                    <p className="text-[8px] text-muted-foreground/40 font-bold">via AbacatePay</p>
                                </div>
                            </div>

                            <Separator className="opacity-20" />

                            {/* Dias restantes */}
                            {daysRemaining !== null && (
                                <div className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-lg",
                                    daysRemaining <= 7 ? "bg-red-500/5 border border-red-500/20" :
                                        daysRemaining <= 30 ? "bg-amber-500/5 border border-amber-500/20" :
                                            "bg-muted/10 border border-border/20"
                                )}>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                        Dias Restantes
                                    </span>
                                    <span className={cn(
                                        "text-sm font-black",
                                        daysRemaining <= 7 ? "text-red-400" :
                                            daysRemaining <= 30 ? "text-amber-400" : "text-foreground/70"
                                    )}>
                                        {daysRemaining} dias
                                    </span>
                                </div>
                            )}

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
                                {/* Histórico */}
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

                                {/* Atualizar plano — abre modal */}
                                <button
                                    onClick={() => setShowPlans(true)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all group"
                                >
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">
                                        <Crown className="h-3 w-3" />
                                        Atualizar Plano
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-primary/30 group-hover:text-primary/60 transition-colors" />
                                </button>

                                {/* Cancelar */}
                                {!cancelConfirm ? (
                                    <button
                                        onClick={() => setCancelConfirm(true)}
                                        className="w-full text-[9px] font-bold uppercase tracking-widest text-destructive/40 hover:text-destructive/70 transition-colors pt-1"
                                    >
                                        Cancelar Assinatura
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                                        <p className="text-[9px] text-destructive/70 font-bold flex-1">Deseja cancelar? Entre em contato com suporte.</p>
                                        <a
                                            href="mailto:suporte@legisfy.com"
                                            className="h-6 px-2 text-[8px] bg-destructive/80 text-white hover:bg-destructive rounded font-bold uppercase tracking-wider flex items-center"
                                        >
                                            Contato
                                        </a>
                                        <button onClick={() => setCancelConfirm(false)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <PaymentHistoryModal open={showHistory} onOpenChange={setShowHistory} />
            <PlansModal open={showPlans} onOpenChange={setShowPlans} currentPlanId={limits?.plan_id} />
        </>
    );
}
