-- Create communications table for admin announcements
CREATE TABLE public.comunicados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  texto_botao TEXT DEFAULT 'Saiba Mais',
  link_botao TEXT DEFAULT '#',
  ativo BOOLEAN NOT NULL DEFAULT true,
  prioridade INTEGER NOT NULL DEFAULT 1,
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

-- Create policies for communications
CREATE POLICY "Platform admins can manage comunicados" 
ON public.comunicados 
FOR ALL 
USING (is_platform_admin());

CREATE POLICY "Users can view active comunicados" 
ON public.comunicados 
FOR SELECT 
USING (
  ativo = true 
  AND (data_inicio IS NULL OR data_inicio <= now()) 
  AND (data_fim IS NULL OR data_fim >= now())
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_comunicados_updated_at
BEFORE UPDATE ON public.comunicados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();