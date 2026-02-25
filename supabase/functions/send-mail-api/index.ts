import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const payload = await req.json();
    console.log("Send mail API called with:", { type: payload.type, email: payload.email });

    // Check if Resend API key exists
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error("RESEND_API_KEY not found in environment");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Forward to mail-dispatcher function
    const { data: mailResult, error: mailError } = await supabase.functions.invoke('mail-dispatcher', {
      body: payload
    });

    if (mailError) {
      console.error("Error calling mail-dispatcher:", mailError);
      return new Response(
        JSON.stringify({ error: mailError.message || "Mail dispatcher error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Log the mail sending for audit
    const logEntry = {
      email_type: payload.type,
      recipient: payload.email || 'unknown',
      resend_response: mailResult,
      sent_at: new Date().toISOString(),
      success: !mailResult.error
    };

    console.log("Mail sent successfully:", logEntry);

    // If it's an invitation, update the email_sent flag
    if (payload.invitation_id) {
      await supabase
        .from('invitations')
        .update({ 
          email_sent: true, 
          resend_message_id: mailResult.data?.id 
        })
        .eq('id', payload.invitation_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        mail_result: mailResult,
        log: logEntry 
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
    console.error("Error in send-mail-api:", error);
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