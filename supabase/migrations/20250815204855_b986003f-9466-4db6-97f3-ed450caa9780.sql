-- Função para criar usuário admin diretamente na tabela auth.users
-- Esta é uma abordagem especial para criar o primeiro admin do sistema

-- Primeiro, inserir na tabela auth.users (contornando as restrições normais)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_super_admin,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_anonymous,
  aud,
  role
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'contato.legisfy@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  0,
  null,
  '',
  null,
  false,
  null,
  false,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  '{}',
  '{"user_type": "admin"}',
  false,
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'contato.legisfy@gmail.com'
);

-- Agora inserir o perfil correspondente
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