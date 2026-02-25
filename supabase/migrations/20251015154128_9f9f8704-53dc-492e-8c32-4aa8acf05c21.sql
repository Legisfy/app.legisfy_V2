-- Add city Placas to Pará state
INSERT INTO public.cidades (nome, estado_id, ibge_code)
SELECT 'Placas', id, '1505650'
FROM public.estados
WHERE sigla = 'PA'
ON CONFLICT DO NOTHING;