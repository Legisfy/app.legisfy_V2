-- Drop existing policy
DROP POLICY IF EXISTS "eleitores_cabinet_access" ON public.eleitores;

-- Create a comprehensive policy that includes both members and owners
CREATE POLICY "eleitores_cabinet_access" ON public.eleitores
FOR ALL
USING (
  -- User is a member of the cabinet
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm
    WHERE gm.gabinete_id = eleitores.gabinete_id 
    AND gm.user_id = auth.uid()
  )
  OR
  -- User is the owner of the voter record
  owner_user_id = auth.uid()
  OR
  -- User owns the cabinet (politician)
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = eleitores.gabinete_id
    AND g.politico_id = auth.uid()
  )
)
WITH CHECK (
  -- Same conditions for INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm
    WHERE gm.gabinete_id = eleitores.gabinete_id 
    AND gm.user_id = auth.uid()
  )
  OR
  owner_user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = eleitores.gabinete_id
    AND g.politico_id = auth.uid()
  )
);