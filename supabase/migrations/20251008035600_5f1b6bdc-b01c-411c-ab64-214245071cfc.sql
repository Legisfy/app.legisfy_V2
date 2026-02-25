-- Create RLS policies for politicos_autorizados table
-- Only admins can manage authorized politicians

-- Policy for SELECT: Admins and the RPC function can read
CREATE POLICY "politicos_autorizados_admin_select"
ON public.politicos_autorizados
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.main_role = 'admin_plataforma'::user_role_type
  )
);

-- Policy for INSERT: Only admins can insert
CREATE POLICY "politicos_autorizados_admin_insert"
ON public.politicos_autorizados
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.main_role = 'admin_plataforma'::user_role_type
  )
);

-- Policy for UPDATE: Only admins can update
CREATE POLICY "politicos_autorizados_admin_update"
ON public.politicos_autorizados
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.main_role = 'admin_plataforma'::user_role_type
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.main_role = 'admin_plataforma'::user_role_type
  )
);

-- Policy for DELETE: Only admins can delete
CREATE POLICY "politicos_autorizados_admin_delete"
ON public.politicos_autorizados
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.main_role = 'admin_plataforma'::user_role_type
  )
);