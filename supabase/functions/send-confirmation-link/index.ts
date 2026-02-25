import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://preview--legisfyapp-15.lovable.app";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, redirectTo } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const redirect = typeof redirectTo === "string" && redirectTo.length > 0
      ? redirectTo
      : `${APP_BASE_URL}/auth`;

    console.log("[send-confirmation-link] Generating confirmation link for:", email, "redirect:", redirect);

    // Try to generate a signup confirmation link
    let link: string | null = null;
    try {
      const { data, error } = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        options: { emailRedirectTo: redirect },
      } as any);

      if (error) {
        console.error("generateLink(signup) error:", error);
      } else {
        // supabase-js v2 returns data.action_link
        link = (data as any)?.action_link || (data as any)?.properties?.action_link || null;
      }
    } catch (e) {
      console.error("Exception generating signup link:", e);
    }

    // Fallback to magiclink if signup link not available
    if (!link) {
      try {
        const { data, error } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { emailRedirectTo: redirect },
        } as any);
        if (error) {
          console.error("generateLink(magiclink) error:", error);
        } else {
          link = (data as any)?.action_link || (data as any)?.properties?.action_link || null;
        }
      } catch (e) {
        console.error("Exception generating magic link:", e);
      }
    }

    if (!link) {
      return new Response(JSON.stringify({ error: "Não foi possível gerar o link de confirmação" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send via Resend
    const from = Deno.env.get("FROM_EMAIL") || "Legisfy <suporte@legisfy.app.br>";

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme seu e-mail - Legisfy</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #FF6B00 0%, #FF3D6B 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; background: #ffffff; }
        .content h2 { color: #2d3748; font-size: 22px; margin: 0 0 20px 0; font-weight: 600; }
        .content p { color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px; }
        .button { display: inline-block; background: linear-gradient(135deg, #FF6B00 0%, #FF3D6B 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3); }
        .button:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(255, 107, 0, 0.4); }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 14px; margin: 5px 0; }
        .link { color: #4a90e2; word-break: break-all; font-size: 14px; }
        @media (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 30px 20px !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Confirme seu e-mail</h1>
            <p>Complete seu cadastro no Legisfy</p>
        </div>
        
        <div class="content">
            <h2>Olá!</h2>
            <p>Para concluir seu cadastro e começar a usar o <strong>Legisfy</strong>, confirme seu e-mail clicando no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" class="button">Confirmar e-mail e acessar</a>
            </div>
            
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p class="link"><a href="${link}">${link}</a></p>
            
            <p><strong>Importante:</strong> Este link expira em 24 horas por segurança.</p>
        </div>
        
        <div class="footer">
            <p><strong>Legisfy</strong> - Plataforma de Gestão Parlamentar</p>
            <p>Este é um email automático, não responda.</p>
            <p>© 2024 Legisfy. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from,
      to: [email],
      subject: "Confirme seu e-mail - Legisfy",
      html,
    });

    console.log("[send-confirmation-link] Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("[send-confirmation-link] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
