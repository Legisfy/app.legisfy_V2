import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequestBody {
  email: string;
  code: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var");
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { email, code }: VerifyRequestBody = await req.json();

    const normalizedEmail = (email || "").toLowerCase().trim();
    const normalizedCode = (code || "").trim();

    if (!normalizedEmail || !normalizedCode || normalizedCode.length !== 6) {
      return new Response(
        JSON.stringify({ success: false, message: "Parâmetros inválidos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Verifying 2FA code for: ${normalizedEmail}`);

    // Get the latest valid code for this email matching the provided code
    const { data, error } = await supabase
      .from("two_factor_codes")
      .select("id, code, expires_at, used")
      .eq("email", normalizedEmail)
      .eq("code", normalizedCode)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching code:", error);
      return new Response(
        JSON.stringify({ success: false, message: "Erro ao validar código" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, message: "Código não encontrado ou expirado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark as used atomically (avoid race conditions)
    const { error: updateError } = await supabase
      .from("two_factor_codes")
      .update({ used: true })
      .eq("id", data.id)
      .eq("used", false);

    if (updateError) {
      console.error("Error marking code as used:", updateError);
      return new Response(
        JSON.stringify({ success: false, message: "Falha ao confirmar código" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Unexpected error in verify-2fa-code:", err);
    return new Response(
      JSON.stringify({ success: false, message: err?.message || "Erro interno" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});