-- Create cabinet-logos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cabinet-logos', 'cabinet-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for cabinet-logos bucket
CREATE POLICY "Cabinet logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cabinet-logos');

CREATE POLICY "Users can upload their own cabinet logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cabinet-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own cabinet logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cabinet-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own cabinet logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'cabinet-logos' AND auth.uid()::text = (storage.foldername(name))[1]);