import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) throw new Error('Invalid user token');

    const { message, conversationId, gabineteId } = await req.json();
    if (!message) throw new Error('Message is required');

    let conversation_id = conversationId;
    let resolvedGabineteId = gabineteId;

    // Resolve gabineteId if missing (keep existing logic)
    if (!resolvedGabineteId) {
      const { data: activeCabinets } = await supabase.rpc('get_active_cabinet');
      if (activeCabinets?.[0]?.cabinet_id) {
        resolvedGabineteId = activeCabinets[0].cabinet_id;
      }
    }

    if (!conversation_id) {
      const { data: newConv, error: convError } = await supabase
        .from('ia_conversations')
        .insert({ user_id: user.id, title: message.slice(0, 50), gabinete_id: resolvedGabineteId })
        .select().single();
      if (convError) throw convError;
      conversation_id = newConv.id;
    }

    await supabase.from('ia_messages').insert({ conversation_id, role: 'user', content: message });

    const { data: history } = await supabase
      .from('ia_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    const { data: profile } = await supabase.from('profiles').select('full_name, main_role').eq('user_id', user.id).single();

    let assistantName = 'Assessor IA';
    let assistantBehavior = 'Responda de forma profissional, empática e objetiva, sempre orientando o gabinete para ações práticas.';

    if (resolvedGabineteId) {
      const { data, error } = await supabase
        .from('meu_assessor_ia')
        .select('nome, comportamento')
        .eq('gabinete_id', resolvedGabineteId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        assistantName = data[0].nome || assistantName;
        assistantBehavior = data[0].comportamento || assistantBehavior;
      }
    }

    const systemPrompt = `Você é ${assistantName}, o Assessor IA da Legisfy, um agente ativo dentro do gabinete de ${profile?.full_name || 'um parlamentar'}.
    Você possui ferramentas para consultar e cadastrar dados. Sempre use o gabinete_id: ${resolvedGabineteId}.
    Regras gerais: Responda em Português (Brasil). Seja proativo mas respeite a privacidade.
    Comportamento e tom de voz específicos deste gabinete: ${assistantBehavior}`;

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(m => ({ role: m.role, content: m.content }))
    ];

    // CALL OPENROUTER
    const callOpenRouter = async (messages: any[]) => {
      const payload = {
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      };

      let attempt = 0;
      const maxAttempts = 3;

      while (attempt < maxAttempts) {
        attempt++;
        console.log(`OpenRouter attempt ${attempt} for model ${payload.model}`);

        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://app.legisfy.app.br',
              'X-Title': 'Legisfy Assessor IA'
            },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error(`OpenRouter error (status ${res.status}): ${errorText}`);

            // If rate limited, wait and retry
            if (res.status === 429 && attempt < maxAttempts) {
              const waitTime = attempt * 2000;
              console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              continue;
            }
            throw new Error(`OpenRouter API error: ${res.status}`);
          }

          const json = await res.json();
          if (json.error) {
            console.error('OpenRouter JSON error:', json.error);
            if (json.error.code === 429 && attempt < maxAttempts) {
              const waitTime = attempt * 2000;
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              continue;
            }
          }
          return json;
        } catch (err) {
          console.error(`Fetch error on attempt ${attempt}:`, err);
          if (attempt === maxAttempts) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return { error: { code: 429, message: 'Frequência de solicitações excedida após várias tentativas.' } };
    };

    let aiResponse = await callOpenRouter(openaiMessages);
    if (aiResponse && (aiResponse as any).error && (aiResponse as any).error.code === 429) {
      const rateLimitedMessage = "Estou com muitos acessos agora e o modelo gratuito está temporariamente indisponível. Tente novamente em alguns instantes.";
      await supabase.from('ia_messages').insert({ conversation_id, role: 'assistant', content: rateLimitedMessage });
      return new Response(JSON.stringify({ message: rateLimitedMessage, conversationId: conversation_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!aiResponse || !aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      const fallbackMessage = "Não consegui gerar uma resposta agora. Tente novamente em alguns instantes.";
      await supabase.from('ia_messages').insert({ conversation_id, role: 'assistant', content: fallbackMessage });
      return new Response(JSON.stringify({ message: fallbackMessage, conversationId: conversation_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let messageObj = aiResponse.choices[0].message;

    const assistantMessage = messageObj.content;
    await supabase.from('ia_messages').insert({ conversation_id, role: 'assistant', content: assistantMessage });

    return new Response(JSON.stringify({ message: assistantMessage, conversationId: conversation_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
