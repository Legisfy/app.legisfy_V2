import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { TurnstileWidget, TurnstileWidgetHandle } from "@/components/auth/TurnstileWidget";
import { useTheme } from "next-themes";

const AdminAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileWidgetHandle | null>(null);
  const { resolvedTheme } = useTheme();

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Check authentication state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check current session first
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            // Check if user is admin
            const { data: profile } = await supabase
              .from('profiles')
              .select('main_role')
              .eq('user_id', currentSession.user.id)
              .single();

            if (profile?.main_role === 'admin_plataforma') {
              navigate('/admin');
            } else {
              // Not an admin, redirect to regular auth
              navigate('/auth');
            }
          }
        }
      } catch (error) {
        console.log('Auth check error:', error);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user && event === 'SIGNED_IN') {
            // Check if user is admin
            const { data: profile } = await supabase
              .from('profiles')
              .select('main_role')
              .eq('user_id', session.user.id)
              .single();

            if (profile?.main_role === 'admin_plataforma') {
              navigate('/admin');
            } else {
              setError('Acesso negado. Esta área é exclusiva para administradores.');
              await supabase.auth.signOut();
            }
          }
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const validateForm = (isSignup: boolean = false) => {
    if (isSignup) {
      if (!signupForm.fullName.trim()) {
        setError('Nome completo é obrigatório');
        return false;
      }
      if (!signupForm.email.trim()) {
        setError('Email é obrigatório');
        return false;
      }
      if (!signupForm.password) {
        setError('Senha é obrigatória');
        return false;
      }
      if (signupForm.password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        return false;
      }
      if (signupForm.password !== signupForm.confirmPassword) {
        setError('Senhas não coincidem');
        return false;
      }
    } else {
      if (!loginForm.email.trim()) {
        setError('Email é obrigatório');
        return false;
      }
      if (!loginForm.password) {
        setError('Senha é obrigatória');
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = isSignup ? signupForm.email : loginForm.email;
    if (!emailRegex.test(email)) {
      setError('Email inválido');
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm(false)) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
        options: {
          captchaToken
        }
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (error.message.includes('captcha')) {
          setError('Verificação de segurança necessária. Recarregue a página e tente novamente.');
        } else {
          setError('Erro ao fazer login. Tente novamente.');
        }
        // Reset captcha
        turnstileRef.current?.reset();
        setCaptchaToken('');
        return;
      }

      if (data.user) {
        // Check if user is admin before proceeding
        const { data: profile } = await supabase
          .from('profiles')
          .select('main_role')
          .eq('user_id', data.user.id)
          .single();

        if (profile?.main_role !== 'admin_plataforma') {
          setError('Acesso negado. Esta área é exclusiva para administradores.');
          await supabase.auth.signOut();
          return;
        }

        toast({
          title: "Sucesso!",
          description: "Login de administrador realizado com sucesso"
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm(true)) return;

    setLoading(true);

    try {
      // Use RPC to check if email is authorized
      const { data: isAuthorized, error: rpcError } = await supabase
        .rpc('is_admin_email', { p_email: signupForm.email });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        setError('Erro ao verificar autorização. Tente novamente.');
        setLoading(false);
        return;
      }

      if (!isAuthorized) {
        setError('Email não autorizado para criação de conta de administrador. Entre em contato com o suporte.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth-callback`,
          data: {
            full_name: signupForm.fullName,
            user_type: 'admin'
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Este email já está cadastrado. Tente fazer login.');
        } else {
          setError('Erro ao criar conta. Tente novamente.');
        }
        return;
      }

      if (data.user) {
        setMessage('Conta de administrador criada com sucesso! Você pode fazer login agora.');
        setActiveTab("login");
        // Reset form
        setSignupForm({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, show loading
  if (user && session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500/10 via-background to-blue-500/10 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-background/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Área do Administrador
          </CardTitle>
          <CardDescription>
            Acesso exclusivo para administradores do sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="text-sm">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-sm">
                Criar Conta
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login" className="space-y-4 mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="pl-10 pr-10"
                      disabled={loading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Turnstile Captcha */}
                <div className="flex justify-center">
                  <TurnstileWidget
                    ref={turnstileRef}
                    siteKey="0x4AAAAAAB08RnSc6cPswWIV"
                    onSuccess={(token) => setCaptchaToken(token)}
                    onError={() => {
                      setCaptchaToken('');
                      setError('Erro na verificação de segurança. Tente novamente.');
                    }}
                    onExpire={() => {
                      setCaptchaToken('');
                      setError('Verificação de segurança expirou. Tente novamente.');
                    }}
                    theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                    size="normal"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  disabled={loading || !captchaToken}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar como Admin'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-0">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Nome do administrador"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({...signupForm, fullName: e.target.value})}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Autorizado</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="admin@email.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Apenas emails pré-autorizados podem criar contas de administrador
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                      className="pl-10 pr-10"
                      disabled={loading}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando Conta...
                    </>
                  ) : (
                    'Criar Conta Admin'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Voltar ao login regular
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;