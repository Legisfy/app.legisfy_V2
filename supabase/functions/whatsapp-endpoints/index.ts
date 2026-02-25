import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token, idempotency-key',
};

// Configuração do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Segurança
const webhookToken = Deno.env.get('APP_N8N_TOKEN');
const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_USER_WELCOME_URL');
const n8nWebhookSecret = Deno.env.get('N8N_WEBHOOK_SECRET');

// Utilitários de segurança
const verifyWebhookToken = (request: Request): boolean => {
  const token = request.headers.get('X-Webhook-Token');
  return token === webhookToken;
};

// Função para criar HMAC-SHA256
const createHmacSignature = async (body: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return 'sha256=' + Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Função para logar eventos de webhook
const logWebhookEvent = async (
  source: string,
  eventType: string,
  correlationId: string,
  request: any,
  response: any,
  statusCode: number,
  idempotencyKey?: string
) => {
  try {
    await supabase.from('webhook_events').insert({
      source,
      event_type: eventType,
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
      status_code: statusCode,
      request,
      response,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging webhook event:', error);
  }
};

// Função para resolver usuário por WhatsApp
const resolveUserByWhatsApp = async (whatsappE164: string) => {
  const { data, error } = await supabase
    .from('usuarios_whatsapp')
    .select(`
      id,
      gabinete_id,
      nome,
      email,
      cargo,
      ativo,
      gabinetes_whatsapp!inner (
        id,
        nome
      )
    `)
    .eq('whatsapp_e164', whatsappE164)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    usuario_id: data.id,
    gabinete_id: data.gabinete_id,
    cargo_slug: data.cargo || 'assessor',
    usuario_nome: data.nome,
    gabinete_nome: data.gabinetes_whatsapp.nome
  };
};

// Verificar permissões baseadas no cargo
const checkPermission = (cargo: string, action: string): boolean => {
  const permissions: Record<string, string[]> = {
    'vereador': ['create_eleitor', 'create_demanda', 'create_ideia', 'create_indicacao', 'create_evento', 'list_eventos'],
    'chefe_gabinete': ['create_eleitor', 'create_demanda', 'create_ideia', 'create_indicacao', 'create_evento', 'list_eventos'],
    'assessor': ['create_eleitor', 'create_demanda', 'create_ideia', 'list_eventos'],
    'estagiario': ['create_eleitor', 'create_demanda', 'list_eventos']
  };

  return permissions[cargo]?.includes(action) || false;
};

// Verificar idempotência
const checkIdempotency = async (idempotencyKey: string): Promise<any> => {
  if (!idempotencyKey) return null;

  const { data } = await supabase
    .from('webhook_events')
    .select('response')
    .eq('idempotency_key', idempotencyKey)
    .single();

  return data?.response || null;
};

// Endpoints
const handleEleitoresCreate = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { whatsapp_e164, payload } = body;
    const correlationId = crypto.randomUUID();
    const idempotencyKey = request.headers.get('Idempotency-Key');

    // Verificar idempotência
    if (idempotencyKey) {
      const existingResponse = await checkIdempotency(idempotencyKey);
      if (existingResponse) {
        return new Response(JSON.stringify(existingResponse), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Resolver usuário
    const userInfo = await resolveUserByWhatsApp(whatsapp_e164);
    if (!userInfo) {
      const errorResponse = {
        error: "USER_NOT_FOUND_OR_NOT_LINKED",
        action: "ask_to_register_or_update_number"
      };
      
      await logWebhookEvent('inbound_from_n8n', 'eleitores.create', correlationId, body, errorResponse, 404, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar permissão
    if (!checkPermission(userInfo.cargo_slug, 'create_eleitor')) {
      const errorResponse = {
        error: "FORBIDDEN_BY_ROLE",
        message: "Seu cargo não permite esta ação."
      };
      
      await logWebhookEvent('inbound_from_n8n', 'eleitores.create', correlationId, body, errorResponse, 403, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar eleitor
    const eleitorData = {
      gabinete_id: userInfo.gabinete_id,
      nome: payload.nome,
      telefone: payload.telefone_e164,
      endereco: payload.endereco || '',
      tags: payload.tags || []
    };

    const { data: eleitor, error } = await supabase
      .from('eleitores_whatsapp')
      .insert(eleitorData)
      .select()
      .single();

    if (error) {
      console.error('Error creating eleitor:', error);
      const errorResponse = { error: "INTERNAL", message: "Erro interno do servidor" };
      
      await logWebhookEvent('inbound_from_n8n', 'eleitores.create', correlationId, body, errorResponse, 500, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const successResponse = {
      ok: true,
      id: eleitor.id,
      message: "Eleitor cadastrado.",
      data: eleitor
    };

    await logWebhookEvent('inbound_from_n8n', 'eleitores.create', correlationId, body, successResponse, 200, idempotencyKey);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in eleitores.create:', error);
    return new Response(JSON.stringify({ error: "INTERNAL" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

const handleDemandasCreate = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { whatsapp_e164, payload } = body;
    const correlationId = crypto.randomUUID();
    const idempotencyKey = request.headers.get('Idempotency-Key');

    // Verificar idempotência
    if (idempotencyKey) {
      const existingResponse = await checkIdempotency(idempotencyKey);
      if (existingResponse) {
        return new Response(JSON.stringify(existingResponse), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Resolver usuário
    const userInfo = await resolveUserByWhatsApp(whatsapp_e164);
    if (!userInfo) {
      const errorResponse = {
        error: "USER_NOT_FOUND_OR_NOT_LINKED",
        action: "ask_to_register_or_update_number"
      };
      
      await logWebhookEvent('inbound_from_n8n', 'demandas.create', correlationId, body, errorResponse, 404, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar permissão
    if (!checkPermission(userInfo.cargo_slug, 'create_demanda')) {
      const errorResponse = {
        error: "FORBIDDEN_BY_ROLE",
        message: "Seu cargo não permite esta ação."
      };
      
      await logWebhookEvent('inbound_from_n8n', 'demandas.create', correlationId, body, errorResponse, 403, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar demanda
    const demandaData = {
      gabinete_id: userInfo.gabinete_id,
      titulo: payload.titulo,
      descricao: payload.descricao,
      status: 'ABERTA',
      anexos: payload.anexos || []
    };

    const { data: demanda, error } = await supabase
      .from('demandas_whatsapp')
      .insert(demandaData)
      .select()
      .single();

    if (error) {
      console.error('Error creating demanda:', error);
      const errorResponse = { error: "INTERNAL", message: "Erro interno do servidor" };
      
      await logWebhookEvent('inbound_from_n8n', 'demandas.create', correlationId, body, errorResponse, 500, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const successResponse = {
      ok: true,
      id: demanda.id,
      status: demanda.status,
      message: "Demanda criada.",
      data: demanda
    };

    await logWebhookEvent('inbound_from_n8n', 'demandas.create', correlationId, body, successResponse, 200, idempotencyKey);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in demandas.create:', error);
    return new Response(JSON.stringify({ error: "INTERNAL" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

const handleIdeiasCreate = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { whatsapp_e164, payload } = body;
    const correlationId = crypto.randomUUID();
    const idempotencyKey = request.headers.get('Idempotency-Key');

    // Verificar idempotência
    if (idempotencyKey) {
      const existingResponse = await checkIdempotency(idempotencyKey);
      if (existingResponse) {
        return new Response(JSON.stringify(existingResponse), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Resolver usuário
    const userInfo = await resolveUserByWhatsApp(whatsapp_e164);
    if (!userInfo) {
      const errorResponse = {
        error: "USER_NOT_FOUND_OR_NOT_LINKED",
        action: "ask_to_register_or_update_number"
      };
      
      await logWebhookEvent('inbound_from_n8n', 'ideias.create', correlationId, body, errorResponse, 404, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar permissão
    if (!checkPermission(userInfo.cargo_slug, 'create_ideia')) {
      const errorResponse = {
        error: "FORBIDDEN_BY_ROLE",
        message: "Seu cargo não permite esta ação."
      };
      
      await logWebhookEvent('inbound_from_n8n', 'ideias.create', correlationId, body, errorResponse, 403, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar ideia
    const ideiaData = {
      gabinete_id: userInfo.gabinete_id,
      titulo: payload.titulo,
      descricao: payload.descricao,
      origem: 'whatsapp',
      anexos: payload.anexos || []
    };

    const { data: ideia, error } = await supabase
      .from('ideias_whatsapp')
      .insert(ideiaData)
      .select()
      .single();

    if (error) {
      console.error('Error creating ideia:', error);
      const errorResponse = { error: "INTERNAL", message: "Erro interno do servidor" };
      
      await logWebhookEvent('inbound_from_n8n', 'ideias.create', correlationId, body, errorResponse, 500, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const successResponse = {
      ok: true,
      id: ideia.id,
      message: "Ideia registrada.",
      data: ideia
    };

    await logWebhookEvent('inbound_from_n8n', 'ideias.create', correlationId, body, successResponse, 200, idempotencyKey);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ideias.create:', error);
    return new Response(JSON.stringify({ error: "INTERNAL" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

const handleIndicacoesCreate = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { whatsapp_e164, payload } = body;
    const correlationId = crypto.randomUUID();
    const idempotencyKey = request.headers.get('Idempotency-Key');

    // Verificar idempotência
    if (idempotencyKey) {
      const existingResponse = await checkIdempotency(idempotencyKey);
      if (existingResponse) {
        return new Response(JSON.stringify(existingResponse), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Resolver usuário
    const userInfo = await resolveUserByWhatsApp(whatsapp_e164);
    if (!userInfo) {
      const errorResponse = {
        error: "USER_NOT_FOUND_OR_NOT_LINKED",
        action: "ask_to_register_or_update_number"
      };
      
      await logWebhookEvent('inbound_from_n8n', 'indicacoes.create', correlationId, body, errorResponse, 404, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar permissão
    if (!checkPermission(userInfo.cargo_slug, 'create_indicacao')) {
      const errorResponse = {
        error: "FORBIDDEN_BY_ROLE",
        message: "Seu cargo não permite esta ação."
      };
      
      await logWebhookEvent('inbound_from_n8n', 'indicacoes.create', correlationId, body, errorResponse, 403, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar indicação
    const indicacaoData = {
      gabinete_id: userInfo.gabinete_id,
      titulo: payload.titulo,
      descricao: payload.descricao,
      status: 'CRIADA'
    };

    const { data: indicacao, error } = await supabase
      .from('indicacoes_whatsapp')
      .insert(indicacaoData)
      .select()
      .single();

    if (error) {
      console.error('Error creating indicacao:', error);
      const errorResponse = { error: "INTERNAL", message: "Erro interno do servidor" };
      
      await logWebhookEvent('inbound_from_n8n', 'indicacoes.create', correlationId, body, errorResponse, 500, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const successResponse = {
      ok: true,
      id: indicacao.id,
      status: indicacao.status,
      message: "Indicação criada.",
      data: indicacao
    };

    await logWebhookEvent('inbound_from_n8n', 'indicacoes.create', correlationId, body, successResponse, 200, idempotencyKey);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in indicacoes.create:', error);
    return new Response(JSON.stringify({ error: "INTERNAL" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// Função para enviar evento para N8N
const sendUserCreatedEvent = async (userInfo: any, gabineteInfo: any): Promise<void> => {
  if (!n8nWebhookUrl || !n8nWebhookSecret) {
    console.warn('N8N webhook URL or secret not configured');
    return;
  }

  try {
    const correlationId = crypto.randomUUID();
    const payload = {
      event: "user_created",
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      user: {
        id: userInfo.id,
        nome: userInfo.nome,
        email: userInfo.email,
        whatsapp_e164: userInfo.whatsapp_e164
      },
      gabinete: {
        id: gabineteInfo.id,
        nome: gabineteInfo.nome
      }
    };

    const body = JSON.stringify(payload);
    const signature = await createHmacSignature(body, n8nWebhookSecret);

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'Idempotency-Key': correlationId
      },
      body
    });

    const responseData = await response.json().catch(() => ({}));

    await logWebhookEvent(
      'outbound_to_n8n',
      'user_created',
      correlationId,
      payload,
      responseData,
      response.status,
      correlationId
    );

    console.log('User created event sent to N8N:', response.status);
  } catch (error) {
    console.error('Error sending user created event:', error);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verificar autenticação
  if (!verifyWebhookToken(req)) {
    return new Response(JSON.stringify({ error: "UNAUTHENTICATED" }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // Roteamento
    switch (path) {
      case '/whatsapp-endpoints/eleitores/create':
        return handleEleitoresCreate(req);
      
      case '/whatsapp-endpoints/demandas/create':
        return handleDemandasCreate(req);
      
      case '/whatsapp-endpoints/ideias/create':
        return handleIdeiasCreate(req);
      
      case '/whatsapp-endpoints/indicacoes/create':
        return handleIndicacoesCreate(req);
      
      case '/whatsapp-endpoints/healthz':
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      
      default:
        return new Response(JSON.stringify({ error: "NOT_FOUND" }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in whatsapp-endpoints:', error);
    return new Response(JSON.stringify({ error: "INTERNAL" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

export { sendUserCreatedEvent };