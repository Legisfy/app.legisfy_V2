import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Instagram, MessageCircle, Globe, User, MapPin, Briefcase } from "lucide-react";

interface ContentTabProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  gabineteData: any;
}

export const ContentTab = ({ formData, onFormChange, gabineteData }: ContentTabProps) => {
  return (
    <div className="space-y-6">
      {/* Informações do Gabinete (Read-only) */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Informações do Gabinete</Label>
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{gabineteData?.nome || 'Nome do Gabinete'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span>Vereador</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Cidade, UF</span>
          </div>
        </div>
      </div>

      {/* Texto de Boas-vindas */}
      <div className="space-y-2">
        <Label htmlFor="welcome_text">Texto de Boas-vindas</Label>
        <Textarea
          id="welcome_text"
          placeholder="Bem-vindo à página oficial do gabinete..."
          value={formData.welcome_text}
          onChange={(e) => onFormChange('welcome_text', e.target.value)}
          maxLength={140}
          rows={3}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Aparecerá logo abaixo das informações básicas
          </p>
          <span className="text-xs text-muted-foreground">
            {formData.welcome_text.length}/140
          </span>
        </div>
      </div>

      {/* Links Sociais */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Links Sociais</Label>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              Instagram
            </Label>
            <Input
              id="instagram"
              placeholder="@usuario"
              value={formData.instagram}
              onChange={(e) => onFormChange('instagram', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-500" />
              WhatsApp
            </Label>
            <Input
              id="whatsapp"
              placeholder="(11) 99999-9999"
              value={formData.whatsapp}
              onChange={(e) => onFormChange('whatsapp', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="site" className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              Site
            </Label>
            <Input
              id="site"
              placeholder="https://..."
              value={formData.site}
              onChange={(e) => onFormChange('site', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Seções Visíveis */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Seções Visíveis</Label>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="show_kpis" className="text-sm font-medium">
                KPIs de Performance
              </Label>
              <p className="text-xs text-muted-foreground">
                Indicadores de produtividade do gabinete
              </p>
            </div>
            <Switch
              id="show_kpis"
              checked={formData.show_kpis}
              onCheckedChange={(checked) => onFormChange('show_kpis', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="show_timeline" className="text-sm font-medium">
                Timeline de Atualizações
              </Label>
              <p className="text-xs text-muted-foreground">
                Últimas ações e atividades
              </p>
            </div>
            <Switch
              id="show_timeline"
              checked={formData.show_timeline}
              onCheckedChange={(checked) => onFormChange('show_timeline', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="show_form" className="text-sm font-medium">
                Formulário do Cidadão
              </Label>
              <p className="text-xs text-muted-foreground">
                Canal de participação popular
              </p>
            </div>
            <Switch
              id="show_form"
              checked={formData.show_form}
              onCheckedChange={(checked) => onFormChange('show_form', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};