import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Palette, Upload, Monitor, Sun, Moon } from "lucide-react";

interface AppearanceTabProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export const AppearanceTab = ({ formData, onFormChange }: AppearanceTabProps) => {
  const colorPresets = [
    { name: 'Azul', primary: '#2563eb', secondary: '#3b82f6' },
    { name: 'Roxo', primary: '#7c3aed', secondary: '#8b5cf6' },
    { name: 'Verde', primary: '#059669', secondary: '#10b981' },
    { name: 'Rosa', primary: '#db2777', secondary: '#ec4899' },
    { name: 'Laranja', primary: '#ea580c', secondary: '#f97316' }
  ];

  const applyPreset = (preset: typeof colorPresets[0]) => {
    onFormChange('primary_color', preset.primary);
    onFormChange('secondary_color', preset.secondary);
  };

  return (
    <div className="space-y-6">
      {/* Cores do Tema */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Cores do Tema
        </Label>
        
        {/* Presets de Cores */}
        <div className="space-y-3">
          <Label className="text-sm">Presets Rápidos</Label>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-2"
              >
                <div className="flex gap-1">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Cores Personalizadas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Cor Primária</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) => onFormChange('primary_color', e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.primary_color}
                onChange={(e) => onFormChange('primary_color', e.target.value)}
                className="flex-1 font-mono"
                placeholder="#2563eb"
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
                onChange={(e) => onFormChange('secondary_color', e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.secondary_color}
                onChange={(e) => onFormChange('secondary_color', e.target.value)}
                className="flex-1 font-mono"
                placeholder="#10b981"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modo do Tema */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Modo do Tema</Label>
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            {formData.theme_mode === 'light' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-500" />
            )}
            <Label htmlFor="theme_mode" className="text-sm font-medium">
              {formData.theme_mode === 'light' ? 'Modo Claro' : 'Modo Escuro'}
            </Label>
          </div>
          <Switch
            id="theme_mode"
            checked={formData.theme_mode === 'dark'}
            onCheckedChange={(checked) => onFormChange('theme_mode', checked ? 'dark' : 'light')}
          />
        </div>
      </div>

      {/* Fonte */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Família da Fonte</Label>
        <Select 
          value={formData.font_family} 
          onValueChange={(value) => onFormChange('font_family', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">Sistema (padrão)</SelectItem>
            <SelectItem value="inter">Inter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Layout do Header */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Layout do Header</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={formData.header_layout === 'compact' ? 'default' : 'outline'}
            className="h-auto p-3 flex-col gap-2"
            onClick={() => onFormChange('header_layout', 'compact')}
          >
            <div className="w-full h-8 bg-muted rounded flex items-center justify-center">
              <div className="w-6 h-6 bg-primary/20 rounded"></div>
            </div>
            <span className="text-xs">Compacto</span>
          </Button>
          
          <Button
            variant={formData.header_layout === 'wide' ? 'default' : 'outline'}
            className="h-auto p-3 flex-col gap-2"
            onClick={() => onFormChange('header_layout', 'wide')}
          >
            <div className="w-full h-12 bg-gradient-to-r from-primary/20 to-secondary/20 rounded flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded"></div>
            </div>
            <span className="text-xs">Amplo</span>
          </Button>
        </div>
      </div>

      {/* Upload de Imagens */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Imagens Personalizadas</Label>
        
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Imagem de Capa (16:9)
            <Badge variant="secondary" className="ml-2">Em breve</Badge>
          </Button>
          
          <Button variant="outline" className="w-full justify-start" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Logo Personalizado
            <Badge variant="secondary" className="ml-2">Em breve</Badge>
          </Button>
        </div>
      </div>
    </div>
  );
};