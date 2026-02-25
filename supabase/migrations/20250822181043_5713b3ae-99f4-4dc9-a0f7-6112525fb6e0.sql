-- Criar um convite de teste para verificar se a consulta funciona
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