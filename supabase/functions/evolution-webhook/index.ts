import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📨 Webhook Evolution API recebido:', JSON.stringify(body, null, 2));

    // A Evolution API envia o evento no campo "event"
    const { event, instance, data } = body;

    if (event !== 'MESSAGES_UPSERT') {
      return new Response(JSON.stringify({ message: 'Evento não processado' }), { status: 200 });
    }

    // Se a mensagem for enviada pelo próprio bot, ignorar para evitar loop
    if (data.key.fromMe) {
      return new Response(JSON.stringify({ message: 'Mensagem do bot ignorada' }), { status: 200 });
    }

    const remoteJid = data.key.remoteJid;
    const phone = remoteJid.split('@')[0]; // Formato E.164 (ex: 5511999999999)
    const messageText = data.message?.conversation || data.message?.extendedTextMessage?.text;

    if (!messageText) {
      return new Response(JSON.stringify({ message: 'Sem conteúdo de texto' }), { status: 200 });
    }

    // 1. Resolver Gabinete através da Instância
    const { data: config, error: configError } = await supabase
      .from('ia_integrations' as any)
      .select('*, me_assessor_ia:gabinete_id(nome, comportamento)')
      .eq('whatsapp_instance_name', instance)
      .eq('whatsapp_enabled', true)
      .maybeSingle();

    if (configError || !config) {
      console.error('❌ Gabinete não encontrado ou WhatsApp desativado para a instância:', instance);
      return new Response(JSON.stringify({ error: 'Gabinete não configurado' }), { status: 404 });
    }

    const gabineteId = config.gabinete_id;
    const { whatsapp_api_url, whatsapp_api_key } = config;

    // 2. Identificar Usuário (Membro do Gabinete ou Eleitor)
    let userType = 'eleitor';
    let userData = null;

    // Tentar encontrar nos membros do gabinete (via profiles e gabinete_usuarios)
    const { data: memberProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name, main_role')
      .or(`whatsapp.eq.${phone},whatsapp.eq.+${phone}`)
      .maybeSingle();

    if (memberProfile) {
      const { data: cabinetAccess } = await supabase
        .from('gabinete_usuarios')
        .select('role')
        .eq('user_id', memberProfile.user_id)
        .eq('gabinete_id', gabineteId)
        .eq('ativo', true)
        .maybeSingle();

      if (cabinetAccess) {
        userType = 'membro';
        userData = {
          id: memberProfile.user_id,
          nome: memberProfile.full_name,
          cargo: cabinetAccess.role
        };
      }
    }

    if (!userData) {
      // Tentar encontrar nos eleitores
      const { data: eleitor } = await supabase
        .from('eleitores_whatsapp')
        .select('*')
        .eq('telefone', phone)
        .eq('gabinete_id', gabineteId)
        .maybeSingle();
      
      if (eleitor) {
        userData = eleitor;
      }
    }

    console.log(`👤 Usuário identificado: ${userType} - ${userData?.nome || 'Desconhecido'} (${phone})`);

    // 3. Processar com IA (Chamando a lógica de whatsapp-ai-actions ou chat-with-ai)
    // Para simplificar e manter o contexto/ações, vamos usar a whatsapp-ai-actions
    const aiActionResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-ai-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        userText: messageText,
        userId: userData?.id || phone,
        userName: userData?.nome || 'Cidadão',
        gabineteId: gabineteId,
        userRole: userType === 'membro' ? userData?.cargo || 'assessor' : 'eleitor'
      })
    });

    if (!aiActionResponse.ok) {
      throw new Error(`Erro ao chamar whatsapp-ai-actions: ${aiActionResponse.statusText}`);
    }

    const aiResult = await aiActionResponse.json();
    const responseText = aiResult.message;

    // 4. Enviar Resposta via Evolution API
    const sendResponse = await fetch(`${whatsapp_api_url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': whatsapp_api_key
      },
      body: JSON.stringify({
        number: phone,
        text: responseText,
        delay: 1200,
        linkPreview: true
      })
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error('❌ Erro ao enviar mensagem para Evolution API:', errorText);
    } else {
      console.log('✅ Mensagem enviada com sucesso para:', phone);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (error) {
    console.error('❌ Erro no webhook evolution:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
