-- Fix gabinete_metas RLS policy to allow both politicians and cabinet members
DROP POLICY IF EXISTS "gabinete_metas_all" ON public.gabinete_metas;

CREATE POLICY "gabinete_metas_access" 
ON public.gabinete_metas 
FOR ALL 
USING (
  -- Allow if user is the politician (owner) of the gabinete
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = gabinete_metas.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  -- Allow if user is a member of the gabinete
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = gabinete_metas.gabinete_id 
    AND gm.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Same check for INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = gabinete_metas.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = gabinete_metas.gabinete_id 
    AND gm.user_id = auth.uid()
  )
);

-- Also fix gabinete_pontuacoes table with the same pattern
DROP POLICY IF EXISTS "gabinete_pontuacoes_all" ON public.gabinete_pontuacoes;

CREATE POLICY "gabinete_pontuacoes_access" 
ON public.gabinete_pontuacoes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = gabinete_pontuacoes.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = gabinete_pontuacoes.gabinete_id 
    AND gm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = gabinete_pontuacoes.gabinete_id 
    AND g.politico_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = gabinete_pontuacoes.gabinete_id 
    AND gm.user_id = auth.uid()
  )
);