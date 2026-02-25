-- First check and clean up existing policies that might cause issues
-- Drop all existing policies for gabinete_members and recreate them properly
DROP POLICY IF EXISTS "Platform admins can manage gabinete_members" ON public.gabinete_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.gabinete_members;  
DROP POLICY IF EXISTS "Politicians can manage their cabinet members" ON public.gabinete_members;

-- Now create the correct non-recursive policies
CREATE POLICY "Admin access to gabinete_members"
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

CREATE POLICY "Member access to own membership"
ON public.gabinete_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Politico manage cabinet members"
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