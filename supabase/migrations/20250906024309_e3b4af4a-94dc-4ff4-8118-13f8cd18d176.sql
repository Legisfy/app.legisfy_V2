-- Add campo nome_politico para guardar o nome político 
ALTER TABLE profiles ADD COLUMN nome_politico TEXT;

-- Update existing profile with the correct political name
UPDATE profiles 
SET nome_politico = 'Roberto Cidade' 
WHERE full_name = 'Roberto Araujo Oliviera';

-- Update gabinete name to use political name
UPDATE gabinetes 
SET nome = 'Gabinete do Deputado Roberto Cidade'
WHERE nome = 'Gabinete do Deputado Roberto Oliviera';