-- Force refresh and clear cache by updating the gabinete
UPDATE gabinetes 
SET updated_at = now()
WHERE id = '29ada3bf-80bf-49d0-9b84-15801d6c9406';

-- Check if there's a logo uploaded in storage that needs to be linked
SELECT 
  g.id as gabinete_id,
  g.nome,
  g.logomarca_url,
  p.full_name,
  p.nome_politico
FROM gabinetes g
LEFT JOIN profiles p ON g.politico_id = p.user_id
WHERE g.id = '29ada3bf-80bf-49d0-9b84-15801d6c9406';