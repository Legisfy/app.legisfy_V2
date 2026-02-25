-- Remove the profile-photos bucket since we're using the existing avatars bucket
DELETE FROM storage.buckets WHERE id = 'profile-photos';

-- Clean up any policies for the profile-photos bucket
DROP POLICY IF EXISTS "Users can view all profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photo" ON storage.objects;