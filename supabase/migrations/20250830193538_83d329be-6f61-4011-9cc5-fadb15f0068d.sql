-- Corrigir a referência de chave estrangeira na tabela invitations
-- Remover a constraint que referencia auth.users se existir e ajustar para UUID simples

-- Primeiro, vamos verificar se a coluna tem constraint de foreign key para auth.users
-- e removê-la, pois não podemos referenciar auth.users diretamente

-- Alterar a coluna para ser apenas UUID sem foreign key constraint
ALTER TABLE public.invitations 
ALTER COLUMN accepted_by_user_id DROP NOT NULL;