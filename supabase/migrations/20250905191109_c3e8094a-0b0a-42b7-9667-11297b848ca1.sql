-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the admin_reset_politico_password function to properly handle password encryption
CREATE OR REPLACE FUNCTION public.admin_reset_politico_password(p_email text, p_new_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
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
  
  -- Atualizar senha e confirmar email se necessário
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
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