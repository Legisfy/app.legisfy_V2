-- Drop the pgcrypto extension and reinstall it properly
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION pgcrypto SCHEMA extensions;

-- Update the principal_invitations table to use a simpler approach
ALTER TABLE public.principal_invitations 
ALTER COLUMN token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Update the send_principal_invite function to use gen_random_uuid instead
CREATE OR REPLACE FUNCTION public.send_principal_invite(p_email text, p_institution_id uuid)
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
  -- Log para debug
  RAISE LOG 'send_principal_invite called with email: %, institution_id: %', p_email, p_institution_id;
  
  -- Normalize email
  v_normalized_email := lower(trim(p_email));
  
  -- Check if email is authorized for this camara
  SELECT EXISTS (
    SELECT 1 FROM public.politicos_autorizados 
    WHERE lower(email) = v_normalized_email 
    AND camara_id = p_institution_id 
    AND COALESCE(is_active, true) = true
  ) INTO v_is_authorized;
  
  RAISE LOG 'Email authorization check result: %', v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email não autorizado para esta instituição'
    );
  END IF;
  
  -- Check for existing active invitation
  SELECT * INTO v_existing_invitation
  FROM public.principal_invitations
  WHERE institution_id = p_institution_id 
  AND lower(email) = v_normalized_email
  AND accepted_at IS NULL;
  
  -- Generate new token using gen_random_uuid (remove dashes for cleaner token)
  v_new_token := replace(gen_random_uuid()::text, '-', '');
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
    RAISE LOG 'Updated existing invitation with id: %', v_invitation_id;
  ELSE
    -- Create new invitation
    INSERT INTO public.principal_invitations (
      institution_id, email, token, expires_at, created_by
    ) VALUES (
      p_institution_id, v_normalized_email, v_new_token, v_expires_at, auth.uid()
    ) RETURNING id INTO v_invitation_id;
    
    RAISE LOG 'Created new invitation with id: %', v_invitation_id;
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

-- Test that everything works
SELECT public.send_principal_invite('test@example.com', gen_random_uuid()) as test_result;