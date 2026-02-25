import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-app-base-url",
};

// Configuração do email FROM usando variável de ambiente
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "time@legisfy.app.br";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to get template from database and replace placeholders
const getEmailTemplate = async (type: string, variables: Record<string, string>) => {
  console.log(`📧 Buscando template para tipo: ${type}`);

  try {
    // Test database connection first
    const { count } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de templates no banco: ${count}`);

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
      console.log(`⚠️ Template ${type} não encontrado no banco`);
      throw new Error(`Template ${type} não encontrado`);
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
    console.error(`❌ Erro ao processar template ${type}:`, error);
    throw error;
  }
};

interface ConvitePrincipalRequest {
  email: string;
  nomeConvidado: string;
  nomeInstituicao: string;
  nomeConvidador: string;
  cargo: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se a chave API está disponível
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("Verificando chave API:", resendApiKey ? "Chave encontrada" : "Chave não encontrada");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY não encontrada nas variáveis de ambiente");
      return new Response(
        JSON.stringify({ error: "Configuração de email não encontrada" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const {
      email,
      nomeConvidado,
      nomeInstituicao,
      nomeConvidador,
      cargo,
      token
    }: ConvitePrincipalRequest = await req.json();

    // Build base URL from header or env, fallback to staging domain
    const headerBase = req.headers.get('x-app-base-url');
    const baseUrl = (headerBase && headerBase.trim()) || Deno.env.get('APP_BASE_URL') || 'https://legisfy.lovable.app';
    const acceptUrl = `${baseUrl}/onboarding?token=${token}`;

    console.log('Tentando enviar email para:', email);
    console.log('URL de aceitação:', acceptUrl);

    // Preparar variáveis para o template (seguindo exatamente o que está no template)
    const templateVariables = {
      name: nomeConvidado || '',
      institution: nomeInstituicao || '',
      link: acceptUrl
    };

    console.log('📧 Buscando template invite_politico do banco de dados...');

    // Buscar template do banco de dados
    const template = await getEmailTemplate('invite_politico', templateVariables);

    console.log("📧 Enviando email com template do banco:", {
      from: `Legisfy <${FROM_EMAIL}>`,
      to: email,
      subject: template.subject
    });

    const emailResponse = await resend.emails.send({
      from: `Legisfy <${FROM_EMAIL}>`,
      to: [email],
      subject: template.subject,
      reply_to: [`Suporte Legisfy <${FROM_EMAIL}>`],
      html: template.html,
    });

    console.log("Convite principal enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar convite principal:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);