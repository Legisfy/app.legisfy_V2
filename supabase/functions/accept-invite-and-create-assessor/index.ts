import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const {
      token,
      password,
      full_name,
      birthdate,
      phone_whatsapp,
      sex,
      avatar_base64_or_path,
      chefe_nome,
      chefe_email,
      // Novos campos para o gabinete
      politician_name,
      partido_id,
      gabinete_nome,
      logomarca_base64
    } = await req.json();

    console.log('🔍 Processing invitation with token:', token);

    // 1. Primeiro tentar buscar como convite de assessor/equipe
    const { data: teamInvitation, error: teamError } = await supabase
      .rpc('get_invitation_details', { invitation_token: token })
      .maybeSingle();

    if (teamInvitation && !teamError) {
      console.log('✅ Found team invitation:', teamInvitation);
      return await handleTeamInvitation(teamInvitation, token, password, full_name, birthdate, phone_whatsapp, sex, avatar_base64_or_path);
    }

    // 2. Se não for convite de equipe, tentar como convite principal (político)
    const { data: invitation, error: invitationError } = await supabase
      .from('principal_invitations')
      .select(`
        *,
        camaras!inner (
          id,
          nome,
          tipo
        )
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .maybeSingle();

    if (invitationError) {
      console.error('❌ Error fetching invitation:', invitationError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao buscar convite' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!invitation) {
      return new Response(JSON.stringify({ 
        error: 'Convite inválido ou expirado' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verificar se já expirou
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ 
        error: 'Convite expirado' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('✅ Valid invitation found for:', invitation.email);

    // 2. Verificar se usuário já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === invitation.email.toLowerCase()
    );

    let user;
    let isNewUser = false;

    if (existingUser) {
      console.log('👤 User already exists:', existingUser.id);
      user = existingUser;
    } else {
      console.log('🔑 Creating new user for:', invitation.email);
      
    // 3. Criar usuário
      try {
        const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
          email: invitation.email,
          password: password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name,
            role: 'politico',
            birth_date: birthdate,
            phone_whatsapp,
            sex
          }
        });

        if (signUpError) {
          console.error('❌ Error creating user:', signUpError);
          console.error('❌ Error details:', JSON.stringify(signUpError, null, 2));
          
          // Check if user already exists
          if (signUpError.message?.includes('User already registered') || 
              signUpError.message?.includes('already been registered')) {
            console.log('🔄 User already exists, trying to find existing user...');
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(
              u => u.email?.toLowerCase() === invitation.email.toLowerCase()
            );
            
            if (existingUser) {
              console.log('✅ Found existing user:', existingUser.id);
              user = existingUser;
              isNewUser = false;
            } else {
              return new Response(JSON.stringify({ 
                error: 'Usuário já existe mas não foi possível localizá-lo' 
              }), {
                status: 400,
                headers: corsHeaders
              });
            }
          } else {
            return new Response(JSON.stringify({ 
              error: 'Falha ao criar conta: ' + signUpError.message 
            }), {
              status: 400,
              headers: corsHeaders
            });
          }
        } else {
          user = authData.user;
          isNewUser = true;
          console.log('✅ User created successfully:', user?.id);
        }
      } catch (createUserException) {
        console.error('❌ Exception creating user:', createUserException);
        return new Response(JSON.stringify({ 
          error: 'Erro interno ao criar usuário: ' + (createUserException instanceof Error ? createUserException.message : 'Erro desconhecido')
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (!user) {
      throw new Error('Falha ao criar/encontrar usuário');
    }

    // 4. Fazer upload do avatar se fornecido
    let avatar_url = null;
    if (avatar_base64_or_path && isNewUser) {
      try {
        // Se for base64, fazer upload
        if (avatar_base64_or_path.startsWith('data:')) {
          const response = await fetch(avatar_base64_or_path);
          const blob = await response.blob();
          const fileExt = blob.type.split('/')[1] || 'jpg';
          const fileName = `${user.id}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, blob, { upsert: true });

          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            avatar_url = publicUrl;
            console.log('✅ Avatar uploaded successfully to:', avatar_url);
          } else {
            console.error('❌ Avatar upload failed:', uploadError);
          }
        }
      } catch (uploadError) {
        console.error('⚠️ Avatar upload failed:', uploadError);
        // Não falhar por causa do upload do avatar
      }
    }

    // 5. Atualizar/criar perfil
    if (isNewUser) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name,
          birth_date: birthdate || null,
          phone_whatsapp: phone_whatsapp || null,
          whatsapp: phone_whatsapp || null, // Also update the whatsapp field
          sex: sex || null,
          avatar_url
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('⚠️ Error updating profile:', profileError);
        // Don't fail because of profile update issues
      } else {
        console.log('✅ Profile updated successfully with avatar_url:', avatar_url);
      }
    } else {
      // For existing users, just update the avatar if provided
      if (avatar_url) {
        const { error: avatarUpdateError } = await supabase
          .from('profiles')
          .update({ avatar_url })
          .eq('user_id', user.id);
        
        if (avatarUpdateError) {
          console.error('⚠️ Error updating avatar for existing user:', avatarUpdateError);
        } else {
          console.log('✅ Avatar updated for existing user');
        }
      }
    }

    // 6. Criar gabinete para o político
    let gabineteId;
    let gabineteNomeFinal;
    
    try {
      // Buscar dados da câmara
      const camara = invitation.camaras;
      const camaraNome = camara?.nome || 'Câmara';
      const camaraTipo = camara?.tipo || 'municipal';
      
      // Se não foi fornecido nome do gabinete, criar um padrão
      if (!gabinete_nome) {
        const cargoPolitico = camaraTipo === 'estadual' ? 'Deputado' : 'Vereador';
        const nomeParts = full_name.trim().split(' ');
        const nomePolitico = nomeParts.length > 1 
          ? `${nomeParts[0]} ${nomeParts[nomeParts.length - 1]}`
          : nomeParts[0];
        gabineteNomeFinal = `Gabinete do ${cargoPolitico} ${nomePolitico}`;
      } else {
        gabineteNomeFinal = gabinete_nome;
      }
      
      console.log('🏛️ Gabinete info:', { camaraTipo, politician_name, gabineteNomeFinal });
      
      console.log('🏛️ Checking for existing gabinete for user:', user.id, 'camara:', invitation.institution_id);
      
      // Verificar se já existe gabinete
      const { data: existingGabinete, error: searchGabineteError } = await supabase
        .from('gabinetes')
        .select('id, nome')
        .eq('politico_id', user.id)
        .eq('camara_id', invitation.institution_id)
        .maybeSingle();
      
      if (searchGabineteError) {
        console.error('❌ Error searching for existing gabinete:', searchGabineteError);
        return new Response(JSON.stringify({ 
          error: 'Erro ao verificar gabinetes existentes: ' + searchGabineteError.message 
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      
      if (existingGabinete) {
        gabineteId = existingGabinete.id;
        gabineteNomeFinal = existingGabinete.nome;
        console.log('✅ Using existing gabinete:', gabineteId);
      } else {
        console.log('🆕 Creating new gabinete:', gabineteNomeFinal);
        
        // Upload da logomarca se fornecida
        let logomarca_url = null;
        if (logomarca_base64) {
          try {
            const response = await fetch(logomarca_base64);
            const blob = await response.blob();
            const fileExt = blob.type.split('/')[1] || 'jpg';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('gabinete-logos')
              .upload(fileName, blob, { upsert: true });

            if (!uploadError && uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from('gabinete-logos')
                .getPublicUrl(fileName);
              logomarca_url = publicUrl;
              console.log('✅ Logomarca uploaded successfully to:', logomarca_url);
            } else {
              console.error('❌ Logomarca upload failed:', uploadError);
            }
          } catch (uploadError) {
            console.error('⚠️ Logomarca upload failed:', uploadError);
          }
        }
        
        console.log('🔍 Gabinete creation parameters:', {
          nome: gabineteNomeFinal,
          politico_id: user.id,
          politician_name: politician_name || full_name,
          camara_id: invitation.institution_id,
          institution_id: invitation.institution_id,
          partido_id: partido_id,
          logomarca_url: logomarca_url,
          status: 'ativo'
        });
        
        // Criar novo gabinete
        const { data: newGabinete, error: gabineteError } = await supabase
          .from('gabinetes')
          .insert({
            nome: gabineteNomeFinal,
            politico_id: user.id,
            politician_name: politician_name || full_name,
            camara_id: invitation.institution_id,
            institution_id: invitation.institution_id,
            partido_id: partido_id,
            logomarca_url: logomarca_url,
            status: 'ativo'
          })
          .select()
          .single();
        
        if (gabineteError) {
          console.error('❌ Error creating gabinete:', gabineteError);
          console.error('❌ Gabinete error details:', JSON.stringify(gabineteError, null, 2));
          return new Response(JSON.stringify({ 
            error: 'Falha ao criar gabinete: ' + gabineteError.message 
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
        
        gabineteId = newGabinete.id;
        console.log('✅ Created new gabinete:', gabineteId);
        
        // Adicionar político ao gabinete_members
        console.log('👥 Adding politician to gabinete_members');
        const { error: memberError } = await supabase
          .from('gabinete_members')
          .insert({
            gabinete_id: gabineteId,
            user_id: user.id,
            role: 'politico'
          });

        if (memberError) {
          console.error('❌ Error adding to gabinete_members:', memberError);
          console.error('❌ Member error details:', JSON.stringify(memberError, null, 2));
          return new Response(JSON.stringify({ 
            error: 'Falha ao adicionar ao gabinete: ' + memberError.message 
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
        
        console.log('✅ Added politician to gabinete_members successfully');
      }
    } catch (gabineteException) {
      console.error('❌ Exception in gabinete creation:', gabineteException);
      return new Response(JSON.stringify({ 
        error: 'Erro interno na criação do gabinete: ' + (gabineteException instanceof Error ? gabineteException.message : 'Erro desconhecido')
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // 8. Atualizar status do político autorizado de "pendente" para "aceito"
    try {
      const { data: updatedPolitico, error: updatePoliticoError } = await supabase
        .from('politicos_autorizados')
        .update({ 
          status: 'aceito',
          data_utilizacao: new Date().toISOString()
        })
        .eq('email', invitation.email.toLowerCase())
        .eq('camara_id', invitation.institution_id)
        .eq('status', 'pendente')
        .select()
        .single();

      if (updatePoliticoError) {
        console.error('❌ Error updating politician status:', updatePoliticoError);
        // Não falhar por causa disso, mas loggar
      } else {
        console.log('✅ Updated politician status to aceito:', updatedPolitico);
      }
    } catch (politicoStatusException) {
      console.error('⚠️ Exception updating politician status:', politicoStatusException);
      // Não falhar por causa disso
    }

    // 9. Atualizar perfil do usuário para político (sempre, não só para novos usuários)
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .upsert({ 
        user_id: user.id,
        main_role: 'politico',
        full_name: full_name || null
      }, { 
        onConflict: 'user_id' 
      });

    if (profileUpdateError) {
      console.error('⚠️ Error updating user role to politico:', profileUpdateError);
      // Don't fail because of profile update issues, just log it
    } else {
      console.log('✅ Updated user role to politico');
    }

    // 10. Marcar convite como aceito
    const { error: updateError } = await supabase
      .from('principal_invitations')
      .update({ 
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('❌ Error updating invitation:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Falha ao marcar convite como aceito' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 11. Enviar convite para chefia se fornecido
    if (chefe_email && chefe_nome && isNewUser) {
      console.log('📧 Sending invitation to chief of staff:', chefe_email);
      
      try {
        // Criar convite na tabela gabinete_invites  
        const { data: convite, error: conviteError } = await supabase
          .from('gabinete_invites')
          .insert({
            gabinete_id: gabineteId,
            email: chefe_email,
            role: 'chefe_gabinete'
          })
          .select()
          .single();

        if (conviteError) {
          console.error('❌ Error creating invitation for chief:', conviteError);
        } else {
          console.log('✅ Invitation created for chief:', convite.id);

          // Enviar email via mail-dispatcher
          try {
            const { data: mailResult, error: mailError } = await supabase.functions.invoke('mail-dispatcher', {
              body: {
                type: 'invite_chefe',
                email: chefe_email,
                name: chefe_nome,
                cabinet: gabineteNomeFinal,
                link: `${Deno.env.get('APP_BASE_URL') || 'http://localhost:3000'}/aceitar-convite-equipe?token=${convite.id}&email=${encodeURIComponent(chefe_email)}&role=chefe`
              }
            });

            if (mailError) {
              console.error('❌ Error sending email to chief:', mailError);
            } else {
              console.log('✅ Email sent to chief successfully:', mailResult);
            }
          } catch (emailError) {
            console.error('❌ Exception sending email to chief:', emailError);
          }
        }
      } catch (inviteError) {
        console.error('❌ Exception creating invitation for chief:', inviteError);
      }
    }

    // 12. Não gerar sessão automática - deixar o frontend fazer login manual

    console.log('✅ Invitation accepted successfully');

    return new Response(JSON.stringify({
      ok: true,
      redirect: '/auth',
      current_gabinete_id: gabineteId,
      gabinete_nome: gabineteNomeFinal,
      user_created: isNewUser,
      chefe_email_sent: !!(chefe_email && chefe_nome && isNewUser),
      message: 'Conta criada com sucesso! Faça login com seu email e senha.'
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

// Função para lidar com convites de equipe/assessor
async function handleTeamInvitation(invitation: any, token: string, password: string, full_name: string, birthdate: string, phone_whatsapp: string, sex: string, avatar_base64_or_path: any) {
  console.log('👥 Processing team invitation for:', invitation.email);
  
  try {
    // Verificar se usuário já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === invitation.email.toLowerCase()
    );

    let user;
    let isNewUser = false;

    if (existingUser) {
      console.log('👤 User already exists:', existingUser.id);
      user = existingUser;
    } else if (password) {
      console.log('🔑 Creating new user for:', invitation.email);
      
      // Criar usuário
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: invitation.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: 'assessor',
          birth_date: birthdate,
          phone_whatsapp,
          sex
        }
      });

      if (signUpError) {
        console.error('❌ Error creating user:', signUpError);
        return new Response(JSON.stringify({ 
          error: 'Falha ao criar conta: ' + signUpError.message 
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      user = authData.user;
      isNewUser = true;
      console.log('✅ User created successfully:', user?.id);
    } else {
      return new Response(JSON.stringify({ 
        error: 'Senha é obrigatória para criar nova conta' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!user) {
      throw new Error('Falha ao criar/encontrar usuário');
    }

    // Upload do avatar se fornecido
    let avatar_url = null;
    if (avatar_base64_or_path && isNewUser) {
      try {
        if (avatar_base64_or_path.startsWith('data:')) {
          const response = await fetch(avatar_base64_or_path);
          const blob = await response.blob();
          const fileExt = blob.type.split('/')[1] || 'jpg';
          const fileName = `${user.id}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, blob, { upsert: true });

          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            avatar_url = publicUrl;
            console.log('✅ Avatar uploaded successfully to:', avatar_url);
          }
        }
      } catch (uploadError) {
        console.error('⚠️ Avatar upload failed:', uploadError);
      }
    }

    // Atualizar/criar perfil
    if (isNewUser || avatar_url) {
      // Definir o main_role baseado no role do convite
      let mainRole = 'assessor';
      if (invitation.role === 'chefe') {
        mainRole = 'chefe_gabinete';
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name,
          birth_date: birthdate || null,
          phone_whatsapp: phone_whatsapp || null,
          whatsapp: phone_whatsapp || null,
          sex: sex || null,
          avatar_url,
          main_role: mainRole
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('⚠️ Error updating profile:', profileError);
      }
    }

    // Adicionar ao gabinete
    const { error: memberError } = await supabase
      .from('gabinete_members')
      .insert({
        gabinete_id: invitation.gabinete_id,
        user_id: user.id,
        role: invitation.role
      });

    if (memberError) {
      console.error('❌ Error adding to gabinete_members:', memberError);
      return new Response(JSON.stringify({ 
        error: 'Falha ao adicionar ao gabinete: ' + memberError.message 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Marcar convite como aceito
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        accepted_at: new Date().toISOString()
      })
      .eq('token', token);

    if (updateError) {
      console.error('❌ Error updating invitation:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Falha ao marcar convite como aceito' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('✅ Team invitation accepted successfully');

    return new Response(JSON.stringify({
      ok: true,
      redirect: '/auth',
      gabinete_nome: invitation.gabinete_nome,
      user_created: isNewUser,
      message: isNewUser ? 'Conta criada com sucesso! Faça login com seu email e senha.' : 'Convite aceito com sucesso!'
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ Error in team invitation:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}