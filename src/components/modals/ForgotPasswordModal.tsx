import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Eye, EyeOff, Mail, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { validatePassword } from "@/utils/passwordValidation";
import { toast } from "@/hooks/use-toast";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'email' | 'password' | 'verification';

export const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(''));

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    setPasswordValidation(validatePassword(value));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);

    try {
      // Verificar se o email existe no sistema
      const { data: users } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', '(SELECT id FROM auth.users WHERE email = $1)')
        .limit(1);

      setMessage('Se este email estiver cadastrado, você poderá definir uma nova senha.');
      setStep('password');
    } catch (err) {
      console.error('Error checking email:', err);
      setError('Erro ao verificar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validações
    if (!passwordValidation.isValid) {
      setError('A senha deve atender todos os requisitos de segurança');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // Enviar código 2FA para o email
      const response = await supabase.functions.invoke('send-2fa-code', {
        body: { 
          email: formData.email.toLowerCase().trim(),
          action: 'reset_password'
        }
      });

      if (response.error) {
        console.error('Error sending 2FA code:', response.error);
        throw new Error(response.error.message || 'Erro ao enviar código');
      }

      setMessage(`Código de verificação enviado para ${formData.email}`);
      setStep('verification');
    } catch (err) {
      console.error('Error sending 2FA code:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao enviar código: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.verificationCode.trim()) {
      setError('Código de verificação é obrigatório');
      return;
    }

    setLoading(true);

    try {
      // Verificar código 2FA via Edge Function (evita RLS no cliente)
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-2fa-code', {
        body: {
          email: formData.email.toLowerCase().trim(),
          code: formData.verificationCode.trim()
        }
      });

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyData?.message || verifyError?.message || 'Código inválido ou expirado');
      }

      // Redefinir senha via função admin
      const { data: resetData, error: resetError } = await supabase.functions.invoke('admin-reset-politico-password', {
        body: {
          email: formData.email.toLowerCase().trim(),
          new_password: formData.password
        }
      });

      if (resetError) {
        console.error('Error resetting password:', resetError);
        throw new Error(resetError.message || 'Erro ao redefinir senha');
      }
      
      if (resetData && !resetData.success) {
        console.error('Reset password failed:', resetData);
        throw new Error(resetData.error || 'Erro ao redefinir senha');
      }

      toast({
        title: "Senha redefinida com sucesso!",
        description: "Sua nova senha foi definida. Faça login com a nova senha."
      });

      // Reset form and close
      setFormData({ email: '', password: '', confirmPassword: '', verificationCode: '' });
      setStep('email');
      onClose();
    } catch (err) {
      console.error('Error resetting password:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao redefinir senha: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: '', password: '', confirmPassword: '', verificationCode: '' });
    setStep('email');
    setError('');
    setMessage('');
    onClose();
  };

  const handleBack = () => {
    if (step === 'password') {
      setStep('email');
    } else if (step === 'verification') {
      setStep('password');
    }
    setError('');
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'email' ? (
              <>
                <Mail className="h-5 w-5" />
                Esqueci Minha Senha
              </>
            ) : step === 'password' ? (
              <>
                <Lock className="h-5 w-5" />
                Nova Senha
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Verificação de Segurança
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'email' 
              ? 'Digite seu email para recuperar sua senha.'
              : step === 'password'
                ? 'Defina sua nova senha. Enviaremos um código de verificação para confirmar.'
                : 'Digite o código de verificação enviado para seu email para confirmar a redefinição da senha.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </form>
        ) : step === 'password' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
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
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Indicador de força da senha */}
            {formData.password && (
              <div className="space-y-2">
                <PasswordStrengthIndicator 
                  requirements={passwordValidation.requirements}
                  strength={passwordValidation.strength}
                  className="text-xs"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua nova senha"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 pr-10"
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleBack}
                disabled={loading}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !passwordValidation.isValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Código
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="verificationCode">Código de Verificação</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Digite o código recebido por email"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Código enviado para: {formData.email}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleBack}
                disabled={loading}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !formData.verificationCode.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Redefinir Senha
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};