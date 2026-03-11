import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowRight, CheckCircle, AlertCircle, Lock, KeyRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/components/AuthProvider";
import { useLoginBanner } from "@/hooks/useLoginBanner";
import { supabase } from "@/integrations/supabase/client";
import { TurnstileWidget, TurnstileWidgetHandle } from "@/components/auth/TurnstileWidget";
import SplineRobot from "@/components/auth/SplineRobot";
import RobotOverlay from "@/components/auth/RobotOverlay";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { user, session, isExonerated, signIn } = useAuthContext();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { banner } = useLoginBanner();
  const [view, setView] = useState<'login' | '2fa' | 'forgot-password' | 'update-password'>('login');
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileWidgetHandle | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Escutar por mudanças no estado de autenticação para detectar recuperação de senha
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state change:', event);
      if (event === 'PASSWORD_RECOVERY') {
        setView('update-password');
        localStorage.removeItem('2fa_verified');
      }
    });

    // Detectar fluxo de recuperação de senha pelo hash ou query params do Supabase (Fallback)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isRecovery = window.location.hash.includes('type=recovery') || 
                       window.location.hash.includes('access_token=') ||
                       new URLSearchParams(location.search).get('type') === 'recovery' ||
                       hashParams.get('type') === 'recovery';

    if (isRecovery) {
      setView('update-password');
      localStorage.removeItem('2fa_verified');
    }

    // Se o usuário estiver logado E com 2FA verificado, vai para o dashboard
    const is2FAVerified = localStorage.getItem('2fa_verified') === 'true';
    if (user && !isExonerated && is2FAVerified && view !== 'update-password') {
      navigate('/dashboard');
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [user, navigate, isExonerated, location, view]);

  const validateForm = () => {
    if (view !== 'update-password' && !formData.email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (view === 'login' && !formData.password) {
      setError('Senha é obrigatória');
      return false;
    }
    if (view === '2fa' && formData.code.length !== 6) {
      setError('O código deve ter 6 dígitos');
      return false;
    }
    if (view === 'update-password') {
      if (!formData.newPassword || formData.newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return false;
      }
    }
    
    if (view !== 'update-password') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Formato de e-mail inválido');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm()) return;

    if (view === 'login') {
      if (!captchaToken) {
        setError('Verificação de segurança necessária.');
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await signIn(formData.email, formData.password, captchaToken);

        if (error) {
          setError(`Erro: ${error.message}`);
          turnstileRef.current?.reset();
          setCaptchaToken('');
          return;
        }

        if (data?.user) {
          // Password login success, now trigger 2FA
          const { error: funcError } = await supabase.functions.invoke('send-2fa-code', {
            body: { email: formData.email }
          });

          if (funcError) {
            console.error('Erro ao enviar 2FA:', funcError);
            setError('Erro ao enviar código de verificação. Tente novamente.');
            return;
          }

          setMessage('Código de verificação enviado para seu e-mail.');
          setView('2fa');
        }

      } catch (error: any) {
        setError('Ocorreu um erro inesperado. Tente novamente.');
      } finally {
        setLoading(false);
      }
    } else if (view === '2fa') {
      // Verificação de 2FA
      setLoading(true);
      try {
        const { data: codeData, error: codeError } = await supabase
          .from('two_factor_codes')
          .select('*')
          .eq('email', formData.email.toLowerCase().trim())
          .eq('code', formData.code)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (codeError || !codeData) {
          setError('Código inválido ou expirado.');
          setLoading(false);
          return;
        }

        // Marcar código como usado
        await supabase
          .from('two_factor_codes')
          .update({ used: true })
          .eq('id', codeData.id);

        localStorage.setItem('2fa_verified', 'true');
        toast({
          title: 'Login realizado',
          description: 'Acesso autorizado com sucesso.'
        });
        navigate('/dashboard');
      } catch (err) {
        setError('Erro ao verificar código.');
      } finally {
        setLoading(false);
      }
    } else if (view === 'forgot-password') {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('request-password-reset', {
          body: { 
            email: formData.email,
            redirectTo: window.location.origin + '/auth'
          }
        });

        if (error || (data && !data.success)) {
          setError(error?.message || data?.error || 'Erro ao enviar e-mail de recuperação.');
          return;
        }

        setMessage('Link de recuperação enviado! Verifique seu e-mail.');
      } catch (err) {
        setError('Erro ao solicitar recuperação de senha.');
      } finally {
        setLoading(false);
      }
    } else if (view === 'update-password') {
      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (error) {
          setError(error.message);
          return;
        }

        toast({
          title: 'Senha atualizada!',
          description: 'Sua senha foi alterada com sucesso.'
        });
        
        // Após resetar senha, por segurança, pede login novamente
        setMessage('Senha alterada! Faça login com sua nova senha.');
        setView('login');
        setFormData({ ...formData, password: '', newPassword: '', confirmPassword: '' });
      } catch (err) {
        setError('Erro ao atualizar senha.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (user && session && localStorage.getItem('2fa_verified') === 'true' && view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }

  const getTitle = () => {
    switch (view) {
      case '2fa': return 'Verificação de Segurança';
      case 'forgot-password': return 'Recuperar Senha';
      case 'update-password': return 'Nova Senha';
      default: return 'Acesse sua conta';
    }
  };

  const getDescription = () => {
    switch (view) {
      case '2fa': return `Enviamos um código de 6 dígitos para ${formData.email}. Insira-o abaixo.`;
      case 'forgot-password': return 'Informe seu e-mail para receber um link de redefinição de senha.';
      case 'update-password': return 'Escolha uma nova senha segura para sua conta.';
      default: return 'Entre com seu e-mail e senha para gerenciar seu mandato.';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white selection:bg-white/10 font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row items-center justify-center p-6 md:p-12 lg:gap-32">
        <div className="hidden lg:flex flex-col items-center justify-center w-full max-w-2xl h-[600px] pointer-events-auto relative">
          <SplineRobot />
          <RobotOverlay />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-30 pointer-events-none" />
        </div>

        <div className="relative group/card w-full max-w-[480px]">
          <div className="absolute -inset-4 bg-white/[0.03] rounded-[2.5rem] blur-3xl pointer-events-none" />
          <div className="absolute inset-x-8 -top-8 bottom-auto h-32 bg-white/[0.05] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -inset-1 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-2xl blur-md opacity-20 pointer-events-none" />

          <Card className="relative w-full bg-zinc-950/90 border border-white/[0.05] rounded-2xl shadow-2xl overflow-hidden">
            <CardHeader className="space-y-4 px-10 py-6 pb-2 text-left">
              <div className="flex flex-col items-center justify-center space-y-6 pt-2">
                <img
                  src="/lovable-uploads/dea8f268-b38b-407b-8d7a-c6bcb60c0466.png"
                  alt="Legisfy"
                  className="h-24 w-auto object-contain brightness-125 transition-all hover:brightness-150"
                />

                <div className="space-y-2 text-center">
                  <CardTitle className="text-2xl font-bold tracking-tight text-white">
                    {getTitle()}
                  </CardTitle>
                  <CardDescription className="text-sm text-white/30 leading-relaxed max-w-[320px] mx-auto">
                    {getDescription()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-10 py-6 pt-2 space-y-4">
              <div className="w-full">
                {error && (
                  <Alert variant="destructive" className="mb-4 bg-red-950/20 border-red-500/20 text-red-400 rounded-xl py-2 px-3 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-[10px] font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                {message && (
                  <Alert className="mb-4 border-white/5 bg-white/[0.03] text-green-400 py-2 px-3 rounded-xl">
                    <CheckCircle className="h-3 w-3 text-green-500/50" />
                    <AlertDescription className="text-[10px] font-medium">{message}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {(view === 'login' || view === 'forgot-password') && (
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[11px] font-medium text-white/40 ml-1">
                        Seu E-mail
                      </Label>
                      <div className="relative group">
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com.br"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-12 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 focus:ring-0 transition-all text-white placeholder:text-white/10"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {view === 'login' && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[11px] font-medium text-white/40 ml-1">
                        Sua Senha
                      </Label>
                      <div className="relative group">
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="h-12 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 focus:ring-0 transition-all text-white placeholder:text-white/10"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {view === '2fa' && (
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-[11px] font-medium text-white/40 ml-1">
                        Código de 6 dígitos
                      </Label>
                      <div className="relative group">
                        <Input
                          id="code"
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                          className="h-12 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 focus:ring-0 transition-all text-white text-center text-2xl tracking-[1em] placeholder:text-white/10"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {view === 'update-password' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-[11px] font-medium text-white/40 ml-1">
                          Nova Senha
                        </Label>
                        <div className="relative group">
                          <Input
                            id="new-password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="h-12 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 focus:ring-0 transition-all text-white placeholder:text-white/10"
                            disabled={loading}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-[11px] font-medium text-white/40 ml-1">
                          Confirmar Nova Senha
                        </Label>
                        <div className="relative group">
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="h-12 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 focus:ring-0 transition-all text-white placeholder:text-white/10"
                            disabled={loading}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-medium text-base rounded-lg shadow-xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {view === 'login' && 'Autenticar'}
                        {view === '2fa' && 'Confirmar código'}
                        {view === 'forgot-password' && 'Solicitar link'}
                        {view === 'update-password' && 'Salvar nova senha'}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>

                  {view === 'login' && (
                    <div className="flex justify-center -mb-2 py-4">
                      <TurnstileWidget
                        ref={turnstileRef}
                        siteKey="0x4AAAAAAB08RnSc6cPswWIV"
                        onSuccess={(token) => setCaptchaToken(token)}
                        onError={() => {
                          setCaptchaToken('');
                          setError('Falha na autenticação humana.');
                        }}
                        onExpire={() => setCaptchaToken('')}
                        theme="dark"
                        size="normal"
                      />
                    </div>
                  )}

                  {(view === '2fa' || view === 'forgot-password' || view === 'update-password') && (
                    <Button 
                      variant="link" 
                      className="w-full text-xs text-white/40 hover:text-white"
                      onClick={() => setView('login')}
                      type="button"
                    >
                      Voltar para o login
                    </Button>
                  )}
                </form>
              </div>

              {view === 'login' && (
                <div className="flex items-center justify-center pt-4 border-t border-white/[0.03]">
                  <button 
                    onClick={() => setView('forgot-password')}
                    className="text-[11px] text-white/40 hover:text-white transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;