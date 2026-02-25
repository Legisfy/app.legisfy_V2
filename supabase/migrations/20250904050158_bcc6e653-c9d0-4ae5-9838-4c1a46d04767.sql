-- Fix the get_principal_invitation_details function
CREATE OR REPLACE FUNCTION public.get_principal_invitation_details(p_token text)
 RETURNS TABLE(email text, institution_id text, camara_nome text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pi.email,
    pi.institution_id::TEXT,
    c.nome AS camara_nome,
    pi.expires_at
  FROM principal_invitations pi
  LEFT JOIN camaras c ON c.id = pi.institution_id
  WHERE pi.token = p_token
  AND pi.expires_at > NOW()
  AND pi.accepted_at IS NULL;
END;
$function$;