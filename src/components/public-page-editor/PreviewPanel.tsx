import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Smartphone, 
  Monitor, 
  User,
  MapPin,
  Briefcase,
  Instagram,
  MessageCircle,
  Globe,
  BarChart3,
  FileText,
  Send,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

interface PreviewPanelProps {
  formData: any;
  gabineteData: any;
  publicPage: any;
}

export const PreviewPanel = ({ formData, gabineteData, publicPage }: PreviewPanelProps) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testFormData, setTestFormData] = useState({
    name: '',
    whatsapp: '',
    message: ''
  });

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Form submitted:', testFormData);
  };

  const mockKpis = [
    { label: 'Eleitores', value: '1.2K', icon: User },
    { label: 'Demandas', value: '89', icon: FileText },
    { label: 'Indicações', value: '23', icon: BarChart3 },
    { label: 'Taxa Atendimento', value: '94%', icon: BarChart3 }
  ];

  const mockTimeline = [
    { date: '2024-01-15', action: 'Nova indicação protocolada', type: 'indicacao' },
    { date: '2024-01-14', action: 'Demanda resolvida no bairro Centro', type: 'demanda' },
    { date: '2024-01-12', action: '5 novos eleitores cadastrados', type: 'eleitor' }
  ];

  return (
    <div className="space-y-4">
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>
        <Badge variant="outline">Preview ao vivo</Badge>
      </div>

      {/* Preview Container */}
      <div className={`border rounded-lg bg-white overflow-auto transition-all duration-300 ${
        previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
      }`} style={{ maxHeight: '70vh' }}>
        
        {/* Validation Errors */}
        {(!formData.slug || formData.slug.length < 3) && (
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Configure um slug válido para visualizar a página</span>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6" style={{
          backgroundColor: formData.theme_mode === 'dark' ? '#1a1a1a' : '#ffffff',
          color: formData.theme_mode === 'dark' ? '#ffffff' : '#000000'
        }}>
          
          {/* Header */}
          <div className={`text-center space-y-4 ${
            formData.header_layout === 'wide' ? 'py-8 px-4 rounded-lg' : ''
          }`} style={{
            background: formData.header_layout === 'wide' 
              ? `linear-gradient(135deg, ${formData.primary_color}20, ${formData.secondary_color}20)`
              : 'transparent'
          }}>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{
              backgroundColor: formData.primary_color
            }}>
              <User className="h-8 w-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{gabineteData?.nome || 'Nome do Gabinete'}</h1>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>Vereador</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Cidade, UF</span>
              </div>
            </div>

            {/* Welcome Text */}
            {formData.welcome_text && (
              <p className="text-muted-foreground max-w-md mx-auto">
                {formData.welcome_text}
              </p>
            )}

            {/* Social Links */}
            <div className="flex justify-center gap-3">
              {formData.instagram && (
                <Button size="sm" variant="outline" className="gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Button>
              )}
              {formData.whatsapp && (
                <Button size="sm" variant="outline" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              )}
              {formData.site && (
                <Button size="sm" variant="outline" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Site
                </Button>
              )}
            </div>
          </div>

          {/* KPIs Section */}
          {formData.show_kpis && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Performance do Gabinete</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockKpis.map((kpi, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 text-center">
                      <kpi.icon className="h-8 w-8 mx-auto mb-2" style={{ color: formData.primary_color }} />
                      <div className="text-2xl font-bold">{kpi.value}</div>
                      <div className="text-sm text-muted-foreground">{kpi.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Section */}
          {formData.show_timeline && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Últimas Atualizações</h2>
              <div className="space-y-3">
                {mockTimeline.map((item, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: formData.secondary_color }}></div>
                    <div className="flex-1">
                      <p className="text-sm">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Section */}
          {formData.show_form && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">{formData.form_title}</h2>
                <p className="text-muted-foreground">{formData.form_description}</p>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleTestSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="preview-name">Nome *</Label>
                      <Input
                        id="preview-name"
                        value={testFormData.name}
                        onChange={(e) => setTestFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="preview-whatsapp">WhatsApp *</Label>
                      <Input
                        id="preview-whatsapp"
                        value={testFormData.whatsapp}
                        onChange={(e) => setTestFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="preview-message">Mensagem *</Label>
                      <Textarea
                        id="preview-message"
                        value={testFormData.message}
                        onChange={(e) => setTestFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Escreva sua mensagem..."
                        rows={4}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      style={{ backgroundColor: formData.primary_color }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      {formData.lgpd_text}
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};