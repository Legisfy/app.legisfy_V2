-- Fix infinite recursion in RLS policies for gabinetes table
DROP POLICY IF EXISTS "Users can view their own gabinete" ON public.gabinetes;

-- Create correct policy for gabinetes without recursion
CREATE POLICY "Users can view their own gabinete" 
ON public.gabinetes 
FOR SELECT 
USING (
  is_platform_admin() OR 
  politico_id = auth.uid() OR 
  chefe_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM public.gabinete_usuarios gu
    WHERE gu.gabinete_id = gabinetes.id 
    AND gu.user_id = auth.uid() 
    AND gu.ativo = true
  )
);

-- Fix the gabinete_usuarios policies to prevent recursion
DROP POLICY IF EXISTS "Users can view gabinete members" ON public.gabinete_usuarios;

CREATE POLICY "Users can view gabinete members" 
ON public.gabinete_usuarios 
FOR SELECT 
USING (
  is_platform_admin() OR 
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM public.gabinetes g
    WHERE g.id = gabinete_usuarios.gabinete_id 
    AND (g.politico_id = auth.uid() OR g.chefe_id = auth.uid())
  )
);