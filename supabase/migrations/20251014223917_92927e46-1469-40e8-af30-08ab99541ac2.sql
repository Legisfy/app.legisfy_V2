-- Create table for dynamic voter segments/audiences
CREATE TABLE IF NOT EXISTS public.publicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  filtros JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.publicos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "publicos_cabinet_access" 
ON public.publicos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = publicos.gabinete_id 
    AND g.politico_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = publicos.gabinete_id 
    AND gm.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_publicos_updated_at
  BEFORE UPDATE ON public.publicos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for performance
CREATE INDEX idx_publicos_gabinete_id ON public.publicos(gabinete_id);
CREATE INDEX idx_publicos_active ON public.publicos(is_active) WHERE is_active = true;