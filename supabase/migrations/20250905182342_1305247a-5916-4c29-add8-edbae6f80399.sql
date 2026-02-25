-- Inserir o usuário político na tabela de autorizados se não existir
INSERT INTO public.politicos_autorizados (email, nome_politico, camara_id, cargo_pretendido, is_active, status)
SELECT 
  u.email,
  p.full_name,
  g.camara_id,
  'Vereador',
  true,
  'ativo'
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.gabinetes g ON g.politico_id = u.id
WHERE p.main_role = 'politico'
AND NOT EXISTS (
  SELECT 1 FROM public.politicos_autorizados pa WHERE pa.email = u.email
);