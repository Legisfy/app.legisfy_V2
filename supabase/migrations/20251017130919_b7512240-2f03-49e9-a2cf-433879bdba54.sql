-- Create enum for status
CREATE TYPE assessor_ia_status AS ENUM ('em_aprendizado', 'ativo', 'desconectado');

-- Create meu_assessor_ia table
CREATE TABLE public.meu_assessor_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  comportamento TEXT NOT NULL,
  numero_whatsapp TEXT NOT NULL,
  foto_url TEXT,
  status assessor_ia_status NOT NULL DEFAULT 'em_aprendizado',
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.meu_assessor_ia ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their gabinete's AI assistant
CREATE POLICY "meu_assessor_ia_read_access"
ON public.meu_assessor_ia
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = meu_assessor_ia.gabinete_id
    AND (g.politico_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.gabinete_members gm
      WHERE gm.gabinete_id = g.id AND gm.user_id = auth.uid()
    ))
  )
);

-- Policy: Users can create AI assistant for their gabinete
CREATE POLICY "meu_assessor_ia_create_access"
ON public.meu_assessor_ia
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = meu_assessor_ia.gabinete_id
    AND (g.politico_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.gabinete_members gm
      WHERE gm.gabinete_id = g.id 
      AND gm.user_id = auth.uid()
      AND gm.role IN ('politico', 'chefe')
    ))
  )
);

-- Policy: Users can update their gabinete's AI assistant
CREATE POLICY "meu_assessor_ia_update_access"
ON public.meu_assessor_ia
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = meu_assessor_ia.gabinete_id
    AND (g.politico_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.gabinete_members gm
      WHERE gm.gabinete_id = g.id 
      AND gm.user_id = auth.uid()
      AND gm.role IN ('politico', 'chefe')
    ))
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_meu_assessor_ia_updated_at
  BEFORE UPDATE ON public.meu_assessor_ia
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();