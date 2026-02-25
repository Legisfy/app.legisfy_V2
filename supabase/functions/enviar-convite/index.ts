
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "time@legisfy.app.br";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Function to get template from database
const getEmailTemplate = async (type: string, variables: Record<string, string>) => {
  console.log(`📧 Buscando template para tipo: ${type}`);

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error(`❌ Erro ao buscar template ${type}:`, error);
      throw error;
    }

    if (!template) {
      console.log(`⚠️ Template ${type} não encontrado, usando fallback`);
      return getFallbackTemplate(variables);
    }

    console.log(`✅ Template ${type} encontrado: ${template.name}`);

    // Replace placeholders in both subject and HTML content
    let subject = template.subject;
    let html = template.html_content;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      html = html.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject, html };
  } catch (error) {
    console.error(`❌ Erro ao processar template:`, error);
    return getFallbackTemplate(variables);
  }
};

// Fallback template 
const getFallbackTemplate = (variables: Record<string, string>) => {
  console.log(`🔄 Usando template fallback`);

  return {
    subject: "Convite para criar gabinete - Legisfy",
    html: `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Convite Legisfy</title>
    <style>
      @media (max-width:600px){
        .container{width:100% !important}
        .px{padding-left:20px !important;padding-right:20px !important}
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#121212;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Você foi autorizado(a) a criar seu gabinete na Legisfy.
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#121212;">
      <tr>
        <td align="center" style="padding:32px 16px;">

          <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="container" style="width:600px; max-width:600px; background:#1e1e1e; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.35);">
            
            <tr>
              <td align="left" class="px" style="padding:28px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="left">
                      <div style="font:700 18px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#ffffff;">
                        Legisfy ⚖️
                      </div>
                    </td>
                    <td align="right" style="font:600 12px/1 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#9aa3b2;">
                      Convite para criação de gabinete
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding:24px 32px 0 32px;">
                <h1 style="margin:0; font:800 22px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#ffffff;">
                  Olá ${variables.name}, seu acesso foi autorizado
                </h1>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding:12px 32px 0 32px;">
                <div style="display:inline-block; padding:12px 16px; border-radius:12px; background:#252525; font:600 14px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#c9cfdd;">
                  ${variables.institution || 'Instituição'}
                </div>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding:12px 32px 0 32px;">
                <p style="margin:0; font:400 15px/1.7 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#c9cfdd;">
                  Você foi autorizado(a) a criar seu gabinete na plataforma <strong style="color:#ffffff;">Legisfy</strong>.
                  Para iniciar e usar todos os recursos, clique no botão abaixo.
                </p>
              </td>
            </tr>

            <tr>
              <td align="left" class="px" style="padding:24px 32px 0 32px;">
                <a href="${variables.link}"
                   style="display:inline-block; text-decoration:none; font:700 15px/1 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#ffffff;
                          background:linear-gradient(90deg,#FF6B00 0%,#FF3D6B 100%);
                          padding:14px 28px; border-radius:999px;">
                  Criar meu gabinete
                </a>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding:18px 32px 0 32px;">
                <p style="margin:0; font:400 12px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#9aa3b2;">
                  Se o botão não funcionar, copie e cole este link no navegador:<br>
                  <span style="word-break:break-all; color:#c9cfdd;">${variables.link}</span>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 0 32px;">
                <div style="height:1px; background:linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));"></div>
              </td>
            </tr>

            <tr>
              <td class="px" style="padding:16px 32px 28px 32px;">
                <p style="margin:0 0 8px 0; font:400 12px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#9aa3b2;">
                  Este convite é exclusivo para o seu usuário e instituição. Se não reconhece este pedido, ignore.
                </p>
                <p style="margin:0; font:400 12px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#9aa3b2;">
                  — Equipe Legisfy
                </p>
              </td>
            </tr>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="container" style="width:600px; max-width:600px;">
            <tr>
              <td align="center" style="padding:16px 10px 0 10px; font:400 11px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#777;">
                © Legisfy. Todos os direitos reservados.
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`
  };
};

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Iniciando função enviar-convite");

    // Parse request body
    const body = await req.json().catch(() => ({}));
    console.log("📧 Payload recebido:", safeStringify(body));

    // Check required environment variables
    if (!RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY não configurado");
      return new Response(safeStringify({
        success: false,
        error: "RESEND_API_KEY não configurado",
        details: "Configure a chave API do Resend nas secrets"
      }), {
        status: 500,
        headers: { "content-type": "application/json", ...corsHeaders }
      });
    }

    // Validate required fields
    const { type, name, email, institution, link } = body;
    if (!email || !name || !link) {
      console.error("❌ Campos obrigatórios ausentes:", { email: !!email, name: !!name, link: !!link });
      return new Response(safeStringify({
        success: false,
        error: "Campos obrigatórios ausentes",
        required: ["email", "name", "link"]
      }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders }
      });
    }

    console.log(`📤 Enviando email para: ${email}`);

    // Get email template from database
    const variables = {
      name,
      institution: institution || 'Instituição',
      cabinet: institution || 'Gabinete do Vereador',
      link
    };
    const template = await getEmailTemplate(type || 'invite_politico', variables);

    console.log("📮 Chamando API do Resend...");
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Legisfy <${FROM_EMAIL}>`,
        to: [email],
        subject: template.subject,
        html: template.html,
      }),
    });

    const resendResponseText = await resendResponse.text();
    console.log(`📬 Resposta do Resend (${resendResponse.status}):`, resendResponseText);

    if (!resendResponse.ok) {
      console.error("❌ Erro do Resend:", resendResponseText);
      return new Response(safeStringify({
        success: false,
        error: "Falha no envio do email",
        resendError: resendResponseText,
        status: resendResponse.status
      }), {
        status: 502,
        headers: { "content-type": "application/json", ...corsHeaders }
      });
    }

    const resendData = JSON.parse(resendResponseText);
    console.log("✅ Email enviado com sucesso:", resendData);

    return new Response(safeStringify({
      success: true,
      message: "Email enviado com sucesso",
      emailId: resendData.id,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "content-type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error("💥 Erro na função enviar-convite:", error);
    return new Response(safeStringify({
      success: false,
      error: "Erro interno da função",
      details: error.message || String(error)
    }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders }
    });
  }
});
