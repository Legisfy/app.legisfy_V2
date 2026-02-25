-- Drop and recreate get_active_cabinet function to include chamber type and politician name
DROP FUNCTION IF EXISTS public.get_active_cabinet();

CREATE OR REPLACE FUNCTION public.get_active_cabinet()
 RETURNS TABLE(cabinet_id uuid, cabinet_name text, user_role text, institution_name text, chamber_type text, politician_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- First try: if user is a politician with their own gabinete
  RETURN QUERY
  SELECT 
    g.id as cabinet_id, 
    g.nome as cabinet_name, 
    'politico'::text as user_role,
    c.nome as institution_name,
    CASE 
      WHEN c.tipo = 'municipal' THEN 'camara_municipal'
      WHEN c.tipo = 'estadual' THEN 'assembleia_legislativa'
      ELSE 'camara_municipal'
    END as chamber_type,
    p.full_name as politician_name
  FROM public.gabinetes g
  LEFT JOIN public.camaras c ON c.id = g.camara_id
  LEFT JOIN public.profiles p ON p.user_id = g.politico_id
  WHERE g.politico_id = current_user_id
    AND g.status = 'ativo'
  LIMIT 1;
  
  -- If no results from politician check, try member check
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      gm.gabinete_id as cabinet_id, 
      g.nome as cabinet_name, 
      gm.role::text as user_role,
      c.nome as institution_name,
      CASE 
        WHEN c.tipo = 'municipal' THEN 'camara_municipal'
        WHEN c.tipo = 'estadual' THEN 'assembleia_legislativa'
        ELSE 'camara_municipal'
      END as chamber_type,
      p.full_name as politician_name
    FROM public.gabinete_members gm
    JOIN public.gabinetes g ON g.id = gm.gabinete_id
    LEFT JOIN public.camaras c ON c.id = g.camara_id
    LEFT JOIN public.profiles p ON p.user_id = g.politico_id
    WHERE gm.user_id = current_user_id
      AND g.status = 'ativo'
    LIMIT 1;
  END IF;
END;
$$;