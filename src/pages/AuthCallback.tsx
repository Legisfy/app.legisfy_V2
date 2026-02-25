import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useEmailInvitations } from '@/hooks/useEmailInvitations';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { markInvitationAccepted, sendWelcomeEmail } = useEmailInvitations();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Erro na autenticação",
            description: error.message,
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        const { session } = data;
        if (!session?.user) {
          toast({
            title: "Erro na autenticação",
            description: "Sessão não encontrada",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        const user = session.user;
        const metadata = user.user_metadata;
        
        console.log('User metadata:', metadata);

        // Check if this is from an invitation
        if (metadata.invitation_id) {
          try {
            // Mark invitation as accepted
            await markInvitationAccepted(metadata.invitation_id);
            
            // Se for político, atualizar status para "aceito"
            if (metadata.role === 'politico' && metadata.institution_id) {
              try {
                await supabase.functions.invoke('update-politician-status', {
                  body: {
                    email: user.email,
                    institution_id: metadata.institution_id
                  }
                });
                console.log('Status do político atualizado para aceito');
              } catch (error) {
                console.error('Erro ao atualizar status do político:', error);
              }
            }
            
            // Send welcome email based on role
            const role = metadata.role;
            const userName = metadata.full_name || user.email?.split('@')[0] || 'Usuário';
            
            let welcomeType: 'welcome_politico' | 'welcome_chefe' | 'welcome_assessor';
            
            switch (role) {
              case 'politico':
                welcomeType = 'welcome_politico';
                break;
              case 'chefe':
                welcomeType = 'welcome_chefe';
                break;
              case 'assessor':
                welcomeType = 'welcome_assessor';
                break;
              default:
                welcomeType = 'welcome_assessor'; // fallback
            }

            // Send welcome email
            await sendWelcomeEmail({
              email: user.email!,
              name: userName,
              type: welcomeType,
              cabinet_name: metadata.cabinet_name
            });

            toast({
              title: "Conta criada com sucesso!",
              description: `Bem-vindo à Legisfy como ${role}!`
            });

            // Redirect based on role
            if (role === 'politico') {
              // Político precisa personalizar o gabinete
              navigate('/politico-onboarding');
            } else if (role === 'chefe' || role === 'assessor') {
              // Chefe e assessor já pertencem ao gabinete, vão direto para dashboard
              navigate('/dashboard');
            } else {
              navigate('/dashboard');
            }
          } catch (error: any) {
            console.error('Error processing invitation:', error);
            // Continue to app even if welcome email fails
            navigate('/dashboard');
          }
        } else {
          // Regular signup/login
          toast({
            title: "Autenticação realizada!",
            description: "Redirecionando..."
          });
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Callback processing error:', error);
        toast({
          title: "Erro no processamento",
          description: "Tente fazer login novamente",
          variant: "destructive"
        });
        navigate('/auth');
      } finally {
        setProcessing(false);
      }
    };

    // Add a small delay to ensure auth state is properly set
    const timer = setTimeout(handleAuthCallback, 500);
    return () => clearTimeout(timer);
  }, [navigate, toast, markInvitationAccepted, sendWelcomeEmail]);

  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Processando autenticação...</p>
          <p className="text-sm text-gray-600 mt-2">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;