-- Corrigir gabinetes que não têm politician_name preenchido
-- Buscar o nome do profile do político e preencher o campo

UPDATE gabinetes g
SET politician_name = p.full_name
FROM profiles p
WHERE g.politico_id = p.user_id
  AND (g.politician_name IS NULL OR g.politician_name = '')
  AND g.status = 'ativo';