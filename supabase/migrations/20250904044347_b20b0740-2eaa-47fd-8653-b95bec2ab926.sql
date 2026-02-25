-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_principal_invitation_details(text);

-- Create function to get principal invitation details (with proper security context)
CREATE OR REPLACE FUNCTION public.get_principal_invitation_details(p_token TEXT)
RETURNS TABLE (
  email TEXT,
  institution_id TEXT,
  camara_nome TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.email,
    pi.institution_id::TEXT,
    i.name AS camara_nome,
    pi.expires_at
  FROM principal_invitations pi
  LEFT JOIN institutions i ON i.id::TEXT = pi.institution_id
  WHERE pi.token = p_token
  AND pi.expires_at > NOW()
  AND pi.status = 'pending';
END;
$$;