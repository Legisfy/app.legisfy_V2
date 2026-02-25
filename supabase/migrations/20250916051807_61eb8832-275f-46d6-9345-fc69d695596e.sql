-- Create a simpler and more reliable get_active_cabinet function
CREATE OR REPLACE FUNCTION public.get_active_cabinet()
RETURNS TABLE(cabinet_id uuid, cabinet_name text, user_role text, institution_name text, chamber_type text, politician_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- First check if user owns a gabinete as politician
  RETURN QUERY
  SELECT 
    g.id::uuid as cabinet_id, 
    g.nome as cabinet_name, 
    'politico'::text as user_role,
    COALESCE(c.nome, 'Instituição')::text as institution_name,
    CASE 
      WHEN c.tipo::text = 'municipal' THEN 'camara_municipal'
      WHEN c.tipo::text = 'estadual' THEN 'assembleia_legislativa'
      ELSE 'camara_municipal'
    END::text as chamber_type,
    COALESCE(p.full_name, 'Político')::text as politician_name
  FROM public.gabinetes g
  LEFT JOIN public.camaras c ON c.id = g.camara_id
  LEFT JOIN public.profiles p ON p.user_id = g.politico_id
  WHERE g.politico_id = current_user_id
    AND g.status = 'ativo'::gabinete_status
  LIMIT 1;
  
  -- If not found as politician, check if user is a member
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      g.id::uuid as cabinet_id, 
      g.nome as cabinet_name, 
      gm.role::text as user_role,
      COALESCE(c.nome, 'Instituição')::text as institution_name,
      CASE 
        WHEN c.tipo::text = 'municipal' THEN 'camara_municipal'
        WHEN c.tipo::text = 'estadual' THEN 'assembleia_legislativa'
        ELSE 'camara_municipal'
      END::text as chamber_type,
      COALESCE(p.full_name, 'Político')::text as politician_name
    FROM public.gabinete_members gm
    JOIN public.gabinetes g ON g.id = gm.gabinete_id
    LEFT JOIN public.camaras c ON c.id = g.camara_id
    LEFT JOIN public.profiles p ON p.user_id = g.politico_id
    WHERE gm.user_id = current_user_id
      AND g.status = 'ativo'::gabinete_status
    LIMIT 1;
  END IF;
END;
$function$;