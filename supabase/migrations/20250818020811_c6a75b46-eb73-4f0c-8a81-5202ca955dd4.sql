-- Fix search path for existing functions
CREATE OR REPLACE FUNCTION public.user_belongs_to_gabinete(target_gabinete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.gabinete_members gm
    WHERE gm.user_id = auth.uid() 
    AND gm.gabinete_id = target_gabinete_id
  );
$$;

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