-- Criar tabela para códigos de autenticação de dois fatores
CREATE TABLE IF NOT EXISTS public.two_factor_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_email ON public.two_factor_codes(email);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_expires_at ON public.two_factor_codes(expires_at);

-- RLS para segurança
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de códigos (função server-side)
CREATE POLICY "Allow service role to manage 2FA codes" 
ON public.two_factor_codes 
FOR ALL 
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_two_factor_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_two_factor_codes_updated_at
  BEFORE UPDATE ON public.two_factor_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_two_factor_codes_updated_at();

-- Função para limpar códigos expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.two_factor_codes 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;