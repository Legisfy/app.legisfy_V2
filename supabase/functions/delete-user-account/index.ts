import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🗑️ Iniciando deleção do usuário: ${user_id}`)

    // Helper to safely delete without breaking the whole flow
    const safeDelete = async (op: () => Promise<any>, label: string) => {
      try {
        const { error } = await op();
        if (error) {
          console.warn(`⚠️ Falha ao deletar ${label}:`, error.message || error);
        } else {
          console.log(`🧹 Removido ${label}`);
        }
      } catch (e) {
        console.warn(`⚠️ Exceção ao deletar ${label}:`, e);
      }
    };

    // Buscar email do usuário (para limpar 2FA por email)
    let userEmail: string | null = null;
    try {
      const { data: userRes, error: getUserErr } = await supabaseClient.auth.admin.getUserById(user_id);
      if (getUserErr) {
        console.warn('⚠️ Erro ao buscar usuário (admin.getUserById):', getUserErr);
      } else {
        // @ts-ignore - edge runtime type
        userEmail = userRes?.user?.email ?? null;
        console.log('ℹ️ Email do usuário:', userEmail);
      }
    } catch (e) {
      console.warn('⚠️ Exceção ao buscar email do usuário:', e);
    }

    // 1) Limpar dados dependentes que referenciam o usuário
    // 1.1) Conversas IA e mensagens
    try {
      const { data: convs, error: convsError } = await supabaseClient
        .from('ia_conversations')
        .select('id')
        .eq('user_id', user_id);

      if (convsError) {
        console.warn('⚠️ Erro ao buscar conversas IA:', convsError.message || convsError);
      } else if (convs && convs.length > 0) {
        const ids = convs.map((c: { id: string }) => c.id);
        await safeDelete(() => supabaseClient.from('ia_messages').delete().in('conversation_id', ids), 'ia_messages (por conversas)');
        await safeDelete(() => supabaseClient.from('ia_conversations').delete().eq('user_id', user_id), 'ia_conversations');
      }
    } catch (e) {
      console.warn('⚠️ Exceção ao limpar conversas IA:', e);
    }

    // 1.2) Notificações (como destino e como criador)
    await safeDelete(
      () => supabaseClient.from('notifications').delete().or(`user_id.eq.${user_id},created_by_user_id.eq.${user_id}`),
      'notifications'
    );

    // 1.3) Eventos de status que possuem user_id
    await safeDelete(() => supabaseClient.from('demanda_status_events').delete().eq('user_id', user_id), 'demanda_status_events');
    await safeDelete(() => supabaseClient.from('indicacao_status_events').delete().eq('user_id', user_id), 'indicacao_status_events');

    // 1.4) Comunicados e métricas (fonte do erro de FK)
    // Apagar métricas primeiro
    await safeDelete(() => supabaseClient.from('comunicado_metrics').delete().eq('user_id', user_id), 'comunicado_metrics');
    try {
      const { count: metricsCount, error: metricsCountErr } = await supabaseClient
        .from('comunicado_metrics')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id);
      if (metricsCountErr) {
        console.warn('⚠️ Erro ao contar comunicado_metrics:', metricsCountErr.message || metricsCountErr);
      } else {
        console.log('📊 comunicado_metrics restantes:', metricsCount);
      }
    } catch (e) {
      console.warn('⚠️ Exceção ao contar comunicado_metrics:', e);
    }
    // Apagar comunicados do usuário
    await safeDelete(() => supabaseClient.from('comunicados').delete().eq('user_id', user_id), 'comunicados');

    // 1.5) Tabelas com coluna user_id simples
    const tablesWithUserIdEq = [
      'pontuacoes_assessores',
      'rankings_mensais',
      'gabinete_members',
      'assessores',
      'politicians',
      'demandas',
      'ideias',
      'indicacoes',
      'eleitores',
      'profiles'
    ];

    for (const table of tablesWithUserIdEq) {
      await safeDelete(
        () => supabaseClient.from(table).delete().eq('user_id', user_id),
        `${table} (user_id)`
      );
    }

    // 1.6) Demandas onde o usuário é owner_user_id
    await safeDelete(() => supabaseClient.from('demandas').delete().eq('owner_user_id', user_id), 'demandas (owner_user_id)');

    // 1.7) Códigos 2FA por email do usuário, se existir
    if (userEmail) {
      await safeDelete(() => supabaseClient.from('two_factor_codes').delete().eq('email', userEmail), 'two_factor_codes (email)');
    }

    // 2) Finalmente, deletar o usuário na autenticação
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(user_id)

    if (authDeleteError) {
      console.error('❌ Erro ao deletar usuário:', authDeleteError)
      return new Response(
        JSON.stringify({ error: authDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Usuário ${user_id} deletado com sucesso`)
    return new Response(
      JSON.stringify({ success: true, message: 'Usuário deletado com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})