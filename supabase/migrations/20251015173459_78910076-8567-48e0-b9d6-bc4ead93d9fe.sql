
-- Add RLS policies for indication_tags table

-- Allow everyone to view indication tags
CREATE POLICY "Everyone can view indication tags" 
ON public.indication_tags
FOR SELECT
TO public
USING (true);

-- Allow platform admins to manage indication tags
CREATE POLICY "Platform admins can manage indication tags" 
ON public.indication_tags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'
  )
);
