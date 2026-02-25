import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { UserMinus } from "lucide-react";

interface ExonerarAssessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessor: {
    id: string;
    nome: string;
  } | null;
  onConfirm: (assessorId: string) => void;
}

export const ExonerarAssessorModal = ({
  open,
  onOpenChange,
  assessor,
  onConfirm,
}: ExonerarAssessorModalProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { cabinet } = useAuthContext();

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== "exonerar" || !assessor) {
      toast.error("Digite 'exonerar' para confirmar a ação");
      return;
    }

    if (!cabinet?.cabinet_id) {
      toast.error("Erro: gabinete não encontrado");
      return;
    }

    setIsLoading(true);

    try {
      // Se é um convite pendente (ID começa com 'invite-'), remover da tabela gabinete_invites
      if (assessor.id.startsWith('invite-')) {
        const email = assessor.id.replace('invite-', '');
        const { error: inviteError } = await (supabase as any)
          .from('gabinete_invites')
          .delete()
          .eq('gabinete_id', cabinet.cabinet_id)
          .eq('email', email);

        if (inviteError) throw inviteError;
      } else {
        // Se é um membro ativo, remover da tabela gabinete_members
        const { error: memberError } = await (supabase as any)
          .from('gabinete_members')
          .delete()
          .eq('gabinete_id', cabinet.cabinet_id)
          .eq('user_id', assessor.id);

        if (memberError) throw memberError;
      }

      toast.success(`${assessor.nome} foi exonerado do gabinete`);
      onConfirm(assessor.id);
      setConfirmText("");
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exonerar assessor:', error);
      toast.error("Erro ao exonerar assessor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card/60 backdrop-blur-xl border-border/40 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-2">
            <UserMinus className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-2xl font-bold font-outfit">Confirmar Exoneração</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground/60 font-medium">
            Você está prestes a exonerar <strong className="text-foreground">{assessor?.nome}</strong> do gabinete.
            <span className="block mt-2 p-3 bg-destructive/5 border border-destructive/10 rounded-xl text-destructive font-bold text-xs">
              ⚠️ Esta ação é irreversível e removerá todos os acessos imediatamente.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6">
          <Label htmlFor="confirm-text" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Confirme digitando "exonerar"
          </Label>
          <Input
            id="confirm-text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Digite exonerar para validar..."
            className="h-12 bg-background/50 border-border/40 rounded-xl focus-visible:ring-destructive/20 transition-all font-bold placeholder:font-normal text-center"
          />
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            onClick={handleCancel}
            className="flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all border-none"
          >
            MANTER MEMBRO
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-destructive/20 transition-all active:scale-95 disabled:grayscale disabled:opacity-50"
            disabled={confirmText.toLowerCase() !== "exonerar" || isLoading}
          >
            {isLoading ? "PROCESSANDO..." : "CONFIRMAR EXONERAÇÃO"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};