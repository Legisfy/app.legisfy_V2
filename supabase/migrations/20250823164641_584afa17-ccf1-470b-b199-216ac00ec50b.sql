-- Fix RLS error when uploading photos to 'uploads' bucket
-- Create storage policies to allow public read and authenticated inserts

-- Public can read files in 'uploads' bucket
CREATE POLICY IF NOT EXISTS "uploads_public_read_v1"
ON storage.objects
FOR SELECT
USING (bucket_id = 'uploads');

-- Authenticated users can upload to 'uploads' bucket
CREATE POLICY IF NOT EXISTS "uploads_authenticated_insert_v1"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads');