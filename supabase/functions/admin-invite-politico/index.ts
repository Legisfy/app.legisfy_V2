import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate a strong temporary password
function generateTemporaryPassword(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const specialChars = '!@#$%^&*';
  
  let password = '';
  
  // Ensure at least one uppercase, one lowercase, one number, one special char
  password += charset.charAt(Math.floor(Math.random() * 26)); // uppercase
  password += charset.charAt(Math.floor(Math.random() * 26) + 26); // lowercase  
  password += charset.charAt(Math.floor(Math.random() * 10) + 52); // number
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length)); // special
  
  // Fill remaining characters
  for (let i = 4; i < 12; i++) {
    const allChars = charset + specialChars;
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
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
    const { email, instituicao_id, gabinete_nome } = await req.json();

    // Validate required fields
    if (!email || !instituicao_id || !gabinete_nome) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios ausentes.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido.' }),
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

    // Generate temporary password
    const senhaTemporaria = generateTemporaryPassword();

    console.log(`Creating politician user for email: ${email}`);

    // Create user with admin privileges
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: { 
        role: 'politico', 
        instituicao_id, 
        gabinete_nome,
        user_type: 'politico',
        full_name: gabinete_nome
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({ error: 'Falha ao criar usuário.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Successfully created user: ${data.user.id}`);

    // Return success response
    return new Response(
      JSON.stringify({ 
        user_id: data.user.id, 
        senha_temporaria: senhaTemporaria,
        email: data.user.email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (e: any) {
    console.error('Unexpected error:', e);
    return new Response(
      JSON.stringify({ error: e.message || 'Erro interno' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})