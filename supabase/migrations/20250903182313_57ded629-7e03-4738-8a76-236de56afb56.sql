-- Criar tabela para códigos de verificação 2FA
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (apenas o sistema pode gerenciar códigos)
CREATE POLICY "Service role can manage verification codes" 
ON public.verification_codes 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger para updated_at
CREATE TRIGGER update_verification_codes_updated_at
  BEFORE UPDATE ON public.verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();