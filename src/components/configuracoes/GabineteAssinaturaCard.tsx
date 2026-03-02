import { useState, useEffect } from "react";
import {
    Crown, Calendar, CreditCard, History, AlertTriangle, CheckCircle,
    ChevronRight, Users, MessageCircle, FileSignature, FileText,
    TrendingUp, Loader2, RefreshCw, X, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentHistoryModal } from "@/components/assinatura/PaymentHistoryModal";
import { CustomerPortalButton } from "@/components/stripe/CustomerPortalButton";
import { cn } from "@/lib/utils";

interface PlanDetails {
    name: string;
    description?: string;
    monthly_price_cents: number;
    max_users?: number;
    max_demandas?: number;
    max_indicacoes?: number;
    max_ideias?: number;
    features?: string[];
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
    "Básico": "Plano inicial para gabinetes com equipes pequenas e funcionalidades essenciais.",
    "Profissional": "Plano completo para gabinetes com equipe estruturada e alta demanda de atendimento.",
    "Enterprise": "Plano ilimitado para grandes gabinetes com necessidades avançadas.",
};

const LIMIT_LABEL: Record<string, string> = {
    max_users: "Usuários",
    max_demandas: "Demandas",
    max_indicacoes: "Indicações",
    max_ideias: "Proj. de Lei",
};

const LIMIT_ICON: Record<string, React.ReactNode> = {
    max_users: <Users className="h-3.5 w-3.5" />,
    max_demandas: <MessageCircle className="h-3.5 w-3.5" />,
    max_indicacoes: <FileSignature className="h-3.5 w-3.5" />,
    max_ideias: <FileText className="h-3.5 w-3.5" />,
};

const LIMIT_COLOR: Record<string, string> = {
    max_users: "text-emerald-500",
    max_demandas: "text-blue-500",
    max_indicacoes: "text-purple-500",
    max_ideias: "text-amber-500",
};

export function GabineteAssinaturaCard() {
    const { cabinet } = useAuthContext();
    const { subscribed, plan, subscription_end, loading, error, refreshSubscription } = useSubscription();
    const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    useEffect(() => {
        const fetchPlanDetails = async () => {
            if (!cabinet?.cabinet_id) return;

            try {
                setLoadingPlan(true);
                const { data: gabinete } = await supabase
                    .from("gabinetes")
                    .select("plan_id, camaras!camara_id(plan_id)")
                    .eq("id", cabinet.cabinet_id)
                    .single();

                const planId = (gabinete as any)?.camaras?.plan_id || (gabinete as any)?.plan_id;
                if (!planId) return;

                const { data: planData } = await supabase
                    .from("plans")
                    .select("name, description, monthly_price_cents, max_users, max_demandas, max_indicacoes, max_ideias, features")
                    .eq("id", planId)
                    .single();

                if (planData) setPlanDetails(planData as any);
            } catch (err) {
                console.error("Erro ao buscar detalhes do plano:", err);
            } finally {
                setLoadingPlan(false);
            }
        };

        fetchPlanDetails();
    }, [cabinet?.cabinet_id]);

    const planName = planDetails?.name || plan || "Plano Básico";
    const priceMonthly = planDetails ? planDetails.monthly_price_cents / 100 : 0;
    const description = planDetails?.description || PLAN_DESCRIPTIONS[planName] || "Acesso às funcionalidades do Legisfy.";

    const nextBillingDate = subscription_end ? new Date(subscription_end) : null;
    const daysRemaining = nextBillingDate
        ? Math.max(0, Math.ceil((nextBillingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const isLoading = loading || loadingPlan;

    const limits: { key: string; value: number | null }[] = [
        { key: "max_users", value: planDetails?.max_users ?? null },
        { key: "max_demandas", value: planDetails?.max_demandas ?? null },
        { key: "max_indicacoes", value: planDetails?.max_indicacoes ?? null },
        { key: "max_ideias", value: planDetails?.max_ideias ?? null },
    ];

    return (
        <>
            <Card className="border border-border/40 bg-card/95 dark:bg-card/20 backdrop-blur-sm shadow-none">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-outfit">
                            <Crown className="h-3 w-3 opacity-40" />
                            Assinatura
                        </CardTitle>
                        <div className="flex items-center gap-1.5">
                            <Badge
                                className={cn(
                                    "text-[7px] font-bold tracking-widest uppercase px-1.5 h-4 border",
                                    subscribed
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                )}
                            >
                                {subscribed ? "Ativo" : "Inativo"}
                            </Badge>
                            <button
                                onClick={refreshSubscription}
                                className="opacity-30 hover:opacity-70 transition-opacity"
                                title="Atualizar"
                            >
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
                                        {subscribed && (
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-xs">
                                        {description}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-bold text-foreground">
                                        R$ {priceMonthly.toFixed(2)}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground/50 uppercase font-bold tracking-widest">
                                        por mês
                                    </p>
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
                                        {nextBillingDate
                                            ? format(nextBillingDate, "d 'de' MMM 'de' yyyy", { locale: ptBR })
                                            : "—"}
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                        Dias Restantes
                                    </p>
                                    <p className="text-[11px] font-semibold text-foreground/80">
                                        {daysRemaining !== null ? `${daysRemaining} dias` : "—"}
                                    </p>
                                </div>
                            </div>

                            <Separator className="opacity-20" />

                            {/* Limites do plano */}
                            <div className="space-y-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                                    <TrendingUp className="h-2.5 w-2.5" />
                                    Limites do Plano
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {limits.map(({ key, value }) => (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between bg-muted/20 border border-border/20 rounded-lg px-3 py-2"
                                        >
                                            <div className={cn("flex items-center gap-1.5 text-[10px] font-bold", LIMIT_COLOR[key])}>
                                                {LIMIT_ICON[key]}
                                                <span className="text-muted-foreground/60">{LIMIT_LABEL[key]}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-foreground/70">
                                                {value === null || value === -1 ? "Ilimitado" : value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator className="opacity-20" />

                            {/* Ações */}
                            <div className="space-y-2">
                                {/* Histórico de cobranças */}
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

                                {/* Atualizar plano */}
                                <button
                                    onClick={() => window.location.href = "/assinatura-stripe"}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all group"
                                >
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">
                                        <Crown className="h-3 w-3" />
                                        Atualizar Plano
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-primary/30 group-hover:text-primary/60 transition-colors" />
                                </button>

                                {/* Gerenciar pagamento */}
                                <CustomerPortalButton className="w-full h-8 text-[10px] font-bold uppercase tracking-widest bg-transparent border border-border/30 text-muted-foreground/60 hover:bg-muted/20 hover:text-muted-foreground rounded-lg transition-all flex items-center justify-center gap-2">
                                    <CreditCard className="h-3 w-3" />
                                    Gerenciar Pagamento
                                </CustomerPortalButton>

                                {/* Cancelar assinatura */}
                                {!cancelConfirm ? (
                                    <button
                                        onClick={() => setCancelConfirm(true)}
                                        className="w-full text-[9px] font-bold uppercase tracking-widest text-destructive/40 hover:text-destructive/70 transition-colors pt-1"
                                    >
                                        Cancelar Assinatura
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                                        <p className="text-[9px] text-destructive/70 font-bold flex-1">
                                            Confirmar cancelamento?
                                        </p>
                                        <CustomerPortalButton className="h-6 px-2 text-[8px] bg-destructive/80 text-white hover:bg-destructive border-0 rounded font-bold uppercase tracking-wider">
                                            Confirmar
                                        </CustomerPortalButton>
                                        <button onClick={() => setCancelConfirm(false)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Aviso erro */}
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
