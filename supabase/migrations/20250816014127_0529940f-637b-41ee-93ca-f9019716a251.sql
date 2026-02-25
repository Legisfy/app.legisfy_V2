-- Limpeza completa de usuários e dados relacionados
-- Remover dados das tabelas relacionadas primeiro (devido às foreign keys)

-- Limpar dados de gabinetes e relacionados
DELETE FROM rankings_mensais;
DELETE FROM pontuacoes_assessores;
DELETE FROM eventos;
DELETE FROM ideias;
DELETE FROM indicacoes;
DELETE FROM demandas;
DELETE FROM eleitores;
DELETE FROM assessores;
DELETE FROM gabinete_usuarios;
DELETE FROM convites;
DELETE FROM gabinetes;

-- Limpar dados de usuários
DELETE FROM whatsapp_connections;
DELETE FROM profiles;

-- Limpar usuários do auth (apenas se não for admin de plataforma)
-- Manter apenas admins que estão na tabela admin_emails
DELETE FROM auth.users 
WHERE id NOT IN (
  SELECT p.user_id 
  FROM profiles p 
  WHERE p.main_role = 'admin_plataforma'
);

-- Remover perfis de usuários que não são admin
DELETE FROM profiles 
WHERE main_role != 'admin_plataforma';

-- Resetar sequences se necessário
-- (As tabelas usam gen_random_uuid() então não há sequences para resetar)