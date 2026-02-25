-- Fix get_principal_invitation_details to properly return JSONB with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.get_principal_invitation_details(text);

CREATE OR REPLACE FUNCTION public.get_principal_invitation_details(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Get invitation details and return as JSONB
  SELECT jsonb_build_object(
    'email', pi.email,
    'institution_id', pi.institution_id::TEXT,
    'camara_nome', COALESCE(c.nome, 'Instituição'),
    'expires_at', pi.expires_at,
    'tipo', c.tipo::TEXT
  ) INTO v_result
  FROM public.principal_invitations pi
  LEFT JOIN public.camaras c ON c.id = pi.institution_id
  WHERE pi.token = p_token
  AND pi.expires_at > NOW()
  AND pi.accepted_at IS NULL
  LIMIT 1;
  
  -- Return the result (will be null if not found)
  RETURN v_result;
END;
$$;