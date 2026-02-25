-- Fix the get_active_cabinet function to use correct table name
DROP FUNCTION IF EXISTS public.get_active_cabinet();

CREATE OR REPLACE FUNCTION public.get_active_cabinet()
RETURNS TABLE(cabinet_id uuid, cabinet_name text, user_role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    gm.gabinete_id as cabinet_id,
    g.nome as cabinet_name,
    gm.role::text as user_role
  FROM public.gabinete_members gm
  JOIN public.gabinetes g ON g.id = gm.gabinete_id
  WHERE gm.user_id = auth.uid()
  ORDER BY gm.created_at DESC
  LIMIT 1;
$$;

-- Fix the user_belongs_to_cabinet function
DROP FUNCTION IF EXISTS public.user_belongs_to_cabinet(uuid);

CREATE OR REPLACE FUNCTION public.user_belongs_to_cabinet(target_cabinet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.gabinete_members gm
    WHERE gm.user_id = auth.uid() 
    AND gm.gabinete_id = target_cabinet_id
  );
$$;

-- Disable RLS temporarily on gabinetes to fix policies
ALTER TABLE public.gabinetes DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view their gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Owners and politicians can update gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Platform admins have full access to gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Politicians can create their own gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Users can view gabinetes they own or are politicians of" ON public.gabinetes;

-- Create simple, non-recursive policies
CREATE POLICY "Platform admins full access gabinetes"
ON public.gabinetes
FOR ALL
TO authenticated
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Politicians can manage their own gabinetes"
ON public.gabinetes
FOR ALL
TO authenticated
USING (politico_id = auth.uid())
WITH CHECK (politico_id = auth.uid());

CREATE POLICY "Members can view gabinetes"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gabinete_members gm 
    WHERE gm.gabinete_id = gabinetes.id 
    AND gm.user_id = auth.uid()
  )
);

-- Re-enable RLS
ALTER TABLE public.gabinetes ENABLE ROW LEVEL SECURITY;