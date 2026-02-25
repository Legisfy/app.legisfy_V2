-- Create a security definer function to fetch principal invitation details by token (publicly callable)
CREATE OR REPLACE FUNCTION public.get_principal_invitation_details(p_token text)
RETURNS TABLE(
  email text,
  expires_at timestamptz,
  accepted_at timestamptz,
  institution_id uuid,
  camara_nome text,
  tipo text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.email,
    pi.expires_at,
    pi.accepted_at,
    pi.institution_id,
    c.nome AS camara_nome,
    c.tipo::text AS tipo
  FROM public.principal_invitations pi
  JOIN public.camaras c ON c.id = pi.institution_id
  WHERE pi.token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth';