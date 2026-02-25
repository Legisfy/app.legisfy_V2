-- Check if plan-assets bucket exists, if not create it
INSERT INTO storage.buckets (id, name, public) 
SELECT 'plan-assets', 'plan-assets', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'plan-assets');

-- Create subscription-assets bucket if it doesn't exist  
INSERT INTO storage.buckets (id, name, public) 
SELECT 'subscription-assets', 'subscription-assets', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'subscription-assets');

-- Create storage policies for plan-assets bucket
CREATE POLICY "Plan assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'plan-assets');

CREATE POLICY "Admins can upload plan assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'plan-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));

CREATE POLICY "Admins can update plan assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'plan-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));

CREATE POLICY "Admins can delete plan assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'plan-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));

-- Create storage policies for subscription-assets bucket
CREATE POLICY "Subscription assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'subscription-assets');

CREATE POLICY "Admins can upload subscription assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'subscription-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));

CREATE POLICY "Admins can update subscription assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'subscription-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));

CREATE POLICY "Admins can delete subscription assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'subscription-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));