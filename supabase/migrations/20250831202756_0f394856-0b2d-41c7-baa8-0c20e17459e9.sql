-- Policies for assessor_permissions management by cabinet owner (politico), chefe, or platform admin
-- Keep existing SELECT policy; add INSERT/UPDATE/DELETE

-- INSERT policy
CREATE POLICY "Politico/chefe/admin can insert assessor permissions"
ON public.assessor_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = cabinet_id AND g.politico_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.gabinete_members gm
    WHERE gm.gabinete_id = cabinet_id AND gm.user_id = auth.uid() AND gm.role = 'chefe'
  )
);

-- UPDATE policy
CREATE POLICY "Politico/chefe/admin can update assessor permissions"
ON public.assessor_permissions
FOR UPDATE
TO authenticated
USING (
  is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = cabinet_id AND g.politico_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.gabinete_members gm
    WHERE gm.gabinete_id = cabinet_id AND gm.user_id = auth.uid() AND gm.role = 'chefe'
  )
)
WITH CHECK (
  is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = cabinet_id AND g.politico_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.gabinete_members gm
    WHERE gm.gabinete_id = cabinet_id AND gm.user_id = auth.uid() AND gm.role = 'chefe'
  )
);

-- DELETE policy
CREATE POLICY "Politico/chefe/admin can delete assessor permissions"
ON public.assessor_permissions
FOR DELETE
TO authenticated
USING (
  is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = cabinet_id AND g.politico_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.gabinete_members gm
    WHERE gm.gabinete_id = cabinet_id AND gm.user_id = auth.uid() AND gm.role = 'chefe'
  )
);
