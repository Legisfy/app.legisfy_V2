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

// Utilitários de segurança
const verifyWebhookToken = (request: Request): boolean => {
  const token = request.headers.get('X-Webhook-Token');
  return token === webhookToken;
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
    'vereador': ['create_evento', 'list_eventos'],
    'chefe_gabinete': ['create_evento', 'list_eventos'],
    'assessor': ['list_eventos'],
    'estagiario': ['list_eventos']
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

// Primeira tentativa de criação da tabela agenda_eventos_whatsapp se não existir
const ensureAgendaTable = async () => {
  try {
    const { error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.agenda_eventos_whatsapp (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          gabinete_id UUID NOT NULL REFERENCES public.gabinetes_whatsapp(id) ON DELETE CASCADE,
          criador_whatsapp TEXT NOT NULL,
          titulo TEXT NOT NULL,
          descricao TEXT,
          inicio TIMESTAMPTZ NOT NULL,
          fim TIMESTAMPTZ NOT NULL,
          local TEXT,
          meta JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.agenda_eventos_whatsapp ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (error) {
      console.warn('Table agenda_eventos_whatsapp may not exist:', error);
    }
  } catch (e) {
    console.warn('Could not ensure agenda table exists:', e);
  }
};

const handleAgendaCreate = async (request: Request): Promise<Response> => {
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
      
      await logWebhookEvent('inbound_from_n8n', 'agenda.create', correlationId, body, errorResponse, 404, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar permissão
    if (!checkPermission(userInfo.cargo_slug, 'create_evento')) {
      const errorResponse = {
        error: "FORBIDDEN_BY_ROLE",
        message: "Seu cargo não permite esta ação."
      };
      
      await logWebhookEvent('inbound_from_n8n', 'agenda.create', correlationId, body, errorResponse, 403, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Garantir que a tabela existe
    await ensureAgendaTable();

    // Criar evento
    const eventoData = {
      gabinete_id: userInfo.gabinete_id,
      criador_whatsapp: whatsapp_e164,
      titulo: payload.titulo,
      descricao: payload.descricao,
      inicio: payload.inicio,
      fim: payload.fim,
      local: payload.local,
      meta: payload.meta || {}
    };

    const { data: evento, error } = await supabase
      .from('agenda_eventos_whatsapp')
      .insert(eventoData)
      .select()
      .single();

    if (error) {
      console.error('Error creating evento:', error);
      const errorResponse = { error: "INTERNAL", message: "Erro interno do servidor" };
      
      await logWebhookEvent('inbound_from_n8n', 'agenda.create', correlationId, body, errorResponse, 500, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const successResponse = {
      ok: true,
      id: evento.id,
      message: "Evento criado.",
      data: evento
    };

    await logWebhookEvent('inbound_from_n8n', 'agenda.create', correlationId, body, successResponse, 200, idempotencyKey);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in agenda.create:', error);
    return new Response(JSON.stringify({ error: "INTERNAL" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

const handleAgendaList = async (request: Request): Promise<Response> => {
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
      
      await logWebhookEvent('inbound_from_n8n', 'agenda.list', correlationId, body, errorResponse, 404, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar permissão
    if (!checkPermission(userInfo.cargo_slug, 'list_eventos')) {
      const errorResponse = {
        error: "FORBIDDEN_BY_ROLE",
        message: "Seu cargo não permite esta ação."
      };
      
      await logWebhookEvent('inbound_from_n8n', 'agenda.list', correlationId, body, errorResponse, 403, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Garantir que a tabela existe
    await ensureAgendaTable();

    // Buscar eventos
    let query = supabase
      .from('agenda_eventos_whatsapp')
      .select('id, titulo, descricao, inicio, fim, local, meta, created_at, updated_at')
      .eq('gabinete_id', userInfo.gabinete_id)
      .order('inicio', { ascending: true });

    // Aplicar filtros se fornecidos
    if (payload.from) {
      query = query.gte('inicio', payload.from);
    }
    if (payload.to) {
      query = query.lte('fim', payload.to);
    }
    if (payload.limit) {
      query = query.limit(payload.limit);
    }

    const { data: eventos, error } = await query;

    if (error) {
      console.error('Error listing eventos:', error);
      const errorResponse = { error: "INTERNAL", message: "Erro interno do servidor" };
      
      await logWebhookEvent('inbound_from_n8n', 'agenda.list', correlationId, body, errorResponse, 500, idempotencyKey);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const successResponse = {
      ok: true,
      items: eventos || [],
      count: eventos?.length || 0
    };

    await logWebhookEvent('inbound_from_n8n', 'agenda.list', correlationId, body, successResponse, 200, idempotencyKey);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in agenda.list:', error);
    return new Response(JSON.stringify({ error: "INTERNAL" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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
      case '/whatsapp-agenda/create':
        return handleAgendaCreate(req);
      
      case '/whatsapp-agenda/list':
        return handleAgendaList(req);
      
      case '/whatsapp-agenda/healthz':
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
    console.error('Error in whatsapp-agenda:', error);
    return new Response(JSON.stringify({ error: "INTERNAL" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});