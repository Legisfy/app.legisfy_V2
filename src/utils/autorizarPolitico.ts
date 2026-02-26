import { supabase } from "@/integrations/supabase/client";

export interface AutorizarPoliticoInput {
  email: string;
  name: string;
  institutionId: string; // UUID da instituição ativa
}

export async function autorizarPolitico(input: AutorizarPoliticoInput) {
  const { email, name, institutionId } = input;

  console.log("🚀 autorizarPolitico chamada com:", { email, name, institutionId });

  if (!email || !institutionId) {
    throw new Error("Dados obrigatórios ausentes");
  }

  try {
    // 1) Validar instituição
    console.log("🔍 Buscando instituição...");
    const { data: inst, error: e1 } = await supabase
      .from("camaras")
      .select("id, nome")
      .eq("id", institutionId)
      .single();

    if (e1 || !inst) {
      console.error("❌ Instituição não encontrada:", e1);
      throw new Error("Instituição não encontrada");
    }

    console.log("✅ Instituição encontrada:", inst);

    // 2) Criar/atualizar convite principal via RPC
    console.log("🧠 Chamando RPC send_principal_invite...");
    const { data: inviteResp, error: rpcErr } = await supabase
      .rpc('send_principal_invite', { p_email: email, p_institution_id: inst.id });

    if (rpcErr) {
      console.error("❌ Falha na RPC send_principal_invite:", rpcErr);
      throw new Error(`Falha ao criar convite: ${rpcErr.message}`);
    }

    console.log("✅ RPC retornou:", inviteResp);
    console.log("✅ Tipo do retorno:", typeof inviteResp);

    // A RPC retorna JSONB que pode vir como string ou objeto
    let responseData: { success?: boolean; token?: string; invitation_id?: string };

    if (typeof inviteResp === 'string') {
      responseData = JSON.parse(inviteResp);
    } else if (inviteResp && typeof inviteResp === 'object') {
      responseData = inviteResp as { success?: boolean; token?: string; invitation_id?: string };
    } else {
      console.error("❌ Formato de resposta inválido:", inviteResp);
      throw new Error("Formato de resposta da RPC inválido");
    }

    const token = responseData?.token;
    console.log("🔑 Token extraído:", token);
    console.log("🔍 Response data completo:", JSON.stringify(responseData));

    if (!token) {
      console.error("❌ Token não encontrado na resposta da RPC:", inviteResp);
      throw new Error("Falha ao gerar token de convite");
    }

    // Construir URL de aceite do convite - sempre usar /onboarding no domínio principal
    let baseUrl = window.location.hostname === 'localhost'
      ? window.location.origin
      : 'https://app.legisfy.app.br';

    if (window.location.hostname.includes('admin.') && window.location.hostname !== 'localhost') {
      baseUrl = 'https://app.legisfy.app.br';
    }
    const acceptUrl = `${baseUrl}/onboarding?token=${token}`;
    console.log("🔗 URL de aceite gerada:", acceptUrl);

    // 3) Enviar email via mail-dispatcher
    console.log("📧 Enviando email via mail-dispatcher...");
    const payload = {
      type: "invite_politico" as const,
      name,
      email,
      institution: inst.nome,
      link: acceptUrl
    };

    try {
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('mail-dispatcher', {
        body: payload
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        throw new Error(`Falha ao enviar email: ${emailError.message}`);
      }

      console.log("✅ Email enviado com sucesso:", emailResult);
    } catch (err: any) {
      const msg = err?.message || "Falha ao enviar convite.";
      console.error("[autorizarPolitico] erro:", msg, { payload });
      throw new Error(`Erro ao enviar email de convite: ${msg}`);
    }

    console.log("🎉 Processo completo! Convite principal enviado com sucesso");
    return { success: true };

  } catch (error) {
    console.error("💥 Erro geral em autorizarPolitico:", error);
    throw error;
  }
}