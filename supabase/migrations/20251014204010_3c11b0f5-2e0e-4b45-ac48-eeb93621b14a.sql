-- Corrigir a função get_active_cabinet_with_correct_name para melhor formatação do nome

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
  short_name text;
  chamber_tipo text;
  formatted_cabinet_name text;
  logomarca_url_val text;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- First try: if user is a politician with their own gabinete
  FOR cabinet_id, institution_name, chamber_tipo, politician_full_name, logomarca_url_val IN
    SELECT 
      g.id, 
      c.nome,
      c.tipo,
      p.full_name,
      g.logomarca_url
    FROM public.gabinetes g
    LEFT JOIN public.camaras c ON c.id = g.camara_id
    LEFT JOIN public.profiles p ON p.user_id = g.politico_id
    WHERE g.politico_id = current_user_id
      AND g.status = 'ativo'
    LIMIT 1
  LOOP
    -- Extract short name (first + last name)
    IF politician_full_name IS NOT NULL AND length(trim(politician_full_name)) > 0 THEN
      DECLARE
        name_parts text[];
        part_count integer;
      BEGIN
        name_parts := string_to_array(trim(politician_full_name), ' ');
        part_count := array_length(name_parts, 1);
        
        IF part_count <= 2 THEN
          short_name := politician_full_name;
        ELSIF part_count >= 3 THEN
          -- First + Last name
          short_name := name_parts[1] || ' ' || name_parts[part_count];
        ELSE
          short_name := politician_full_name;
        END IF;
      END;
    ELSE
      short_name := 'Político';
    END IF;
    
    -- Format cabinet name based on chamber type
    IF chamber_tipo = 'estadual' THEN
      formatted_cabinet_name := 'Gabinete do Deputado ' || short_name;
    ELSE
      formatted_cabinet_name := 'Gabinete do Vereador ' || short_name;
    END IF;
    
    cabinet_name := trim(formatted_cabinet_name);
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
  FOR cabinet_id, institution_name, chamber_tipo, politician_full_name, user_role, logomarca_url_val IN
    SELECT 
      gm.gabinete_id, 
      c.nome,
      c.tipo,
      p.full_name,
      gm.role::text,
      g.logomarca_url
    FROM public.gabinete_members gm
    JOIN public.gabinetes g ON g.id = gm.gabinete_id
    LEFT JOIN public.camaras c ON c.id = g.camara_id
    LEFT JOIN public.profiles p ON p.user_id = g.politico_id
    WHERE gm.user_id = current_user_id
      AND g.status = 'ativo'
    LIMIT 1
  LOOP
    -- Extract short name (first + last name)
    IF politician_full_name IS NOT NULL AND length(trim(politician_full_name)) > 0 THEN
      DECLARE
        name_parts text[];
        part_count integer;
      BEGIN
        name_parts := string_to_array(trim(politician_full_name), ' ');
        part_count := array_length(name_parts, 1);
        
        IF part_count <= 2 THEN
          short_name := politician_full_name;
        ELSIF part_count >= 3 THEN
          -- First + Last name
          short_name := name_parts[1] || ' ' || name_parts[part_count];
        ELSE
          short_name := politician_full_name;
        END IF;
      END;
    ELSE
      short_name := 'Político';
    END IF;
    
    -- Format cabinet name based on chamber type
    IF chamber_tipo = 'estadual' THEN
      formatted_cabinet_name := 'Gabinete do Deputado ' || short_name;
    ELSE
      formatted_cabinet_name := 'Gabinete do Vereador ' || short_name;
    END IF;
    
    cabinet_name := trim(formatted_cabinet_name);
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