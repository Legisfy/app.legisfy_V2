import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, Image } from 'lucide-react';

interface Plan {
  id: string;
  title: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  is_trial: boolean;
  trial_days: number;
  is_active: boolean;
  plan_type: string;
  cover_image_url?: string;
}

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  onSuccess: () => void;
}

interface AvailableFeature {
  feature_key: string;
  feature_name: string;
  feature_description: string;
  category: string;
}

export const EditPlanModal = ({ isOpen, onClose, plan, onSuccess }: EditPlanModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    max_users: '',
    is_trial: false,
    trial_days: '',
    is_active: true,
    plan_type: 'custom' as const,
    cover_image_url: '',
  });
  
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Initialize form data when plan changes
  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title,
        description: plan.description,
        price_monthly: plan.price_monthly.toString(),
        price_yearly: plan.price_yearly.toString(),
        max_users: plan.max_users.toString(),
        is_trial: plan.is_trial,
        trial_days: plan.trial_days.toString(),
        is_active: plan.is_active,
        plan_type: plan.plan_type as any,
        cover_image_url: plan.cover_image_url || '',
      });
    }
  }, [plan]);

  // Fetch available features
  const { data: availableFeatures, isLoading: featuresLoading } = useQuery({
    queryKey: ['available-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_features_available')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as AvailableFeature[];
    },
  });

  // Fetch current plan features
  const { data: currentFeatures, isLoading: currentFeaturesLoading } = useQuery({
    queryKey: ['plan-features', plan?.id],
    queryFn: async () => {
      if (!plan?.id) return [];
      
      const { data, error } = await supabase
        .from('plan_features')
        .select('feature_key, is_enabled')
        .eq('plan_id', plan.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!plan?.id,
  });

  // Update selected features when current features load
  useEffect(() => {
    if (currentFeatures) {
      const enabledFeatures = currentFeatures
        .filter(f => f.is_enabled)
        .map(f => f.feature_key);
      setSelectedFeatures(new Set(enabledFeatures));
    }
  }, [currentFeatures]);

  // Upload cover image function
  const uploadCoverImage = async (file: File): Promise<string> => {
    const fileName = `plan-cover-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('cabinet-logos')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('cabinet-logos')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async () => {
      let coverImageUrl = formData.cover_image_url;
      
      // Upload cover image if file is selected
      if (coverImageFile) {
        setIsUploadingImage(true);
        try {
          coverImageUrl = await uploadCoverImage(coverImageFile);
        } catch (error) {
          setIsUploadingImage(false);
          throw new Error('Erro ao fazer upload da imagem de capa');
        }
        setIsUploadingImage(false);
      }
      
      // Update the plan
      const { error: planError } = await supabase
        .from('plans')
        .update({
          title: formData.title,
          description: formData.description,
          price_monthly: parseFloat(formData.price_monthly),
          price_yearly: parseFloat(formData.price_yearly),
          max_users: parseInt(formData.max_users),
          is_trial: formData.is_trial,
          trial_days: formData.is_trial ? parseInt(formData.trial_days) : 0,
          is_active: formData.is_active,
          plan_type: formData.plan_type,
          cover_image_url: coverImageUrl || null,
        })
        .eq('id', plan.id);
      
      if (planError) throw planError;
      
      // Delete existing plan features
      const { error: deleteError } = await supabase
        .from('plan_features')
        .delete()
        .eq('plan_id', plan.id);
      
      if (deleteError) throw deleteError;
      
      // Create new plan features
      if (selectedFeatures.size > 0) {
        const planFeatures = Array.from(selectedFeatures).map(featureKey => ({
          plan_id: plan.id,
          feature_key: featureKey,
          is_enabled: true
        }));
        
        const { error: featuresError } = await supabase
          .from('plan_features')
          .insert(planFeatures);
        
        if (featuresError) throw featuresError;
      }
      
      return plan;
    },
    onSuccess: () => {
      toast({
        title: "Plano atualizado",
        description: "O plano foi atualizado com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFeatureToggle = (featureKey: string, checked: boolean) => {
    const newSelectedFeatures = new Set(selectedFeatures);
    if (checked) {
      newSelectedFeatures.add(featureKey);
    } else {
      newSelectedFeatures.delete(featureKey);
    }
    setSelectedFeatures(newSelectedFeatures);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      // Clear URL field when file is selected
      setFormData({ ...formData, cover_image_url: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlanMutation.mutate();
  };

  const groupedFeatures = availableFeatures?.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, AvailableFeature[]>);

  const categoryLabels = {
    core: 'Funcionalidades Essenciais',
    ai: 'Inteligência Artificial',
    reports: 'Relatórios',
    marketing: 'Marketing',
    gamification: 'Gamificação',
    communication: 'Comunicação',
    general: 'Geral'
  };

  if (featuresLoading || currentFeaturesLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Plano</DialogTitle>
          <DialogDescription>
            Edite os detalhes do plano e configure as funcionalidades disponíveis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nome do plano"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan_type">Tipo do Plano</Label>
              <Select
                value={formData.plan_type}
                onValueChange={(value) => setFormData({ ...formData, plan_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                  <SelectItem value="institucional">Institucional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve descrição explicando para quem é o plano"
              required
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Imagem de Capa do Plano</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="cover_image_file" className="text-sm font-medium">Upload de Arquivo</Label>
                <div className="relative">
                  <Input
                    id="cover_image_file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="h-10"
                  />
                  <Upload className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
                {coverImageFile && (
                  <p className="text-xs text-green-600">
                    Arquivo selecionado: {coverImageFile.name}
                  </p>
                )}
              </div>
              
              {/* URL Alternative */}
              <div className="space-y-2">
                <Label htmlFor="cover_image_url" className="text-sm font-medium">Ou URL da Imagem</Label>
                <Input
                  id="cover_image_url"
                  value={formData.cover_image_url}
                  onChange={(e) => {
                    setFormData({ ...formData, cover_image_url: e.target.value });
                    if (e.target.value) setCoverImageFile(null);
                  }}
                  placeholder="https://exemplo.com/imagem-capa.jpg"
                  className="h-10"
                  type="url"
                  disabled={!!coverImageFile}
                />
              </div>
            </div>
            
            {/* Preview Area */}
            <div className="border-2 border-dashed border-muted rounded-lg p-4">
              <div className="text-center">
                <Image className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium mt-2">Preview da Capa</p>
                <p className="text-xs text-muted-foreground">
                  A imagem será exibida como um card vertical estilo Netflix na página de assinatura.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: proporção 2:3 (ex: 400x600px) para melhor resultado.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_monthly">Valor Mensal (R$) *</Label>
              <Input
                id="price_monthly"
                type="number"
                step="0.01"
                value={formData.price_monthly}
                onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                placeholder="199.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_yearly">Valor Anual (R$) *</Label>
              <Input
                id="price_yearly"
                type="number"
                step="0.01"
                value={formData.price_yearly}
                onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                placeholder="2149.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_users">Usuários Permitidos *</Label>
              <Input
                id="max_users"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                placeholder="5"
                required
              />
            </div>
          </div>

          {/* Status and Trial Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Plano ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_trial"
                  checked={formData.is_trial}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_trial: checked })}
                />
                <Label htmlFor="is_trial">Oferece período de trial</Label>
              </div>

              {formData.is_trial && (
                <div className="space-y-2">
                  <Label htmlFor="trial_days">Dias de Trial</Label>
                  <Input
                    id="trial_days"
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                    placeholder="30"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funcionalidades Disponíveis</CardTitle>
              <CardDescription>
                Selecione quais funcionalidades estarão disponíveis neste plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {groupedFeatures && Object.entries(groupedFeatures).map(([category, features]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-semibold text-sm">
                      {categoryLabels[category as keyof typeof categoryLabels] || category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {features.map((feature) => (
                        <div key={feature.feature_key} className="flex items-start space-x-2">
                          <Checkbox
                            id={feature.feature_key}
                            checked={selectedFeatures.has(feature.feature_key)}
                            onCheckedChange={(checked) => 
                              handleFeatureToggle(feature.feature_key, checked as boolean)
                            }
                          />
                          <div className="space-y-1">
                            <Label
                              htmlFor={feature.feature_key}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {feature.feature_name}
                            </Label>
                            {feature.feature_description && (
                              <p className="text-xs text-muted-foreground">
                                {feature.feature_description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updatePlanMutation.isPending || isUploadingImage}>
              {(updatePlanMutation.isPending || isUploadingImage) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploadingImage ? 'Fazendo Upload...' : 'Salvando...'}
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};