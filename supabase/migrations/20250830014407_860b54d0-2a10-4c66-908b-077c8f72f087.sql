-- Permite acesso público aos convites usando token para aceitar convites
CREATE POLICY "Anyone can view invitations with valid token"
ON public.invitations
FOR SELECT
USING (
  token IS NOT NULL 
  AND accepted_at IS NULL 
  AND (expires_at IS NULL OR expires_at > now())
);