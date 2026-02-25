-- Create storage policies for uploads bucket (recreate if exists)
DROP POLICY IF EXISTS "Users can upload files to uploads bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploaded files" ON storage.objects;

CREATE POLICY "Users can upload files to uploads bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view uploaded files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads');

CREATE POLICY "Users can update their own uploaded files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);