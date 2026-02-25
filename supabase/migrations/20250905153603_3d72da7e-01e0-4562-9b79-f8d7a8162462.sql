-- Função para resetar senha de político
CREATE OR REPLACE FUNCTION public.reset_politico_password(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
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
  
  -- Gerar novo token de reset de senha
  UPDATE auth.users 
  SET 
    recovery_token = encode(gen_random_bytes(32), 'base64'),
    recovery_sent_at = now()
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Token de reset gerado com sucesso'
  );
END;
$$;

-- Melhorar o trigger handle_new_user para políticos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text := 'assessor';
BEGIN
  -- Verificar se o email está na lista de admins
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email)) THEN
    user_role := 'admin_plataforma';
  -- Verificar se é político baseado nos metadados OU se está autorizado
  ELSIF (NEW.raw_user_meta_data ->> 'user_type' = 'politico') OR 
        EXISTS (SELECT 1 FROM public.politicos_autorizados WHERE lower(email) = lower(NEW.email) AND is_active = true) THEN
    user_role := 'politico';
  END IF;

  -- Insert/update profile com melhor tratamento de erro
  INSERT INTO public.profiles (user_id, full_name, main_role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name', 
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    user_role::user_role_type
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(
      NEW.raw_user_meta_data ->> 'full_name', 
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    main_role = user_role::user_role_type,
    updated_at = now();
    
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;