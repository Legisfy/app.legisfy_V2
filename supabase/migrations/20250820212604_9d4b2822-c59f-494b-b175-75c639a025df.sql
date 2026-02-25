-- First, let's drop ALL existing policies on gabinetes to start fresh
DROP POLICY IF EXISTS "Platform admins have full access to gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Politicians can view their own gabinetes" ON public.gabinetes;  
DROP POLICY IF EXISTS "Cabinet members can view their gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "members_view_gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "platform_admin_access_gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "politico_manage_gabinetes" ON public.gabinetes;

-- Create simple, non-recursive policies
CREATE POLICY "Platform admins full access to gabinetes"
ON public.gabinetes
FOR ALL
TO authenticated
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Politicians access their gabinetes"
ON public.gabinetes
FOR ALL
TO authenticated
USING (politico_id = auth.uid())
WITH CHECK (politico_id = auth.uid());

-- Now fix edge function issue by updating the generate-invite-link function
-- The issue is that newer Supabase versions require password for signup links