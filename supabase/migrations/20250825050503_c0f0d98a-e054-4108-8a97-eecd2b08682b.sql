-- Create storage bucket for cabinet logos
INSERT INTO storage.buckets (id, name, public) VALUES ('cabinet-logos', 'cabinet-logos', true);

-- Create RLS policies for cabinet logos
CREATE POLICY "Cabinet members can view their cabinet logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cabinet-logos' AND (
  EXISTS (
    SELECT 1 FROM gabinetes 
    WHERE id = (storage.foldername(name))[1]::uuid 
    AND politico_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM gabinete_members gm
    JOIN gabinetes g ON g.id = gm.gabinete_id
    WHERE g.id = (storage.foldername(name))[1]::uuid 
    AND gm.user_id = auth.uid()
  )
));

CREATE POLICY "Cabinet members can upload their cabinet logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cabinet-logos' AND (
  EXISTS (
    SELECT 1 FROM gabinetes 
    WHERE id = (storage.foldername(name))[1]::uuid 
    AND politico_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM gabinete_members gm
    JOIN gabinetes g ON g.id = gm.gabinete_id
    WHERE g.id = (storage.foldername(name))[1]::uuid 
    AND gm.user_id = auth.uid()
    AND gm.role IN ('politico', 'chefe_gabinete')
  )
));

CREATE POLICY "Cabinet members can update their cabinet logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cabinet-logos' AND (
  EXISTS (
    SELECT 1 FROM gabinetes 
    WHERE id = (storage.foldername(name))[1]::uuid 
    AND politico_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM gabinete_members gm
    JOIN gabinetes g ON g.id = gm.gabinete_id
    WHERE g.id = (storage.foldername(name))[1]::uuid 
    AND gm.user_id = auth.uid()
    AND gm.role IN ('politico', 'chefe_gabinete')
  )
));

CREATE POLICY "Cabinet members can delete their cabinet logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'cabinet-logos' AND (
  EXISTS (
    SELECT 1 FROM gabinetes 
    WHERE id = (storage.foldername(name))[1]::uuid 
    AND politico_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM gabinete_members gm
    JOIN gabinetes g ON g.id = gm.gabinete_id
    WHERE g.id = (storage.foldername(name))[1]::uuid 
    AND gm.user_id = auth.uid()
    AND gm.role IN ('politico', 'chefe_gabinete')
  )
));