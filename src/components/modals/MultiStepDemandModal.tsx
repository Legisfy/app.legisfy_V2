import { useState, useMemo } from "react";
import {
  MessageSquare, User, MessageCircle, ArrowLeft, ArrowRight,
  CheckCircle2, Calendar, LayoutGrid, Tag as TagIcon,
  BarChart3, Folder, Circle, Type
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useRealDemandas } from "@/hooks/useRealDemandas";
import { useRealEleitores } from "@/hooks/useRealEleitores";
import { useGabineteCategorias } from "@/hooks/useGabineteCategorias";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

// Helper to render Lucide icons dynamically or fallback
const CategoryIcon = ({ name, color, isRoot }: { name: string; color?: string; isRoot?: boolean }) => {
  if (!isRoot) {
    return <Circle className="h-3 w-3 fill-current opacity-40" style={{ color }} />;
  }
  return <Folder className="h-4 w-4" style={{ color }} />;
};

interface NewDemandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDemandModal({ open, onOpenChange }: NewDemandModalProps) {
  const { toast } = useToast();
  const { createDemanda } = useRealDemandas();
  const { eleitores } = useRealEleitores();
  const { categories, loading: categoriesLoading } = useGabineteCategorias('demandas');
  const { getDisplayName } = useCurrentUser();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [loading, setLoading] = useState(false);
  const [hasDeadline, setHasDeadline] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    description: "",
    eleitor_id: "",
    category_id: "",
    subcategory_id: "",
    priority: "media",
    data_limite: "",
  });

  // Filter root categories (those without parent_id)
  const rootCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id);
  }, [categories]);

  // Filter subcategories based on selected root category
  const subcategories = useMemo(() => {
    if (!formData.category_id) return [];
    return categories.filter(c => c.parent_id === formData.category_id);
  }, [formData.category_id, categories]);

  const handleSubmit = async () => {
    if (currentStep !== totalSteps) return;

    setLoading(true);
    try {
      // Use subcategory if selected, otherwise root category
      const finalCategoryId = formData.subcategory_id || formData.category_id;

      await createDemanda({
        titulo: formData.titulo,
        description: formData.description,
        status: "pendente",
        categoria_id: finalCategoryId || null,
        priority: formData.priority,
        eleitor_id: formData.eleitor_id || null,
        data_limite: hasDeadline ? formData.data_limite : null,
      } as any);

      toast({
        title: "Demanda criada!",
        description: "A demanda foi adicionada com sucesso ao sistema.",
      });

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating demanda:', error);
      toast({
        title: "Erro ao criar demanda",
        description: error.message || "Ocorreu um erro ao criar a demanda. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setHasDeadline(false);
    setFormData({
      titulo: "",
      description: "",
      eleitor_id: "",
      category_id: "",
      subcategory_id: "",
      priority: "media",
      data_limite: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep !== totalSteps) {
      e.preventDefault();
      if (canProceed()) {
        nextStep();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.titulo.trim().length >= 3 && formData.category_id;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="titulo" className="text-muted-foreground flex items-center gap-2">
                <Type className="h-4 w-4" />
                Título da Demanda
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange("titulo", e.target.value)}
                placeholder="Ex: Vazamento de água na Rua X..."
                className="bg-muted/20 border-border/40 focus:border-primary/50 transition-all rounded-2xl h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-muted-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Descrição Detalhada
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descreva detalhadamente a necessidade do eleitor..."
                rows={3}
                className="bg-muted/20 border-border/40 focus:border-primary/50 transition-all rounded-2xl resize-none py-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-muted-foreground flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Categoria
                </Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => {
                    handleInputChange("category_id", value);
                    handleInputChange("subcategory_id", "");
                  }}
                  disabled={loading || categoriesLoading}
                >
                  <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-11">
                    <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl shadow-2xl z-[100]">
                    {rootCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="focus:bg-primary/10 rounded-xl transition-colors">
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={category.icone} color={category.cor} isRoot={true} />
                          <span>{category.nome}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-muted-foreground flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Subcategoria
                </Label>
                <Select
                  value={formData.subcategory_id}
                  onValueChange={(value) => handleInputChange("subcategory_id", value)}
                  disabled={loading || !formData.category_id || subcategories.length === 0}
                >
                  <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-11">
                    <SelectValue placeholder={!formData.category_id ? "Aguardando" : subcategories.length === 0 ? "Nenhuma" : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl shadow-2xl z-[100]">
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id} className="focus:bg-primary/10 rounded-xl transition-colors">
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={sub.icone} color={sub.cor} isRoot={false} />
                          <span>{sub.nome}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Eleitor Solicitante
              </Label>
              <Select
                value={formData.eleitor_id}
                onValueChange={(value) => handleInputChange("eleitor_id", value)}
                disabled={loading}
              >
                <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-11">
                  <SelectValue placeholder="Busque ou selecione um eleitor..." />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl shadow-2xl z-[100]">
                  {eleitores.map((eleitor) => (
                    <SelectItem key={eleitor.id} value={eleitor.id} className="focus:bg-primary/10 rounded-xl transition-colors">
                      {eleitor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Prioridade
                </Label>
                <div className="flex items-center gap-2 p-1 bg-muted/20 border border-border/40 rounded-2xl">
                  {["baixa", "media", "urgente"].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleInputChange("priority", p)}
                      type="button"
                      className={cn(
                        "flex-1 h-9 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all",
                        formData.priority === p
                          ? p === 'baixa' ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 shadow-[0_0_15px_-5px_#10b981]"
                            : p === 'media' ? "bg-amber-500/20 text-amber-500 border border-amber-500/50 shadow-[0_0_15px_-5px_#f59e0b]"
                              : "bg-rose-500/20 text-rose-500 border border-rose-500/50 shadow-[0_0_15px_-5px_#ef4444]"
                          : "text-muted-foreground hover:bg-muted/30"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data Limite?
                  </Label>
                  <Switch
                    checked={hasDeadline}
                    onCheckedChange={setHasDeadline}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {hasDeadline && (
                  <Input
                    id="data_limite"
                    type="date"
                    value={formData.data_limite}
                    onChange={(e) => handleInputChange("data_limite", e.target.value)}
                    className="bg-muted/20 border-border/40 rounded-2xl h-11 transition-all focus:border-primary/50 text-foreground animate-in slide-in-from-top-2"
                  />
                )}
              </div>
            </div>

            <div className="bg-muted/10 border border-border/20 backdrop-blur-sm p-4 rounded-3xl space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <h4 className="font-outfit font-black uppercase tracking-widest text-[10px] text-primary">Confirmação de Dados</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                <div className="col-span-2 space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground/60 font-bold tracking-tight">Título</p>
                  <p className="font-medium text-foreground truncate">{formData.titulo}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground/60 font-bold tracking-tight">Categoria</p>
                  <p className="font-medium text-foreground truncate flex items-center gap-1.5">
                    {formData.category_id ? (
                      <>
                        <CategoryIcon name={categories.find(c => c.id === formData.category_id)?.icone || ""} color={categories.find(c => c.id === formData.category_id)?.cor} isRoot={true} />
                        {categories.find(c => c.id === formData.category_id)?.nome}
                      </>
                    ) : "Nenhuma"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground/60 font-bold tracking-tight">Data Limite</p>
                  <p className="font-medium text-foreground truncate">
                    {hasDeadline ? formData.data_limite : "Não definida"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open && !loading) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-white/10 font-outfit">
        <DialogHeader className="p-8 pb-4">
          <div className="flex justify-between items-start mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div className="flex gap-1.5 mt-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    currentStep === i ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
            {currentStep === 1 ? "Nova Demanda" : "Configurações"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60 text-xs font-medium uppercase tracking-widest">
            {currentStep === 1 ? "Inicie descrevendo o que precisa ser feito" : "Defina a urgência e prazos da tarefa"}
          </DialogDescription>
        </DialogHeader>

        <div onKeyDown={handleKeyDown} className="p-8 pt-0 space-y-8">
          {renderStep()}

          <div className="flex gap-3 pt-4 pb-8">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={loading}
                className="h-12 w-12 rounded-2xl border-border/40 hover:bg-muted/50 transition-all flex items-center justify-center p-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            {currentStep === totalSteps ? (
              <Button
                type="button"
                onClick={handleSubmit}
                className="h-12 flex-1 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                disabled={loading || !canProceed()}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    CRIAR DEMANDA
                    <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="h-12 flex-1 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
              >
                PROSSEGUIR
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}