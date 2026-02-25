import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Send2FARequest {
  email: string;
  action?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Legisfy <suporte@legisfy.app.br>';

// Função para buscar template de email do banco de dados
async function getEmailTemplate(type: string, variables: Record<string, string>) {
  try {
    console.log(`🔍 [getEmailTemplate] Iniciando busca para tipo: "${type}"`);
    console.log(`📊 [getEmailTemplate] Variáveis recebidas:`, JSON.stringify(Object.keys(variables)));
    
    // Test connection and list all templates
    const { data: allTemplates, error: listError } = await supabase
      .from('email_templates')
      .select('id, type, name, is_active')
      .limit(10);
    
    if (listError) {
      console.error(`❌ [getEmailTemplate] Erro ao listar templates:`, listError);
    } else {
      console.log(`📋 [getEmailTemplate] Templates disponíveis:`, JSON.stringify(allTemplates, null, 2));
    }
    
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('subject, html_content, name, type')
      .eq('type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`❌ [getEmailTemplate] Erro na query para tipo "${type}":`, JSON.stringify(error));
      return getFallbackTemplate(variables);
    }

    if (!template) {
      console.log(`⚠️ [getEmailTemplate] NENHUM template encontrado para tipo "${type}"`);
      console.log(`🔄 [getEmailTemplate] Usando template fallback`);
      return getFallbackTemplate(variables);
    }

    console.log(`✅ [getEmailTemplate] Template encontrado!`);
    console.log(`   📝 Nome: ${template.name}`);
    console.log(`   📧 Subject: ${template.subject}`);
    console.log(`   🏷️ Type: ${template.type}`);

    // Substituir variáveis no template
    let subject = template.subject;
    let html = template.html_content;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      html = html.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject, html };
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return getFallbackTemplate(variables);
  }
}

// Template fallback caso não exista no banco
function getFallbackTemplate(variables: Record<string, string>) {
  return {
    subject: 'Seu código de autenticação - Legisfy',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; font-size: 28px; margin-bottom: 10px;">Legisfy</h1>
          <p style="color: #6b7280; font-size: 16px;">Mandato Inteligente</p>
        </div>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; text-align: center;">
          <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Código de Autenticação</h2>
          <p style="color: #6b7280; font-size: 16px; margin-bottom: 20px;">
            Use o código abaixo para completar seu login:
          </p>
          
          <div style="background-color: #1e40af; color: white; font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: monospace;">
            ${variables.code}
          </div>
          
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
            ⚠️ Este código expira em 5 minutos
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Se você não solicitou este código, ignore este email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #9ca3af; font-size: 12px;">
            © 2024 Legisfy. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action = 'login' }: Send2FARequest = await req.json();
    console.log('Sending 2FA code to:', email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated 2FA code:', code);

    // Buscar informações do usuário e gabinete
    const { data: authUser } = await supabase.auth.admin.listUsers();
    const user = authUser?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    let userName = 'Usuário';
    let gabineteName = '';
    
    if (user) {
      // Buscar nome do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.full_name) {
        userName = profile.full_name;
      }
      
      // Buscar gabinete do usuário
      const { data: gabinete } = await supabase
        .from('gabinetes')
        .select('nome')
        .eq('politico_id', user.id)
        .single();
      
      if (gabinete?.nome) {
        gabineteName = gabinete.nome;
      } else {
        // Tentar buscar por membro de gabinete
        const { data: member } = await supabase
          .from('gabinete_members')
          .select('gabinete_id, gabinetes(nome)')
          .eq('user_id', user.id)
          .limit(1)
          .single();
        
        if (member && member.gabinetes) {
          gabineteName = (member.gabinetes as any).nome;
        }
      }
    }

    // Salvar código no banco com expiração de 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    
    const { error: dbError } = await supabase
      .from('two_factor_codes')
      .upsert({
        email: email.toLowerCase().trim(),
        code,
        expires_at: expiresAt.toISOString(),
        used: false
      }, {
        onConflict: 'email'
      });

    if (dbError) {
      console.error('Erro ao salvar código 2FA:', dbError);
      return new Response(
        JSON.stringify({ error: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Buscar template de email
    const loginLink = `${Deno.env.get('APP_BASE_URL') || 'https://legisfy.app.br'}/auth`;
    
    console.log('🔍 Código gerado antes do template:', code);
    console.log('📧 Buscando template 2fa_code');
    
    const { subject, html } = await getEmailTemplate('2fa_code', {
      codigo: code,
      code: code,
      nome: userName,
      gabinete_name: gabineteName,
      email: email,
      expires_minutes: '5',
      link: loginLink
    });
    
    console.log('✅ Template processado, HTML length:', html.length);
    console.log('🔍 Verificando se código aparece no HTML:', html.includes(code) ? 'SIM' : 'NÃO');

    // Enviar email com código
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: subject,
      html: html,
    });

    console.log("Email 2FA enviado:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Código de autenticação enviado para seu email",
        expires_in: 300 // 5 minutos em segundos
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Erro na função send-2fa-code:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);