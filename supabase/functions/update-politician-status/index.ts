import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateStatusRequest {
  email: string;
  institution_id: string;
}

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

    const { email, institution_id }: UpdateStatusRequest = await req.json();

    console.log("Updating politician status for:", { email, institution_id });

    // Buscar a câmara correspondente à instituição
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('name')
      .eq('id', institution_id)
      .single();

    if (instError) {
      console.error("Error finding institution:", instError);
      throw instError;
    }

    // Buscar a câmara pelo nome da instituição
    const { data: camara, error: camaraError } = await supabase
      .from('camaras')
      .select('id')
      .eq('nome', institution.name)
      .single();

    if (camaraError) {
      console.error("Error finding camara:", camaraError);
      throw camaraError;
    }

    // Atualizar o status do político autorizado de "pendente" para "aceito"
    const { data: updatedPolitico, error: updateError } = await supabase
      .from('politicos_autorizados')
      .update({ 
        status: 'aceito',
        data_utilizacao: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())
      .eq('camara_id', camara.id)
      .eq('status', 'pendente')
      .select()
      .single();

    if (updateError) {
      console.error("Error updating politician status:", updateError);
      throw updateError;
    }

    // Marcar o convite como aceito
    const { error: inviteError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())
      .eq('institution_id', institution_id);

    if (inviteError) {
      console.error("Error updating invitation status:", inviteError);
      // Não vamos falhar por causa disso, apenas loggar o erro
    }

    console.log("Politician status updated successfully:", updatedPolitico);

    return new Response(
      JSON.stringify({ 
        success: true, 
        politician: updatedPolitico 
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
    console.error("Error in update-politician-status:", error);
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