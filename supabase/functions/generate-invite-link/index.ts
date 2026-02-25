import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-base-url",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido. Use POST." }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { email, name, role, institution_id, invitation_id } = await req.json();
    const baseUrl = req.headers.get('x-app-base-url') || 'https://legisfy.lovable.app';
    
    // Use the invitation_id passed from the client (which is the actual DB token)
    const token = invitation_id;
    
    // Generate different URLs based on role
    let inviteLink: string;
    if (role === 'politico') {
      // Político vai para página de onboarding
      inviteLink = `${baseUrl}/onboarding?token=${token}`;
    } else {
      // Chefe e assessor vão para página de criação de conta da equipe
      inviteLink = `${baseUrl}/aceitar-convite-equipe?token=${token}&email=${encodeURIComponent(email)}&role=${role}`;
    }
    
    console.log("✅ Invite link generated for role", role, ":", inviteLink);
    
    return new Response(JSON.stringify({ 
      action_link: inviteLink,
      success: true 
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error("❌ Erro ao gerar link de convite:", error);
    
    return new Response(JSON.stringify({ 
      error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      success: false 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});