import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Building2, User, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationDetails {
  email: string;
  institution_name: string;
  position_title: string;
  expires_at: string;
}

interface InvitationResponse {
  email: string;
  institution_id: string;
  camara_nome: string;
  expires_at: string;
  tipo?: string;
}

interface AcceptResult {
  success: boolean;
  existing: boolean;
  cabinet_id: string;
  cabinet_name: string;
  politician_id?: string;
  institution_name: string;
  error?: string;
}

export default function AceitarConvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AcceptResult | null>(null);

  // Extract only the token value, not the full URL
  const rawToken = searchParams.get('token');
  const token = rawToken ? rawToken.split('?token=').pop() || rawToken : null;

  useEffect(() => {
    if (!token) {
      setError('Token de convite não encontrado na URL');
      setLoading(false);
      return;
    }

    if (authLoading) {
      return; // Wait for auth to load
    }

    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/auth?redirect=${returnUrl}`);
      return;
    }

    validateInvitation();
  }, [token, user, authLoading, navigate]);

  const validateInvitation = async () => {
    if (!token || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar convite principal via RPC (bypass RLS)
      const { data: invitationData, error: invitationError } = await supabase
        .rpc('get_principal_invitation_details', { p_token: token });

      console.log('✅ Invitation data:', invitationData, 'Error:', invitationError);

      if (invitationError || !invitationData) {
        console.error('❌ Invitation not found for token:', token);
        setError('Convite não encontrado ou já foi aceito');
        return;
      }

      // Type cast the response
      const invitation = invitationData as unknown as InvitationResponse;

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        setError('Este convite expirou. Solicite um novo convite.');
        return;
      }

      // Check if user email matches invitation email
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        setError(
          `Este convite foi enviado para ${invitation.email}. ` +
          `Você está logado como ${user.email}. ` +
          `Faça login com o e-mail correto para aceitar o convite.`
        );
        return;
      }

      const institutionType = invitation.tipo;
      let positionTitle = 'Político';
      
      if (institutionType === 'municipal') {
        positionTitle = 'Vereador';
      } else if (institutionType === 'estadual') {
        positionTitle = 'Deputado Estadual';
      }

      setInvitation({
        email: invitation.email,
        institution_name: invitation.camara_nome || 'Instituição',
        position_title: positionTitle,
        expires_at: invitation.expires_at
      });

    } catch (err: any) {
      console.error('Error validating invitation:', err);
      setError('Erro ao validar convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!token) return;

    try {
      setProcessing(true);
      setError(null);

      // Call the RPC to accept invitation
      const { data, error } = await supabase.rpc('accept_principal_invitation', {
        p_token: token
      });

      if (error) {
        throw error;
      }

      // Type cast safely from Supabase Json to our interface
      const result = data as unknown as AcceptResult;
      
      if (!result.success) {
        setError(result.error || 'Erro ao aceitar convite');
        return;
      }

      setSuccess(result);
      
      if (result.existing) {
        toast.success('Bem-vindo de volta ao seu gabinete!');
      } else {
        toast.success('Gabinete criado com sucesso! Bem-vindo ao Legisfy!');
      }

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError('Erro ao aceitar convite. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500/20 via-purple-600/10 to-pink-500/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="bg-gradient-to-r from-orange-500/10 to-purple-600/10 p-6 rounded-lg border border-orange-200">
              <div className="flex items-center mb-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-orange-600" />
                <span className="text-orange-800 font-medium">Carregando convite...</span>
              </div>
              <p className="text-orange-700 text-sm">
                Aguarde enquanto validamos seu convite.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500/20 via-purple-600/10 to-pink-500/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/legisfy-logo-light.png" 
              alt="Legisfy" 
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            Confirmação da Instituição
          </CardTitle>
          <p className="text-muted-foreground">
            Confirme a instituição onde seu gabinete será designado
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {success.existing ? (
                  <>Bem-vindo de volta ao <strong>{success.cabinet_name}</strong>!</>
                ) : (
                  <>Gabinete <strong>{success.cabinet_name}</strong> criado com sucesso na <strong>{success.institution_name}</strong>!</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {invitation && !success && (
            <>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Detalhes do Convite</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Instituição</p>
                      <p className="text-muted-foreground">{invitation.institution_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Cargo</p>
                      <p className="text-muted-foreground">{invitation.position_title}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">E-mail</p>
                      <p className="text-muted-foreground">{invitation.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">O que acontecerá quando aceitar:</h4>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Seu gabinete digital será criado automaticamente</li>
                  <li>• Você poderá convidar Chefe de Gabinete e Assessores</li>
                  <li>• Terá acesso completo à plataforma Legisfy</li>
                  <li>• Poderá gerenciar eleitores, demandas, indicações e agenda</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={acceptInvitation}
                  disabled={processing}
                  className="flex-1"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Criando Gabinete...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aceitar Convite
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/auth')}
                  disabled={processing}
                >
                  Cancelar
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Convite expira em: {new Date(invitation.expires_at).toLocaleString('pt-BR')}
              </div>
            </>
          )}

          {success && (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Redirecionando para o dashboard...
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Ir para Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}