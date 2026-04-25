import { 
  Facebook, Instagram, Loader2, Save, AlertCircle, Check, 
  ExternalLink, LogOut, Settings2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

export const SocialMediaConfigCard = () => {
  const { cabinet } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Facebook State
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  
  // Instagram State
  const [instagramEnabled, setInstagramEnabled] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  
  const [integrationId, setIntegrationId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!cabinet?.cabinet_id) return;
      
      try {
        const { data: configData } = await supabase
          .from('ia_integrations' as any)
          .select('*')
          .eq('gabinete_id', cabinet.cabinet_id)
          .maybeSingle();

        if (configData) {
          const config = configData as any;
          setIntegrationId(config.id);
          setFacebookEnabled(config.facebook_enabled || false);
          setInstagramEnabled(config.instagram_enabled || false);
          setFacebookConnected(!!config.meta_access_token);
          setInstagramConnected(!!config.meta_access_token && !!config.meta_instagram_id);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de redes sociais:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [cabinet?.cabinet_id]);

  const handleConnect = async (platform: 'facebook' | 'instagram') => {
    if (!cabinet?.cabinet_id) {
      toast.error("Gabinete não identificado.");
      return;
    }

    // Configurações da Meta (Buscando de variáveis de ambiente)
    const META_APP_ID = import.meta.env.VITE_META_APP_ID || "SEU_APP_ID_AQUI"; 
    const REDIRECT_URI = encodeURIComponent("https://wvvxstgpjodmfxpekhkf.supabase.co/functions/v1/meta-oauth-handler");
    const SCOPES = "pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,pages_manage_metadata,public_profile";

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&state=${cabinet.cabinet_id}&scope=${SCOPES}`;
    
    toast.info(`Redirecionando para o Facebook para conectar seu ${platform}...`);
    
    setTimeout(() => {
      window.location.href = authUrl;
    }, 1000);
  };

  const handleDisconnect = async (platform: 'facebook' | 'instagram') => {
    if (platform === 'facebook') {
        setFacebookConnected(false);
        setFacebookEnabled(false);
    } else {
        setInstagramConnected(false);
        setInstagramEnabled(false);
    }
    toast.success(`${platform === 'facebook' ? 'Facebook' : 'Instagram'} desconectado.`);
  };

  const handleSave = async () => {
    if (!cabinet?.cabinet_id) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        gabinete_id: cabinet.cabinet_id,
        facebook_enabled: facebookEnabled,
        instagram_enabled: instagramEnabled,
        updated_at: new Date().toISOString(),
      };

      // Se estiver "conectado" na UI, simulamos os tokens no banco
      if (facebookConnected) {
        payload.meta_access_token = "simulated_token_123";
        payload.meta_page_id = "simulated_page_id";
      } else {
        payload.meta_access_token = null;
        payload.meta_page_id = null;
      }

      if (instagramConnected) {
        payload.meta_instagram_id = "simulated_insta_id";
      } else {
        payload.meta_instagram_id = null;
      }

      if (integrationId) {
        await supabase.from('ia_integrations' as any).update(payload).eq('id', integrationId);
      } else {
        await supabase.from('ia_integrations' as any).insert([payload]);
      }

      toast.success("Configurações de redes sociais atualizadas!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border border-zinc-800/50 bg-card shadow-sm overflow-hidden animate-in fade-in duration-500">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Esquerda: Visual */}
          <div className="md:w-56 bg-zinc-900/50 border-r border-border/50 p-6 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Settings2 className="h-3 w-3 text-blue-400" />
                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Conexões Meta</span>
              </div>
              <h3 className="text-lg font-extrabold text-zinc-200 tracking-tight leading-tight">
                Redes <span className="text-zinc-400">Sociais</span>
              </h3>
              <p className="text-zinc-500 text-[10px] leading-relaxed">
                Integre seu Facebook e Instagram para centralizar métricas e insights no dashboard.
              </p>
            </div>

            <div className="mt-8 flex justify-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <div className="flex -space-x-3">
                  <div className="bg-blue-600 p-3 rounded-xl shadow-lg relative z-10">
                    <Facebook className="h-6 w-6 text-white" />
                  </div>
                  <div className="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-3 rounded-xl shadow-lg relative z-20">
                    <Instagram className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direita: Configurações */}
          <div className="flex-1 p-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Facebook Card */}
              <div className={cn(
                "p-4 rounded-xl border transition-all duration-300",
                facebookConnected ? "bg-blue-500/5 border-blue-500/20" : "bg-zinc-900/20 border-zinc-800/50"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      facebookConnected ? "bg-blue-600 shadow-lg shadow-blue-500/20" : "bg-zinc-800"
                    )}>
                      <Facebook className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Facebook</p>
                      <p className="text-[9px] text-zinc-500">{facebookConnected ? "Página Vinculada" : "Não conectado"}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={facebookEnabled} 
                    onCheckedChange={setFacebookEnabled}
                    disabled={!facebookConnected}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
                
                {facebookConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-green-500/10 border border-green-500/20 rounded-md">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-[9px] font-medium text-green-400 uppercase tracking-tighter">Conexão Ativa</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDisconnect('facebook')}
                      className="w-full h-8 text-[9px] text-zinc-500 hover:text-red-400 hover:bg-red-400/5 font-bold uppercase"
                    >
                      <LogOut className="h-3 w-3 mr-2" /> Desconectar
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleConnect('facebook')}
                    className="w-full h-9 text-[10px] font-bold uppercase border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
                  >
                    <ExternalLink className="h-3 w-3 mr-2" /> Conectar Facebook
                  </Button>
                )}
              </div>

              {/* Instagram Card */}
              <div className={cn(
                "p-4 rounded-xl border transition-all duration-300",
                instagramConnected ? "bg-pink-500/5 border-pink-500/20" : "bg-zinc-900/20 border-zinc-800/50"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      instagramConnected ? "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-lg shadow-pink-500/20" : "bg-zinc-800"
                    )}>
                      <Instagram className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Instagram</p>
                      <p className="text-[9px] text-zinc-500">{instagramConnected ? "Perfil Profissional" : "Não conectado"}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={instagramEnabled} 
                    onCheckedChange={setInstagramEnabled}
                    disabled={!instagramConnected}
                    className="data-[state=checked]:bg-pink-500"
                  />
                </div>

                {instagramConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-green-500/10 border border-green-500/20 rounded-md">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-[9px] font-medium text-green-400 uppercase tracking-tighter">Conexão Ativa</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDisconnect('instagram')}
                      className="w-full h-8 text-[9px] text-zinc-500 hover:text-red-400 hover:bg-red-400/5 font-bold uppercase"
                    >
                      <LogOut className="h-3 w-3 mr-2" /> Desconectar
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleConnect('instagram')}
                    className="w-full h-9 text-[10px] font-bold uppercase border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
                  >
                    <ExternalLink className="h-3 w-3 mr-2" /> Conectar Instagram
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-zinc-900/40 p-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                <b>Nota:</b> Para o Instagram, é necessário que sua conta seja um <b>Perfil Profissional</b> vinculado a uma página no Facebook.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="h-9 px-6 text-[11px] font-bold rounded-lg shadow-lg shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                Salvar Configurações
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
