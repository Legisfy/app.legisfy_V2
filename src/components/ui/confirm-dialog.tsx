import React, { createContext, useContext, useState, useCallback } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, AlertTriangle, Info, Trash2 } from "lucide-react";

interface ConfirmOptions {
    title?: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive" | "warning" | "info";
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({ description: "" });
    const [resolveCallback, setResolveCallback] = useState<(value: boolean) => void>(() => { });

    const confirm = useCallback((confirmOptions: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setOptions(confirmOptions);
            setOpen(true);
            setResolveCallback(() => resolve);
        });
    }, []);

    const handleCancel = () => {
        setOpen(false);
        resolveCallback(false);
    };

    const handleConfirm = () => {
        setOpen(false);
        resolveCallback(true);
    };

    const getIcon = () => {
        switch (options.variant) {
            case "destructive":
                return <Trash2 className="h-6 w-6 text-destructive" />;
            case "warning":
                return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
            case "info":
                return <Info className="h-6 w-6 text-blue-500" />;
            default:
                return <AlertCircle className="h-6 w-6 text-primary" />;
        }
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="max-w-[400px] border border-border/40 bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 ring-1 ring-white/10">
                    <AlertDialogHeader className="space-y-4">
                        <div className="flex justify-center mb-2">
                            <div className="p-4 rounded-2xl bg-muted/40 ring-1 ring-border/20">
                                {getIcon()}
                            </div>
                        </div>
                        <div className="space-y-1.5 text-center">
                            <AlertDialogTitle className="text-xl font-bold font-outfit uppercase tracking-tight text-foreground/80">
                                {options.title || "Confirmar Ação"}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs font-medium text-muted-foreground/60 leading-relaxed px-2">
                                {options.description}
                            </AlertDialogDescription>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 sm:justify-center gap-3">
                        <AlertDialogCancel
                            onClick={handleCancel}
                            className="mt-0 h-11 px-8 rounded-2xl border-border/40 hover:bg-muted/50 font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                            {options.cancelText || "Cancelar"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={`h-11 px-8 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10 transition-all ${options.variant === "destructive"
                                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                }`}
                        >
                            {options.confirmText || "Confirmar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context.confirm;
};
