-- First check and remove all existing policies for estados and cidades tables
DO $$
BEGIN
  -- Remove all existing policies for estados
  DROP POLICY IF EXISTS "Platform admins can manage estados" ON public.estados;
  DROP POLICY IF EXISTS "Users can view estados" ON public.estados;
  DROP POLICY IF EXISTS "Platform admins can insert estados" ON public.estados;
  DROP POLICY IF EXISTS "Platform admins can update estados" ON public.estados;
  DROP POLICY IF EXISTS "Platform admins can delete estados" ON public.estados;
  
  -- Remove all existing policies for cidades  
  DROP POLICY IF EXISTS "Platform admins can manage cidades" ON public.cidades;
  DROP POLICY IF EXISTS "Users can view cidades" ON public.cidades;
  DROP POLICY IF EXISTS "Platform admins can insert cidades" ON public.cidades;
  DROP POLICY IF EXISTS "Platform admins can update cidades" ON public.cidades;
  DROP POLICY IF EXISTS "Platform admins can delete cidades" ON public.cidades;
END $$;

-- Now create the correct policies for estados
CREATE POLICY "Users can view estados" 
ON public.estados 
FOR SELECT 
USING (true);

CREATE POLICY "Platform admins can modify estados" 
ON public.estados 
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Create the correct policies for cidades
CREATE POLICY "Users can view cidades" 
ON public.cidades 
FOR SELECT 
USING (true);

CREATE POLICY "Platform admins can modify cidades" 
ON public.cidades 
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());