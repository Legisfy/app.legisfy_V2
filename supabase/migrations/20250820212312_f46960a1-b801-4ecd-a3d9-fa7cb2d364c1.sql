-- Fix infinite recursion in gabinetes table policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view gabinetes they belong to" ON public.gabinetes;
DROP POLICY IF EXISTS "Users can view their gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Admins can view all gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Platform admins can view all gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Politicos can view their own gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Members can view their gabinetes" ON public.gabinetes;

-- Create simplified, non-recursive policies for gabinetes table
CREATE POLICY "Platform admins have full access to gabinetes"
ON public.gabinetes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.main_role = 'admin_plataforma'
  )
);

CREATE POLICY "Politicians can view their own gabinetes"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (politico_id = auth.uid());

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

-- Fix the edge function password issue by updating the admin.generateLink call
-- The issue is that Supabase requires a password for signup links in newer versions