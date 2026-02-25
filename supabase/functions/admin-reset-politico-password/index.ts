import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Parse request body
    const { email, new_password } = await req.json();

    // Validate required fields
    if (!email || !new_password) {
      return new Response(
        JSON.stringify({ error: 'Email e nova senha são obrigatórios.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const normalizedEmail = email.toLowerCase().trim();

    console.log(`Resetando senha para usuário: ${normalizedEmail}`);

    // Get user by email from auth.users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuários.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Total users found: ${users?.users?.length || 0}`);
    
    const targetUser = users?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (!targetUser) {
      console.error(`User not found with email: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado.' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found user with ID: ${targetUser.id}`);

    // Update the user's password using admin API
    const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { 
        password: new_password,
        email_confirm: true // Ensure email is confirmed
      }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Senha resetada com sucesso para: ${normalizedEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha resetada com sucesso',
        user_id: targetUser.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (e: any) {
    console.error('Erro inesperado:', e);
    return new Response(
      JSON.stringify({ error: e.message || 'Erro interno' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})