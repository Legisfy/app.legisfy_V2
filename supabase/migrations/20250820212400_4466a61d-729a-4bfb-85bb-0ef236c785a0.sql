-- Fix remaining gabinete_members policies for infinite recursion
DROP POLICY IF EXISTS "Allow viewing gabinete_members for owners and members" ON public.gabinete_members;
DROP POLICY IF EXISTS "Deny all authenticated access to gabinete_members" ON public.gabinete_members;

-- Create proper policies for gabinete_members
CREATE POLICY "Platform admins can manage gabinete_members"
ON public.gabinete_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.main_role = 'admin_plataforma'
  )
);

CREATE POLICY "Users can view their own membership"
ON public.gabinete_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Politicians can manage their cabinet members"
ON public.gabinete_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = gabinete_members.gabinete_id 
    AND g.politico_id = auth.uid()
  )
);

-- Also fix gabinetes table to have proper non-recursive policies
DROP POLICY IF EXISTS "members_view_gabinetes" ON public.gabinetes;

CREATE POLICY "Cabinet members can view their gabinetes"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT gm.gabinete_id 
    FROM public.gabinete_members gm 
    WHERE gm.user_id = auth.uid()
  )
);