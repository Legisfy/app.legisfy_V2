import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  email: string;
}

export const TwoFactorInput = ({ value, onChange, onSubmit, loading, email }: TwoFactorInputProps) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer para expiração do código
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-focus no primeiro campo
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Formatação do tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Manipular entrada dos dígitos
  const handleDigitChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    
    const newValue = value.split('');
    newValue[index] = digit;
    const updatedValue = newValue.join('').slice(0, 6);
    onChange(updatedValue);

    // Auto-focus no próximo campo
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Manipular teclas especiais
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      onSubmit(e);
    }
  };

  // Colar código
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasteData);
    
    // Focus no último campo preenchido
    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Reenviar código
  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-2fa-code', {
        body: { email }
      });

      if (error) {
        throw new Error(error.message);
      }

      setTimeLeft(300);
      setCanResend(false);
      onChange('');
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('Erro ao reenviar código:', error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
        <p className="text-sm text-muted-foreground mb-4">
          Enviamos um código de 6 dígitos para:
        </p>
        <p className="font-medium text-sm">{email}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Código de Verificação</Label>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value[index] || ''}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-lg font-mono"
              disabled={loading}
              autoComplete="one-time-code"
            />
          ))}
        </div>
      </div>

      <div className="text-center text-sm">
        {timeLeft > 0 ? (
          <p className="text-muted-foreground">
            Código expira em: <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
          </p>
        ) : (
          <p className="text-destructive">
            ⚠️ Código expirado
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        variant="cta"
        className="w-full"
        disabled={loading || value.length !== 6}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verificando...
          </>
        ) : (
          'Confirmar e Entrar'
        )}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={handleResendCode}
          disabled={!canResend || resendLoading}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {resendLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reenviando...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              {canResend ? 'Reenviar código' : 'Aguarde para reenviar'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};