-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can upload cabinet logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view cabinet logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their cabinet logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their cabinet logos" ON storage.objects;

-- Criar políticas RLS simples e permissivas para cabinet-logos
-- Permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated users can upload cabinet logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cabinet-logos');

-- Permitir que todos vejam as logos (público)
CREATE POLICY "Anyone can view cabinet logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cabinet-logos');

-- Permitir que usuários autenticados atualizem suas logos
CREATE POLICY "Authenticated users can update cabinet logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cabinet-logos')
WITH CHECK (bucket_id = 'cabinet-logos');

-- Permitir que usuários autenticados deletem suas logos
CREATE POLICY "Authenticated users can delete cabinet logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cabinet-logos');