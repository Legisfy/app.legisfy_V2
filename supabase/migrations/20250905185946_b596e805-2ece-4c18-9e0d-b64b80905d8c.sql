-- Allow service role to update principal_invitations (needed for edge functions)
CREATE POLICY "Service role can update principal_invitations" 
ON public.principal_invitations 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);