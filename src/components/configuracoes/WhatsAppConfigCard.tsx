import { useState, useEffect } from "react";
import { MessageSquare, Settings2, Save, Loader2, Link2, ExternalLink, QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";

export const WhatsAppConfigCard = () => {
  const { cabinet } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [integrationId, setIntegrationId] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [provider, setProvider] = useState("evolution");

  useEffect(() => {
    const loadConfig = async () => {
      if (!cabinet?.cabinet_id) return;
      
      try {
        const { data, error } = await supabase
          .from('ia_integrations')
          .select('*')
          .eq('gabinete_id', cabinet.cabinet_id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIntegrationId(data.id);
          setEnabled(data.whatsapp_enabled || false);
          setApiUrl(data.whatsapp_api_url || "");
          setApiKey(data.whatsapp_api_key || "");
          setInstanceName(data.whatsapp_instance_name || "");
          setProvider(data.whatsapp_provider || "evolution");
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de WhatsApp:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [cabinet?.cabinet_id]);

  const handleSave = async () => {
    if (!cabinet?.cabinet_id) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        gabinete_id: cabinet.cabinet_id,
        whatsapp_enabled: enabled,
        whatsapp_api_url: apiUrl.trim(),
        whatsapp_api_key: apiKey.trim(),
        whatsapp_instance_name: instanceName.trim(),
        whatsapp_provider: provider,
        updated_at: new Date().toISOString(),
      };

      if (integrationId) {
        const { error } = await supabase
          .from('ia_integrations')
          .update(payload)
          .eq('id', integrationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ia_integrations')
          .insert([payload]);
        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de WhatsApp foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar configurações de WhatsApp:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-zinc-800/50 bg-card shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">WhatsApp Dedicado</CardTitle>
              <CardDescription className="text-xs">
                Conecte seu gabinete diretamente via Evolution API ou Z-API
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={enabled ? "success" : "secondary"} className="text-[10px] uppercase font-bold">
              {enabled ? "Ativo" : "Inativo"}
            </Badge>
            <Switch 
              checked={enabled} 
              onCheckedChange={setEnabled}
              className="scale-75"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Provedor de API</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={provider === 'evolution' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setProvider('evolution')}
                  className="text-xs h-8"
                >
                  Evolution API
                </Button>
                <Button 
                  variant={provider === 'zapi' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setProvider('zapi')}
                  className="text-xs h-8"
                >
                  Z-API
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">URL da API</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                <Input
                  placeholder="https://api.sua-instancia.com"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">API Key / Token</Label>
              <Input
                type="password"
                placeholder="Seu token de acesso"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome da Instância</Label>
              <Input
                placeholder="Ex: gabinete-vanderlei"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-[#0a0a0a] border border-zinc-800/50 rounded-xl space-y-4">
            <div className="w-32 h-32 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center relative group">
              <QrCode className="h-16 w-16 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <p className="text-[10px] font-bold text-white uppercase text-center px-2">
                  Salve as configurações para gerar o QR Code
                </p>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-zinc-200 uppercase tracking-tight">Status da Conexão</p>
              <div className="flex items-center gap-1.5 justify-center">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] text-amber-500 font-bold uppercase">Aguardando Configuração</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full text-[10px] font-bold h-8 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400">
              <ExternalLink className="h-3 w-3 mr-2" />
              Testar Conexão
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground max-w-md">
            <CheckCircle2 className="h-3 w-3 inline mr-1 text-primary" />
            Ao conectar o WhatsApp, o **Assessor IA** e as **Campanhas** utilizarão este número para interagir com os eleitores.
          </p>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="h-9 px-6 text-xs font-bold"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
