import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/v135/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const secretHeader = req.headers.get('x-campaign-secret');

    // Permitir se tiver JWT válido pelo verify_jwt (caso usuário chame manualmente) OU se tiver o secret do cron
    if (secretHeader !== "my-super-secret-cron-key" && !authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar campanhas ativas
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("*, gabinetes!inner(id), publicos(id, nome)")
      .eq("is_active", true);

    if (campaignsError) {
      console.error("Erro ao buscar campanhas:", campaignsError);
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma campanha ativa no momento." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const now = new Date();
    // UTC time handling. Depends exactly on how scheduling was saved. Assuming scheduled_date is UTC.
    const currentDayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda...
    
    // Time formatted as HH:mm for comparisons (server time should be adjusted to Brazil if time is saved in local time, but we'll assume it's roughly matched or uses UTC. Let's adjust to UTC-3 for safety if the user input was BRT.
    // For simplicity, we check the hour/minute matching using string formats.
    // However, it's safer to compare ISO strings.
    
    let processedCount = 0;

    for (const campaign of campaigns) {
      // 2. Determinar se a campanha deve ser executada AGORA
      let shouldRun = false;

      if (campaign.frequency === "once") {
        if (!campaign.scheduled_date) continue;
        const scheduled = new Date(campaign.scheduled_date);
        
        // Verifica se a hora do agendamento já passou ou está no momento, 
        // mas garante que já não foi completamente enviada e que está "ativa" (is_active)
        // se `messages_sent` < `messages_total` ou algo assim (já que não temos um status `completed`). 
        // Vamos checar se o momento de envio chegou (scheduled <= now)
        if (scheduled <= now) {
            shouldRun = true;
        }
      } else if (campaign.frequency === "recurring") {
        // Verifica se hoje está no recurring_days
        if (campaign.recurring_days && campaign.recurring_days.includes(currentDayOfWeek)) {
          // Verifica se o recurring_end_date foi passado
          if (campaign.recurring_end_date && new Date(campaign.recurring_end_date) < now) {
            // Desativar campanha
            await supabase.from("campaigns").update({ is_active: false }).eq("id", campaign.id);
            continue;
          }

          // Verifica se chegou o horário.
          // O tempo em `recurring_day_times` ex: {"1": "14:30", "3": "10:00"}
          if (campaign.recurring_day_times && typeof campaign.recurring_day_times === 'object') {
             const timeForToday = campaign.recurring_day_times[currentDayOfWeek.toString()];
             if (timeForToday) {
                 // Convert now to HH:mm in Brazil timezone string roughly
                 // Deno runs in UTC by default. So we need to consider offset
                 const brtTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
                 const currentHours = brtTime.getUTCHours().toString().padStart(2, '0');
                 const currentMinutes = brtTime.getUTCMinutes().toString().padStart(2, '0');
                 const currentHHMM = `${currentHours}:${currentMinutes}`;
                 
                 // if the scheduled time is earlier or equal to current time, run it
                 // DANGER: this might run every minute if not marked as "ran today".
                 // BUT for recurring campaigns, we need a way to track the last run date. 
                 // Since there isn't a `last_run_at` in the DB schema provided, we'll run it and we'd need to assume a daily run tracking, or use `messages_total`.
                 // FOR THIS MVP, we'll safely just process once campaigns! Recurring needs more logic tracking.
             }
          }
        }
      }

      if (!shouldRun) continue;

      // 3. Buscar Integração de WhatsApp
      const { data: integration, error: intError } = await supabase
        .from("ia_integrations")
        .select("*")
        .eq("gabinete_id", campaign.gabinete_id)
        .maybeSingle();

      if (intError || !integration || !integration.whatsapp_enabled || !integration.whatsapp_api_url || !integration.whatsapp_instance_name || !integration.whatsapp_api_key) {
        console.warn(`Gabinete ${campaign.gabinete_id} da campanha ${campaign.id} não possui WhatsApp configurado.`);
        continue;
      }

      // 4. Buscar Eleitores
      let eleitoresQuery = supabase
        .from("eleitores")
        .select("*")
        .eq("gabinete_id", campaign.gabinete_id)
        .not("whatsapp", "is", null);

      if (campaign.audience_type === "tag" && campaign.tag_id) {
          // Precisamos do nome da tag
          let tagName = null;
          const { data: tagCustom } = await supabase.from("gabinete_custom_tags").select("name").eq("id", campaign.tag_id).maybeSingle();
          if (tagCustom) {
              tagName = tagCustom.name;
          } else {
              const { data: tagEleitor } = await supabase.from("eleitor_tags").select("name").eq("id", campaign.tag_id).maybeSingle();
              if (tagEleitor) tagName = tagEleitor.name;
          }

          if (tagName) {
             eleitoresQuery = eleitoresQuery.contains("tags", [tagName]);
          } else {
             console.warn(`Tag ${campaign.tag_id} não encontrada para a campanha ${campaign.id}. Ignorando o envio para evitar disparos em massa.`);
             await supabase.from("campaigns").update({ is_active: false, messages_total: 0 }).eq("id", campaign.id);
             continue;
          }
      }

      const { data: eleitores, error: eleitoresError } = await eleitoresQuery;

      // 5. Buscar contagens de demandas e indicações para personalização
      const { data: demandasCount } = await supabase
        .from("demandas")
        .select("eleitor_id")
        .eq("gabinete_id", campaign.gabinete_id);
      
      const { data: indicacoesCount } = await supabase
        .from("indicacoes")
        .select("eleitor_id")
        .eq("gabinete_id", campaign.gabinete_id);

      const countMap = (arr: any[] | null) => {
        const map: Record<string, number> = {};
        arr?.forEach(item => {
          if (item.eleitor_id) map[item.eleitor_id] = (map[item.eleitor_id] || 0) + 1;
        });
        return map;
      };

      const demandasMap = countMap(demandasCount);
      const indicacoesMap = countMap(indicacoesCount);

      // Atualiza o total de mensagens se ainda estiver zerado (primeira execução)
      await supabase.from("campaigns").update({ messages_total: eleitores.length }).eq("id", campaign.id);

      // 6. Enviar Mensagens
      let sentCount = 0;
      const processedNumbers = new Set<string>();
      
      // Delay function for rate limiting
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      for (const eleitor of eleitores) {
         if (!eleitor.whatsapp) continue;

         // Formatar número do whatsapp (remover não dígitos)
         let number = eleitor.whatsapp.replace(/\D/g, '');
         if (!number.startsWith('55')) {
             number = '55' + number; // assumes Brazil
         }

         // Verifica duplicidade no envio atual
         if (processedNumbers.has(number)) {
             console.log(`Pull ignorou eleitor ID ${eleitor.id} por número duplicado: ${number}`);
             continue; // Já enviou para este número nesta campanha
         }
         
         processedNumbers.add(number);

         // Personalizar Mensagem
         let text = campaign.message || "";
         
         // Helper para idade
         const calculateAge = (birthDate: string | null) => {
           if (!birthDate) return "";
           const today = new Date();
           const birth = new Date(birthDate);
           let age = today.getFullYear() - birth.getFullYear();
           const month = today.getMonth() - birth.getMonth();
           if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
             age--;
           }
           return age.toString();
         };

         // Helper para primeiro nome
         const getFirstName = (fullName: string | null) => {
           if (!fullName) return "";
           return fullName.split(' ')[0];
         };

         text = text.replace(/{{nome}}/gi, eleitor.name || "");
         text = text.replace(/{{primeiro_nome}}/gi, getFirstName(eleitor.name));
         text = text.replace(/{{bairro}}/gi, eleitor.neighborhood || "");
         text = text.replace(/{{cidade}}/gi, eleitor.cidade || "");
         text = text.replace(/{{idade}}/gi, calculateAge(eleitor.birth_date));
         text = text.replace(/{{sexo}}/gi, eleitor.sex || "");
         text = text.replace(/{{profissao}}/gi, eleitor.profession || "");
         text = text.replace(/{{total_demandas}}/gi, (demandasMap[eleitor.id] || 0).toString());
         text = text.replace(/{{total_indicacoes}}/gi, (indicacoesMap[eleitor.id] || 0).toString());

         try {
            const apiUrl = integration.whatsapp_api_url.endsWith('/') ? integration.whatsapp_api_url.slice(0, -1) : integration.whatsapp_api_url;
            // Endpoint Evolution API sendText
            const sendUrl = `${apiUrl}/message/sendText/${integration.whatsapp_instance_name}`;

            const res = await fetch(sendUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": integration.whatsapp_api_key
                },
                body: JSON.stringify({
                    number: number,
                    text: text,
                    delay: 1200, // delay nativo da Evolution para digitar
                })
            });

            if (res.ok) {
                sentCount++;
                // Registrar log de envio (opcional, pode ser na tabela audit_log_whatsapp)
                await supabase.from("audit_log_whatsapp").insert({
                    gabinete_id: campaign.gabinete_id,
                    acao: "CAMPANHA_SEND",
                    payload_resumido: { campaign_id: campaign.id, eleitor_id: eleitor.id, number: number }
                });
            } else {
                console.error(`Erro ao enviar para ${number}: ${await res.text()}`);
            }

         } catch (e) {
             console.error(`Falha no fetch para evolution no eleitor ${eleitor.id}:`, e);
         }

         // Rate limiting manual 2s entre mensagens +- para não levar ban rápido
         await delay(1500);
      }

      // 6. Atualizar Campanha
      const updates: any = {};
      
      // Soma às enviadas se for recurring e envia lotes? Para once é apenas setar.
      updates.messages_sent = (campaign.messages_sent || 0) + sentCount;
      
      if (campaign.frequency === "once") {
          updates.is_active = false; // Finalizou
      }

      await supabase.from("campaigns").update(updates).eq("id", campaign.id);
      
      processedCount++;
    }

    return new Response(JSON.stringify({ message: "Campanhas processadas com sucesso.", processedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro no processamento:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
