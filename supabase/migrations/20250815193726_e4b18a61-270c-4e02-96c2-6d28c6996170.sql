-- Update camaras table with additional fields
ALTER TABLE public.camaras 
ADD COLUMN presidente TEXT,
ADD COLUMN logomarca_url TEXT,
ADD COLUMN numero_gabinetes_permitidos INTEGER DEFAULT 10,
ADD COLUMN usuarios_por_gabinete_permitidos INTEGER DEFAULT 20;

-- Create table for authorized politician emails
CREATE TABLE public.politicos_autorizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camara_id UUID NOT NULL REFERENCES public.camaras(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome_politico TEXT,
  cargo_pretendido TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_autorizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_utilizacao TIMESTAMP WITH TIME ZONE,
  user_id UUID, -- Will be filled when politician creates account
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(email, camara_id)
);

-- Enable RLS
ALTER TABLE public.politicos_autorizados ENABLE ROW LEVEL SECURITY;

-- Create policies for politicos_autorizados
CREATE POLICY "Platform admins can manage politicos autorizados" 
ON public.politicos_autorizados 
FOR ALL 
USING (is_platform_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_politicos_autorizados_updated_at
BEFORE UPDATE ON public.politicos_autorizados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();