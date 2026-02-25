import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    subject: `Convite para criar gabinete - Legisfy`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Convite - Legisfy</h1>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>Olá ${variables.name || 'usuário'}!</h2>
          <p>Você foi convidado para acessar a plataforma <strong>Legisfy</strong> da <strong>${variables.institution || 'instituição'}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.link || '#'}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              ✅ Aceitar Convite
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
            <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">${variables.link || '#'}</code>
          </p>
        </div>
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          <p>Atenciosamente,<br><strong>Equipe Legisfy</strong></p>
        </div>
      </div>
    `
  };
};

interface EmailRequest {
  to: string;
  subject: string;
  name: string;
  institution: string;
  link: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== SEND-SIMPLE-EMAIL v3.0 STARTING ===");
    console.log("Timestamp:", new Date().toISOString());
    
    // Check all environment variables for debugging
    const allEnvVars = Deno.env.toObject();
    const resendKeys = Object.keys(allEnvVars).filter(k => k.includes('RESEND'));
    console.log("Environment variables with RESEND:", resendKeys);
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("RESEND_API_KEY exists:", !!resendApiKey);
    
    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not found in environment variables");
      console.log("Available env vars:", Object.keys(allEnvVars).slice(0, 10));
      return new Response(
        JSON.stringify({ 
          error: "RESEND_API_KEY not configured",
          debug: { hasKey: false, envKeysCount: Object.keys(allEnvVars).length }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("✅ RESEND_API_KEY found, length:", resendApiKey.length);

    let requestData;
    try {
      const requestText = await req.text();
      console.log("📨 Raw request body:", requestText);
      requestData = JSON.parse(requestText);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { to, subject, name, institution, link } = requestData as EmailRequest;
    console.log("📧 Email details:", { to, subject, name, institution });

    if (!to || !subject || !name || !institution || !link) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required email fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    // Get email template from database
    const variables = { name, institution, link };
    const template = await getEmailTemplate('invite_politico', variables);

    console.log("🚀 Calling Resend API...");
    
    const emailResponse = await resend.emails.send({
      from: `Legisfy <${Deno.env.get("FROM_EMAIL") || "suporte@legisfy.app.br"}>`,
      to: [to],
      subject: template.subject,
      html: template.html,
    });

    console.log("📬 Resend response:", JSON.stringify(emailResponse, null, 2));

    if (emailResponse.error) {
      console.error("❌ Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: "Email service error",
          details: emailResponse.error 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("✅ Email sent successfully!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: emailResponse,
        message: `Email sent to ${to}`
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("❌ Fatal error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);