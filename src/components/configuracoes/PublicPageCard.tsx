import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePublicPage } from "@/hooks/usePublicPage";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { useState } from "react";
import { 
  Globe, 
  Eye, 
  EyeOff, 
  Share2, 
  Instagram, 
  MessageCircle,
  Palette,
  Settings
} from "lucide-react";
import { toast } from "sonner";

export const PublicPageCard = () => {
  const { publicPage, loading, createPublicPage, updatePublicPage, publishPage, hidePage } = usePublicPage();
  const { gabineteData } = useGabineteConfig();
  const [formData, setFormData] = useState({
    welcome_text: '',
    instagram: '',
    whatsapp: '',
    site: '',
    primary_color: '#5B6BFF',
    secondary_color: '#8A5BFF',
    show_kpis: true,
    show_timeline: true,
    show_form: true
  });

  // Atualizar form quando carregar a página
  useState(() => {
    if (publicPage) {
      setFormData({
        welcome_text: publicPage.welcome_text || '',
        instagram: publicPage.links?.instagram || '',
        whatsapp: publicPage.links?.whatsapp || '',
        site: publicPage.links?.site || '',
        primary_color: publicPage.theme?.primary || '#5B6BFF',
        secondary_color: publicPage.theme?.secondary || '#8A5BFF',
        show_kpis: publicPage.show_sections?.kpis || true,
        show_timeline: publicPage.show_sections?.timeline || true,
        show_form: publicPage.show_sections?.form || true
      });
    }
  });

  const handleCreatePage = async () => {
    if (!gabineteData?.nome) {
      toast.error('Nome do gabinete não encontrado');
      return;
    }
    await createPublicPage(gabineteData.nome);
  };

  const handleSaveChanges = async () => {
    const updates = {
      welcome_text: formData.welcome_text,
      theme: {
        primary: formData.primary_color,
        secondary: formData.secondary_color,
        mode: 'light' as const
      },
      links: {
        instagram: formData.instagram,
        whatsapp: formData.whatsapp,
        site: formData.site
      },
      show_sections: {
        kpis: formData.show_kpis,
        timeline: formData.show_timeline,
        form: formData.show_form
      }
    };
    
    await updatePublicPage(updates);
  };

  const handlePublish = async () => {
    await publishPage();
  };

  const handleHide = async () => {
    await hidePage();
  };

  const copyPageUrl = () => {
    if (publicPage) {
      const url = `${window.location.origin}/p/${publicPage.slug}`;
      navigator.clipboard.writeText(url);
      toast.success('URL copiada para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!publicPage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Builder
          </CardTitle>
          <CardDescription>
            Construa landing pages e formulários conectados ao seu gabinete para capturar eleitores, demandas e indicações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">
              Você ainda não possui nenhuma landing page criada
            </div>
            <Button onClick={handleCreatePage} className="w-full">
              <Globe className="h-4 w-4 mr-2" />
              Criar Landing Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle>Builder</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={publicPage.status === 'published' ? 'default' : 'secondary'}>
              {publicPage.status === 'published' ? 'Publicada' : 
               publicPage.status === 'draft' ? 'Rascunho' : 'Oculta'}
            </Badge>
            {publicPage.status === 'published' && (
              <Button variant="outline" size="sm" onClick={copyPageUrl}>
                <Share2 className="h-4 w-4 mr-1" />
                Copiar URL
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          URL: /p/{publicPage.slug}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Texto de Boas-vindas */}
        <div className="space-y-2">
          <Label htmlFor="welcome_text">Texto de Boas-vindas</Label>
          <Textarea
            id="welcome_text"
            placeholder="Bem-vindo à página oficial do gabinete..."
            value={formData.welcome_text}
            onChange={(e) => setFormData({...formData, welcome_text: e.target.value})}
            maxLength={140}
          />
          <div className="text-xs text-muted-foreground text-right">
            {formData.welcome_text.length}/140 caracteres
          </div>
        </div>

        {/* Links Sociais */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Label className="text-sm font-medium">Links Sociais</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-1">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram"
                placeholder="@usuario"
                value={formData.instagram}
                onChange={(e) => setFormData({...formData, instagram: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                placeholder="(11) 99999-9999"
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                placeholder="https://..."
                value={formData.site}
                onChange={(e) => setFormData({...formData, site: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Cores do Tema */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <Label className="text-sm font-medium">Cores do Tema</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seções Visíveis */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Seções Visíveis</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show_kpis" className="text-sm">KPIs de Performance</Label>
              <Switch
                id="show_kpis"
                checked={formData.show_kpis}
                onCheckedChange={(checked) => setFormData({...formData, show_kpis: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show_timeline" className="text-sm">Timeline de Atualizações</Label>
              <Switch
                id="show_timeline"
                checked={formData.show_timeline}
                onCheckedChange={(checked) => setFormData({...formData, show_timeline: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show_form" className="text-sm">Formulário do Cidadão</Label>
              <Switch
                id="show_form"
                checked={formData.show_form}
                onCheckedChange={(checked) => setFormData({...formData, show_form: checked})}
              />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button onClick={handleSaveChanges} className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
          
          {publicPage.status === 'published' ? (
            <Button variant="outline" onClick={handleHide}>
              <EyeOff className="h-4 w-4 mr-2" />
              Ocultar
            </Button>
          ) : (
            <Button variant="outline" onClick={handlePublish}>
              <Eye className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
