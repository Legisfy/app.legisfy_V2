-- Fix reset functions to use proper crypto functions
CREATE OR REPLACE FUNCTION public.reset_politico_password(p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_user_id uuid;
  v_normalized_email text;
BEGIN
  -- Normalizar email
  v_normalized_email := lower(trim(p_email));
  
  -- Verificar se o usuário existe e é um político autorizado
  SELECT u.id INTO v_user_id
  FROM auth.users u
  JOIN public.politicos_autorizados pa ON lower(pa.email) = v_normalized_email
  WHERE lower(u.email) = v_normalized_email
  AND pa.is_active = true;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado ou não é um político autorizado'
    );
  END IF;
  
  -- Gerar novo token de reset de senha usando função do Postgres
  UPDATE auth.users 
  SET 
    recovery_token = encode(extensions.gen_random_bytes(32), 'base64'),
    recovery_sent_at = now()
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Token de reset gerado com sucesso'
  );
END;
$function$;

-- Also fix the admin reset function
CREATE OR REPLACE FUNCTION public.admin_reset_politico_password(p_email text, p_new_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_user_id uuid;
  v_normalized_email text;
BEGIN
  -- Normalizar email
  v_normalized_email := lower(trim(p_email));
  
  -- Verificar se o usuário existe e é um político
  SELECT u.id INTO v_user_id
  FROM auth.users u
  JOIN public.profiles prof ON prof.user_id = u.id
  WHERE lower(u.email) = v_normalized_email
  AND prof.main_role = 'politico';
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário político não encontrado'
    );
  END IF;
  
  -- Atualizar senha usando crypt da extensão pgcrypto
  UPDATE auth.users 
  SET 
    encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Senha atualizada com sucesso',
    'user_id', v_user_id
  );
END;
$function$;