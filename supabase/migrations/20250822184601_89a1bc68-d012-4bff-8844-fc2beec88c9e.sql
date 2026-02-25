-- Criar bucket para imagens de comunicados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comunicados', 'comunicados', true);

-- Política para visualização pública das imagens
CREATE POLICY "Public access to comunicados images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'comunicados');

-- Política para upload de imagens (apenas admins)
CREATE POLICY "Admins can upload comunicados images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'comunicados' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'::user_role_type
  )
));

-- Política para atualização de imagens (apenas admins)
CREATE POLICY "Admins can update comunicados images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'comunicados' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'::user_role_type
  )
));

-- Política para exclusão de imagens (apenas admins)
CREATE POLICY "Admins can delete comunicados images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'comunicados' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'::user_role_type
  )
));