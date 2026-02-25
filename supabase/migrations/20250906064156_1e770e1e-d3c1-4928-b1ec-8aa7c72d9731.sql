-- Update existing gabinete names to use correct politician names
DO $$
DECLARE
  gabinete_record RECORD;
  politician_full_name text;
  short_name text;
  chamber_tipo text;
  formatted_cabinet_name text;
BEGIN
  -- Loop through all active gabinetes
  FOR gabinete_record IN 
    SELECT g.id, g.politico_id, g.camara_id, c.tipo
    FROM public.gabinetes g
    LEFT JOIN public.camaras c ON c.id = g.camara_id
    WHERE g.status = 'ativo'
  LOOP
    -- Get politician's full name
    SELECT full_name INTO politician_full_name
    FROM public.profiles
    WHERE user_id = gabinete_record.politico_id;
    
    -- Extract short name (first + last name)
    IF politician_full_name IS NOT NULL THEN
      SELECT 
        CASE 
          WHEN array_length(string_to_array(trim(politician_full_name), ' '), 1) <= 2 
          THEN politician_full_name
          ELSE (string_to_array(trim(politician_full_name), ' '))[1] || ' ' || 
               (string_to_array(trim(politician_full_name), ' '))[array_length(string_to_array(trim(politician_full_name), ' '), 1)]
        END
      INTO short_name;
    ELSE
      short_name := '';
    END IF;
    
    -- Format cabinet name based on chamber type
    IF gabinete_record.tipo = 'estadual' THEN
      formatted_cabinet_name := 'Gabinete do Deputado ' || COALESCE(short_name, '');
    ELSE
      formatted_cabinet_name := 'Gabinete do Vereador ' || COALESCE(short_name, '');
    END IF;
    
    -- Update the gabinete name
    UPDATE public.gabinetes
    SET nome = trim(formatted_cabinet_name), updated_at = now()
    WHERE id = gabinete_record.id;
    
    RAISE LOG 'Updated gabinete % with name: %', gabinete_record.id, trim(formatted_cabinet_name);
  END LOOP;
  
  RAISE NOTICE 'Finished updating gabinete names';
END $$;