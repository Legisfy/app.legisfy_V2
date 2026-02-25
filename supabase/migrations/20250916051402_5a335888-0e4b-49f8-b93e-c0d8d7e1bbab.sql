-- Fix infinite recursion in gabinetes RLS policy
-- Create a security definer function to avoid circular reference

CREATE OR REPLACE FUNCTION public.user_can_access_gabinete(target_gabinete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Check if user is the politician (owner)
    SELECT 1 FROM public.gabinetes g 
    WHERE g.id = target_gabinete_id 
    AND g.politico_id = auth.uid()
  ) OR EXISTS (
    -- Check if user is a member
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = target_gabinete_id 
    AND gm.user_id = auth.uid()
  );
$$;

-- Replace the problematic policy with one using the security definer function
DROP POLICY IF EXISTS "gabinetes_politico_access" ON public.gabinetes;
DROP POLICY IF EXISTS "gabinetes_all" ON public.gabinetes;

CREATE POLICY "gabinetes_safe_access" 
ON public.gabinetes 
FOR ALL 
USING (public.user_can_access_gabinete(id));

-- Also fix storage policies for logo uploads
-- Drop existing bucket if it exists and recreate it
DELETE FROM storage.buckets WHERE id = 'gabinete-logos';

INSERT INTO storage.buckets (id, name, public) 
VALUES ('gabinete-logos', 'gabinete-logos', true);

-- Create storage policies for gabinete logos
CREATE POLICY "Gabinete logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gabinete-logos');

CREATE POLICY "Users can upload their gabinete logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gabinete-logos' 
  AND public.user_can_access_gabinete(
    (storage.foldername(name))[1]::uuid
  )
);

CREATE POLICY "Users can update their gabinete logo" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'gabinete-logos' 
  AND public.user_can_access_gabinete(
    (storage.foldername(name))[1]::uuid
  )
);

CREATE POLICY "Users can delete their gabinete logo" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'gabinete-logos' 
  AND public.user_can_access_gabinete(
    (storage.foldername(name))[1]::uuid
  )
);