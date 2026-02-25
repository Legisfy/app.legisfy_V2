-- Add RLS policies for principal_invitations table
-- This allows the invitation system to work properly

-- Enable RLS if not already enabled
ALTER TABLE public.principal_invitations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
ON public.principal_invitations
FOR SELECT
USING (
  lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Policy 2: Allow admins to manage all invitations
CREATE POLICY "Admins can manage all invitations"
ON public.principal_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.main_role = 'admin_plataforma'
  )
);

-- Policy 3: Allow insert for admins creating invitations
CREATE POLICY "Admins can create invitations"
ON public.principal_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.main_role = 'admin_plataforma'
  )
);

-- Policy 4: Bypass RLS for service role (used by RPC functions)
-- This is already handled by security definer functions, but we add for clarity