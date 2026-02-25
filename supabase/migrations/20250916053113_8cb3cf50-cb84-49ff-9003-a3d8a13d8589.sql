-- Fix all other gabinete-related tables to have consistent RLS policies
-- This ensures all features work properly for both politicians and cabinet members

-- Fix eleitores policy
DROP POLICY IF EXISTS "eleitores_cabinet_access" ON public.eleitores;
CREATE POLICY "eleitores_access" 
ON public.eleitores 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = eleitores.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = eleitores.gabinete_id 
    AND gm.user_id = auth.uid()
  )
  OR
  owner_user_id = auth.uid()
);

-- Fix demandas policy  
DROP POLICY IF EXISTS "demandas_cabinet_access" ON public.demandas;
CREATE POLICY "demandas_access" 
ON public.demandas 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = demandas.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = demandas.gabinete_id 
    AND gm.user_id = auth.uid()
  )
  OR
  owner_user_id = auth.uid()
);

-- Fix eventos policy
DROP POLICY IF EXISTS "eventos_all" ON public.eventos;
CREATE POLICY "eventos_access" 
ON public.eventos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = eventos.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = eventos.gabinete_id 
    AND gm.user_id = auth.uid()
  )
  OR
  owner_user_id = auth.uid()
);