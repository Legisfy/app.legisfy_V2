import { useState } from "react";
import { MessageSquare, User, AlertCircle, MessageCircle, ArrowLeft, ArrowRight } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useRealDemandas } from "@/hooks/useRealDemandas";
import { useRealEleitores } from "@/hooks/useRealEleitores";
import { useDemandCategories } from "@/hooks/useDemandCategories";
import { useAuthContext } from "@/components/AuthProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface NewDemandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDemandModal({ open, onOpenChange }: NewDemandModalProps) {
  const { toast } = useToast();
  const { createDemanda } = useRealDemandas();
  const { eleitores } = useRealEleitores();
  const { categories, tags, getTagsByCategory, loading: categoriesLoading } = useDemandCategories();
  const { user } = useAuthContext();
  const { getDisplayName } = useCurrentUser();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    description: "",
    eleitor_id: "",
    category_id: "",
    tag_id: "",
    priority: "media",
    data_limite: "",
  });

  const handleSubmit = async () => {
    // Only allow submission on the last step
    if (currentStep !== totalSteps) {
      return;
    }
    
    setLoading(true);
    
    try {
      await createDemanda({
        description: formData.description,
        status: "pendente",
        category_id: formData.category_id || null,
        tag_id: formData.tag_id || null,
        priority: formData.priority,
        eleitor_id: formData.eleitor_id || null,
        data_limite: formData.data_limite || null,
      });

      toast({
        title: "Demanda criada!",
        description: "A demanda foi adicionada com sucesso ao sistema.",
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating demanda:', error);
      toast({
        title: "Erro ao criar demanda",
        description: "Ocorreu um erro ao criar a demanda. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      description: "",
      eleitor_id: "",
      category_id: "",
      tag_id: "",
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
    // Prevent Enter from submitting form on non-final steps
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
        return formData.description && formData.category_id && formData.tag_id;
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Demanda*</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descreva detalhadamente a demanda"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria*</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => {
                  handleInputChange("category_id", value);
                  handleInputChange("tag_id", ""); // Reset tag when category changes
                }}
                disabled={loading}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="hover:bg-gray-100">
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.category_id && (
              <div className="space-y-2">
                <Label htmlFor="tag">Tag*</Label>
                <Select
                  value={formData.tag_id}
                  onValueChange={(value) => handleInputChange("tag_id", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione a tag" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md z-50">
                    {getTagsByCategory(formData.category_id).map((tag) => (
                      <SelectItem key={tag.id} value={tag.id} className="hover:bg-gray-100">
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Eleitor Solicitante (opcional)
              </Label>
              <Select
                value={formData.eleitor_id}
                onValueChange={(value) => handleInputChange("eleitor_id", value)}
                disabled={loading}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Nenhum eleitor selecionado" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50">
                  {eleitores.map((eleitor) => (
                    <SelectItem key={eleitor.id} value={eleitor.id} className="hover:bg-gray-100">
                      {eleitor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Autor da Demanda</p>
              <p className="text-sm text-muted-foreground">
                {getDisplayName()}
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
                disabled={loading}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50">
                  <SelectItem value="baixa" className="hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Baixa
                    </div>
                  </SelectItem>
                  <SelectItem value="media" className="hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      Média
                    </div>
                  </SelectItem>
                  <SelectItem value="urgente" className="hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      Urgente
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_limite">Data Limite (opcional)</Label>
              <Input
                id="data_limite"
                type="date"
                value={formData.data_limite}
                onChange={(e) => handleInputChange("data_limite", e.target.value)}
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo da Demanda</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Categoria:</span> {categories.find(c => c.id === formData.category_id)?.name || "Não informada"}</p>
                <p><span className="font-medium">Tag:</span> {tags.find(t => t.id === formData.tag_id)?.name || "Não informada"}</p>
                <p><span className="font-medium">Prioridade:</span> {formData.priority}</p>
                <p><span className="font-medium">Status:</span> Pendente</p>
                <p><span className="font-medium">Autor:</span> {getDisplayName()}</p>
                {formData.eleitor_id && (
                  <p><span className="font-medium">Eleitor:</span> {eleitores.find(e => e.id === formData.eleitor_id)?.name || "Não encontrado"}</p>
                )}
                {formData.data_limite && (
                  <p><span className="font-medium">Data Limite:</span> {new Date(formData.data_limite).toLocaleDateString('pt-BR')}</p>
                )}
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Criar Nova Demanda
          </DialogTitle>
          <DialogDescription>
            Etapa {currentStep} de {totalSteps} - Preencha todos os campos antes de prosseguir
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        <div onKeyDown={handleKeyDown} className="space-y-6">
          {renderStep()}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            {currentStep === totalSteps ? (
              <Button 
                type="button" 
                onClick={handleSubmit} 
                className="flex items-center gap-2" 
                disabled={loading || !canProceed()}
              >
                {loading ? "Criando..." : "Criar Demanda"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}