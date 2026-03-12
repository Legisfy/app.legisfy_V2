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
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      if (!cabinet?.cabinet_id) return;
      
      try {
        const { data, error } = await supabase
          .from('ia_integrations' as any)
          .select('*')
          .eq('gabinete_id', cabinet.cabinet_id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const config = data as any;
          setIntegrationId(config.id);
          setEnabled(config.whatsapp_enabled || false);
          setApiUrl(config.whatsapp_api_url || "");
          setApiKey(config.whatsapp_api_key || "");
          setInstanceName(config.whatsapp_instance_name || "");
          setProvider(config.whatsapp_provider || "evolution");
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
          .from('ia_integrations' as any)
          .update(payload)
          .eq('id', integrationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ia_integrations' as any)
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
      <CardContent className="p-6 space-y-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* QR Code Section */}
          <div className="w-full max-w-sm flex flex-col items-center p-8 bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
            
            <div className="w-48 h-48 bg-white p-3 rounded-xl flex items-center justify-center relative group shadow-lg">
              {enabled && apiUrl && apiKey ? (
                <QrCode className="h-full w-full text-zinc-900" />
              ) : (
                <div className="text-center space-y-2 opacity-40">
                  <QrCode className="h-24 w-24 text-zinc-400 mx-auto" />
                </div>
              )}
              
              {(!enabled || !apiUrl || !apiKey) && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 rounded-xl text-center">
                  <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-[10px] font-bold text-zinc-200 uppercase leading-tight">
                    Configure e salve <br /> para gerar o QR Code
                  </p>
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm font-black text-zinc-100 uppercase tracking-tighter">Status da Conexão</p>
              <div className="flex items-center gap-2 justify-center">
                <div className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  enabled ? "bg-green-500" : "bg-amber-500"
                )} />
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  enabled ? "text-green-500" : "text-amber-500"
                )}>
                  {enabled ? "Conectado / Pronto" : "Aguardando Configuração"}
                </span>
              </div>
            </div>

            <Button 
               variant="outline" 
               size="sm" 
               className="w-full h-10 rounded-xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Verificar Conexão em Tempo Real
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center max-w-md leading-relaxed">
            Abra o WhatsApp no seu celular, vá em **Aparelhos Conectados** e aponte a câmera para o código acima.
          </p>
        </div>

        {/* Advanced Settings */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="border border-border/40 rounded-xl overflow-hidden">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto hover:bg-muted/50 rounded-none">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Configurações Técnicas</span>
              </div>
              {showAdvanced ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 bg-muted/5 border-t border-border/40 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Provedor</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={provider === 'evolution' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setProvider('evolution')}
                    className="flex-1 h-8 text-[9px] font-bold"
                  >
                    Evolution API
                  </Button>
                  <Button 
                    variant={provider === 'zapi' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setProvider('zapi')}
                    className="flex-1 h-8 text-[9px] font-bold"
                  >
                    Z-API
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Instância</Label>
                <Input 
                  placeholder="gabinete-id" 
                  value={instanceName} 
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="h-8 text-[11px] bg-background" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">URL do Servidor</Label>
              <Input 
                placeholder="https://sua-api.com" 
                value={apiUrl} 
                onChange={(e) => setApiUrl(e.target.value)}
                className="h-8 text-[11px] bg-background" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Chave Secreta/Token</Label>
              <Input 
                type="password" 
                placeholder="Sua API Key" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                className="h-8 text-[11px] bg-background" 
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

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
