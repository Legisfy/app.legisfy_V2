import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// CONFIGURAÇÃO GLOBAL DA EVOLUTION API (VPS)
const EVO_API_URL = Deno.env.get('EVOLUTION_API_URL') || '';
const EVO_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const { action, gabineteId } = await req.json();
    if (!gabineteId) throw new Error('ID do gabinete é obrigatório');

    // 1. Verificar se o usuário tem acesso ao gabinete
    const supabaseUser = createClient(supabaseUrl, authHeader, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error('Sessão inválida');

    const { data: access } = await supabase
      .from('gabinete_usuarios')
      .select('cabinet_id')
      .eq('user_id', user.id)
      .eq('cabinet_id', gabineteId)
      .maybeSingle();

    if (!access && user.email !== 'admin@legisfy.app.br') { // Permitir admin global
        throw new Error('Sem permissão para este gabinete');
    }

    const instanceName = `gabinete-${gabineteId.split('-')[0]}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook`;

    if (action === 'get-status' || action === 'connect') {
      // 1. Tentar buscar status da instância na Evolution
      const statusRes = await fetch(`${EVO_API_URL}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': EVO_API_KEY }
      });

      let instanceExists = statusRes.ok;
      let connectionState = 'NOT_FOUND';

      if (instanceExists) {
        const statusData = await statusRes.json();
        connectionState = statusData.instance?.state || 'DISCONNECTED';
      }

      // 2. Se não existir, criar instância
      if (connectionState === 'NOT_FOUND' || !instanceExists) {
        console.log(`Criando instância ${instanceName}...`);
        const createRes = await fetch(`${EVO_API_URL}/instance/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVO_API_KEY },
          body: JSON.stringify({
            instanceName: instanceName,
            token: gabineteId, // Usando o ID do gabinete como token da instância
            qrcode: true
          })
        });

        if (!createRes.ok) throw new Error('Falha ao criar instância na Evolution API');
        connectionState = 'DISCONNECTED';
      }

      // 3. Configurar Webhook (Sempre garantir que está certo)
      console.log(`Configurando webhook para ${instanceName}...`);
      await fetch(`${EVO_API_URL}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_API_KEY },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          webhook_by_events: true,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
        })
      });

      // 4. Salvar/Atualizar config no banco
      await supabase.from('ia_integrations' as any).upsert({
        gabinete_id: gabineteId,
        whatsapp_enabled: true,
        whatsapp_instance_name: instanceName,
        whatsapp_api_url: EVO_API_URL,
        whatsapp_api_key: EVO_API_KEY,
        updated_at: new Date().toISOString()
      }, { onConflict: 'gabinete_id' });

      // 5. Pegar QR Code se estiver desconectado
      if (connectionState !== 'open' && connectionState !== 'CONNECTED') {
        const qrRes = await fetch(`${EVO_API_URL}/instance/connect/${instanceName}`, {
          headers: { 'apikey': EVO_API_KEY }
        });
        const qrData = await qrRes.json();
        return new Response(JSON.stringify({ 
          status: connectionState, 
          qrcode: qrData.base64 || qrData.code,
          instanceName 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      return new Response(JSON.stringify({ status: connectionState, instanceName }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'logout') {
        await fetch(`${EVO_API_URL}/instance/logout/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': EVO_API_KEY }
        });
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error('Ação inválida');

  } catch (error) {
    console.error('Erro no manage-whatsapp:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
