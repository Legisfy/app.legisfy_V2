import { useState, useEffect } from "react";
import { FileText, MapPin, User, Camera, ArrowLeft, ArrowRight, Upload, X, Tag } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useRealIndicacoes } from "@/hooks/useRealIndicacoes";
import { useRealEleitores } from "@/hooks/useRealEleitores";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useIndicationCategories } from "@/hooks/useIndicationCategories";

interface NewIndicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createIndicacao?: (...args: any[]) => Promise<any>;
}

export function NewIndicationModal({ open, onOpenChange, createIndicacao: createIndicacaoProp }: NewIndicationModalProps) {
  const { toast } = useToast();
  const { createIndicacao: createIndicacaoLocal } = useRealIndicacoes();
  const createIndicacao = createIndicacaoProp || createIndicacaoLocal;
  const { eleitores } = useRealEleitores();
  const { user } = useAuthContext();
  const { tags: availableTags, getTagsByCategory, getCategories, loading: loadingTags } = useIndicationCategories();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log('📊 Available tags:', availableTags);
    console.log('📋 Categories:', getCategories());
    console.log('🏷️ Loading tags:', loadingTags);
  }, [availableTags, loadingTags]);
  const [formData, setFormData] = useState({
    titulo: "",
    justificativa: "",
    endereco_rua: "",
    endereco_bairro: "",
    endereco_cep: "",
    cidade: "",
    estado: "",
    fotos: [] as File[],
    fotosUrls: [] as string[],
    requestedByVoter: false,
    eleitor_id: "",
    tag: "",
  });

  // Get categories from tags
  const categories = getCategories();

  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `indicacoes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  // Função para geocodificar o endereço e obter coordenadas
  const geocodeAddress = async (): Promise<{ lat: number; lng: number } | null> => {
    const rua = formData.endereco_rua?.trim();
    const bairro = formData.endereco_bairro?.trim();
    const cep = formData.endereco_cep?.replace(/\D/g, '');
    const cidade = formData.cidade?.trim() || 'Vitória';
    const estado = formData.estado?.trim() || 'ES';

    if (!rua) return null;

    try {
      // Montar query para geocodificação
      const query = [
        rua,
        bairro || null,
        cidade,
        estado,
        cep || null,
        'Brasil'
      ].filter(Boolean).join(', ');

      const encoded = encodeURIComponent(query);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&country=BR&language=pt-BR&autocomplete=false&types=address&limit=5`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.features) && data.features.length) {
          // Escolher o melhor resultado
          let best = data.features[0];
          let bestScore = -1;

          for (const f of data.features) {
            let score = (typeof f.relevance === 'number' ? f.relevance : 0);

            // Preferir resultados que tenham o CEP correto
            if (cep && cep.length >= 5) {
              const fPost = (f.context || []).find((c: any) => String(c.id).startsWith('postcode'))?.text?.replace(/\D/g, '') || '';
              if (fPost && fPost.startsWith(cep.slice(0, 5))) {
                score += 1.5;
              }
            }

            // Preferir resultados que tenham o bairro correto
            if (bairro) {
              const fBairro = (f.context || []).find((c: any) =>
                String(c.id).startsWith('neighborhood') || String(c.id).startsWith('locality')
              )?.text?.toLowerCase() || '';
              if (fBairro && fBairro.includes(bairro.toLowerCase())) {
                score += 1.0;
              }
            }

            if (score > bestScore) {
              best = f;
              bestScore = score;
            }
          }

          const [lng, lat] = best.center as [number, number];
          return { lat, lng };
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('handleSubmit called with formData:', formData);
    console.log('selectedCategory:', selectedCategory);

    // Validações finais
    if (!selectedCategory || !formData.tag) {
      console.log('Validation failed - missing category or tag');
      toast({
        title: "Selecione a categoria e a TAG",
        description: "Para criar a indicação, escolha uma categoria e uma TAG.",
        variant: "destructive",
      });
      return;
    }

    if (formData.requestedByVoter && !formData.eleitor_id) {
      console.log('Validation failed - voter required but not selected');
      toast({
        title: "Selecione o eleitor",
        description: "Você marcou que foi solicitado por eleitor, mas não selecionou qual.",
        variant: "destructive",
      });
      return;
    }

    console.log('Validation passed, starting creation process...');
    setLoading(true);

    try {
      let fotosUrls = formData.fotosUrls;

      // Upload das fotos se houver
      if (formData.fotos.length > 0) {
        console.log('Uploading', formData.fotos.length, 'photos...');
        setUploadingPhotos(true);
        fotosUrls = await uploadPhotos(formData.fotos);
        console.log('Photos uploaded, URLs:', fotosUrls);
      }

      // Geocodificar o endereço para obter coordenadas precisas
      console.log('Geocoding address...');
      const coordinates = await geocodeAddress();
      console.log('Geocoding result:', coordinates);

      const payload = {
        titulo: formData.titulo,
        justificativa: formData.justificativa,
        endereco_rua: formData.endereco_rua || null,
        endereco_bairro: formData.endereco_bairro || null,
        endereco_cep: formData.endereco_cep || null,
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lng || null,
        eleitor_id: formData.requestedByVoter ? formData.eleitor_id : null,
        fotos_urls: fotosUrls.length > 0 ? fotosUrls : null,
        category: selectedCategory,
        tag: formData.tag,
      };

      console.log("Creating indicação with payload:", payload);
      const result = await createIndicacao(payload as any);
      console.log("Creation result:", result);

      if (coordinates) {
        toast({
          title: "Indicação criada!",
          description: "A indicação foi adicionada com sucesso e o endereço foi localizado no mapa.",
        });
      } else {
        toast({
          title: "Indicação criada!",
          description: "A indicação foi criada, mas não foi possível geocodificar o endereço automaticamente.",
        });
      }

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating indicacao:', error);
      toast({
        title: "Erro ao criar indicação",
        description: error?.message || "Ocorreu um erro ao criar a indicação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedCategory("");
    setFormData({
      titulo: "",
      justificativa: "",
      endereco_rua: "",
      endereco_bairro: "",
      endereco_cep: "",
      cidade: "",
      estado: "",
      fotos: [],
      fotosUrls: [],
      requestedByVoter: false,
      eleitor_id: "",
      tag: "",
    });
  };

  // Função para buscar CEP via ViaCEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco_rua: data.logradouro || "",
          endereco_bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || ""
        }));

        toast({
          title: "CEP encontrado!",
          description: `Endereço preenchido automaticamente: ${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique se o CEP está correto e tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível consultar o CEP. Verifique sua conexão.",
        variant: "destructive",
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    // Formatar CEP automaticamente
    const cepFormatado = value
      .replace(/\D/g, '') // Remove tudo que não é dígito
      .replace(/(\d{5})(\d)/, '$1-$2') // Adiciona hífen após 5 dígitos
      .substring(0, 9); // Limita a 9 caracteres

    handleInputChange("endereco_cep", cepFormatado);

    // Buscar automaticamente quando tiver 8 dígitos
    const cepLimpo = cepFormatado.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarCep(cepLimpo);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file =>
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB max
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Arquivos inválidos",
        description: "Apenas imagens até 5MB são permitidas.",
        variant: "destructive",
      });
    }

    handleInputChange('fotos', [...formData.fotos, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.fotos.filter((_, i) => i !== index);
    handleInputChange('fotos', newPhotos);
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
    switch (currentStep) {
      case 1:
        return formData.titulo && formData.justificativa;
      case 2:
        return formData.endereco_rua && formData.endereco_bairro;
      case 3:
        return selectedCategory && formData.tag;
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
              <Label htmlFor="titulo" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Título da Indicação*
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange("titulo", e.target.value)}
                placeholder="Digite o título da indicação"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa*</Label>
              <Textarea
                id="justificativa"
                value={formData.justificativa}
                onChange={(e) => handleInputChange("justificativa", e.target.value)}
                placeholder="Descreva a justificativa para esta indicação"
                rows={4}
                required
              />
            </div>

            {/* Info sobre responsável */}
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span><strong>Responsável:</strong> {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário"}</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço da Indicação*
              </Label>

              <div className="space-y-2">
                <Input
                  placeholder="Rua/Avenida/Praça*"
                  value={formData.endereco_rua}
                  onChange={(e) => handleInputChange("endereco_rua", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Bairro*"
                  value={formData.endereco_bairro}
                  onChange={(e) => handleInputChange("endereco_bairro", e.target.value)}
                  required
                />
                <Input
                  placeholder="CEP (00000-000)"
                  value={formData.endereco_cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  maxLength={9}
                  disabled={loadingCep}
                />
              </div>

              {loadingCep && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Buscando endereço...
                </div>
              )}

              {(formData.cidade || formData.estado) && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Cidade/Estado:</span> {formData.cidade}/{formData.estado}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Fotos (opcional)
              </Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="text-center mb-3">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Adicione fotos para documentar a indicação (máx. 5MB cada)
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Fotos
                    </label>
                  </Button>
                </div>

                {formData.fotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {formData.fotos.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requestedByVoter"
                checked={formData.requestedByVoter}
                onCheckedChange={(checked) => handleInputChange("requestedByVoter", Boolean(checked))}
              />
              <Label htmlFor="requestedByVoter" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Solicitado por eleitor?
              </Label>
            </div>

            {formData.requestedByVoter && (
              <div className="space-y-2">
                <Label>Eleitor Solicitante</Label>
                <Select
                  value={formData.eleitor_id}
                  onValueChange={(value) => handleInputChange("eleitor_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o eleitor" />
                  </SelectTrigger>
                  <SelectContent>
                    {eleitores.map((eleitor) => (
                      <SelectItem key={eleitor.id} value={eleitor.id}>
                        {eleitor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categoria*
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                TAG da Indicação*
              </Label>
              <Select
                value={formData.tag}
                onValueChange={(value) => handleInputChange("tag", value)}
                required
                disabled={!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCategory ? "Selecione uma TAG" : "Selecione uma categoria primeiro"} />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-background border-zinc-200 dark:border-white/10 shadow-xl">
                  {selectedCategory && getTagsByCategory(selectedCategory).map((tag) => (
                    <SelectItem key={tag.id} value={tag.tag_type}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resumo */}
            {formData.tag && (
              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Resumo da Indicação:</h4>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><strong>Título:</strong> {formData.titulo}</p>
                  <p><strong>Responsável:</strong> {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário"}</p>
                  <p><strong>Endereço:</strong> {formData.endereco_rua}, {formData.endereco_bairro}</p>
                  <p><strong>Categoria:</strong> {selectedCategory}</p>
                  <p><strong>TAG:</strong> {getTagsByCategory(selectedCategory).find(t => t.tag_type === formData.tag)?.name}</p>
                  <p><strong>Fotos:</strong> {formData.fotos.length} anexada(s)</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Criar Nova Indicação
          </DialogTitle>
          <DialogDescription>
            Etapa {currentStep} de {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

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
              <Button
                type="submit"
                className="flex items-center gap-2 px-8"
                disabled={loading || uploadingPhotos || !canProceed()}
              >
                {uploadingPhotos ? "Enviando fotos..." : loading ? "Criando..." : "Criar Indicação"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
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