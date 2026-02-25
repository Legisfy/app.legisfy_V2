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
    const { action, email, password } = await req.json();

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

    if (action === 'reset_password') {
      // Reset password for the politician
      const { data, error } = await supabaseAdmin.rpc('admin_reset_politico_password', {
        p_email: email,
        p_new_password: password
      });

      if (error) {
        console.error('Error resetting password:', error);
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
          data,
          message: 'Password reset successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'test_login') {
      // Test login with the provided credentials
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login test failed:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error.message,
            details: 'Login failed with provided credentials'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if user is a politician
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('main_role, full_name')
        .eq('user_id', data.user.id)
        .single();

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: data.user,
          profile,
          message: 'Login successful'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'check_user_status') {
      // Check user status in the database
      // First, get all users and find by email
      const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
      const targetUser = allUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'User not found', details: 'No user with this email exists' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const { data: userInfo, error: userError } = await supabaseAdmin
        .from('profiles')
        .select(`
          *, 
          user_id,
          full_name,
          main_role
        `)
        .eq('user_id', targetUser.id)
        .single();

      if (userError) {
        return new Response(
          JSON.stringify({ error: 'User not found', details: userError.message }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get auth user details
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userInfo.user_id);

      // Check for gabinete
      const { data: gabinete } = await supabaseAdmin
        .from('gabinetes')
        .select('id, nome, status')
        .eq('politico_id', userInfo.user_id)
        .single();

      return new Response(
        JSON.stringify({ 
          user: userInfo,
          auth_user: authUser?.user,
          gabinete,
          message: 'User status retrieved'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
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