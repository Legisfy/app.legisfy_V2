-- Drop the existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Platform admins can manage principal invitations" ON public.principal_invitations;
DROP POLICY IF EXISTS "Public can read pending invitations" ON public.principal_invitations;

-- Create RLS policies for principal_invitations
CREATE POLICY "Platform admins can manage principal invitations" ON public.principal_invitations
FOR ALL USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Allow public read for validation (needed for accepting invitations)
CREATE POLICY "Public can read pending invitations" ON public.principal_invitations
FOR SELECT USING (status = 'pending' AND expires_at > NOW());