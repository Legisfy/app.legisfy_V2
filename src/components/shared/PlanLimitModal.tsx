import { Lock, TrendingUp, ArrowRight, Zap } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const RESOURCE_LABELS: Record<string, { label: string; limit: string; upgrade: string }> = {
    eleitores: {
        label: "Eleitores",
        limit: "Você atingiu o limite de eleitores cadastrados do seu plano.",
        upgrade: "Faça upgrade para cadastrar mais eleitores e ampliar sua base.",
    },
    demandas: {
        label: "Demandas",
        limit: "Você atingiu o limite de demandas do seu plano.",
        upgrade: "Faça upgrade para registrar e gerenciar mais demandas.",
    },
    indicacoes: {
        label: "Indicações",
        limit: "Você atingiu o limite de indicações do seu plano.",
        upgrade: "Faça upgrade para registrar mais indicações.",
    },
    ideias: {
        label: "Projetos de Lei",
        limit: "Você atingiu o limite de projetos de lei do seu plano.",
        upgrade: "Faça upgrade para registrar mais projetos de lei.",
    },
    users: {
        label: "Usuários",
        limit: "Você atingiu o limite de usuários (assessores) do seu plano.",
        upgrade: "Faça upgrade para adicionar mais membros à sua equipe.",
    },
};

interface PlanLimitModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resource: string;
    currentUsage: number;
    maxLimit: number;
    planName?: string;
}

export function PlanLimitModal({
    open,
    onOpenChange,
    resource,
    currentUsage,
    maxLimit,
    planName = "seu plano atual",
}: PlanLimitModalProps) {
    const navigate = useNavigate();
    const info = RESOURCE_LABELS[resource] || {
        label: resource,
        limit: `Você atingiu o limite do seu plano.`,
        upgrade: "Faça upgrade para continuar usando.",
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm border border-border/40 bg-card/95 dark:bg-card/20 backdrop-blur-sm shadow-2xl">
                <DialogHeader className="text-center">
                    {/* Ícone */}
                    <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-orange-400" />
                    </div>

                    <DialogTitle className="text-sm font-bold text-foreground">
                        Limite de {info.label} Atingido
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground/70 leading-relaxed mt-1">
                        {info.limit}
                    </DialogDescription>
                </DialogHeader>

                {/* Uso atual */}
                <div className="my-2 p-3 rounded-xl bg-muted/20 border border-border/20 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground/60 font-bold uppercase tracking-widest">
                            Uso atual
                        </span>
                        <Badge variant="outline" className="text-[8px] h-4 border-orange-500/30 text-orange-400 bg-orange-500/5">
                            {currentUsage} / {maxLimit}
                        </Badge>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
                            style={{ width: "100%" }}
                        />
                    </div>
                    <p className="text-[9px] text-muted-foreground/40 font-medium">
                        Plano atual: <span className="text-foreground/60 font-bold">{planName}</span>
                    </p>
                </div>

                {/* Próximo plano */}
                <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                    {info.upgrade}
                </p>

                {/* Botões */}
                <div className="flex gap-2 mt-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 text-[9px] font-bold uppercase tracking-widest"
                        onClick={() => onOpenChange(false)}
                    >
                        Fechar
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 h-8 text-[9px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 gap-1"
                        onClick={() => {
                            onOpenChange(false);
                            navigate("/assinatura-stripe");
                        }}
                    >
                        <Zap className="h-3 w-3" />
                        Ver Planos
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
