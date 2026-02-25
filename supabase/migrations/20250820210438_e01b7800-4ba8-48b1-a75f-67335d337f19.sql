-- Fixing critical security vulnerability in invitations table
-- Remove overly permissive policies that expose email addresses

-- Drop existing problematic policies
DROP POLICY IF EXISTS "System can manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can view invitations by email" ON public.invitations;

-- Create secure policies that protect email addresses

-- Policy 1: Platform admins can manage all invitations
-- (This policy already exists and is correct)

-- Policy 2: Users can only view invitations sent to their own email address
CREATE POLICY "Users can view own invitations only" 
ON public.invitations 
FOR SELECT 
TO authenticated
USING (
  lower(email) = lower((SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()))
  OR is_platform_admin()
);

-- Policy 3: Only platform admins can create invitations
CREATE POLICY "Only platform admins can create invitations" 
ON public.invitations 
FOR INSERT 
TO authenticated
WITH CHECK (is_platform_admin());

-- Policy 4: Only platform admins can update invitations
CREATE POLICY "Only platform admins can update invitations" 
ON public.invitations 
FOR UPDATE 
TO authenticated
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Policy 5: Only platform admins can delete invitations
CREATE POLICY "Only platform admins can delete invitations" 
ON public.invitations 
FOR DELETE 
TO authenticated
USING (is_platform_admin());