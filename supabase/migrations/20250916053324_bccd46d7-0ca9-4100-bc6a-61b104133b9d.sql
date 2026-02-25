-- Fix remaining gabinete-related tables with consistent RLS policies
-- Skip eleitores and demandas as they already have updated policies

-- Update gabinete_members to also allow politico access
DROP POLICY IF EXISTS "gabinete_members_simple" ON public.gabinete_members;
CREATE POLICY "gabinete_members_access" 
ON public.gabinete_members 
FOR ALL 
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = gabinete_members.gabinete_id 
    AND g.politico_id = auth.uid()
  )
);

-- Fix ideias policy if it exists
DROP POLICY IF EXISTS "ideias_all" ON public.ideias;
CREATE POLICY "ideias_access" 
ON public.ideias 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = ideias.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = ideias.gabinete_id 
    AND gm.user_id = auth.uid()
  )
  OR
  user_id = auth.uid()
);

-- Fix indicacoes policy if it exists
DROP POLICY IF EXISTS "indicacoes_all" ON public.indicacoes;
CREATE POLICY "indicacoes_access" 
ON public.indicacoes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = indicacoes.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = indicacoes.gabinete_id 
    AND gm.user_id = auth.uid()
  )
  OR
  user_id = auth.uid()
);