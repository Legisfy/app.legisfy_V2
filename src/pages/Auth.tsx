import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/components/AuthProvider";
import { useLoginBanner } from "@/hooks/useLoginBanner";
import { supabase } from "@/integrations/supabase/client";
import { TurnstileWidget, TurnstileWidgetHandle } from "@/components/auth/TurnstileWidget";
import SplineRobot from "@/components/auth/SplineRobot";
import RobotOverlay from "@/components/auth/RobotOverlay";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user, session, isExonerated } = useAuthContext();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { banner } = useLoginBanner();
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileWidgetHandle | null>(null);

  const [formData, setFormData] = useState({
    email: '',
  });

  useEffect(() => {
    if (user && !isExonerated) {
      navigate('/dashboard');
    }
  }, [user, navigate, isExonerated]);

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Formato de e-mail inválido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm()) return;

    if (!captchaToken) {
      setError('Verificação de segurança necessária.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          captchaToken: captchaToken
        }
      });

      if (error) {
        setError(`Erro: ${error.message}`);
        turnstileRef.current?.reset();
        setCaptchaToken('');
        return;
      }

      setMessage('Link de acesso enviado! Verifique seu e-mail.');
      toast({
        title: 'Verifique seu e-mail',
        description: 'Enviamos um link de login para você.'
      });

    } catch (error: any) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (user && session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white selection:bg-white/10 font-sans">
      {/* Background Metallic Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row items-center justify-center p-6 md:p-12 lg:gap-32">

        {/* Left Side: Robot Component (Dynamic & Interactive 3D) */}
        <div className="hidden lg:flex flex-col items-center justify-center w-full max-w-2xl h-[600px] pointer-events-auto relative">
          <SplineRobot />
          <RobotOverlay />
          {/* Bottom Gradient Overlay to hide leg cut */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-30 pointer-events-none" />
        </div>

        {/* Login Card with Enhanced Background Light Effect */}
        <div className="relative group/card w-full max-w-[480px]">
          {/* Layered Metallic Glows */}
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
                    Acesse seu gabinete
                  </CardTitle>
                  <CardDescription className="text-sm text-white/30 leading-relaxed max-w-[320px] mx-auto">
                    Se você já tem uma conta na Legisfy, enviaremos um link mágico para seu e-mail para autenticação e confirmação imediata.
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
                        onChange={(e) => setFormData({ email: e.target.value })}
                        className="h-12 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 focus:ring-0 transition-all text-white placeholder:text-white/10"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-medium text-base rounded-lg shadow-xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Solicitar acesso
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>

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
                </form>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                <a href="#" className="text-[11px] text-white/40 hover:text-white transition-colors">
                  Esqueceu sua senha?
                </a>
                <a href="/onboarding" className="text-[11px] text-white/40 hover:text-white transition-colors flex items-center gap-1 group">
                  Criar uma nova conta
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;