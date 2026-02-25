-- Adicionar coluna para armazenar o nome político no gabinete
ALTER TABLE public.gabinetes 
ADD COLUMN IF NOT EXISTS politician_name TEXT;

-- Atualizar a função para usar o nome político do gabinete
DROP FUNCTION IF EXISTS public.get_active_cabinet_with_correct_name();

CREATE OR REPLACE FUNCTION public.get_active_cabinet_with_correct_name()
 RETURNS TABLE(cabinet_id uuid, cabinet_name text, user_role text, institution_name text, chamber_type text, politician_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  politician_full_name text;
  chamber_tipo text;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- First try: if user is a politician with their own gabinete
  FOR cabinet_id, cabinet_name, institution_name, chamber_tipo, politician_full_name IN
    SELECT 
      g.id, 
      g.nome,
      c.nome,
      c.tipo,
      COALESCE(g.politician_name, p.full_name)
    FROM public.gabinetes g
    LEFT JOIN public.camaras c ON c.id = g.camara_id
    LEFT JOIN public.profiles p ON p.user_id = g.politico_id
    WHERE g.politico_id = current_user_id
      AND g.status = 'ativo'
    LIMIT 1
  LOOP
    user_role := 'politico';
    chamber_type := CASE 
      WHEN chamber_tipo = 'municipal' THEN 'camara_municipal'
      WHEN chamber_tipo = 'estadual' THEN 'assembleia_legislativa'
      ELSE 'camara_municipal'
    END;
    politician_name := politician_full_name;
    
    RETURN NEXT;
    RETURN;
  END LOOP;
  
  -- If no results from politician check, try member check
  FOR cabinet_id, cabinet_name, user_role, institution_name, chamber_tipo, politician_full_name IN
    SELECT 
      gm.gabinete_id, 
      g.nome,
      gm.role::text,
      c.nome,
      c.tipo,
      COALESCE(g.politician_name, p.full_name)
    FROM public.gabinete_members gm
    JOIN public.gabinetes g ON g.id = gm.gabinete_id
    LEFT JOIN public.camaras c ON c.id = g.camara_id
    LEFT JOIN public.profiles p ON p.user_id = g.politico_id
    WHERE gm.user_id = current_user_id
      AND g.status = 'ativo'
    LIMIT 1
  LOOP
    chamber_type := CASE 
      WHEN chamber_tipo = 'municipal' THEN 'camara_municipal'
      WHEN chamber_tipo = 'estadual' THEN 'assembleia_legislativa'
      ELSE 'camara_municipal'
    END;
    politician_name := politician_full_name;
    
    RETURN NEXT;
    RETURN;
  END LOOP;
END;
$function$;