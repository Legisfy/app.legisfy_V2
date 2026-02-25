-- Check if plan-assets bucket exists, if not create it
DO $$
BEGIN
  -- Create plan-assets bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'plan-assets') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('plan-assets', 'plan-assets', true);
  END IF;
  
  -- Create subscription-assets bucket if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'subscription-assets') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('subscription-assets', 'subscription-assets', true);
  END IF;
END $$;

-- Create storage policies for plan-assets bucket
CREATE POLICY IF NOT EXISTS "Plan assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'plan-assets');

CREATE POLICY IF NOT EXISTS "Admins can upload plan assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'plan-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));

CREATE POLICY IF NOT EXISTS "Admins can update plan assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'plan-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));

CREATE POLICY IF NOT EXISTS "Admins can delete plan assets" 
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
CREATE POLICY IF NOT EXISTS "Subscription assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'subscription-assets');

CREATE POLICY IF NOT EXISTS "Admins can upload subscription assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'subscription-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));

CREATE POLICY IF NOT EXISTS "Admins can update subscription assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'subscription-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));

CREATE POLICY IF NOT EXISTS "Admins can delete subscription assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'subscription-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
));