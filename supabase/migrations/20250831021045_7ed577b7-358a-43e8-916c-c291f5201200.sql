-- Create or replace the get_active_cabinet function to properly handle assessor authentication
CREATE OR REPLACE FUNCTION public.get_active_cabinet()
RETURNS TABLE(cabinet_id uuid, cabinet_name text, user_role text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First try: if user is a politician with their own gabinete
  RETURN QUERY
  SELECT g.id as cabinet_id, g.nome as cabinet_name, 'politico'::text as user_role
  FROM public.gabinetes g
  WHERE g.politico_id = auth.uid()
    AND g.status = 'ativo'
  LIMIT 1;
  
  -- If no results from politician check, try member check
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT gm.gabinete_id as cabinet_id, g.nome as cabinet_name, gm.role::text as user_role
    FROM public.gabinete_members gm
    JOIN public.gabinetes g ON g.id = gm.gabinete_id
    WHERE gm.user_id = auth.uid()
      AND g.status = 'ativo'
    LIMIT 1;
  END IF;
END;
$$;