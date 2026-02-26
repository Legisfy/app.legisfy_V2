import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type InvitationRole = 'politico' | 'chefe' | 'assessor';

interface CreateInvitationParams {
  email: string;
  name: string;
  role: InvitationRole;
  institution_id: string;
  cabinet_name?: string; // For chefe and assessor invites
  permissions?: Record<string, { can_read: boolean; can_write: boolean; can_delete: boolean }>;
}

interface SendWelcomeParams {
  email: string;
  name: string;
  type: 'welcome_politico' | 'welcome_chefe' | 'welcome_assessor';
  cabinet_name?: string;
}

export const useEmailInvitations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateInviteLink = async (params: CreateInvitationParams & { invitation_id?: string }) => {
    try {
      // Get the current domain from window location
      // Get the current domain, preferring production for invites
      const currentDomain = window.location.hostname === 'localhost'
        ? window.location.origin
        : 'https://app.legisfy.app.br';

      console.log('🔗 Generating invite link with domain:', currentDomain);

      const { data, error } = await supabase.functions.invoke('generate-invite-link', {
        headers: {
          'x-app-base-url': currentDomain,
        },
        body: {
          email: params.email,
          name: params.name,
          role: params.role,
          institution_id: params.institution_id,
          invitation_id: params.invitation_id || crypto.randomUUID()
        }
      });

      if (error) {
        console.error('Erro na função generate-invite-link:', error);
        throw error;
      }

      console.log('✅ Link gerado pela edge function:', data.action_link);
      return data.action_link;
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      // Fallback: usar o token correto com domínio atual
      const token = params.invitation_id || crypto.randomUUID();
      const currentDomain = window.location.hostname === 'localhost'
        ? window.location.origin
        : 'https://app.legisfy.app.br';

      const fallbackLink = params.role === 'politico'
        ? `${currentDomain}/onboarding?token=${token}`
        : `${currentDomain}/aceitar-convite-equipe?token=${token}&email=${encodeURIComponent(params.email)}&role=${params.role}`;

      console.log('⚠️ Usando fallback link:', fallbackLink);
      return fallbackLink;
    }
  };

  const createInvitation = async (params: CreateInvitationParams): Promise<string> => {
    setLoading(true);
    try {
      // First, get the camara_id (institution_id) from the gabinete
      const { data: gabineteData, error: gabineteError } = await supabase
        .from('gabinetes')
        .select('camara_id')
        .eq('id', params.institution_id)
        .single();

      if (gabineteError || !gabineteData) {
        throw new Error('Gabinete não encontrado');
      }

      // Create invitation record in database
      const token = crypto.randomUUID();
      const invitationData: Record<string, any> = {
        institution_id: gabineteData.camara_id, // Use the actual camara_id as institution_id
        gabinete_id: params.institution_id,     // Keep the gabinete_id as passed
        email: params.email.toLowerCase().trim(),
        name: params.name.trim(),
        role: params.role,
        token: token,
        email_sent: false,
        ...(params.permissions && { permissions: params.permissions }),
      };

      const { data: invitation, error: dbError } = await supabase
        .from('invitations')
        .insert(invitationData)
        .select()
        .single();

      if (dbError) throw dbError;

      // Get cabinet/institution name for email
      let institutionName;
      if (params.role === 'politico') {
        const { data: camara } = await supabase
          .from('camaras')
          .select('nome')
          .eq('id', gabineteData.camara_id)
          .maybeSingle();
        institutionName = camara?.nome || 'Instituição';
      } else {
        const { data: gabinete } = await supabase
          .from('gabinetes')
          .select('nome')
          .eq('id', params.institution_id)
          .maybeSingle();
        institutionName = gabinete?.nome || 'Gabinete';
      }

      // Generate invitation link using the actual token from database
      const inviteLink = await generateInviteLink({
        email: params.email,
        name: params.name,
        role: params.role,
        institution_id: params.institution_id,
        invitation_id: invitation.token // Use the actual token from DB
      });

      // Prepare email payload
      let emailPayload;
      const cabinetName = params.cabinet_name || institutionName;

      switch (params.role) {
        case 'politico':
          emailPayload = {
            type: 'invite_politico',
            name: params.name,
            email: params.email,
            institution: institutionName,
            link: inviteLink,
            invitation_id: invitation.id
          };
          break;
        case 'chefe':
          emailPayload = {
            type: 'invite_chefe',
            name: params.name,
            email: params.email,
            cabinet: cabinetName,
            link: inviteLink,
            invitation_id: invitation.id
          };
          break;
        case 'assessor':
          emailPayload = {
            type: 'invite_assessor',
            name: params.name,
            email: params.email,
            cabinet: cabinetName,
            link: inviteLink,
            invitation_id: invitation.id
          };
          break;
      }

      // Send the email using mail-dispatcher function directly
      console.log('Sending email with mail-dispatcher function');
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('mail-dispatcher', {
        body: emailPayload
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        // Still mark invitation as created but show warning
        toast({
          title: "Convite criado",
          description: `Convite para ${params.role} criado, mas houve problema no envio do email. Verifique as configurações de email.`,
          variant: "destructive"
        });
      } else {
        console.log('Email sent successfully:', emailResult);
        toast({
          title: "Convite enviado!",
          description: `Convite para ${params.role} enviado para ${params.email} com sucesso.`,
        });
      }

      return invitation.id;
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Erro ao criar convite",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendWelcomeEmail = async (params: SendWelcomeParams) => {
    setLoading(true);
    try {
      const emailPayload = {
        type: params.type,
        name: params.name,
        email: params.email,
        ...(params.cabinet_name && { cabinet: params.cabinet_name })
      };

      const { error } = await supabase.functions.invoke('mail-dispatcher', {
        body: emailPayload
      });

      if (error) throw error;

      toast({
        title: "E-mail de boas-vindas enviado!",
        description: `E-mail enviado para ${params.email}`
      });
    } catch (error: any) {
      console.error('Error sending welcome email:', error);
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkInvitationStatus = async (email: string) => {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const markInvitationAccepted = async (invitation_id: string) => {
    const { error } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation_id);

    if (error) throw error;
  };

  return {
    loading,
    createInvitation,
    sendWelcomeEmail,
    checkInvitationStatus,
    markInvitationAccepted,
    generateInviteLink
  };
};