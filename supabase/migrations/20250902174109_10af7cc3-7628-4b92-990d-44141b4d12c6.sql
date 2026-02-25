-- Atualizar função send_principal_invite para trabalhar com camaras
CREATE OR REPLACE FUNCTION public.send_principal_invite(p_camara_id uuid, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_normalized_email text;
  v_is_authorized boolean;
  v_existing_invitation record;
  v_new_token text;
  v_expires_at timestamptz;
  v_invitation_id uuid;
BEGIN
  -- Normalize email
  v_normalized_email := lower(trim(p_email));
  
  -- Check if email is authorized for this camara
  SELECT EXISTS (
    SELECT 1 FROM public.politicos_autorizados 
    WHERE lower(email) = v_normalized_email 
    AND camara_id = p_camara_id 
    AND is_active = true
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email not authorized for this institution'
    );
  END IF;
  
  -- Check for existing active invitation
  SELECT * INTO v_existing_invitation
  FROM public.principal_invitations
  WHERE institution_id = p_camara_id 
  AND lower(email) = v_normalized_email
  AND accepted_at IS NULL;
  
  -- Generate new token and expiration
  v_new_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + interval '7 days';
  
  IF v_existing_invitation.id IS NOT NULL THEN
    -- Update existing invitation
    UPDATE public.principal_invitations
    SET 
      token = v_new_token,
      expires_at = v_expires_at,
      updated_at = now(),
      created_by = auth.uid()
    WHERE id = v_existing_invitation.id;
    
    v_invitation_id := v_existing_invitation.id;
  ELSE
    -- Create new invitation using camara_id as institution_id
    INSERT INTO public.principal_invitations (
      institution_id, email, token, expires_at, created_by
    ) VALUES (
      p_camara_id, v_normalized_email, v_new_token, v_expires_at, auth.uid()
    ) RETURNING id INTO v_invitation_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_new_token,
    'expires_at', v_expires_at,
    'accept_url', format('%s/aceitar?token=%s', 
      coalesce(current_setting('app.base_url', true), 'http://localhost:3000'), 
      v_new_token)
  );
END;
$function$;