-- Fix search_path for user_belongs_to_cabinet function
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