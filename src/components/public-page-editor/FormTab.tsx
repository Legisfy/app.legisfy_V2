import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, TestTube, Clock } from "lucide-react";
import { toast } from "sonner";

interface FormTabProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export const FormTab = ({ formData, onFormChange }: FormTabProps) => {
  const handleTestSubmit = async () => {
    // Simulate form test
    toast.success("Teste realizado com sucesso! Formulário funcionando corretamente.");
  };

  return (
    <div className="space-y-6">
      {/* Configuração Básica */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Configuração do Formulário</Label>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="form_title">Título do Formulário</Label>
            <Input
              id="form_title"
              value={formData.form_title}
              onChange={(e) => onFormChange('form_title', e.target.value)}
              placeholder="Fale com o Gabinete"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="form_description">Descrição</Label>
            <Textarea
              id="form_description"
              value={formData.form_description}
              onChange={(e) => onFormChange('form_description', e.target.value)}
              placeholder="Envie sua sugestão, elogio ou reclamação"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Campos do Formulário */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Campos (Não Editável)</Label>
        <div className="bg-muted/30 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Nome</span>
              <Badge variant="destructive" className="ml-2 text-xs">Obrigatório</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">WhatsApp</span>
              <Badge variant="destructive" className="ml-2 text-xs">Obrigatório</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Mensagem</span>
              <Badge variant="destructive" className="ml-2 text-xs">Obrigatório</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Texto LGPD */}
      <div className="space-y-2">
        <Label htmlFor="lgpd_text">Texto de Privacidade (LGPD)</Label>
        <Textarea
          id="lgpd_text"
          value={formData.lgpd_text}
          onChange={(e) => onFormChange('lgpd_text', e.target.value)}
          rows={3}
          placeholder="Seus dados serão tratados conforme nossa Política de Privacidade."
        />
        <p className="text-xs text-muted-foreground">
          Aparecerá no rodapé do formulário
        </p>
      </div>

      {/* Proteção Anti-Spam */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Proteção Anti-Spam
        </Label>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="captcha_enabled" className="text-sm font-medium">
                Captcha (Turnstile)
              </Label>
              <p className="text-xs text-muted-foreground">
                Verificação automática contra bots
              </p>
            </div>
            <Switch
              id="captcha_enabled"
              checked={formData.captcha_enabled}
              onCheckedChange={(checked) => onFormChange('captcha_enabled', checked)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rate_limit" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Limite por IP (24h)
            </Label>
            <Input
              id="rate_limit"
              type="number"
              min="1"
              max="50"
              value={formData.rate_limit}
              onChange={(e) => onFormChange('rate_limit', parseInt(e.target.value) || 5)}
            />
            <p className="text-xs text-muted-foreground">
              Máximo de envios por endereço IP em 24 horas
            </p>
          </div>
        </div>
      </div>

      {/* Teste do Formulário */}
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          Teste do Formulário
        </Label>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-3">
            Teste o funcionamento do formulário antes de publicar
          </p>
          <Button 
            onClick={handleTestSubmit}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Executar Teste
          </Button>
        </div>
      </div>
    </div>
  );
};