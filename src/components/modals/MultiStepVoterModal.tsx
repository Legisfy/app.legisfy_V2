import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Tag, Calendar, Camera, ArrowLeft, ArrowRight, Upload, X, Lock } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRealEleitores } from "@/hooks/useRealEleitores";
import { NormalizedInput } from "@/components/ui/normalized-input";
import { useNormalizedFields } from "@/hooks/useNormalizedFields";
import { normalizePhone, formatPhoneDisplay } from "@/utils/textNormalization";
import { useEleitorTags } from "@/hooks/useEleitorTags";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";

interface NewVoterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewVoterModal({ open, onOpenChange }: NewVoterModalProps) {
  const { toast } = useToast();
  const { createEleitor } = useRealEleitores();
  const { getExistingNeighborhoods } = useNormalizedFields();
  const { tags: eleitorTags, loading: tagsLoading } = useEleitorTags();
  const { hasPermission } = usePermissions();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [loading, setLoading] = useState(false);
  const [existingNeighborhoods, setExistingNeighborhoods] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const canWrite = hasPermission('eleitores', 'write');
  
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    whatsapp: "",
    email: "",
    address: "",
    neighborhood: "",
    cep: "",
    socialMedia: "",
    tags: "",
    profilePhoto: null as File | null,
  });

  // Load existing neighborhoods
  useEffect(() => {
    if (open) {
      loadExistingNeighborhoods();
    }
  }, [open]);

  const loadExistingNeighborhoods = async () => {
    try {
      const neighborhoods = await getExistingNeighborhoods();
      setExistingNeighborhoods(neighborhoods);
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
    }
  };

  const handleToggleTag = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar permissão de escrita
    if (!canWrite) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para cadastrar eleitores. Entre em contato com o administrador do gabinete.",
        variant: "destructive"
      });
      return;
    }
    
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros nos campos antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Use selected tags from badges
      const tagsArray = selectedTags.length > 0 ? selectedTags : [];

      await createEleitor({
        name: formData.name,
        whatsapp: formData.whatsapp,
        email: formData.email || null,
        address: formData.address,
        neighborhood: formData.neighborhood,
        birth_date: formData.birthDate || null,
        social_media: formData.socialMedia || null,
        tags: tagsArray,
        profile_photo_url: null, // TODO: Implement photo upload
      });

      toast({
        title: "Eleitor cadastrado!",
        description: "O eleitor foi adicionado com sucesso ao sistema.",
      });
      
      onOpenChange(false);
      setCurrentStep(1);
      setFormData({
        name: "",
        birthDate: "",
        whatsapp: "",
        email: "",
        address: "",
        neighborhood: "",
        cep: "",
        socialMedia: "",
        tags: "",
        profilePhoto: null,
      });
      setValidationErrors({});
    } catch (error) {
      console.error('Error creating eleitor:', error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar o eleitor. Tente novamente.";
      toast({
        title: "Erro ao cadastrar eleitor",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    // Check for validation errors first
    if (Object.keys(validationErrors).length > 0) {
      return false;
    }
    
    switch (currentStep) {
      case 1:
        return formData.name && formData.whatsapp;
      case 2:
        return formData.address && formData.neighborhood;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center relative overflow-hidden">
                {formData.profilePhoto ? (
                  <img 
                    src={URL.createObjectURL(formData.profilePhoto)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar Foto
                </Button>
                {formData.profilePhoto && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, profilePhoto: null }))}
                  >
                    Remover
                  </Button>
                )}
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData(prev => ({ ...prev, profilePhoto: file }));
                  }
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo*
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Nascimento
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  WhatsApp*
                </Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço Completo*
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Rua, número, complemento"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro*</Label>
                <NormalizedInput
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(value) => handleInputChange("neighborhood", value)}
                  placeholder="Digite o bairro"
                  required
                  normalize={true}
                  checkDuplicates={true}
                  existingValues={existingNeighborhoods}
                  onDuplicateFound={(isDuplicate, duplicateValue) => {
                    if (isDuplicate) {
                      setValidationErrors(prev => ({
                        ...prev,
                        neighborhood: "Este bairro já existe"
                      }));
                    } else {
                      setValidationErrors(prev => {
                        const { neighborhood, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange("cep", e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialMedia">Redes Sociais</Label>
              <Input
                id="socialMedia"
                value={formData.socialMedia}
                onChange={(e) => handleInputChange("socialMedia", e.target.value)}
                placeholder="@usuario ou link"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Selecione as tags que se aplicam ao eleitor
              </p>
              
              {/* Display selected tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 border rounded-md bg-muted/30">
                  {selectedTags.map((tag) => {
                    const eleitorTag = eleitorTags.find(t => t.name === tag);
                    return (
                      <Badge 
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:opacity-80"
                        style={eleitorTag ? { 
                          backgroundColor: eleitorTag.color + '20',
                          color: eleitorTag.color,
                          border: `1px solid ${eleitorTag.color}`
                        } : undefined}
                        onClick={() => handleToggleTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Tags from eleitor_tags table */}
              {tagsLoading ? (
                <div className="text-center text-muted-foreground py-4">Carregando tags...</div>
              ) : eleitorTags.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tags disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {eleitorTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                        className="cursor-pointer"
                        style={selectedTags.includes(tag.name) ? { 
                          backgroundColor: tag.color,
                          borderColor: tag.color 
                        } : {
                          borderColor: tag.color,
                          color: tag.color
                        }}
                        onClick={() => handleToggleTag(tag.name)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Nenhuma tag criada ainda. Crie tags em Públicos → TAGs.
                </div>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Cadastro</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nome:</span> {formData.name || "Não informado"}</p>
                <p><span className="font-medium">WhatsApp:</span> {formData.whatsapp || "Não informado"}</p>
                <p><span className="font-medium">Endereço:</span> {formData.address || "Não informado"}</p>
                <p><span className="font-medium">Bairro:</span> {formData.neighborhood || "Não informado"}</p>
                {selectedTags.length > 0 && (
                  <p><span className="font-medium">Tags:</span> {selectedTags.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Cadastrar Novo Eleitor
          </DialogTitle>
          <DialogDescription>
            Etapa {currentStep} de {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {!canWrite && (
          <Card className="bg-yellow-50 border-yellow-200 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Lock className="h-4 w-4" />
                <p className="text-sm font-medium">
                  Você não tem permissão para cadastrar eleitores. Contate o administrador do gabinete para obter acesso.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Button type="submit" className="flex items-center gap-2" disabled={loading || !canWrite}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed() || !canWrite}
                className="flex items-center gap-2"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}