import { useState } from 'react';
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
import { Loader2, Briefcase, DollarSign, Clock, Settings, Image, Upload } from 'lucide-react';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MenuFeature {
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

const MENU_FEATURES: MenuFeature[] = [
  // Menu Principal
  { key: 'dashboard', name: 'Dashboards', description: 'Dashboard principal com métricas e resumos', category: 'principal', icon: 'BarChart3' },
  { key: 'eleitores', name: 'Eleitores', description: 'Gestão de eleitores e contatos', category: 'principal', icon: 'Users' },
  { key: 'indicacoes', name: 'Indicações', description: 'Sistema de indicações políticas', category: 'principal', icon: 'FileText' },
  { key: 'demandas', name: 'Demandas', description: 'Gestão de demandas e solicitações', category: 'principal', icon: 'MessageSquare' },
  { key: 'agenda', name: 'Agenda', description: 'Sistema de agendamento e calendário', category: 'principal', icon: 'Calendar' },
  
  // Inteligência Artificial
  { key: 'assessor_ia', name: 'AssesorIA', description: 'Assistente virtual com inteligência artificial', category: 'ia', icon: 'Bot' },
  
  // Comunicação
  { key: 'whatsapp', name: 'Conexao com Whatsapp', description: 'Integração completa com WhatsApp para comunicação', category: 'comunicacao', icon: 'MessageCircle' },
  
  // Geolocalização
  { key: 'geolocalizacao', name: 'Geolocalizações', description: 'Sistema de geolocalização e mapas', category: 'geolocalizacao', icon: 'MapPin' },
  
  // Gamificação
  { key: 'gamificacao', name: 'Gamificação do gabinete', description: 'Sistema de metas e gamificação para motivar a equipe', category: 'gamificacao', icon: 'Target' },
  { key: 'metas', name: 'Sistema de metas', description: 'Definição e acompanhamento de metas da equipe', category: 'gamificacao', icon: 'Trophy' },
];

export const CreatePlanModal = ({ isOpen, onClose, onSuccess }: CreatePlanModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    max_users: '',
    is_trial: false,
    trial_days: '',
    plan_type: '',
    cover_image_url: '',
  });
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());

  // Upload cover image function
  const uploadCoverImage = async (file: File): Promise<string> => {
    const fileName = `plan-cover-${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('plan-assets')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('plan-assets')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  // Create plan mutation
  const createPlanMutation = useMutation({
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
      
      // Validate numeric fields
      const priceMonthly = Number(formData.price_monthly);
      const priceYearly = Number(formData.price_yearly);
      const maxUsers = parseInt(formData.max_users || '0', 10);
      const trialDays = formData.is_trial ? parseInt(formData.trial_days || '0', 10) : 0;

      if (isNaN(priceMonthly) || isNaN(priceYearly) || isNaN(maxUsers) || (formData.is_trial && isNaN(trialDays))) {
        throw new Error('Preencha os campos numéricos corretamente.');
      }
      
      // Normalize and map plan_type to enum
      const normalize = (s: string) =>
        s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
      const allowed = ['basico','intermediario','avancado','institucional'];
      const mapAliases: Record<string,string> = {
        basico: 'basico',
        basic: 'basico',
        starter: 'basico',
        intermediario: 'intermediario',
        intermediate: 'intermediario',
        ambicioso: 'intermediario',
        avancado: 'avancado',
        advanced: 'avancado',
        poder: 'avancado',
        premium: 'avancado',
        institucional: 'institucional',
        institutional: 'institucional'
      };
      const normInput = normalize(formData.plan_type);
      const safePlanType = allowed.includes(normInput) ? normInput : (mapAliases[normInput] || 'basico');

      // Create the plan
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .insert({
          name: formData.title,
          description: formData.description,
          monthly_price_cents: priceMonthly * 100,
          slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
          is_trial: formData.is_trial,
          trial_days: trialDays,
          plan_type: safePlanType as any,
          cover_image_url: coverImageUrl || null,
        })
        .select()
        .single();
      
      if (planError) throw planError;
      
      // Create plan features (best-effort, do not fail plan creation)
      if (selectedFeatures.size > 0) {
        const planFeatures = Array.from(selectedFeatures).map(featureKey => ({
          plan_id: plan.id,
          feature_key: featureKey,
          is_enabled: true
        }));
        
        try {
          const { error: featuresError } = await supabase
            .from('plan_features')
            .insert(planFeatures);
          if (featuresError) throw featuresError;
        } catch (featuresError: any) {
          console.error('Erro ao salvar funcionalidades do plano:', featuresError);
          toast({
            title: 'Plano criado, mas...',
            description: 'As funcionalidades do plano não puderam ser salvas agora. Você pode configurá-las depois.',
          });
        }
      }
      
      return plan;
    },
    onSuccess: () => {
      toast({
        title: 'Plano criado',
        description: 'O plano foi criado com sucesso.',
      });
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar plano',
        description: (error as any)?.message || 'Não foi possível criar o plano.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price_monthly: '',
      price_yearly: '',
      max_users: '',
      is_trial: false,
      trial_days: '',
      plan_type: '',
      cover_image_url: '',
    });
    setSelectedFeatures(new Set());
    setCoverImageFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      // Clear URL field when file is selected
      setFormData({ ...formData, cover_image_url: '' });
    }
  };

  const handleFeatureToggle = (featureKey: string, checked: boolean) => {
    const newSelectedFeatures = new Set(selectedFeatures);
    if (checked) {
      newSelectedFeatures.add(featureKey);
    } else {
      newSelectedFeatures.delete(featureKey);
    }
    setSelectedFeatures(newSelectedFeatures);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanMutation.mutate();
  };

  const groupedFeatures = MENU_FEATURES.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, MenuFeature[]>);

  const categoryLabels = {
    principal: 'Funcionalidades Essenciais',
    ia: 'Inteligência Artificial',
    comunicacao: 'Comunicação',
    geolocalizacao: 'Geolocalização',
    gamificacao: 'Gamificação'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">Criar Novo Plano</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Configure os detalhes do novo plano e selecione as funcionalidades que estarão disponíveis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Título do Plano *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Plano Premium"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan_type" className="text-sm font-medium">Categoria do Plano</Label>
                  <Select
                    value={formData.plan_type}
                    onValueChange={(value) => setFormData({ ...formData, plan_type: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione a categoria" />
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
                <Label htmlFor="description" className="text-sm font-medium">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva para quem é esse plano e seus principais benefícios..."
                  className="min-h-[80px] resize-none"
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
                      <strong>Dimensões recomendadas:</strong> 400x600px (proporção 2:3)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tamanho máximo: 2MB | Formatos: JPG, PNG, WEBP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Preços e Limites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_monthly" className="text-sm font-medium">Valor Mensal (R$) *</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                    placeholder="199.00"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_yearly" className="text-sm font-medium">Valor Anual (R$) *</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    step="0.01"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                    placeholder="2149.00"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_users" className="text-sm font-medium">Usuários Permitidos *</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                    placeholder="5"
                    className="h-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trial Settings */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configurações de Trial
              </CardTitle>
              <CardDescription>
                Configure se este plano oferece período de teste gratuito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="is_trial"
                  checked={formData.is_trial}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_trial: checked })}
                />
                <Label htmlFor="is_trial" className="text-sm font-medium">Oferece período de trial</Label>
              </div>

              {formData.is_trial && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="trial_days" className="text-sm font-medium">Dias de Trial</Label>
                  <Input
                    id="trial_days"
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                    placeholder="30"
                    className="h-10 w-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Selection */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Funcionalidades Disponíveis
              </CardTitle>
              <CardDescription>
                Selecione quais funcionalidades do menu lateral estarão disponíveis neste plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {Object.entries(groupedFeatures).map(([category, features]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-border flex-1" />
                      <h4 className="font-semibold text-sm px-3 py-1 bg-accent/20 rounded-full">
                        {categoryLabels[category as keyof typeof categoryLabels] || category}
                      </h4>
                      <div className="h-px bg-border flex-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {features.map((feature) => (
                        <div key={feature.key} className="border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id={feature.key}
                              checked={selectedFeatures.has(feature.key)}
                              onCheckedChange={(checked) => 
                                handleFeatureToggle(feature.key, checked as boolean)
                              }
                              className="mt-1"
                            />
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="text-primary">
                                  {/* Icon placeholder - you can add actual icons later */}
                                  <div className="w-4 h-4 bg-primary/20 rounded"></div>
                                </div>
                                <Label
                                  htmlFor={feature.key}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {feature.name}
                                </Label>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={createPlanMutation.isPending || isUploadingImage} className="flex-1">
              {(createPlanMutation.isPending || isUploadingImage) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploadingImage ? 'Fazendo Upload...' : 'Criando Plano...'}
                </>
              ) : (
                'Criar Plano'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};