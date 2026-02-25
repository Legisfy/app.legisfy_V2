-- Criar bucket para mídias do WhatsApp
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media', 
  'whatsapp-media', 
  true, 
  50000000, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'video/mp4', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para whatsapp-media bucket
CREATE POLICY "Gabinete members can upload whatsapp media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'whatsapp-media' AND 
  EXISTS (
    SELECT 1 FROM usuarios_whatsapp u 
    WHERE u.gabinete_id::text = (storage.foldername(name))[1]
    AND auth.uid()::text = u.id::text
  )
);

CREATE POLICY "Gabinete members can view whatsapp media" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'whatsapp-media' AND 
  EXISTS (
    SELECT 1 FROM usuarios_whatsapp u 
    WHERE u.gabinete_id::text = (storage.foldername(name))[1]
    AND user_belongs_to_whatsapp_gabinete(u.gabinete_id)
  )
);

CREATE POLICY "Admin can manage whatsapp media" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'whatsapp-media' AND is_whatsapp_platform_admin())
WITH CHECK (bucket_id = 'whatsapp-media' AND is_whatsapp_platform_admin());