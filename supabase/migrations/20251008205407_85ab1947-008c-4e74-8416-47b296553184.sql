-- Corrigir categorias em inglês para português
UPDATE public.demand_categories 
SET 
  name = 'Assistência Social',
  icon = '👥'
WHERE name = 'Users' AND icon = 'Users';

UPDATE public.demand_categories 
SET 
  name = 'Cultura',
  icon = '🎭'
WHERE name = 'Cultura' AND icon = 'Music';

UPDATE public.demand_categories 
SET 
  name = 'Esporte',
  icon = '🏆'
WHERE name = 'Esporte' AND icon = 'Trophy';

UPDATE public.demand_categories 
SET 
  name = 'Habitação',
  icon = '🏠'
WHERE name = 'Habitação' AND icon = 'Home';

UPDATE public.demand_categories 
SET 
  name = 'Infraestrutura',
  icon = '🏗️'
WHERE name = 'Infraestrutura' AND icon = 'Construction';

UPDATE public.demand_categories 
SET 
  name = 'Meio Ambiente',
  icon = '🌱'
WHERE name = 'Meio Ambiente' AND icon = 'Leaf';

UPDATE public.demand_categories 
SET 
  name = 'Segurança',
  icon = '🛡️'
WHERE name = 'Segurança' AND icon = 'Shield';

UPDATE public.demand_categories 
SET 
  name = 'Transporte',
  icon = '🚗'
WHERE name = 'Transporte' AND icon = 'Car';