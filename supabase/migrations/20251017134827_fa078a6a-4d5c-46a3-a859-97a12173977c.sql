-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for assessor IA photos
CREATE POLICY "Users can upload assessor IA photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'assessor-ia'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own assessor IA photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'assessor-ia'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Public access to assessor IA photos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'assessor-ia'
);

CREATE POLICY "Users can delete their own assessor IA photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'assessor-ia'
  AND auth.uid() IS NOT NULL
);