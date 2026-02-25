import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido. Use POST." }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    console.log("🧪 Testando conexão com Resend...");
    
    const apiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Chave API do Resend não encontrada",
          details: "Configure a variável RESEND_API_KEY" 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("✅ Chave API encontrada");
    
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email é obrigatório para o teste" 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Inicializar Resend
    const resend = new Resend(apiKey);
    
    console.log(`📧 Enviando email de teste para: ${email}`);

    // Enviar email de teste
    const result = await resend.emails.send({
      from: "Legisfy <suporte@legisfy.app.br>",
      to: [email],
      subject: "🧪 Teste de Conexão - Legisfy",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Teste de Conexão</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF3D6B 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
                        🧪 Teste de Conexão
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
                        Legisfy - Sistema de Email
                    </p>
                </div>
                
                <div style="padding: 30px;">
                    <h2 style="color: #2d3748; margin: 0 0 20px 0;">✅ Conexão Funcionando!</h2>
                    <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0;">
                        Este email confirma que a integração entre o Legisfy e o Resend está funcionando perfeitamente.
                    </p>
                    
                    <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #234e52; margin: 0; font-size: 14px;">
                            <strong>✅ Configuração OK:</strong> Todos os emails de convite e notificações serão enviados normalmente.
                        </p>
                    </div>
                    
                    <div style="margin: 25px 0;">
                        <strong>Detalhes do teste:</strong>
                        <ul style="color: #4a5568; margin: 10px 0; padding-left: 20px;">
                            <li>Data/Hora: ${new Date().toLocaleString('pt-BR')}</li>
                            <li>Destinatário: ${email}</li>
                            <li>Serviço: Resend API</li>
                            <li>Status: Enviado com sucesso</li>
                        </ul>
                    </div>
                    
                    <p style="color: #718096; font-size: 14px; margin: 20px 0 0 0;">
                        Se você recebeu este email, significa que o sistema está pronto para enviar convites e notificações.
                    </p>
                </div>
                
                <div style="background: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #718096; font-size: 12px; margin: 0;">
                        Legisfy - Plataforma de Gestão Parlamentar
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
      reply_to: ["suporte@legisfy.app.br"]
    });

    if (result.error) {
      console.error("❌ Erro do Resend:", result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erro ao enviar email",
          details: result.error 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`✅ Email enviado com sucesso! ID: ${result.data?.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de teste enviado com sucesso!",
        emailId: result.data?.id,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("❌ Erro no teste de email:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Erro interno no teste",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});