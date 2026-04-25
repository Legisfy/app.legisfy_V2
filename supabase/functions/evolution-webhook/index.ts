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
    const { event, instance, data } = body;
    console.log(`📨 Evento: ${event}, Instância: ${instance}`);

    // Verificar se o evento é de mensagens (Evolution v2 usa "messages.upsert")
    if (event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
      return new Response(JSON.stringify({ message: 'Evento não processado' }), { status: 200 });
    }

    // A mensagem em si vem dentro de data.message na v2
    const messageInfo = data?.message || data;

    // Se a mensagem for enviada pelo próprio bot, ignorar para evitar loop
    // Na v2, o fromMe fica dentro de data.key.fromMe
    if (data?.key?.fromMe) {
      return new Response(JSON.stringify({ message: 'Mensagem do bot ignorada' }), { status: 200 });
    }

    // remoteJid na v2 fica dentro de data.key
    const remoteJid = data?.key?.remoteJid;
    if (!remoteJid) {
       return new Response(JSON.stringify({ message: 'Sem remetente válido' }), { status: 200 });
    }

    // Ignorar mensagens de grupos (terminam com @g.us)
    if (remoteJid.endsWith('@g.us')) {
      console.log('🔇 Mensagem de grupo ignorada:', remoteJid);
      return new Response(JSON.stringify({ message: 'Mensagem de grupo ignorada' }), { status: 200 });
    }

    const phone = remoteJid.split('@')[0]; // Formato E.164 (ex: 5511999999999)
    
    // 1. Resolver Gabinete através da Instância primeiro para ter a API URL
    const { data: config, error: configError } = await supabase
      .from('ia_integrations' as any)
      .select('*')
      .eq('whatsapp_instance_name', instance)
      .eq('whatsapp_enabled', true)
      .maybeSingle();

    if (configError) {
      console.error('❌ Erro no BD ao buscar ia_integrations:', configError);
    }

    if (!config) {
      console.error('❌ Gabinete não encontrado ou WhatsApp desativado para a instância:', instance);
      return new Response(JSON.stringify({ error: 'Gabinete não configurado' }), { status: 404 });
    }

    const gabineteId = config.gabinete_id;
    const { whatsapp_api_url, whatsapp_api_key } = config;

    // O texto fica em messageInfo.conversation ou messageInfo.extendedTextMessage.text
    let messageText = messageInfo?.conversation || messageInfo?.extendedTextMessage?.text;
    let audioBase64 = null;
    let isAudio = !!messageInfo?.audioMessage;

    if (!messageText && !isAudio) {
      return new Response(JSON.stringify({ message: 'Sem conteúdo suportado' }), { status: 200 });
    }

    if (isAudio) {
      console.log('🎙️ Mensagem de áudio recebida, baixando base64 da Evolution API...');
      try {
        const base64Res = await fetch(`${whatsapp_api_url}/chat/getBase64FromMediaMessage/${instance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': whatsapp_api_key
          },
          body: JSON.stringify({ message: messageInfo })
        });
        
        if (base64Res.ok) {
          const mediaData = await base64Res.json();
          audioBase64 = mediaData.base64;
          console.log('✅ Áudio baixado com sucesso.');
        } else {
          console.error('❌ Erro ao baixar áudio da Evolution API:', await base64Res.text());
        }
      } catch (err) {
        console.error('❌ Falha na requisição de áudio:', err);
      }
    }

    // Buscar configurações do Assessor de IA (opcional mas importante para nome/comportamento)
    const { data: assessorConfig } = await supabase
      .from('meu_assessor_ia')
      .select('nome, comportamento')
      .eq('gabinete_id', gabineteId)
      .maybeSingle();

    // 2. Identificar Usuário (Membro do Gabinete ou Eleitor)
    let userType = 'eleitor';
    let userData = null;

    // Função auxiliar para normalizar telefone (apenas números)
    const normalizePhone = (p: string) => p?.replace(/\D/g, '') || '';
    const normalizedIncomingPhone = normalizePhone(phone);
    const incomingPhoneWithoutCountry = normalizedIncomingPhone.startsWith('55') 
      ? normalizedIncomingPhone.substring(2) 
      : normalizedIncomingPhone;

    // Buscar todos os usuários ativos do gabinete
    const { data: cabinetUsers, error: cabinetError } = await supabase
      .from('gabinete_usuarios')
      .select(`
        role,
        user_id,
        profiles (
          full_name,
          whatsapp,
          main_role
        )
      `)
      .eq('gabinete_id', gabineteId)
      .eq('ativo', true);

    if (cabinetUsers && cabinetUsers.length > 0) {
      // Procurar match normalizando o telefone do banco
      const matchedUser = cabinetUsers.find(cu => {
        const dbPhoneRaw = Array.isArray(cu.profiles) ? cu.profiles[0]?.whatsapp : (cu.profiles as any)?.whatsapp;
        if (!dbPhoneRaw) return false;
        
        const dbPhoneNorm = normalizePhone(dbPhoneRaw);
        return dbPhoneNorm === normalizedIncomingPhone || 
               dbPhoneNorm === incomingPhoneWithoutCountry ||
               (dbPhoneNorm.length === 11 && dbPhoneNorm === incomingPhoneWithoutCountry) || // ex: 27999205531
               (dbPhoneNorm.length === 10 && dbPhoneNorm === incomingPhoneWithoutCountry.replace(/^(\d{2})9/, '$1')); // sem o 9 extra
      });

      if (matchedUser) {
        userType = 'membro';
        const profile = Array.isArray(matchedUser.profiles) ? matchedUser.profiles[0] : (matchedUser.profiles as any);
        userData = {
          id: matchedUser.user_id,
          nome: profile?.full_name || 'Membro do Gabinete',
          cargo: matchedUser.role || profile?.main_role || 'assessor'
        };
      }
    }

    if (!userData) {
      // Tentar encontrar nos eleitores
      // Aqui podemos usar a normalização no backend ou trazer os eleitores (cuidado com gabinetes grandes)
      // Como a tabela de eleitores pode ser grande, usamos like para variações comuns ou busca exata
      
      const phoneVariants = [
        phone, // 5527999205531
        `+${phone}`, // +5527999205531
        incomingPhoneWithoutCountry, // 27999205531
        `(${incomingPhoneWithoutCountry.substring(0,2)}) ${incomingPhoneWithoutCountry.substring(2,7)}-${incomingPhoneWithoutCountry.substring(7)}`, // (27) 99920-5531
        `(${incomingPhoneWithoutCountry.substring(0,2)}) ${incomingPhoneWithoutCountry.substring(2)}` // (27) 999205531
      ];

      const { data: eleitor } = await supabase
        .from('eleitores_whatsapp')
        .select('*')
        .eq('gabinete_id', gabineteId)
        .in('telefone', phoneVariants)
        .maybeSingle();
      
      if (eleitor) {
        userData = eleitor;
      }
    }

    console.log(`👤 Usuário identificado: ${userType} - ${userData?.nome || 'Desconhecido'} (${phone})`);
    
    // Log para depuração interna
    console.log(`GabineteID: ${gabineteId}, UserID: ${userData?.id || phone}`);

    // 3. Processar com IA (Chamando a lógica de whatsapp-ai-actions ou chat-with-ai)
    // Para simplificar e manter o contexto/ações, vamos usar a whatsapp-ai-actions
    const aiActionResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-ai-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        userText: messageText || '',
        audioBase64: audioBase64,
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

    // 4. Salvar histórico no Banco (Mensagem do Usuário e Resposta da IA)
    // Mensagem do Usuário
    await supabase
      .from('conversation_history')
      .insert({
        gabinete_id: gabineteId,
        telefone: phone,
        role: 'user',
        content: messageText || (isAudio ? '[Áudio]' : '')
      });

    // Resposta da IA
    await supabase
      .from('conversation_history')
      .insert({
        gabinete_id: gabineteId,
        telefone: phone,
        role: 'assistant',
        content: responseText
      });

    // 5. Enviar Resposta via Evolution API
    const sendResponse = await fetch(`${whatsapp_api_url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': whatsapp_api_key
      },
      body: JSON.stringify({
        number: phone,
        text: responseText
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
