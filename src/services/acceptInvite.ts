import { supabase } from '@/integrations/supabase/client';

export interface AcceptInviteParams {
  token: string;
  email: string;
  role: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  message: string;
  redirectTo?: string;
}

export async function acceptInvite(params: AcceptInviteParams): Promise<AcceptInviteResponse> {
  try {
    const { token, email, role } = params;

    // Validate invitation token
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (invitationError) {
      console.error('Error fetching invitation:', invitationError);
      return {
        success: false,
        message: 'Erro ao buscar convite. Tente novamente.'
      };
    }

    if (!invitation) {
      return {
        success: false,
        message: 'Convite não encontrado ou já foi aceito.'
      };
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return {
        success: false,
        message: 'Este convite já foi aceito.'
      };
    }

    // Check if expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return {
        success: false,
        message: 'Este convite expirou. Solicite um novo convite.'
      };
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        message: 'Usuário não autenticado. Faça login primeiro.'
      };
    }

    // Verify email matches
    if (user.email?.toLowerCase() !== email.toLowerCase()) {
      return {
        success: false,
        message: `Este convite foi enviado para ${email}. Você está logado como ${user.email}.`
      };
    }

    // Add user to gabinete_members
    const { error: memberError } = await supabase
      .from('gabinete_members')
      .insert({
        gabinete_id: invitation.gabinete_id,
        user_id: user.id,
        role: invitation.role
      });

    if (memberError) {
      console.error('Error adding to gabinete_members:', memberError);
      return {
        success: false,
        message: 'Erro ao adicionar ao gabinete. Tente novamente.'
      };
    }

    // Mark invitation as accepted (invalidate token)
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      // Don't fail here since user was already added to gabinete
    }

    return {
      success: true,
      message: 'Convite aceito com sucesso!',
      redirectTo: '/dashboard'
    };

  } catch (error: any) {
    console.error('Error in acceptInvite:', error);
    return {
      success: false,
      message: error.message || 'Erro interno. Tente novamente.'
    };
  }
}