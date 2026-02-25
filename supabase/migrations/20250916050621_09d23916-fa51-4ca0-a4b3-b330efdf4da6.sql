-- Fix RLS policies to ensure data access for politicians and cabinet members

-- First, ensure gabinetes has proper policies for politicians to see their own gabinete
DROP POLICY IF EXISTS "gabinetes_politico_access" ON public.gabinetes;
CREATE POLICY "gabinetes_politico_access" 
ON public.gabinetes 
FOR ALL 
USING (
  politico_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = gabinetes.id 
    AND gm.user_id = auth.uid()
  )
);

-- Ensure demandas RLS allows proper cabinet access
DROP POLICY IF EXISTS "demandas_read_if_member_or_owner" ON public.demandas;
CREATE POLICY "demandas_cabinet_access" 
ON public.demandas 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = demandas.gabinete_id 
    AND gm.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = demandas.gabinete_id 
    AND g.politico_id = auth.uid()
  ) OR 
  owner_user_id = auth.uid()
);

-- Ensure indicacoes has proper RLS 
DROP POLICY IF EXISTS "indicacoes_all" ON public.indicacoes;
CREATE POLICY "indicacoes_cabinet_access" 
ON public.indicacoes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = indicacoes.gabinete_id 
    AND gm.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = indicacoes.gabinete_id 
    AND g.politico_id = auth.uid()
  ) OR 
  owner_user_id = auth.uid()
);

-- Ensure ideias has proper RLS
DROP POLICY IF EXISTS "ideias_all" ON public.ideias;
CREATE POLICY "ideias_cabinet_access" 
ON public.ideias 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = ideias.gabinete_id 
    AND gm.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = ideias.gabinete_id 
    AND g.politico_id = auth.uid()
  ) OR 
  owner_user_id = auth.uid()
);