import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { token } = await req.json();
    console.log('🔍 Debug token:', token);

    // 1. Test basic invitation lookup
    const { data: invitation, error: invitationError } = await supabase
      .from('principal_invitations')
      .select(`
        *,
        camaras!inner (
          id,
          nome
        )
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .maybeSingle();

    console.log('📋 Invitation result:', { invitation, invitationError });

    if (invitationError) {
      return new Response(JSON.stringify({ 
        error: 'Database error',
        details: invitationError
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!invitation) {
      return new Response(JSON.stringify({ 
        error: 'Invitation not found'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // 2. Test user creation (dry run)
    console.log('🔑 Testing user creation parameters for:', invitation.email);
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === invitation.email.toLowerCase()
    );

    console.log('👤 Existing user check:', { found: !!existingUser, id: existingUser?.id });

    // 3. Test gabinete creation parameters
    const gabineteNome = `Gabinete do Vereador Test User`;
    console.log('🏛️ Gabinete creation test parameters:', {
      nome: gabineteNome,
      politico_id: existingUser?.id || 'test-user-id',
      camara_id: invitation.institution_id,
      institution_id: invitation.institution_id,
      status: 'ativo'
    });

    // 4. Check politicos_autorizados
    const { data: authorized, error: authError } = await supabase
      .from('politicos_autorizados')
      .select('*')
      .eq('email', invitation.email.toLowerCase())
      .eq('is_active', true);

    console.log('👑 Authorization check:', { authorized, authError });

    return new Response(JSON.stringify({
      success: true,
      debug: {
        invitation_found: !!invitation,
        invitation_email: invitation.email,
        invitation_institution: invitation.institution_id,
        existing_user: !!existingUser,
        authorized_politician: !!authorized?.length,
        test_gabinete_params: {
          nome: gabineteNome,
          politico_id: existingUser?.id || 'test-user-id',
          camara_id: invitation.institution_id,
          institution_id: invitation.institution_id,
          status: 'ativo'
        }
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});