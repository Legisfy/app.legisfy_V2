-- Criar tabela eleitor_tags
CREATE TABLE IF NOT EXISTS public.eleitor_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT 'Tag',
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gabinete_id, name)
);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_eleitor_tags_gabinete ON public.eleitor_tags(gabinete_id);

-- Habilitar RLS
ALTER TABLE public.eleitor_tags ENABLE ROW LEVEL SECURITY;

-- Política para leitura: membros do gabinete
CREATE POLICY "eleitor_tags_cabinet_read"
ON public.eleitor_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = eleitor_tags.gabinete_id
    AND (g.politico_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.gabinete_members gm
    WHERE gm.gabinete_id = eleitor_tags.gabinete_id
    AND gm.user_id = auth.uid()
  )
);

-- Política para escrita: membros do gabinete
CREATE POLICY "eleitor_tags_cabinet_write"
ON public.eleitor_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = eleitor_tags.gabinete_id
    AND (g.politico_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.gabinete_members gm
    WHERE gm.gabinete_id = eleitor_tags.gabinete_id
    AND gm.user_id = auth.uid()
  )
);

-- Migrar TAGs de gabinete_custom_tags para eleitor_tags
INSERT INTO public.eleitor_tags (name, color, icon, gabinete_id, created_by)
SELECT 
  name,
  COALESCE(color, '#3b82f6'),
  COALESCE(icon, 'Tag'),
  gabinete_id,
  created_by
FROM public.gabinete_custom_tags
WHERE category = 'eleitores'
ON CONFLICT (gabinete_id, name) DO NOTHING;

-- Comentário explicativo
COMMENT ON TABLE public.eleitor_tags IS 'TAGs específicas para eleitores, criadas por cada gabinete';
COMMENT ON COLUMN public.eleitor_tags.gabinete_id IS 'Gabinete ao qual a TAG pertence';