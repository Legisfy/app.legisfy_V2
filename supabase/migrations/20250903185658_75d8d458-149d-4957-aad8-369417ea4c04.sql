-- Create RLS policies for principal_invitations to allow users to access their own invitations

-- Allow users to read invitations sent to their email
CREATE POLICY "Users can read invitations sent to their email" ON public.principal_invitations
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Allow users to update invitations when accepting (for accepted_at field)
CREATE POLICY "Users can accept invitations sent to their email" ON public.principal_invitations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())) AND
  accepted_at IS NULL
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);