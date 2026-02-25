import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Image, Upload, Palette, Type, Eye } from 'lucide-react';

interface SubscriptionPageConfig {
  id: string;
  banner_image_url?: string;
  headline: string;
  subtitle: string;
  background_color: string;
  primary_color: string;
  accent_color: string;
}

export const SubscriptionPageConfig = () => {
  const [formData, setFormData] = useState({
    banner_image_url: '',
    headline: 'Escolha seu Plano',
    subtitle: 'Transforme seu gabinete com as ferramentas mais avançadas da política moderna',
    background_color: '#1e293b',
    primary_color: '#3b82f6',
    accent_color: '#fbbf24',
    use_banner: true,
  });
  
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch current config
  const { data: config, isLoading } = useQuery({
    queryKey: ['subscription-page-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_page_config')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data as SubscriptionPageConfig;
    },
  });

  // Initialize form with config data
  useEffect(() => {
    if (config) {
      setFormData({
        banner_image_url: config.banner_image_url || '',
        headline: config.headline,
        subtitle: config.subtitle,
        background_color: config.background_color,
        primary_color: config.primary_color,
        accent_color: config.accent_color,
        use_banner: !!config.banner_image_url,
      });
    }
  }, [config]);

  // Upload banner image function
  const uploadBannerImage = async (file: File): Promise<string> => {
    const fileName = `subscription-banner-${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('subscription-assets')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('subscription-assets')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      let bannerImageUrl = formData.banner_image_url;
      
      // Upload banner image if file is selected
      if (bannerImageFile) {
        setIsUploadingImage(true);
        try {
          bannerImageUrl = await uploadBannerImage(bannerImageFile);
        } catch (error) {
          setIsUploadingImage(false);
          throw new Error('Erro ao fazer upload da imagem do banner');
        }
        setIsUploadingImage(false);
      }

      const configData = {
        banner_image_url: formData.use_banner ? (bannerImageUrl || null) : null,
        headline: formData.headline,
        subtitle: formData.subtitle,
        background_color: formData.background_color,
        primary_color: formData.primary_color,
        accent_color: formData.accent_color,
      };

      if (config?.id) {
        // Update existing config
        const { error } = await supabase
          .from('subscription_page_config')
          .update(configData)
          .eq('id', config.id);
        
        if (error) throw error;
      } else {
        // Create new config
        const { error } = await supabase
          .from('subscription_page_config')
          .insert(configData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Configuração salva",
        description: "As configurações da página de assinatura foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-page-config'] });
      setBannerImageFile(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImageFile(file);
      // Clear URL field when file is selected
      setFormData({ ...formData, banner_image_url: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfigMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Configuração da Página de Assinatura
        </CardTitle>
        <CardDescription>
          Configure a aparência e conteúdo da página de assinatura onde os usuários escolhem seus planos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-4 w-4" />
              <h4 className="font-semibold">Conteúdo</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Título Principal</Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="Escolha seu Plano"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Transforme seu gabinete com as ferramentas mais avançadas da política moderna"
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Display Mode Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Image className="h-4 w-4" />
              <h4 className="font-semibold">Configuração Visual</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="use_banner"
                  name="display_mode"
                  checked={formData.use_banner}
                  onChange={() => setFormData({ ...formData, use_banner: true })}
                  className="h-4 w-4"
                />
                <Label htmlFor="use_banner">Usar Imagem de Banner</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="use_gradient"
                  name="display_mode"
                  checked={!formData.use_banner}
                  onChange={() => setFormData({ ...formData, use_banner: false })}
                  className="h-4 w-4"
                />
                <Label htmlFor="use_gradient">Usar Gradiente de Cores</Label>
              </div>
            </div>
          </div>

          {/* Banner Image Configuration */}
          {formData.use_banner && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Image className="h-4 w-4" />
                <h4 className="font-semibold">Imagem do Banner</h4>
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="banner_image_file">Upload de Arquivo</Label>
                    <div className="relative">
                      <Input
                        id="banner_image_file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <Upload className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Dimensões recomendadas:</strong> 1920x600px (proporção 16:5)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tamanho máximo: 5MB | Formatos: JPG, PNG, WEBP
                    </p>
                    {bannerImageFile && (
                      <p className="text-xs text-green-600">
                        Arquivo selecionado: {bannerImageFile.name}
                      </p>
                    )}
                  </div>
              
              {/* URL Alternative */}
              <div className="space-y-2">
                <Label htmlFor="banner_image_url">Ou URL da Imagem</Label>
                <Input
                  id="banner_image_url"
                  value={formData.banner_image_url}
                  onChange={(e) => {
                    setFormData({ ...formData, banner_image_url: e.target.value });
                    if (e.target.value) setBannerImageFile(null);
                  }}
                  placeholder="https://exemplo.com/banner.jpg"
                  type="url"
                  disabled={!!bannerImageFile}
                />
                </div>
              </div>
            </div>
          )}

          {/* Color Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4" />
              <h4 className="font-semibold">Cores</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="background_color">Cor de Fundo do Banner</Label>
                <div className="flex gap-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    placeholder="#1e293b"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_color">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent_color">Cor de Destaque</Label>
                <div className="flex gap-2">
                  <Input
                    id="accent_color"
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    placeholder="#fbbf24"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4" />
              <h4 className="font-semibold">Preview</h4>
            </div>
            
            <div 
              className="rounded-lg p-8 text-center text-white relative overflow-hidden"
              style={{
                background: formData.use_banner && (formData.banner_image_url || bannerImageFile)
                  ? `url(${formData.banner_image_url || (bannerImageFile ? URL.createObjectURL(bannerImageFile) : '')}) center/cover`
                  : `linear-gradient(135deg, ${formData.background_color}, ${formData.primary_color})`
              }}
            >
              {!formData.use_banner && (
                <>
                  <h1 className="text-2xl font-bold mb-2">
                    {formData.headline} <span style={{ color: formData.accent_color }}>Plano</span>
                  </h1>
                  <p className="text-sm opacity-90">
                    {formData.subtitle}
                  </p>
                </>
              )}
              {formData.use_banner && (formData.banner_image_url || bannerImageFile) && (
                <div className="text-xs opacity-70 mt-4">
                  Preview da imagem de banner
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={updateConfigMutation.isPending || isUploadingImage}
            className="w-full"
          >
            {(updateConfigMutation.isPending || isUploadingImage) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploadingImage ? 'Fazendo Upload...' : 'Salvando...'}
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};