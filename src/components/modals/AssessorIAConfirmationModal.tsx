import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2 } from "lucide-react";

interface AssessorIAConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappNumber?: string;
}

export function AssessorIAConfirmationModal({
  open,
  onOpenChange,
}: AssessorIAConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-zinc-800/50 text-zinc-200">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/60 border border-zinc-700/40">
            <CheckCircle2 className="w-8 h-8 text-zinc-300" />
          </div>
          <DialogTitle className="text-center text-2xl font-extrabold text-zinc-100 tracking-tight">
            Solicitação Enviada!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/30">
            <Clock className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-zinc-200 mb-1">
                Prazo de Implementação
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                A configuração do seu Assessor IA pode levar aproximadamente <strong className="text-zinc-200">24 horas</strong>.
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-500 text-center leading-relaxed">
            Você pode acompanhar o status da implementação nesta mesma página.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-zinc-200 text-zinc-900 hover:bg-zinc-300 font-bold text-sm px-8"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
