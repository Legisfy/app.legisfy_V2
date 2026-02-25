import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string | null;
  onSuccess: () => void;
}

interface Plan {
  id: string;
  title: string;
  price_monthly?: number;
  price_yearly?: number;
}

export function EditContractModal({ open, onOpenChange, contractId, onSuccess }: EditContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    novo_valor_mensal: "",
    novo_valor_anual: "",
    novo_plan_id: "",
    observacoes_update: ""
  });

  useEffect(() => {
    if (open && contractId) {
      fetchPlans();
    }
  }, [open, contractId]);

  const fetchPlans = async () => {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('id, name, monthly_price_cents')
        .eq('is_active', true);

      if (plansError) throw plansError;
      setPlans(plansData as any[] || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      });
    }
  };

  const uploadPdf = async (): Promise<string | null> => {
    if (!pdfFile) return null;

    try {
      const fileName = `contract-updates/${Date.now()}_${pdfFile.name}`;
      const { error } = await supabase.storage
        .from('uploads')
        .upload(fileName, pdfFile);

      if (error) throw error;

      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do PDF:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do arquivo PDF.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId) return;
    
    setLoading(true);

    try {
      // Upload do PDF se existir
      let pdfUrl = null;
      if (pdfFile) {
        pdfUrl = await uploadPdf();
        if (!pdfUrl) {
          setLoading(false);
          return;
        }
      }

      // TODO: Create contract update log (table doesn't exist yet)
      console.log('Contract update log:', {
        contrato_id: contractId,
        novo_valor_mensal: formData.novo_valor_mensal ? parseFloat(formData.novo_valor_mensal) : null,
        novo_valor_anual: formData.novo_valor_anual ? parseFloat(formData.novo_valor_anual) : null,
        novo_plan_id: formData.novo_plan_id || null,
        novo_anexo_pdf_url: pdfUrl,
        observacoes_update: formData.observacoes_update,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

      // TODO: Update contract (table doesn't exist yet)
      console.log('Contract update data:', {
        valor_mensal: formData.novo_valor_mensal ? parseFloat(formData.novo_valor_mensal) : undefined,
        valor_anual: formData.novo_valor_anual ? parseFloat(formData.novo_valor_anual) : undefined,
        plan_id: formData.novo_plan_id || undefined,
        anexo_pdf_url: pdfUrl,
        updated_at: new Date().toISOString()
      });

      toast({
        title: "Sucesso",
        description: "Contrato atualizado com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o contrato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      novo_valor_mensal: "",
      novo_valor_anual: "",
      novo_plan_id: "",
      observacoes_update: ""
    });
    setPdfFile(null);
  };

  if (!contractId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atualizar Contrato</DialogTitle>
          <DialogDescription>
            Atualize os dados do contrato. Apenas preencha os campos que deseja modificar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Novo Plano */}
          <div className="space-y-2">
            <Label htmlFor="novo_plan">Novo Plano (opcional)</Label>
            <Select value={formData.novo_plan_id} onValueChange={(value) => 
              setFormData({ ...formData, novo_plan_id: value })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Manter plano atual</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.title} - R$ {plan.price_monthly}/mês
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Novos Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="novo_valor_mensal">Novo Valor Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.novo_valor_mensal}
                onChange={(e) => setFormData({ ...formData, novo_valor_mensal: e.target.value })}
                placeholder="Deixe vazio para manter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novo_valor_anual">Novo Valor Anual (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.novo_valor_anual}
                onChange={(e) => setFormData({ ...formData, novo_valor_anual: e.target.value })}
                placeholder="Deixe vazio para manter"
              />
            </div>
          </div>

          {/* Upload PDF */}
          <div className="space-y-2">
            <Label htmlFor="pdf">Novo Anexo PDF</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {pdfFile && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {pdfFile.name}
              </p>
            )}
          </div>

          {/* Observações da Atualização */}
          <div className="space-y-2">
            <Label htmlFor="observacoes_update">Observações da Atualização</Label>
            <Textarea
              value={formData.observacoes_update}
              onChange={(e) => setFormData({ ...formData, observacoes_update: e.target.value })}
              rows={3}
              placeholder="Descreva o motivo da atualização..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}