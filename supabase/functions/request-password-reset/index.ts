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
    
    // Determine safe redirect (avoid localhost). Allow only our domains; otherwise fallback to production.
    let redirect = `${APP_BASE_URL}/?change-password=true`;
    if (redirectTo) {
      try {
        const u = new URL(redirectTo);
        const host = u.hostname.toLowerCase();
        const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost') || host.endsWith('.local');
        const isAllowed = host.endsWith('legisfy.app.br') || host.endsWith('lovable.app');
        
        console.log("[request-password-reset] Parsed URL - host:", host, "isLocal:", isLocal, "isAllowed:", isAllowed);
        
        if (!isLocal && isAllowed) {
          // keep the origin but force the path/query we need
          redirect = `${u.origin}/?change-password=true`;
          console.log("[request-password-reset] Using provided origin with safe redirect:", redirect);
        } else {
          console.log("[request-password-reset] Rejecting redirectTo, using default:", redirect);
        }
      } catch (error) {
        console.log("[request-password-reset] Error parsing redirectTo URL:", error);
        // keep default redirect
      }
    }
    
    console.log("[request-password-reset] Final redirect URL:", redirect);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log("[request-password-reset] Generating recovery link for:", normalizedEmail, "redirect:", redirect);

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
      console.error("No action_link returned from generateLink:", data);
      return new Response(
        JSON.stringify({ success: false, error: "Não foi possível gerar o link de recuperação." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subject = "Redefinir senha - Legisfy";
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; background:#f8fafc; padding:24px;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
            <div style="padding:24px 24px 0 24px;">
              <h1 style="margin:0 0 8px 0; font-size:22px; color:#111827;">Redefinir senha</h1>
              <p style="margin:0 0 16px 0; color:#374151;">Clique no botão abaixo para definir uma nova senha para sua conta Legisfy.</p>
              <a href="${actionLink}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600" target="_blank">Redefinir Senha</a>
              <p style="margin:16px 0 0 0; color:#6b7280; font-size:12px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
              <p style="word-break:break-all; color:#6b7280; font-size:12px;">${actionLink}</p>
            </div>
            <div style="padding:16px 24px; background:#f9fafb; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px;">Este link expira em 24 horas. Se você não solicitou a redefinição, ignore este email.</div>
          </div>
        </body>
      </html>`;

    const emailResponse = await resend.emails.send({
      from: `Legisfy <${FROM_EMAIL}>`,
      to: [normalizedEmail],
      subject,
      html,
      reply_to: [`Suporte Legisfy <${FROM_EMAIL}>`],
    });

    console.log("[request-password-reset] Email sent:", emailResponse?.id || emailResponse);

    return new Response(JSON.stringify({ success: true, message: "Email enviado", id: emailResponse.id }), {
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