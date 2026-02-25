import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Camara {
  id: string;
  nome: string;
  cidades?: { nome: string; estados?: { nome: string; sigla: string } };
}

interface DeleteInstitutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camara: Camara | null;
  onSuccess?: () => void;
}

export function DeleteInstitutionModal({ open, onOpenChange, camara, onSuccess }: DeleteInstitutionModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedText = camara ? `EXCLUIR ${camara.nome.toUpperCase()}` : "";

  const handleDelete = async () => {
    if (!camara || confirmText !== expectedText) {
      toast.error("Texto de confirmação incorreto");
      return;
    }

    setIsDeleting(true);

    try {
      // Soft delete - marca como excluída mas mantém no banco
      const { error } = await supabase
        .from("camaras")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq("id", camara.id);

      if (error) {
        toast.error("Erro ao excluir instituição");
        return;
      }

      toast.success("Instituição movida para lixeira!");
      handleClose();
      onSuccess?.();
    } catch (error) {
      toast.error("Erro inesperado ao excluir instituição");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  if (!camara) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Instituição
          </DialogTitle>
          <DialogDescription>
            Esta ação excluirá permanentemente a instituição e todos os dados relacionados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <h3 className="font-semibold text-destructive mb-2">{camara.nome}</h3>
            <p className="text-sm text-muted-foreground">
              {camara.cidades?.nome}, {camara.cidades?.estados?.sigla}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Para confirmar, digite: <code className="bg-muted px-1 rounded text-sm font-mono">{expectedText}</code>
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedText}
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmText !== expectedText || isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Excluindo..." : "Excluir Instituição"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}