-- Add soft delete columns to camaras table
ALTER TABLE public.camaras 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance on deleted items
CREATE INDEX idx_camaras_deleted ON public.camaras(is_deleted, deleted_at);

-- Create table for feedback/ouvidoria 
CREATE TABLE public.feedback_ouvidoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('Elogio', 'Dúvida', 'Sugestão', 'Problema')),
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT NOT NULL,
  gabinete_nome TEXT,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Novo' CHECK (status IN ('Novo', 'Em Andamento', 'Resolvido', 'Respondido')),
  prioridade TEXT NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Alta', 'Média', 'Baixa')),
  categoria TEXT,
  resposta TEXT,
  respondido_por UUID REFERENCES auth.users(id),
  respondido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_ouvidoria ENABLE ROW LEVEL SECURITY;

-- RLS policies for feedback
CREATE POLICY "Platform admins can manage feedback" 
ON public.feedback_ouvidoria 
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Authenticated users can create feedback" 
ON public.feedback_ouvidoria 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE TRIGGER update_feedback_ouvidoria_updated_at
  BEFORE UPDATE ON public.feedback_ouvidoria
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update camaras RLS policy to exclude deleted items
DROP POLICY IF EXISTS "Users can view camaras" ON public.camaras;

CREATE POLICY "Users can view active camaras" 
ON public.camaras 
FOR SELECT 
USING (is_deleted = false);

CREATE POLICY "Platform admins can view all camaras including deleted" 
ON public.camaras 
FOR SELECT 
USING (is_platform_admin());