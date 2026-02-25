-- Create a gabinete for the user korvoead@gmail.com
INSERT INTO public.gabinetes (
  nome,
  politico_id,
  camara_id,
  institution_id,
  status
) VALUES (
  'Gabinete do Vereador Carlos Gabriel',
  'd4e07676-4489-49dd-9376-6b36523b37e5',
  'a1d2c71b-b950-48ea-b34d-68e12cb1dffd',
  'a1d2c71b-b950-48ea-b34d-68e12cb1dffd',
  'ativo'::gabinete_status
);

-- Get the created gabinete ID and insert some test eleitores
WITH new_gabinete AS (
  SELECT id FROM public.gabinetes 
  WHERE politico_id = 'd4e07676-4489-49dd-9376-6b36523b37e5'
  LIMIT 1
)
INSERT INTO public.eleitores (
  name,
  whatsapp,
  address,
  neighborhood,
  user_id,
  gabinete_id,
  email
) 
SELECT 
  nome,
  telefone,
  endereco,
  bairro,
  'd4e07676-4489-49dd-9376-6b36523b37e5',
  ng.id,
  email
FROM new_gabinete ng,
(VALUES 
  ('Maria Silva Santos', '+5527999887766', 'Rua das Flores, 123', 'Centro', 'maria.silva@email.com'),
  ('João Carlos Oliveira', '+5527988776655', 'Av. Principal, 456', 'Jardim América', 'joao.carlos@email.com'),
  ('Ana Paula Costa', '+5527977665544', 'Rua da Paz, 789', 'Vila Nova', 'ana.paula@email.com'),
  ('Pedro Santos Lima', '+5527966554433', 'Rua do Comércio, 321', 'Centro', 'pedro.santos@email.com'),
  ('Carla Rodrigues', '+5527955443322', 'Av. das Palmeiras, 654', 'Jardim Tropical', 'carla.rodrigues@email.com')
) AS valores(nome, telefone, endereco, bairro, email);

-- Create gabinete_members entry for the user as politico
INSERT INTO public.gabinete_members (
  gabinete_id,
  user_id,
  role
) 
SELECT 
  g.id,
  'd4e07676-4489-49dd-9376-6b36523b37e5',
  'politico'
FROM public.gabinetes g
WHERE g.politico_id = 'd4e07676-4489-49dd-9376-6b36523b37e5'
ON CONFLICT DO NOTHING;