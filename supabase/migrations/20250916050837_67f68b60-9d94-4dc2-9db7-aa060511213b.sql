-- Fix remaining security warnings by adding search_path to functions that don't have it

-- Update get_active_cabinet_with_correct_name function
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
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- First try: if user is a politician with their own gabinete
  FOR cabinet_id, institution_name, chamber_tipo, politician_full_name IN
    SELECT 
      g.id, 
      c.nome,
      c.tipo,
      p.full_name
    FROM public.gabinetes g
    LEFT JOIN public.camaras c ON c.id = g.camara_id
    LEFT JOIN public.profiles p ON p.user_id = g.politico_id
    WHERE g.politico_id = current_user_id
      AND g.status = 'ativo'
    LIMIT 1
  LOOP
    -- Extract short name (first + last name)
    IF politician_full_name IS NOT NULL THEN
      SELECT INTO short_name
        CASE 
          WHEN array_length(string_to_array(trim(politician_full_name), ' '), 1) <= 2 
          THEN politician_full_name
          ELSE (string_to_array(trim(politician_full_name), ' '))[1] || ' ' || 
               (string_to_array(trim(politician_full_name), ' '))[array_length(string_to_array(trim(politician_full_name), ' '), 1)]
        END;
    ELSE
      short_name := '';
    END IF;
    
    -- Format cabinet name based on chamber type
    IF chamber_tipo = 'estadual' THEN
      formatted_cabinet_name := 'Gabinete do Deputado ' || COALESCE(short_name, '');
    ELSE
      formatted_cabinet_name := 'Gabinete do Vereador ' || COALESCE(short_name, '');
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
  FOR cabinet_id, institution_name, chamber_tipo, politician_full_name, user_role IN
    SELECT 
      gm.gabinete_id, 
      c.nome,
      c.tipo,
      p.full_name,
      gm.role::text
    FROM public.gabinete_members gm
    JOIN public.gabinetes g ON g.id = gm.gabinete_id
    LEFT JOIN public.camaras c ON c.id = g.camara_id
    LEFT JOIN public.profiles p ON p.user_id = g.politico_id
    WHERE gm.user_id = current_user_id
      AND g.status = 'ativo'
    LIMIT 1
  LOOP
    -- Extract short name (first + last name)
    IF politician_full_name IS NOT NULL THEN
      SELECT INTO short_name
        CASE 
          WHEN array_length(string_to_array(trim(politician_full_name), ' '), 1) <= 2 
          THEN politician_full_name
          ELSE (string_to_array(trim(politician_full_name), ' '))[1] || ' ' || 
               (string_to_array(trim(politician_full_name), ' '))[array_length(string_to_array(trim(politician_full_name), ' '), 1)]
        END;
    ELSE
      short_name := '';
    END IF;
    
    -- Format cabinet name based on chamber type
    IF chamber_tipo = 'estadual' THEN
      formatted_cabinet_name := 'Gabinete do Deputado ' || COALESCE(short_name, '');
    ELSE
      formatted_cabinet_name := 'Gabinete do Vereador ' || COALESCE(short_name, '');
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

-- Update get_gabinete_members_with_profiles function
CREATE OR REPLACE FUNCTION public.get_gabinete_members_with_profiles(gab_id uuid)
 RETURNS TABLE(user_id uuid, role text, full_name text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT gm.user_id,
         gm.role,
         p.full_name,
         p.avatar_url
  FROM public.gabinete_members gm
  LEFT JOIN public.profiles p ON p.user_id = gm.user_id
  WHERE gm.gabinete_id = gab_id
    AND (
      public.user_belongs_to_cabinet(gab_id)
      OR public.is_platform_admin()
      OR EXISTS (
        SELECT 1 FROM public.gabinetes g
        WHERE g.id = gab_id AND g.politico_id = auth.uid()
      )
    );
$function$;