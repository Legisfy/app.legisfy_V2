import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log("🔧 Starting gabinete names correction...");

    // Buscar todos os gabinetes com seus políticos e câmaras
    const { data: gabinetes, error: gabineteError } = await supabase
      .from('gabinetes')
      .select(`
        id,
        nome,
        politico_id,
        camaras!inner (
          id,
          nome,
          tipo
        ),
        profiles!inner (
          full_name,
          sex
        )
      `)
      .eq('status', 'ativo');

    if (gabineteError) {
      console.error("❌ Error fetching gabinetes:", gabineteError);
      throw gabineteError;
    }

    console.log(`📊 Found ${gabinetes?.length || 0} gabinetes to process`);

    let updatedCount = 0;
    const results = [];

    if (gabinetes && gabinetes.length > 0) {
      for (const gabinete of gabinetes) {
        try {
          const camara = gabinete.camaras;
          const profile = gabinete.profiles;
          
          if (!camara || !profile) {
            console.log(`⚠️ Skipping gabinete ${gabinete.id} - missing data`);
            continue;
          }

          const camaraTipo = camara.tipo;
          const fullName = profile.full_name;
          const gender = profile.sex;
          
          // Determinar cargo político baseado no tipo da câmara
          const positionType = camaraTipo === 'estadual' ? 'Deputado' : 'Vereador';
          
          // Criar nome político (primeiro nome + último sobrenome)
          const nomeParts = fullName.trim().split(' ');
          const nomePolitico = nomeParts.length > 1 
            ? `${nomeParts[0]} ${nomeParts[nomeParts.length - 1]}`
            : nomeParts[0];
          
          // Determinar artigo e cargo baseado no gênero
          let article = 'do';
          let position = positionType;
          
          if (gender?.toLowerCase() === 'feminino') {
            article = 'da';
            position = positionType === 'Deputado' ? 'Deputada' : 'Vereadora';
          } else if (gender?.toLowerCase() === 'nao_binario' || gender?.toLowerCase() === 'não binário') {
            article = 'do(a)';
            position = positionType === 'Deputado' ? 'Deputado(a)' : 'Vereador(a)';
          }
          
          // Novo nome do gabinete
          const novoNome = `Gabinete ${article} ${position} ${nomePolitico}`;
          
          // Verificar se precisa atualizar
          if (gabinete.nome !== novoNome) {
            console.log(`🔄 Updating: "${gabinete.nome}" -> "${novoNome}"`);
            
            const { error: updateError } = await supabase
              .from('gabinetes')
              .update({ nome: novoNome })
              .eq('id', gabinete.id);
            
            if (updateError) {
              console.error(`❌ Error updating gabinete ${gabinete.id}:`, updateError);
              results.push({
                gabinete_id: gabinete.id,
                old_name: gabinete.nome,
                new_name: novoNome,
                success: false,
                error: updateError.message
              });
            } else {
              console.log(`✅ Successfully updated gabinete ${gabinete.id}`);
              updatedCount++;
              results.push({
                gabinete_id: gabinete.id,
                old_name: gabinete.nome,
                new_name: novoNome,
                success: true
              });
            }
          } else {
            console.log(`✓ Gabinete ${gabinete.id} already has correct name: "${gabinete.nome}"`);
            results.push({
              gabinete_id: gabinete.id,
              name: gabinete.nome,
              success: true,
              already_correct: true
            });
          }
        } catch (error) {
          console.error(`❌ Error processing gabinete ${gabinete.id}:`, error);
          results.push({
            gabinete_id: gabinete.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    console.log(`🎉 Correction completed! Updated ${updatedCount} gabinetes`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully updated ${updatedCount} gabinete names`,
        total_processed: gabinetes?.length || 0,
        updated_count: updatedCount,
        results
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
    console.error("❌ Error in fix-gabinete-names:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);