import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "time@legisfy.app.br";
const APP_URL = "https://app.legisfy.app.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-legisfy, x-client-info, apikey, content-type, x-app-base-url",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

console.log("📧 Mail dispatcher iniciado com chave:", Deno.env.get("RESEND_API_KEY") ? "✅ Presente" : "❌ Ausente");

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function successResponse(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
}

function errorResponse(status: number, message: string) {
  console.error(`❌ Erro ${status}: ${message}`);
  return new Response(JSON.stringify({ error: message, success: false }), { status, headers: corsHeaders });
}

// Template de email - ID Visual: Preto, Grafite, Branco, Prata/Metálico
function createEmailTemplate(options: {
  title: string;
  subtitle?: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
  preheader?: string;
}) {
  const { title, subtitle, body, buttonText, buttonUrl, preheader } = options;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;background-color:#000000;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#000000;">${preheader}</div>` : ''}
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="https://wvvxstgpjodmfxpekhkf.supabase.co/storage/v1/object/public/LEGISFY/legisfy%20branco.png" alt="Legisfy" height="48" style="height:48px;display:block;" />
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background-color:#09090b;border:1px solid rgba(255,255,255,0.05);border-radius:16px;overflow:hidden;">
              
              <!-- Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#09090b;border-bottom:1px solid rgba(255,255,255,0.05);padding:32px 32px 24px 32px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;letter-spacing:-0.02em;">${title}</h1>
                    ${subtitle ? `<p style="margin:10px 0 0 0;color:rgba(255,255,255,0.40);font-size:14px;line-height:1.4;font-weight:500;">${subtitle}</p>` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- Body Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;color:rgba(255,255,255,0.50);font-size:15px;line-height:1.7;">
                    ${body}
                    
                    ${buttonText && buttonUrl ? `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                      <tr>
                        <td align="center">
                          <a href="${buttonUrl}" style="display:inline-block;background-color:#ffffff;color:#000000;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:-0.01em;">${buttonText}</a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- Warning -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 32px 24px 32px;">
                    <div style="background-color:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:14px 16px;">
                      <p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px;line-height:1.5;">Se você não reconhece este convite, ignore este email. Nenhuma ação será tomada automaticamente.</p>
                    </div>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0 0 4px 0;color:rgba(255,255,255,0.20);font-size:11px;"><strong>Legisfy</strong> · Plataforma de Gestão Parlamentar</p>
              <p style="margin:0;color:rgba(255,255,255,0.12);font-size:10px;">© 2025 Legisfy. Todos os direitos reservados.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const getEmailTemplate = async (type: string, variables: Record<string, string>) => {
  try {
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!template) return getFallbackTemplate(type, variables);

    let subject = template.subject;
    let html = template.html_content;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      html = html.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject, html };
  } catch (error) {
    return getFallbackTemplate(type, variables);
  }
};

const getFallbackTemplate = (type: string, variables: Record<string, string>) => {
  const fallbacks: Record<string, { subject: string; html: string }> = {
    invite_politico: {
      subject: `Convite para criar seu gabinete – ${variables.institution || 'Legisfy'}`,
      html: createEmailTemplate({
        title: "Você foi autorizado!",
        subtitle: "Crie seu gabinete parlamentar no Legisfy",
        preheader: `${variables.name}, você foi autorizado a criar seu gabinete`,
        body: `
          <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 16px 0;letter-spacing:-0.02em;">Olá, ${variables.name}!</h2>
          <p style="margin:0 0 12px 0;">Você foi autorizado a criar seu gabinete na <strong style="color:#ffffff;">${variables.institution}</strong>.</p>
          <p style="margin:0;">Clique no botão abaixo para iniciar a configuração do seu gabinete.</p>
        `,
        buttonText: "Criar meu Gabinete →",
        buttonUrl: variables.link
      })
    },
    welcome_politico: {
      subject: "Gabinete criado com sucesso! – Legisfy",
      html: createEmailTemplate({
        title: "Bem-vindo ao Legisfy!",
        subtitle: "Seu gabinete foi criado com sucesso",
        body: `
          <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 16px 0;">Parabéns, ${variables.name}!</h2>
          <p style="margin:0;">Seu gabinete parlamentar está pronto para uso. Acesse a plataforma para configurar sua equipe.</p>
        `,
        buttonText: "Acessar Gabinete →",
        buttonUrl: APP_URL
      })
    },
    invite_chefe: {
      subject: `Convite: Chefe de Gabinete – ${variables.cabinet}`,
      html: createEmailTemplate({
        title: "Convite para Chefe de Gabinete",
        subtitle: variables.cabinet,
        body: `
          <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 16px 0;">Olá, ${variables.name}!</h2>
          <p style="margin:0 0 12px 0;">Você foi convidado(a) para ser <strong style="color:#ffffff;">Chefe de Gabinete</strong> no gabinete <strong style="color:#ffffff;">${variables.cabinet}</strong>.</p>
          <p style="margin:0;">Clique abaixo para aceitar o convite e criar sua conta.</p>
        `,
        buttonText: "Aceitar Convite →",
        buttonUrl: variables.link
      })
    },
    welcome_chefe: {
      subject: "Conta ativada como Chefe de Gabinete – Legisfy",
      html: createEmailTemplate({
        title: "Conta Ativada!",
        subtitle: "Você agora é Chefe de Gabinete",
        body: `
          <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 16px 0;">Bem-vindo(a), ${variables.name}!</h2>
          <p style="margin:0;">Sua conta como Chefe de Gabinete foi ativada com sucesso.</p>
        `,
        buttonText: "Acessar Plataforma →",
        buttonUrl: APP_URL
      })
    },
    invite_assessor: {
      subject: `Convite: Assessor – ${variables.cabinet}`,
      html: createEmailTemplate({
        title: "Convite para Assessor",
        subtitle: variables.cabinet,
        body: `
          <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 16px 0;">Olá${variables.name ? `, ${variables.name}` : ''}!</h2>
          <p style="margin:0 0 12px 0;">Você foi convidado(a) para integrar a equipe como <strong style="color:#ffffff;">Assessor</strong> no gabinete <strong style="color:#ffffff;">${variables.cabinet}</strong>.</p>
          <p style="margin:0;">Clique abaixo para aceitar o convite e criar sua conta.</p>
        `,
        buttonText: "Aceitar Convite →",
        buttonUrl: variables.link
      })
    },
    welcome_assessor: {
      subject: "Conta criada como Assessor – Legisfy",
      html: createEmailTemplate({
        title: "Conta Criada!",
        subtitle: "Você agora faz parte da equipe",
        body: `
          <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 16px 0;">Bem-vindo(a), ${variables.name}!</h2>
          <p style="margin:0;">Sua conta como Assessor no gabinete <strong style="color:#ffffff;">${variables.cabinet}</strong> foi criada.</p>
        `,
        buttonText: "Acessar Plataforma →",
        buttonUrl: APP_URL
      })
    }
  };

  return fallbacks[type] || {
    subject: "Legisfy",
    html: createEmailTemplate({
      title: "Legisfy",
      body: "<p style='margin:0;'>Esta é uma mensagem do Legisfy.</p>",
      buttonText: "Acessar →",
      buttonUrl: APP_URL
    })
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse(405, "Método não permitido.");

  try {
    const payload = await req.json();
    if (!payload?.type || !payload?.email) return errorResponse(400, "Campos obrigatórios: type e email");
    if (!RESEND_API_KEY) return errorResponse(500, "Chave API do Resend não configurada");

    const resend = new Resend(RESEND_API_KEY);

    const sendEmail = async (subject: string, html: string, to: string) => {
      const result = await resend.emails.send({
        from: `Legisfy <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
        reply_to: [`Suporte Legisfy <${FROM_EMAIL}>`]
      });
      if (result.error) throw new Error(`Resend: ${result.error.message || JSON.stringify(result.error)}`);
      if (!result?.data?.id) throw new Error("Falha ao enviar email");
      console.log(`✅ Email enviado! ID: ${result.data.id}`);
      return result;
    };

    let variables: Record<string, string> = {};

    switch (payload.type) {
      case "invite_politico": {
        const { name, institution, link } = payload;
        if (!name || !institution || !link) return errorResponse(400, "Campos: name, institution, link");
        variables = { name, institution, link };
        break;
      }
      case "welcome_politico": {
        const { name, cabinet } = payload;
        if (!name || !cabinet) return errorResponse(400, "Campos: name, cabinet");
        variables = { name, cabinet };
        break;
      }
      case "invite_chefe": {
        const { name, cabinet, link } = payload;
        if (!name || !cabinet || !link) return errorResponse(400, "Campos: name, cabinet, link");
        variables = { name, cabinet, link };
        break;
      }
      case "welcome_chefe": {
        const { name, cabinet } = payload;
        if (!name) return errorResponse(400, "Campo: name");
        variables = { name, cabinet: cabinet || "" };
        break;
      }
      case "invite_assessor": {
        const { cabinet, link, name } = payload;
        if (!cabinet || !link) return errorResponse(400, "Campos: cabinet, link");
        variables = { cabinet, link, name: name || "" };
        break;
      }
      case "welcome_assessor": {
        const { name, cabinet } = payload;
        if (!name || !cabinet) return errorResponse(400, "Campos: name, cabinet");
        variables = { name, cabinet };
        break;
      }
      default:
        return errorResponse(400, `Tipo não suportado: ${payload.type}`);
    }

    const template = await getEmailTemplate(payload.type, variables);
    const result = await sendEmail(template.subject, template.html, payload.email);

    return successResponse({ success: true, type: payload.type, emailId: result.data.id });
  } catch (error) {
    console.error("❌ Erro:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key")) return errorResponse(500, "Erro de autenticação email");
      if (error.message.includes("domain")) return errorResponse(500, "Domínio não configurado");
      return errorResponse(500, error.message);
    }
    return errorResponse(500, "Erro interno");
  }
});