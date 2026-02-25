import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('AUTH_WEBHOOK_SECRET') as string;
const fromEmail = Deno.env.get('FROM_EMAIL') || 'suporte@legisfy.app.br';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log('🔐 Webhook de autenticação recebido');
    
    // Verificar webhook signature se secret estiver configurado
    let webhookData: any;
    
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      webhookData = wh.verify(payload, headers);
    } else {
      webhookData = JSON.parse(payload);
    }
    
    const {
      user,
      email_data: { 
        token, 
        token_hash, 
        redirect_to, 
        email_action_type, 
        site_url 
      }
    } = webhookData;

    console.log('📧 Enviando email de autenticação para:', user.email);
    console.log('🔑 Tipo de ação:', email_action_type);

    let subject = 'Acesso ao Legisfy';
    let actionText = 'acessar sua conta';
    let buttonText = 'Acessar Conta';
    
    // Personalizar baseado no tipo de ação
    switch (email_action_type) {
      case 'signup':
        subject = 'Confirme seu email - Legisfy';
        actionText = 'confirmar seu email e ativar sua conta';
        buttonText = 'Confirmar Email';
        break;
      case 'magiclink':
        subject = 'Link de acesso - Legisfy';
        actionText = 'fazer login sem senha';
        buttonText = 'Fazer Login';
        break;
      case 'recovery':
        subject = 'Redefinir senha - Legisfy';
        actionText = 'redefinir sua senha';
        buttonText = 'Redefinir Senha';
        break;
      case 'email_change':
        subject = 'Confirme seu novo email - Legisfy';
        actionText = 'confirmar a alteração do seu email';
        buttonText = 'Confirmar Alteração';
        break;
    }

    // URL de ação baseada no tipo
    const actionUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || site_url)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              margin: 0; 
              padding: 0; 
              background-color: #f8fafc;
              line-height: 1.6;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 { 
              color: white; 
              margin: 0; 
              font-size: 28px; 
              font-weight: 600;
            }
            .logo {
              color: white;
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content { 
              padding: 40px 30px; 
              text-align: center; 
            }
            .content h2 {
              color: #1f2937;
              font-size: 24px;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .content p {
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .button { 
              display: inline-block;
              background: linear-gradient(135deg, #1e40af, #3b82f6);
              color: white !important; 
              text-decoration: none; 
              padding: 16px 32px; 
              border-radius: 8px; 
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
            }
            .code-section {
              background: #f1f5f9;
              border: 2px dashed #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .code { 
              font-size: 24px; 
              font-weight: bold; 
              color: #1e40af; 
              letter-spacing: 2px; 
              font-family: 'Courier New', monospace;
            }
            .footer { 
              background: #f8fafc; 
              padding: 30px; 
              text-align: center; 
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #6b7280; 
              font-size: 14px;
              margin: 5px 0;
            }
            .security-note {
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
              color: #92400e;
            }
            @media (max-width: 600px) {
              .container { margin: 20px; }
              .header, .content, .footer { padding: 20px; }
              .header h1 { font-size: 24px; }
              .content h2 { font-size: 20px; }
            }
          </style>
        </head>
        <body>
          <div style="padding: 20px;">
            <div class="container">
              <div class="header">
                <div class="logo">Legisfy</div>
                <h1>Acesso à Plataforma</h1>
              </div>
              <div class="content">
                <h2>${buttonText}</h2>
                <p>Olá!</p>
                <p>Clique no botão abaixo para ${actionText}:</p>
                
                <a href="${actionUrl}" class="button" target="_blank">
                  ${buttonText}
                </a>
                
                ${token ? `
                  <div class="code-section">
                    <p><strong>Ou use este código:</strong></p>
                    <div class="code">${token}</div>
                  </div>
                ` : ''}
                
                <div class="security-note">
                  <strong>🔒 Segurança:</strong> Este link expira em 24 horas. Se você não solicitou este acesso, pode ignorar este email com segurança.
                </div>
              </div>
              <div class="footer">
                <p><strong>Legisfy</strong> - Plataforma de Gestão Política</p>
                <p>© ${new Date().getFullYear()} Legisfy. Todos os direitos reservados.</p>
                <p>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
                <p style="word-break: break-all; font-size: 12px; color: #9ca3af;">${actionUrl}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `Legisfy <${fromEmail}>`,
      to: [user.email],
      subject,
      html,
      reply_to: [`Suporte Legisfy <${fromEmail}>`],
    });

    console.log('✅ Email de autenticação enviado com sucesso:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email enviado com sucesso',
      emailId: emailResponse.id 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json', 
        ...corsHeaders 
      },
    });

  } catch (error: any) {
    console.error('❌ Erro ao enviar email de autenticação:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json', 
        ...corsHeaders 
      },
    });
  }
});