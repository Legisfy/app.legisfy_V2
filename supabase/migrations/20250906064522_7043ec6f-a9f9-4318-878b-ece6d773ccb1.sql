-- Corrigir o nome do usuário para André Brandino
UPDATE public.profiles 
SET full_name = 'André Brandino', updated_at = now()
WHERE user_id = 'df7115b2-c3c4-4d3c-95e9-7ccace630fa2';

-- Atualizar o nome do gabinete com o nome correto
UPDATE public.gabinetes
SET nome = 'Gabinete do Vereador André Brandino', updated_at = now()
WHERE politico_id = 'df7115b2-c3c4-4d3c-95e9-7ccace630fa2' AND status = 'ativo';