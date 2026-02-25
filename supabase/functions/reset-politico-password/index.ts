import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Reset Politico Password function started")

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
    const { email, newPassword } = await req.json();
    console.log(`Processing password reset for: ${email}`);

    if (!email || !newPassword) {
      console.log("Missing email or password");
      return new Response(
        JSON.stringify({ error: 'Email and newPassword are required' }),
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

    // First check if user is an authorized politician
    const { data: politicoAuth, error: politicoError } = await supabaseAdmin
      .from('politicos_autorizados')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .single();

    console.log(`Politician check result:`, { politicoAuth, politicoError });

    if (!politicoAuth) {
      console.log("User is not an authorized politician");
      return new Response(
        JSON.stringify({ error: 'User is not an authorized politician' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user ID
    const { data: userData, error: userListError } = await supabaseAdmin.auth.admin.listUsers();
    console.log(`User list result:`, { userCount: userData.users?.length, userListError });
    
    const user = userData.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
    console.log(`Found user:`, { userId: user?.id, userEmail: user?.email });

    if (!user) {
      console.log("User not found in auth.users");
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Reset password using admin API
    console.log(`Attempting to reset password for user: ${user.id}`);
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    console.log(`Password reset result:`, { data: !!data, error });

    if (error) {
      console.error('Error updating password:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully',
        user_id: user.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (e: any) {
    console.error('Unexpected error:', e);
    return new Response(
      JSON.stringify({ error: e.message || 'Internal error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})