import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Gabinete {
  id: string;
  nome: string;
  politico_id: string;
}

interface Plan {
  id: string;
  title: string;
  price_monthly?: number;
  price_yearly?: number;
}

interface Profile {
  user_id: string;
  full_name: string;
}

export function CreateContractModal({ open, onOpenChange, onSuccess }: CreateContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [gabinetes, setGabinetes] = useState<Gabinete[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    gabinete_id: "",
    plan_id: "",
    responsavel_id: "",
    valor_mensal: "",
    valor_anual: "",
    recorrencia: "mensal",
    data_vencimento: undefined as Date | undefined,
    is_trial: false,
    observacoes: ""
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      // Buscar gabinetes
      const { data: gabinetesData, error: gabinetesError } = await supabase
        .from('gabinetes')
        .select(`
          id, 
          nome, 
          politico_id
        `);

      if (gabinetesError) throw gabinetesError;

      // Buscar planos
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('id, title, price_monthly, price_yearly')
        .eq('is_active', true);

      if (plansError) throw plansError;

      // Buscar profiles para responsáveis
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .not('full_name', 'is', null);

      if (profilesError) throw profilesError;

      setGabinetes(gabinetesData || []);
      const { data: plans } = await supabase
        .from('plans')
        .select('id, name')
        .eq('is_active', true);

      if (plans) setPlans(plans as any[]);
      setProfiles(profilesData || []);
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
      const fileName = `contracts/${Date.now()}_${pdfFile.name}`;
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

      // Buscar dados do gabinete selecionado
      const selectedGabinete = gabinetes.find(g => g.id === formData.gabinete_id);
      if (!selectedGabinete) {
        throw new Error("Gabinete não encontrado");
      }

      // TODO: Create contract in appropriate table when implemented
      console.log('Contract data:', {
        gabinete_id: formData.gabinete_id,
        plan_id: formData.plan_id,
        politico_id: selectedGabinete.politico_id,
        responsavel_id: formData.responsavel_id,
        valor_mensal: parseFloat(formData.valor_mensal),
        valor_anual: formData.valor_anual ? parseFloat(formData.valor_anual) : null,
        recorrencia: formData.recorrencia,
        data_vencimento: formData.data_vencimento?.toISOString().split('T')[0],
        is_trial: formData.is_trial,
        status: formData.is_trial ? 'trial' : 'ativo',
        anexo_pdf_url: pdfUrl,
        observacoes: formData.observacoes,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

      // For now, just show success message
      toast({
        title: "Sucesso", 
        description: "Contrato será criado quando a tabela for implementada.",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o contrato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      gabinete_id: "",
      plan_id: "",
      responsavel_id: "",
      valor_mensal: "",
      valor_anual: "",
      recorrencia: "mensal",
      data_vencimento: undefined,
      is_trial: false,
      observacoes: ""
    });
    setPdfFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo contrato
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Gabinete */}
          <div className="space-y-2">
            <Label htmlFor="gabinete">Gabinete *</Label>
            <Select value={formData.gabinete_id} onValueChange={(value) => 
              setFormData({ ...formData, gabinete_id: value })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o gabinete" />
              </SelectTrigger>
              <SelectContent>
                {gabinetes.map((gabinete) => (
                  <SelectItem key={gabinete.id} value={gabinete.id}>
                    {gabinete.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plano */}
          <div className="space-y-2">
            <Label htmlFor="plan">Plano de Assinatura *</Label>
            <Select value={formData.plan_id} onValueChange={(value) => 
              setFormData({ ...formData, plan_id: value })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.title} - R$ {plan.price_monthly}/mês
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável *</Label>
            <Select value={formData.responsavel_id} onValueChange={(value) => 
              setFormData({ ...formData, responsavel_id: value })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.user_id} value={profile.user_id}>
                    {profile.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valores e Recorrência */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_mensal">Valor Mensal (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_mensal}
                onChange={(e) => setFormData({ ...formData, valor_mensal: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_anual">Valor Anual (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_anual}
                onChange={(e) => setFormData({ ...formData, valor_anual: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recorrência</Label>
            <Select value={formData.recorrencia} onValueChange={(value) => 
              setFormData({ ...formData, recorrencia: value })
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label>Data de Vencimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.data_vencimento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.data_vencimento ? (
                    format(formData.data_vencimento, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.data_vencimento}
                  onSelect={(date) => setFormData({ ...formData, data_vencimento: date })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Trial */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_trial"
              checked={formData.is_trial}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_trial: checked === true })
              }
            />
            <Label htmlFor="is_trial">É um período de trial?</Label>
          </div>

          {/* Upload PDF */}
          <div className="space-y-2">
            <Label htmlFor="pdf">Anexo PDF</Label>
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

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
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
              {loading ? "Criando..." : "Criar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}