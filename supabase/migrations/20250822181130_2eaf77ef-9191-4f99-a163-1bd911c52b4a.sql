-- Primeiro, criar uma entrada na tabela institutions para o gabinete
INSERT INTO public.institutions (id, name) 
SELECT 
  g.id,
  g.nome
FROM public.gabinetes g
WHERE g.id = '2a1794ed-ceb3-44b8-96ca-4427fbb189f7'
ON CONFLICT (id) DO NOTHING;

-- Agora criar um convite de teste
INSERT INTO public.invitations (
  email, 
  name, 
  role, 
  institution_id, 
  token, 
  email_sent
) VALUES (
  'teste@example.com',
  'Assessor Teste',
  'assessor',
  '2a1794ed-ceb3-44b8-96ca-4427fbb189f7',
  'test_token_123456',
  true
);