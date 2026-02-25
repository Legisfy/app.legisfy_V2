-- Fix get_principal_invitation_details RPC function to work properly
-- The issue is that it returns a TABLE which causes 406 errors
-- We need to return JSONB instead and handle the case properly

DROP FUNCTION IF EXISTS public.get_principal_invitation_details(text);

CREATE OR REPLACE FUNCTION public.get_principal_invitation_details(p_token text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;