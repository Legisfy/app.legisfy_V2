-- Remove problematic recursive policies from gabinete_members
DROP POLICY IF EXISTS "gabinete_members_all" ON public.gabinete_members;
DROP POLICY IF EXISTS "read_members_same_gabinete" ON public.gabinete_members;

-- Create simple, non-recursive policies for gabinete_members
-- Policy 1: Users can read their own membership records
CREATE POLICY "gabinete_members_own_record" ON public.gabinete_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Politicians can manage their gabinete members
CREATE POLICY "gabinete_members_politico_manage" ON public.gabinete_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = gabinete_members.gabinete_id
    AND g.politico_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gabinetes g
    WHERE g.id = gabinete_members.gabinete_id
    AND g.politico_id = auth.uid()
  )
);

-- Policy 3: Admin platform access
CREATE POLICY "gabinete_members_admin_access" ON public.gabinete_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.main_role = 'admin_plataforma'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.main_role = 'admin_plataforma'
  )
);