import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

    console.log("🔓 Auto-confirming user:", user_id);

    // Primeiro verificar se o usuário existe
    const { data: userExists, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (userError || !userExists.user) {
      console.error("❌ User not found:", userError?.message || "User does not exist");
      return new Response(JSON.stringify({ 
        error: "User not found", 
        user_id: user_id,
        details: userError?.message 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Se usuário já está confirmado, retornar sucesso
    if (userExists.user.email_confirmed_at) {
      console.log("✅ User already confirmed");
      return new Response(JSON.stringify({ 
        success: true, 
        user: userExists.user, 
        already_confirmed: true 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Confirmar o usuário
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      email_confirm: true,
    });

    if (error) {
      console.error("❌ Failed to auto-confirm user:", error);
      return new Response(JSON.stringify({ 
        error: error.message,
        user_id: user_id,
        code: error.code || "UNKNOWN_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("✅ User confirmed successfully");

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("❌ Unexpected error in admin-auto-confirm-user:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});