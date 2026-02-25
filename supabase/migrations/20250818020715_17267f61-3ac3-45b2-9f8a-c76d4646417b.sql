-- Drop all existing policies first
DROP POLICY IF EXISTS "platform_admin_access_gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "politico_manage_gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "members_view_gabinetes" ON public.gabinetes;

-- Temporarily disable RLS on gabinetes
ALTER TABLE public.gabinetes DISABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for gabinetes
CREATE POLICY "platform_admin_access_gabinetes"
ON public.gabinetes
FOR ALL
TO authenticated
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "politico_manage_gabinetes"
ON public.gabinetes
FOR ALL
TO authenticated  
USING (politico_id = auth.uid())
WITH CHECK (politico_id = auth.uid());

CREATE POLICY "members_view_gabinetes"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = gabinetes.id 
    AND gm.user_id = auth.uid()
  )
);

-- Re-enable RLS
ALTER TABLE public.gabinetes ENABLE ROW LEVEL SECURITY;