import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "suporte@legisfy.app.br";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://www.legisfy.app.br";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email, redirectTo }: { email?: string; redirectTo?: string } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: "Email é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    
    console.log("[request-password-reset] Input redirectTo:", redirectTo);
    console.log("[request-password-reset] APP_BASE_URL:", APP_BASE_URL);
    
// Determinar redirect seguro. Permitir endereços oficiais ou localhost para desenvolvimento.
    let redirect = `${APP_BASE_URL}/auth#type=recovery`;
    if (redirectTo) {
      try {
        const u = new URL(redirectTo);
        const host = u.hostname.toLowerCase();
        
        // Permitir localhost explicitamente para desenvolvimento se o usuário estiver testando localmente
        const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
        const isAllowed = host.endsWith('legisfy.app.br') || host.endsWith('lovable.app') || isLocal;
        
        if (isAllowed) {
          redirect = `${u.origin}${u.pathname}${u.search ? u.search + '&' : '?'}type=recovery`;
          console.log("[request-password-reset] Usando origin permitido:", redirect);
        }
      } catch (error) {
        console.log("[request-password-reset] Erro ao processar redirectTo:", error);
      }
    }
    
    console.log("[request-password-reset] Final redirect URL:", redirect);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: { emailRedirectTo: redirect },
    } as any);

    if (error) {
      console.error("generateLink(recovery) error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const actionLink = (data as any)?.action_link || (data as any)?.properties?.action_link;
    if (!actionLink) {
      return new Response(JSON.stringify({ success: false, error: "Link não gerado." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Buscar template premium no banco de dados
    const { data: template } = await admin
      .from('email_templates')
      .select('subject, html_content')
      .eq('type', 'password_reset')
      .eq('is_active', true)
      .maybeSingle();

    let subject = "Redefinir senha - Legisfy";
    let html = `Clique aqui para redefinir sua senha: ${actionLink}`;

    if (template) {
      subject = template.subject;
      html = template.html_content.replace(/{{link}}/g, actionLink);
    } else {
      // Fallback para template básico melhorado se não houver no banco
      html = `
        <div style="font-family:sans-serif; padding:20px;">
          <h2>Redefinir Senha</h2>
          <p>Você solicitou a redefinição de senha para sua conta Legisfy.</p>
          <a href="${actionLink}" style="padding:10px 20px; background:#000; color:#fff; text-decoration:none; border-radius:5px;">Redefinir Senha</a>
        </div>`;
    }

    const emailResponse = await resend.emails.send({
      from: `Legisfy <${FROM_EMAIL}>`,
      to: [normalizedEmail],
      subject,
      html,
      reply_to: [`Suporte Legisfy <${FROM_EMAIL}>`],
    });

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("[request-password-reset] Error:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message || "Erro interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});