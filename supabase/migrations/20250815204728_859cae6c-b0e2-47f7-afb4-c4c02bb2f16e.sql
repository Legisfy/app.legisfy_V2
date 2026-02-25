-- Criar usuário admin do sistema
-- Primeiro inserir o usuário na tabela auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change_token_new,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'contato.legisfy@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"user_type": "admin"}',
  false,
  '',
  '',
  0,
  null,
  '',
  null,
  false,
  null
) ON CONFLICT (email) DO NOTHING;

-- Inserir perfil de admin na tabela profiles
INSERT INTO public.profiles (
  user_id,
  full_name,
  main_role,
  created_at,
  updated_at
)
SELECT 
  id,
  'Administrador do Sistema',
  'admin_plataforma',
  now(),
  now()
FROM auth.users 
WHERE email = 'contato.legisfy@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  main_role = 'admin_plataforma',
  full_name = 'Administrador do Sistema';

-- Garantir que a função is_platform_admin funcione corretamente
-- Atualizar a função para ser mais robusta
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  );
$$;