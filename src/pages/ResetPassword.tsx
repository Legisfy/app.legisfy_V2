import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // O Supabase coloca o access_token no hash da URL quando o usuário vem do e-mail de recuperação
        const hash = window.location.hash;
        const search = window.location.search;
        const hasToken = hash.includes('access_token=') || search.includes('access_token=') || hash.includes('type=recovery');

        // Escutar evento de recuperação caso o hash já tenha sido processado pelo SDK
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            setCanReset(true);
          }
        });

        // Verificar se já existe uma sessão (o Supabase cria uma sessão temporária ao clicar no link)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session || hasToken) {
          setCanReset(true);
        } else {
          // Pequeno delay para garantir que o SDK processou a URL
          setTimeout(async () => {
             const { data: { session: retrySession } } = await supabase.auth.getSession();
             if (retrySession) setCanReset(true);
             setLoading(false);
          }, 1000);
          return () => subscription.unsubscribe();
        }

        setLoading(false);
        return () => subscription.unsubscribe();
      } catch (err) {
        console.error('Erro ao validar link:', err);
        setError('Não foi possível validar seu link de acesso.');
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
        toast.error('Erro ao atualizar senha');
      } else {
        setSuccess(true);
        toast.success('Senha alterada com sucesso!');
        setTimeout(() => navigate('/auth'), 3000);
      }
    } catch (err: any) {
      setError('Ocorreu um erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-white/20 mx-auto" />
          <p className="text-white/40 text-sm font-medium animate-pulse">Validando credenciais de segurança...</p>
        </div>
      </div>
    );
  }

  if (!canReset && !success) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 font-outfit">
        <Card className="w-full max-w-md bg-white/[0.02] border-white/5 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">Link inválido</CardTitle>
            <CardDescription className="text-white/40">
              Este link de recuperação expirou ou já foi utilizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full bg-white hover:bg-zinc-200 text-black font-medium transition-all"
            >
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 font-outfit selection:bg-white/10">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/[0.02] border-white/5 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(255,255,255,0.05)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <CardHeader className="space-y-4 pt-10 px-8">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                <ShieldCheck className="h-7 w-7 text-white/80" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <CardTitle className="text-3xl font-bold text-white tracking-tight">Nova Senha</CardTitle>
              <CardDescription className="text-white/40 text-sm">
                Crie uma senha forte para proteger seu gabinete.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10 pt-4">
            {success ? (
              <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Senha Alterada!</h3>
                  <p className="text-white/40 text-sm">Sua nova senha foi salva com sucesso. Redirecionando para o portal em instantes...</p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-white/20 mx-auto" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium text-white/40 ml-1 uppercase tracking-widest">Nova Senha</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/[0.03] border-white/5 focus:border-white/20 focus:ring-0 text-white placeholder:text-white/10 transition-all rounded-xl"
                    disabled={saving}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-medium text-white/40 ml-1 uppercase tracking-widest">Confirmar Senha</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-white/[0.03] border-white/5 focus:border-white/20 focus:ring-0 text-white placeholder:text-white/10 transition-all rounded-xl"
                    disabled={saving}
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg animate-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold text-base rounded-xl shadow-xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Salvar Nova Senha
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-white/20 text-[10px] uppercase tracking-[0.2em]">
          Legisfy • Segurança Premium de Dados
        </p>
      </div>
    </div>
  );
}
