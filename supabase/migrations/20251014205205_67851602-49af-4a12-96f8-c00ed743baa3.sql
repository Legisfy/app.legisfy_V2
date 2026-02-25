-- Atualizar o nome político nos gabinetes existentes baseado no nome completo do perfil
UPDATE public.gabinetes g
SET politician_name = p.full_name
FROM public.profiles p
WHERE g.politico_id = p.user_id
AND g.politician_name IS NULL
AND p.full_name IS NOT NULL;