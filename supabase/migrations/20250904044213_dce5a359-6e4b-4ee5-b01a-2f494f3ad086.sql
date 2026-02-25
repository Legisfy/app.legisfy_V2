-- Create function to get principal invitation details (with proper security context)
CREATE OR REPLACE FUNCTION get_principal_invitation_details(p_token TEXT)
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

-- Create function to accept principal invitation (with proper security context)
CREATE OR REPLACE FUNCTION accept_principal_invitation(p_token TEXT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_gabinete_id UUID;
  v_existing_gabinete RECORD;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- If no user is authenticated, return error
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Get invitation details
  SELECT pi.*, i.name as institution_name
  INTO v_invitation
  FROM principal_invitations pi
  LEFT JOIN institutions i ON i.id::TEXT = pi.institution_id
  WHERE pi.token = p_token
  AND pi.expires_at > NOW()
  AND pi.status = 'pending';

  -- Check if invitation exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;

  -- Check if user email matches invitation
  IF (SELECT email FROM auth.users WHERE id = v_user_id) != v_invitation.email THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email mismatch'
    );
  END IF;

  -- Check if gabinete already exists for this user
  SELECT * INTO v_existing_gabinete
  FROM gabinetes
  WHERE politico_id = v_user_id;

  IF FOUND THEN
    -- Update invitation status
    UPDATE principal_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE token = p_token;

    RETURN json_build_object(
      'success', true,
      'existing', true,
      'gabinete_id', v_existing_gabinete.id
    );
  END IF;

  -- Mark invitation as accepted
  UPDATE principal_invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE token = p_token;

  RETURN json_build_object(
    'success', true,
    'existing', false,
    'invitation_id', v_invitation.id
  );
END;
$$;